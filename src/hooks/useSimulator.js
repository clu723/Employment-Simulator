import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

const INITIAL_TASKS = [
    // { id: 1, text: "Check your email", completed: false, difficulty: 1 },
];

export const useSimulator = (initialState) => {
    const [timeLeft, setTimeLeft] = useState(initialState.duration * 60);
    const [score, setScore] = useState(0);
    const [tasksCompleted, setTasksCompleted] = useState(0);
    const [tasks, setTasks] = useState(INITIAL_TASKS);
    const [messages, setMessages] = useState([{
        text: `Welcome to the team! Let's hit that goal:
        ${initialState.goal}!`, sender: 'Manager', id: 0
    }]);
    const [isActive, setIsActive] = useState(true);
    const [error, setError] = useState(null);
    const isGeneratingRef = useRef(false);
    const stateRef = useRef({ score, timeLeft, goal: initialState.goal });
    const { currentUser } = useAuth();

    // Load score from Firestore on login
    useEffect(() => {
        const loadScore = async () => {
            if (currentUser) {
                try {
                    const docRef = doc(db, "users", currentUser.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        setScore(docSnap.data().score || 0);
                    }
                } catch (err) {
                    console.error("Error loading score:", err);
                }
            }
        };
        loadScore();
    }, [currentUser]);

    // Save score to Firestore when it changes
    useEffect(() => {
        if (!currentUser) return;

        const timeoutId = setTimeout(async () => {
            try {
                const docRef = doc(db, "users", currentUser.uid);
                await setDoc(docRef, {
                    score: score,
                    displayName: currentUser.displayName || 'Anonymous'
                }, { merge: true });
            } catch (err) {
                console.error("Error saving score:", err);
            }
        }, 1000);

        return () => clearTimeout(timeoutId);
    }, [score, currentUser]);

    useEffect(() => {
        stateRef.current = { score, timeLeft, goal: initialState.goal };
    }, [score, timeLeft, initialState.goal]);

    // Timer Logic
    useEffect(() => {
        if (!isActive || timeLeft <= 0) {
            document.title = "00:00 - Employment Simulator";
            return;
        }

        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
            document.title = `${formatTime(timeLeft)} - Employment Simulator`;
        }, 1000);

        return () => clearInterval(timer);
    }, [isActive, timeLeft]);

    // Manager "Check-in" Logic (Randomly triggered)
    useEffect(() => {
        if (!isActive) return;

        const interval = setInterval(async () => {
            if (Math.random() > 0.6 && !isGeneratingRef.current) {
                isGeneratingRef.current = true;
                try {
                    const { goal } = stateRef.current;
                    const prompt = `
                        You are a manager in a workplace simulation.
                        The user's goal is: "${goal}".
                        Current tasks are: ${(tasks.map(t => t.text).join(', ').slice(-2))}.

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
    }, [isActive, tasks]);

    const addMessage = (text) => {
        setMessages((prev) => [...prev, { text, sender: 'Manager', id: Date.now() }]);
    };

    const generateNewTask = async () => {
        if (isGeneratingRef.current) return;
        isGeneratingRef.current = true;

        try {
            const prompt = `
                You are a manager. The user's goal is: "${initialState.goal}".
                Generate a single, realistic work task that works toward this goal, 
                builds on top of previous tasks, and is different from the user's previous tasks.
                The user's previous tasks were: ${(tasks.map(t => t.text).join(', ').slice(-2))}.
                Return ONLY the task text. NO quotes.
                Include ONLY a single digit difficulty level from 1-5 at the end of the task.
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
            const text = data.message.content.slice(0, -1);
            console.log(text);

            const newTaskId = Date.now();
            setTasks((prev) => [...prev, {
                id: newTaskId,
                text: text,
                completed: false,
                difficulty: parseInt(text.slice(-1))
            }]);
            addMessage(`Hey ${initialState.name}, for your new task: ${text}`);

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
    };

    // Generate initial 2 tasks 
    useEffect(() => {
        const initTasks = async () => {
            await generateNewTask();
            await generateNewTask();
        };
        initTasks();
    }, []);

    const completeTask = useCallback((taskId) => {
        setTasks((prev) => prev.map(t => t.id === taskId ? { ...t, completed: true } : t));

        const task = tasks.find(t => t.id === taskId);
        if (task && !task.completed) {
            setScore((prev) => prev + (task.difficulty * 100));
            setTasksCompleted((prev) => prev + 1);
            setTimeout(() => {
                generateNewTask();
            }, 30000);
        }

        // setTasks((prev) => prev.filter(t => t.id !== taskId));
    }, [tasks]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return {
        timeLeft,
        score,
        tasksCompleted,
        tasks,
        messages,
        completeTask,
        formatTime,
        isActive,
        setIsActive,
        error
    };
};
