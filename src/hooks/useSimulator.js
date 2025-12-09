import { useState, useEffect, useCallback, useRef } from 'react';
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

const genAI = new GoogleGenerativeAI(import.meta.env.VITE_GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
const deepseek = new OpenAI({
    baseURL: typeof window !== 'undefined' ? `${window.location.origin}/api/deepseek` : 'http://localhost:5173/api/deepseek',
    apiKey: import.meta.env.VITE_DEEPSEEK_API_KEY,
    dangerouslyAllowBrowser: true
});

const INITIAL_TASKS = [
    { id: 1, text: "Check your email", completed: false, difficulty: 1 },
    // { id: 2, text: "Review the project roadmap", completed: false, difficulty: 2 },
];

export const useSimulator = (initialState) => {
    const [timeLeft, setTimeLeft] = useState(initialState.duration * 60);
    const [score, setScore] = useState(0);
    const [tasks, setTasks] = useState(INITIAL_TASKS);
    const [messages, setMessages] = useState([{ text: "Welcome to the team! Let's hit that goal: " + initialState.goal, sender: 'Manager', id: 0 }]);
    const [isActive, setIsActive] = useState(true);
    const [error, setError] = useState(null);
    const isGeneratingRef = useRef(false);
    const stateRef = useRef({ score, timeLeft, goal: initialState.goal });

    useEffect(() => {
        stateRef.current = { score, timeLeft, goal: initialState.goal };
    }, [score, timeLeft, initialState.goal]);

    // Timer Logic
    useEffect(() => {
        if (!isActive || timeLeft <= 0) return;

        const timer = setInterval(() => {
            setTimeLeft((prev) => prev - 1);
        }, 1000);

        return () => clearInterval(timer);
    }, [isActive, timeLeft]);

    // Manager "Check-in" Logic (Randomly triggered)
    // useEffect(() => {
    //     if (!isActive) return;

    //     const interval = setInterval(async () => {
    //         if (Math.random() > 0.6 && !isGeneratingRef.current) {
    //             console.log("Manager check-in attempt");
    //             isGeneratingRef.current = true;
    //             try {
    //                 const { timeLeft, goal } = stateRef.current;
    //                 const prompt = `
    //                     You are a manager in a workplace simulation.
    //                     The user's goal is: "${goal}".
    //                     Current tasks are: ${tasks.map(t => t.text).join(', ')}.
    //                     Time remaining: ${Math.floor(timeLeft / 60)} minutes.

    //                     Generate a short, 1-sentence message to the employee.
    //                     It can be encouraging, pressuring, or just a random check-in.
    //                     Do not include quotes.
    //                 `;
    //                 const result = await model.generateContent(prompt);
    //                 const response = result.response;
    //                 const text = response.text();
    //                 addMessage(text);
    //                 console.log("Manager message:", text);
    //             } catch (error) {
    //                 console.error("Error generating message:", error);
    //                 setError(error.message || "Unknown error generating message");
    //             } finally {
    //                 isGeneratingRef.current = false;
    //             }
    //         }
    //     }, 5000); // Check every 5 seconds

    //     return () => clearInterval(interval);
    // }, [isActive]);

    useEffect(() => {
        if (!isActive) return;

        const interval = setInterval(async () => {
            if (Math.random() > 0.6 && !isGeneratingRef.current) {
                console.log("Manager check-in attempt");
                isGeneratingRef.current = true;
                try {
                    const { timeLeft, goal } = stateRef.current;
                    const prompt = `
                        You are a manager in a workplace simulation. 
                        The user's goal is: "${goal}".
                        Current tasks are: ${tasks.map(t => t.text).join(', ')}.
                        Time remaining: ${Math.floor(timeLeft / 60)} minutes.
                        
                        Generate a short, 1-sentence message to the employee. 
                        It can be encouraging, pressuring, or just a random check-in.
                        Do not include quotes.
                    `;
                    const result = await deepseek.chat.completions.create({
                        model: "deepseek-chat",
                        messages: [{ role: "user", content: prompt }],
                    });
                    const response = result.response;
                    const text = response.text();
                    addMessage(text);
                    console.log("Manager message:", text);
                } catch (error) {
                    console.error("Error generating message:", error);
                    setError(error.message || "Unknown error generating message");
                } finally {
                    isGeneratingRef.current = false;
                }
            }
        }, 5000); // Check every 5 seconds

        return () => clearInterval(interval);
    }, [isActive]);

    const addMessage = (text) => {
        setMessages((prev) => [...prev, { text, sender: 'Manager', id: Date.now() }]);
    };

    // const generateNewTask = async () => {
    //     if (isGeneratingRef.current) return;
    //     isGeneratingRef.current = true;

    //     try {
    //         const prompt = `
    //             You are a manager. The user's goal is: "${initialState.goal}".
    //             Generate a single, realistic work task that works toward this goal.
    //             Return ONLY the task text. No numbering, no quotes.
    //             Keep it short.
    //         `;
    //         const result = await model.generateContent(prompt);
    //         const response = result.response;
    //         const text = response.text().trim();

    //         const newTaskId = Date.now();
    //         setTasks((prev) => [...prev, {
    //             id: newTaskId,
    //             text: text,
    //             completed: false,
    //             difficulty: Math.floor(Math.random() * 3) + 1
    //         }]);

    //     } catch (error) {
    //         console.error("Error generating task:", error);
    //         setError(error.message || "Unknown error generating task");
    //         // Fallback
    //         const newTaskId = Date.now();
    //         setTasks((prev) => [...prev, { id: newTaskId, text: "Review recent changes", completed: false, difficulty: 1 }]);
    //     } finally {
    //         isGeneratingRef.current = false;
    //     }
    // };

    const generateNewTask = async () => {
        if (isGeneratingRef.current) return;
        isGeneratingRef.current = true;

        try {
            const prompt = `
                You are a manager. The user's goal is: "${initialState.goal}".
                Generate a single, realistic work task that works toward this goal.
                Return ONLY the task text. No numbering, no quotes.
                Keep it short.
            `;
            const result = await deepseek.chat.completions.create({
                model: "deepseek-chat",
                messages: [{ role: "user", content: prompt }],
            });
            const text = result.choices[0].message.content.trim();

            const newTaskId = Date.now();
            setTasks((prev) => [...prev, {
                id: newTaskId,
                text: text,
                completed: false,
                difficulty: Math.floor(Math.random() * 3) + 1
            }]);

        } catch (error) {
            console.error("Error generating task:", error);
            setError(error.message || "Unknown error generating task");
            // Fallback
            const newTaskId = Date.now();
            setTasks((prev) => [...prev, { id: newTaskId, text: "Review recent changes", completed: false, difficulty: 1 }]);
        } finally {
            isGeneratingRef.current = false;
        }
    };

    const completeTask = useCallback((taskId) => {
        setTasks((prev) => prev.map(t => t.id === taskId ? { ...t, completed: true } : t));

        const task = tasks.find(t => t.id === taskId);
        if (task && !task.completed) {
            setScore((prev) => prev + (task.difficulty * 100));

            // Trigger new task generation
            setTimeout(() => {
                generateNewTask();
            }, 30000);
        }
    }, [tasks]);

    const formatTime = (seconds) => {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    };

    return {
        timeLeft,
        score,
        tasks,
        messages,
        completeTask,
        formatTime,
        isActive,
        setIsActive,
        error
    };
};
