import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

export const useSimulator = (initialState) => {
    const [timeLeft, setTimeLeft] = useState(initialState.duration * 60);
    const [score, setScore] = useState(0);
    const [tasksCompleted, setTasksCompleted] = useState(0);
    const [tasks, setTasks] = useState([]);
    const [messages, setMessages] = useState([{
        text: `Great to have you on board today!`, sender: 'Manager', id: 0
    }]);
    const [isPaused, setIsPaused] = useState(false);
    const [streak, setStreak] = useState(0);
    const [lastTaskDate, setLastTaskDate] = useState(null);
    const [lastDecayDate, setLastDecayDate] = useState(null); // New state for decay
    const [isActive, setIsActive] = useState(true);
    const [error, setError] = useState(null);
    const [isGenerationOnCooldown, setIsGenerationOnCooldown] = useState(false);
    const isGeneratingRef = useRef(false);
    const stateRef = useRef({ score, timeLeft, goal: initialState.goal });
    const { currentUser } = useAuth();

    // Load score and streak from Firestore on login
    useEffect(() => {
        const loadScore = async () => {
            if (currentUser) {
                try {
                    const docRef = doc(db, "users", currentUser.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        const data = docSnap.data();

                        let currentScore = data.score || 0;
                        const savedDecayDate = data.lastDecayDate || new Date().toDateString();
                        const today = new Date();
                        const todayStr = today.toDateString();

                        // Decay Logic
                        if (savedDecayDate !== todayStr) {
                            const lastDate = new Date(savedDecayDate);
                            const diffTime = Math.abs(today - lastDate);
                            const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

                            if (diffDays > 0) {
                                currentScore = Math.max(0, currentScore - (diffDays * 500));
                            }
                        }

                        setScore(currentScore);
                        setStreak(data.streak || 0);
                        setLastTaskDate(data.lastTaskDate || null);
                        setLastDecayDate(todayStr);
                    } else {
                        // Initialize decay date for new users
                        setLastDecayDate(new Date().toDateString());
                    }
                } catch (err) {
                    console.error("Error loading user data:", err);
                }
            }
        };
        loadScore();
    }, [currentUser]);

    useEffect(() => {
        if (!currentUser || !lastDecayDate) return;

        const timeoutId = setTimeout(async () => {
            try {
                const docRef = doc(db, "users", currentUser.uid);
                await setDoc(docRef, {
                    score: score,
                    streak: streak,
                    lastTaskDate: lastTaskDate,
                    lastDecayDate: lastDecayDate
                }, { merge: true });
            } catch (err) {
                console.error("Error saving user data:", err);
            }
        }, 1000);

        return () => clearTimeout(timeoutId);
    }, [score, streak, lastTaskDate, lastDecayDate, currentUser]);

    useEffect(() => {
        stateRef.current = { score, timeLeft, goal: initialState.goal };
    }, [score, timeLeft, initialState.goal]);

    // Timer Logic
    useEffect(() => {
        if (!isActive || timeLeft <= 0 || isPaused) {
            if (!isPaused) {
                document.title = timeLeft <= 0 ? "00:00 - Employment Simulator" : "Employment Simulator";
            }
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
            document.title = `${formatTime(timeLeft)} - Simulator`;
        }, 1000);

        return () => clearInterval(timer);
    }, [isActive, timeLeft, isPaused]);

    // Manager "Check-in" Logic (Randomly triggered)
    useEffect(() => {
        if (!isActive || isPaused) return;

        const interval = setInterval(async () => {
            if (Math.random() > 0.6 && !isGeneratingRef.current) {
                isGeneratingRef.current = true;
                try {
                    const { goal } = stateRef.current;
                    const prompt = `
                        You are a manager in a workplace simulation.
                        The user's goal is: "${goal}".
                        Current tasks are: ${(tasks.map(t => t.text).join(', ').slice(-3))}.
                        ${tasks.length >= 3 ? `The user's current tasks were: ${tasks.map(t => t.text).join(', ').slice(-3)}...` : ''}
                        Generate a short, 1-sentence message to the employee. 
                        Address the employee as ${initialState.name}.
                        Be pressuring.
                        Do not include quotes.
                    `;

                    const response = await fetch("https://desktop-f2niegj.tail23801d.ts.net/api/llm", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            messages: [{ role: "user", content: prompt }]
                        })
                    });
                    const data = await response.json();
                    const text = data.message.content;
                    addMessage(text);
                } catch (error) {
                    console.error("Error generating message:", error);
                    setError(error.message || "Unknown error generating message");
                } finally {
                    isGeneratingRef.current = false;
                }
            }
        }, 60000);

        return () => clearInterval(interval);
    }, [isActive, isPaused, tasks]);

    const addMessage = (text) => {
        setMessages((prev) => [...prev, { text, sender: 'Manager', id: Date.now() }]);
    };

    const generateNewTask = useCallback(async () => {
        if (isGeneratingRef.current) return;
        isGeneratingRef.current = true;

        try {
            const prompt = `
                You are a manager. The user's goal is: "${initialState.goal}".
                Generate a single, realistic, not too complex work task that works toward this goal, 
                builds on top of previous tasks, and is different from the user's previous tasks.
                ${tasks.length >= 3 ? `The user's previous tasks were: ${tasks.map(t => t.text).join(', ').slice(-3)}...` : ''}
                Include a single digit number from 1-5 for the task's difficulty level at the end of the task text.
                DO NOT include quotes.
                Keep it short.
            `;

            const response = await fetch("https://desktop-f2niegj.tail23801d.ts.net/api/llm", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    messages: [{ role: "user", content: prompt }]
                })
            });
            const data = await response.json();
            const rawText = data.message.content.trim();
            console.log(rawText);

            // Extract difficulty (last character) and task text (everything before)
            const difficultyMatch = rawText.match(/\d$/);
            const difficulty = difficultyMatch ? parseInt(difficultyMatch[0]) : 1;
            const taskText = difficultyMatch ? rawText.slice(0, -1).trim() : rawText;

            const newTaskId = Date.now();
            setTasks((prev) => [...prev, {
                id: newTaskId,
                text: taskText,
                completed: false,
                difficulty: Math.min(5, Math.max(1, difficulty))
            }]);
            addMessage(`Hey ${initialState.name}, for your new task: ${taskText}`);

        } catch (error) {
            console.error("Error generating task:", error);
            setError(error.message || "Unknown error generating task");
            // Fallback
            const newTaskId = Date.now();
            setTasks((prev) => [...prev, { id: newTaskId, text: "Review previous work", completed: false, difficulty: 1 }]);
            addMessage(`Hey ${initialState.name}, for your new task: Review previous work`);
        } finally {
            isGeneratingRef.current = false;
        }
    }, [initialState.goal, initialState.name, tasks, addMessage]);

    // Handle generation cooldown
    useEffect(() => {
        if (!isGenerationOnCooldown) return;
        const cooldownTimer = setTimeout(() => {
            setIsGenerationOnCooldown(false);
        }, 120000); // 120 seconds
        return () => clearTimeout(cooldownTimer);
    }, [isGenerationOnCooldown]);

    // Auto-generate tasks when below threshold (3 active tasks)
    useEffect(() => {
        if (!isActive || isPaused || isGenerationOnCooldown) return;

        const activeTasksCount = tasks.filter(t => !t.completed).length;
        if (activeTasksCount < 3 && !isGeneratingRef.current) {
            generateNewTask();
        }
    }, [tasks, isActive, isPaused, generateNewTask, isGenerationOnCooldown]);

    const completeTask = useCallback((taskId, isBypass = false) => {
        setTasks((prev) => prev.map(t => t.id === taskId ? { ...t, completed: true } : t));

        const task = tasks.find(t => t.id === taskId);
        if (task && !task.completed) {
            // Give 50% points on bypass
            const pointMultiplier = isBypass ? 0.5 : 1;
            const streakMultiplier = 1 + (streak * 0.1);
            const basePoints = task.difficulty * 100;
            const finalPoints = basePoints * pointMultiplier * streakMultiplier;

            setScore((prev) => prev + finalPoints);
            setTasksCompleted((prev) => prev + 1);

            // Streak Logic
            const today = new Date();
            const todayStr = today.toDateString();

            if (lastTaskDate !== todayStr) {
                const yesterday = new Date(today);
                yesterday.setDate(yesterday.getDate() - 1);
                const yesterdayStr = yesterday.toDateString();

                if (lastTaskDate === yesterdayStr) {
                    setStreak((prev) => prev + 1);
                } else {
                    setStreak(1);
                }
                setLastTaskDate(todayStr);
            }

            if (isBypass) {
                addMessage("I disagree, but fine. We're moving on. Just don't let it happen again.");
            }

            // Set cooldown for generating new tasks after completion
            setIsGenerationOnCooldown(true);
        }
    }, [tasks, lastTaskDate, generateNewTask]);

    const bypassTask = (taskId) => {
        completeTask(taskId, true);
    };

    const deleteTask = (taskId) => {
        setTasks((prev) => prev.filter(t => t.id !== taskId));
    };

    const addCustomTask = (text, difficulty = 1) => {
        const newTaskId = Date.now();
        setTasks((prev) => [...prev, {
            id: newTaskId,
            text,
            completed: false,
            difficulty: Math.min(5, Math.max(1, difficulty))
        }]);
    };

    const verifyTaskCompletion = async (taskId, extractedText) => {
        const task = tasks.find(t => t.id === taskId);
        if (!task) throw new Error("Task not found");

        const prompt = `
            You are a manager in a workplace simulation. 
            Evaluate if the following extracted text from a screenshot proves that the employee completed the task: "${task.text}".
            Extracted Text: """${extractedText}"""
            
            Respond ONLY in valid JSON format with no markdown formatting. The JSON must have two keys:
            1. "approved": boolean (true if the text shows they completed the task, false if irrelevant or incomplete)
            2. "message": string (A short, pressuring, context-aware message to the employee from you, the manager, either praising them or rejecting their work).
        `;

        const response = await fetch("https://desktop-f2niegj.tail23801d.ts.net/api/llm", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
                messages: [{ role: "user", content: prompt }]
            })
        });

        if (!response.ok) {
            throw new Error("Failed to communicate with Manager AI.");
        }

        const data = await response.json();
        const rawJsonString = data.message.content.trim().replace(/^```json/, '').replace(/```$/, '').trim();

        let decision;
        try {
            decision = JSON.parse(rawJsonString);
        } catch (e) {
            console.error("Failed to parse LLM JSON:", rawJsonString);
            throw new Error("Manager returned invalid response format.");
        }

        if (decision.approved) {
            completeTask(taskId);
            addMessage(decision.message || "Good work. Now onto the next one.");
        } else {
            addMessage(decision.message || "This isn't what I asked for. Try again.");
            throw new Error("Manager rejected the task proof.");
        }
    };

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return {
        timeLeft,
        score,
        streak,
        isPaused,
        setIsPaused,
        tasksCompleted,
        tasks,
        messages,
        completeTask,
        bypassTask,
        deleteTask,
        addCustomTask,
        verifyTaskCompletion,
        formatTime,
        isActive,

        setIsActive,
        error
    };
};
