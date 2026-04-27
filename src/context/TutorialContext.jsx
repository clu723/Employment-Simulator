import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';

const STEPS = [
    { id: 'welcome',        phase: 'clockin',   target: null,             title: '👋 Welcome to AI Employment Simulator!', description: "Let me walk you through everything. This takes about 2 minutes — or skip anytime." },
    { id: 'goal-input',     phase: 'clockin',   target: 'goal-input',     title: '🎯 Set Your Work Goal',           description: 'Enter what you want to accomplish this session. The AI Manager uses this to generate relevant tasks tailored to your goal.' },
    { id: 'duration-input', phase: 'clockin',   target: 'duration-input', title: '⏱ Set Your Shift Duration',       description: 'Choose how many minutes your session lasts. The timer counts down and your session ends automatically when it hits zero.' },
    { id: 'clockin-btn',    phase: 'clockin',   target: 'clockin-btn',    title: '🚀 Clock In to Start!',           description: "When you're ready, clock in to begin. The AI Manager will generate your first tasks immediately." },
    { id: 'header-stats',   phase: 'workspace', target: 'header-stats',   title: '📊 Your Stats',                   description: 'Track your timer, score, and daily streak here. Each day of streak adds a 10% score bonus — keep that streak alive!' },
    { id: 'manager-chat',   phase: 'workspace', target: 'manager-chat',   title: '💬 Manager Chat',                 description: 'Your AI Manager assigns tasks and sends pressure check-in messages. New task announcements appear here too.' },
    { id: 'task-list',      phase: 'workspace', target: 'task-list',      title: '📋 Your Tasks',                   description: 'Active tasks appear here. Each shows a difficulty rating (dots). Higher difficulty = more points earned!' },
    { id: 'task-item',      phase: 'workspace', target: 'task-item',      title: '✅ Completing a Task',             description: 'Tap any task to open the verification screen. Upload a screenshot as proof — the AI Manager reviews it and awards points.' },
    { id: 'add-task-btn',   phase: 'workspace', target: 'add-task-btn',   title: '➕ Add Custom Tasks',              description: "Create your own tasks with a custom difficulty. Great for goals the Manager didn't assign. Verifiable with screenshots too!" },
    { id: 'leaderboard-btn',phase: 'workspace', target: 'leaderboard-btn',title: '🏆 Company Leaderboard',           description: 'See how you rank globally against all employees. Your score, streak, and level are all on display. Compete for #1!' },
    { id: 'clockout-btn',   phase: 'workspace', target: 'clockout-btn',   title: "🎉 You're All Set!",               description: "Clock Out any time to end your shift and see your session summary. The Manager is watching — now get to work!" },
];

const TutorialContext = createContext(null);

export function TutorialProvider({ children }) {
    const [step, setStep] = useState(0);
    const [isActive, setIsActive] = useState(false);
    const { currentUser } = useAuth();

    // Auto-start for users who haven't completed the tutorial
    useEffect(() => {
        if (!currentUser) return; // Wait for login
        const done = localStorage.getItem('employmentSim_tutorialDone');
        if (!done) {
            const t = setTimeout(() => setIsActive(true), 600);
            return () => clearTimeout(t);
        }
    }, [currentUser]);

    const currentStep = STEPS[step] ?? STEPS[0];

    const nextStep = () => {
        if (step >= STEPS.length - 1) {
            setIsActive(false);
            localStorage.setItem('employmentSim_tutorialDone', 'true');
        } else {
            setStep(s => s + 1);
        }
    };

    const prevStep = () => { if (step > 0) setStep(s => s - 1); };

    // Skip hides the overlay but does NOT set the flag — allows re-launch via help button
    const skipTutorial = () => setIsActive(false);

    const startTutorial = (phase = 'clockin') => {
        const idx = phase === 'workspace' ? STEPS.findIndex(s => s.phase === 'workspace') : 0;
        setStep(Math.max(0, idx));
        setIsActive(true);
    };

    // Called when user Clocks In mid-tutorial to jump to workspace steps
    const advanceToWorkspace = () => {
        if (!isActive) return;
        const idx = STEPS.findIndex(s => s.phase === 'workspace');
        if (idx >= 0) setStep(idx);
    };

    return (
        <TutorialContext.Provider value={{ step, isActive, currentStep, totalSteps: STEPS.length, nextStep, prevStep, skipTutorial, startTutorial, advanceToWorkspace }}>
            {children}
        </TutorialContext.Provider>
    );
}

export function useTutorial() {
    const ctx = useContext(TutorialContext);
    if (!ctx) throw new Error('useTutorial must be used inside TutorialProvider');
    return ctx;
}
