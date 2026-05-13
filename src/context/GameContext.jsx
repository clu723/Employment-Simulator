import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { CHANNELS, getDMChannels, ALL_CHARACTERS, getCharacterById } from '../data/coworkerTemplates';
import { SCHEDULED_EVENTS, RANDOM_EVENTS } from '../data/eventTemplates';
import { generateText } from '../systems/aiClient';
import { getRankById, getNextRank, canPromote, RANKS } from '../utils/levels';

const GameContext = createContext(null);

// ── Initial State Factory ──
function createInitialState() {
    return {
        // Session
        shiftActive: false,
        shiftStartTime: null,
        shiftDuration: 30, // minutes
        timeRemaining: 0,
        userGoal: '',

        // Progression
        rank: 'intern',
        bankBalance: 0,
        promotionPoints: 0,
        streak: 0,
        lastShiftDate: null,
        netWorth: 0,

        // Coworker runtime state
        coworkerStates: {},

        // Messages: { channelId: Message[] }
        messages: {},

        // Tasks
        tasks: [],
        tasksCompletedTotal: 0,
    };
}

// ── Initialize coworker states ──
function initCoworkerStates() {
    const states = {};
    for (const char of ALL_CHARACTERS) {
        states[char.id] = {
            mood: char.defaultMood,
            relationshipScore: 50,
            memorySummary: '',
            recentEvents: [],
            isOnline: false,
        };
    }
    return states;
}

// ── Provider ──
export function GameProvider({ children }) {
    const { currentUser } = useAuth();
    const [state, setState] = useState(createInitialState);
    const [activeChannel, setActiveChannel] = useState('general');
    const [isLoaded, setIsLoaded] = useState(false);
    const [typingCharacter, setTypingCharacter] = useState(null);
    const timerRef = useRef(null);
    const eventTimersRef = useRef([]);
    const randomEventRef = useRef(null);
    const isGeneratingRef = useRef(false);
    const saveTimeoutRef = useRef(null);

    // All channels (static + DMs)
    const channels = [...CHANNELS, ...getDMChannels()];

    // ── Load from Firestore ──
    useEffect(() => {
        if (!currentUser) return;
        const load = async () => {
            try {
                const snap = await getDoc(doc(db, 'users', currentUser.uid));
                if (snap.exists()) {
                    const data = snap.data();
                    setState(prev => ({
                        ...prev,
                        rank: data.rank || 'intern',
                        bankBalance: data.bankBalance ?? (data.score || 0),
                        netWorth: data.netWorth ?? data.bankBalance ?? (data.score || 0),
                        promotionPoints: data.promotionPoints || 0,
                        streak: data.streak || 0,
                        lastShiftDate: data.lastShiftDate || null,
                        tasksCompletedTotal: data.tasksCompletedTotal || 0,
                        coworkerStates: data.coworkerStates || initCoworkerStates(),
                    }));
                } else {
                    setState(prev => ({
                        ...prev,
                        coworkerStates: initCoworkerStates(),
                    }));
                }
            } catch (err) {
                console.error('Failed to load game state:', err);
                setState(prev => ({ ...prev, coworkerStates: initCoworkerStates() }));
            }
            setIsLoaded(true);
        };
        load();
    }, [currentUser]);

    // ── Auto-save to Firestore (debounced) ──
    useEffect(() => {
        if (!currentUser || !isLoaded) return;
        if (saveTimeoutRef.current) clearTimeout(saveTimeoutRef.current);
        saveTimeoutRef.current = setTimeout(async () => {
            try {
                await setDoc(doc(db, 'users', currentUser.uid), {
                    rank: state.rank,
                    bankBalance: state.bankBalance,
                    netWorth: state.netWorth,
                    promotionPoints: state.promotionPoints,
                    streak: state.streak,
                    lastShiftDate: state.lastShiftDate,
                    tasksCompletedTotal: state.tasksCompletedTotal,
                    coworkerStates: state.coworkerStates,
                    // Keep legacy fields for leaderboard
                    score: state.netWorth
                }, { merge: true });
            } catch (err) {
                console.error('Failed to save game state:', err);
            }
        }, 2000);
        return () => clearTimeout(saveTimeoutRef.current);
    }, [state.rank, state.bankBalance, state.netWorth, state.promotionPoints, state.streak, state.lastShiftDate, state.tasksCompletedTotal, currentUser, isLoaded]);

    // ── Shift Timer ──
    useEffect(() => {
        if (!state.shiftActive) {
            if (timerRef.current) clearInterval(timerRef.current);
            return;
        }
        timerRef.current = setInterval(() => {
            setState(prev => {
                const remaining = prev.timeRemaining - 1;
                if (remaining <= 0) {
                    return { ...prev, timeRemaining: 0, shiftActive: false };
                }
                return { ...prev, timeRemaining: remaining };
            });
        }, 1000);
        return () => clearInterval(timerRef.current);
    }, [state.shiftActive]);

    // ── End shift when timer runs out ──
    useEffect(() => {
        if (state.timeRemaining <= 0 && state.shiftActive) {
            endShift();
        }
    }, [state.timeRemaining, state.shiftActive]);

    // ── Scheduled Events ──
    useEffect(() => {
        if (!state.shiftActive) {
            eventTimersRef.current.forEach(t => clearTimeout(t));
            eventTimersRef.current = [];
            return;
        }

        for (const event of SCHEDULED_EVENTS) {
            const timer = setTimeout(() => {
                triggerEvent(event);
            }, event.delayAfterShiftStart);
            eventTimersRef.current.push(timer);
        }

        return () => {
            eventTimersRef.current.forEach(t => clearTimeout(t));
            eventTimersRef.current = [];
        };
    }, [state.shiftActive, state.shiftStartTime]);

    // ── Random Events (check every 60s) ──
    useEffect(() => {
        if (!state.shiftActive) {
            if (randomEventRef.current) clearInterval(randomEventRef.current);
            return;
        }
        randomEventRef.current = setInterval(() => {
            for (const event of RANDOM_EVENTS) {
                if (Math.random() < event.probability && !isGeneratingRef.current) {
                    const participantId = event.participantPool[
                        Math.floor(Math.random() * event.participantPool.length)
                    ];
                    triggerEvent({ ...event, selectedParticipant: participantId });
                    break; // Only one random event per tick
                }
            }
        }, 60_000);
        return () => clearInterval(randomEventRef.current);
    }, [state.shiftActive]);

    // ── Trigger an AI event ──
    const triggerEvent = useCallback(async (event) => {
        if (isGeneratingRef.current) return;
        isGeneratingRef.current = true;

        const participantId = event.selectedParticipant || event.participants?.[0];
        const character = getCharacterById(participantId);
        if (!character) { isGeneratingRef.current = false; return; }

        const channelId = event.channel;
        setTypingCharacter({ id: character.id, channelId });

        try {
            const coworkerState = state.coworkerStates[character.id] || {};
            const recentMsgs = (state.messages[channelId] || []).slice(-5)
                .map(m => `${m.senderName}: ${m.text}`).join('\n');

            const prompt = `${character.promptPrefix}

Current mood: ${coworkerState.mood || character.defaultMood}
${coworkerState.memorySummary ? `Recent memory: ${coworkerState.memorySummary}` : ''}
${state.userGoal ? `The employee's current goal: "${state.userGoal}"` : ''}
${recentMsgs ? `Recent messages in this channel:\n${recentMsgs}` : ''}

Context: ${event.promptContext}

Write a single message as ${character.name}. Stay in character. Do not use quotes around your message.`;

            // Simulate typing delay
            await new Promise(r => setTimeout(r, 1500 + Math.random() * 2000));

            const text = await generateText(prompt);

            if (text) {
                addMessage(channelId, {
                    text,
                    senderId: character.id,
                    senderName: character.name,
                    senderAvatar: character.avatar,
                    senderRole: character.role,
                    type: 'coworker',
                });
            }
        } catch (err) {
            console.error(`Event ${event.id} failed:`, err);
        } finally {
            setTypingCharacter(null);
            isGeneratingRef.current = false;
        }
    }, [state.coworkerStates, state.messages, state.userGoal]);

    // ── Add a message to a channel ──
    const addMessage = useCallback((channelId, msg) => {
        const message = {
            id: Date.now() + Math.random(),
            timestamp: Date.now(),
            ...msg,
        };
        setState(prev => ({
            ...prev,
            messages: {
                ...prev.messages,
                [channelId]: [...(prev.messages[channelId] || []), message],
            },
        }));
    }, []);

    // ── Send a user message ──
    const sendMessage = useCallback(async (channelId, text, images = []) => {
        addMessage(channelId, {
            text,
            images,
            senderId: 'user',
            senderName: currentUser?.displayName?.split(' ')[0] || 'You',
            senderAvatar: '🧑',
            type: 'user',
        });

        // If DM, trigger AI response
        if (channelId.startsWith('dm_')) {
            const characterId = channelId.replace('dm_', '');
            const character = getCharacterById(characterId);
            if (character && !isGeneratingRef.current) {
                isGeneratingRef.current = true;
                setTypingCharacter({ id: character.id, channelId });

                try {
                    const coworkerState = state.coworkerStates[character.id] || {};
                    const recentMsgs = [...(state.messages[channelId] || []).slice(-5), { senderName: 'You', text }]
                        .map(m => `${m.senderName}: ${m.text}`).join('\n');

                    const activeTasks = state.tasks.filter(t => !t.completed).slice(0, 3);
                    const taskContext = activeTasks.length > 0
                        ? `Current tasks: ${activeTasks.map(t => t.title).join(', ')}`
                        : '';

                    const prompt = `${character.promptPrefix}

Current mood: ${coworkerState.mood || character.defaultMood}
Relationship with employee: ${coworkerState.relationshipScore}/100
${coworkerState.memorySummary ? `Recent memory: ${coworkerState.memorySummary}` : ''}
${state.userGoal ? `Employee's goal: "${state.userGoal}"` : ''}
${taskContext}

Recent conversation:
${recentMsgs}

Reply as ${character.name}. Stay in character. Be natural and conversational. Do not use quotes.`;

                    await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));
                    const response = await generateText(prompt);

                    if (response) {
                        addMessage(channelId, {
                            text: response,
                            senderId: character.id,
                            senderName: character.name,
                            senderAvatar: character.avatar,
                            senderRole: character.role,
                            type: 'coworker',
                        });
                    }
                } catch (err) {
                    console.error('DM response failed:', err);
                } finally {
                    setTypingCharacter(null);
                    isGeneratingRef.current = false;
                }
            }
        }

        // If team-chat or general, small chance of coworker chiming in
        if (['general', 'team-chat'].includes(channelId) && !isGeneratingRef.current) {
            if (Math.random() < 0.3) {
                const randomCoworker = ALL_CHARACTERS[Math.floor(Math.random() * ALL_CHARACTERS.length)];
                setTimeout(() => {
                    triggerEvent({
                        id: 'reply_to_user',
                        channel: channelId,
                        selectedParticipant: randomCoworker.id,
                        promptContext: `The employee just said: "${text}". React naturally. You may agree, joke, help, or be dismissive based on your personality.`,
                    });
                }, 3000 + Math.random() * 5000);
            }
        }
    }, [currentUser, state.coworkerStates, state.messages, state.tasks, state.userGoal, addMessage, triggerEvent]);

    // ── Clock In ──
    const clockIn = useCallback((goal, duration) => {
        const now = Date.now();
        setState(prev => {
            // Streak logic
            let newStreak = prev.streak;
            const today = new Date().toDateString();
            if (prev.lastShiftDate !== today) {
                const yesterday = new Date();
                yesterday.setDate(yesterday.getDate() - 1);
                if (prev.lastShiftDate === yesterday.toDateString()) {
                    newStreak = prev.streak + 1;
                } else if (prev.lastShiftDate !== today) {
                    newStreak = 1;
                }
            }

            // Set coworkers online
            const updatedCoworkerStates = { ...prev.coworkerStates };
            for (const char of ALL_CHARACTERS) {
                if (updatedCoworkerStates[char.id]) {
                    updatedCoworkerStates[char.id] = { ...updatedCoworkerStates[char.id], isOnline: true };
                }
            }

            return {
                ...prev,
                shiftActive: true,
                shiftStartTime: now,
                shiftDuration: duration,
                timeRemaining: duration * 60,
                userGoal: goal,
                streak: newStreak,
                lastShiftDate: today,
                coworkerStates: updatedCoworkerStates,
            };
        });

        // Welcome message
        addMessage('general', {
            text: `Good to have you in today. Let's make it count.`,
            senderId: 'manager_davis',
            senderName: 'Patricia Davis',
            senderAvatar: '👩‍💼',
            senderRole: 'Engineering Manager',
            type: 'coworker',
        });
    }, [addMessage]);

    // ── Clock Out / End Shift ──
    const endShift = useCallback(() => {
        setState(prev => {
            const updatedCoworkerStates = { ...prev.coworkerStates };
            for (const char of ALL_CHARACTERS) {
                if (updatedCoworkerStates[char.id]) {
                    updatedCoworkerStates[char.id] = { ...updatedCoworkerStates[char.id], isOnline: false };
                }
            }

            // Calculate salary earned this shift
            const rank = getRankById(prev.rank);
            const streakBonus = 1 + (prev.streak * 0.1);
            const shiftSalary = Math.floor(rank.salary * streakBonus * (prev.shiftDuration / 60));

            return {
                ...prev,
                shiftActive: false,
                timeRemaining: 0,
                bankBalance: prev.bankBalance + shiftSalary,
                netWorth: prev.netWorth + shiftSalary,
                coworkerStates: updatedCoworkerStates,
            };
        });

        addMessage('general', {
            text: `Shift complete. Great work today.`,
            senderId: 'system',
            senderName: 'System',
            senderAvatar: '🏢',
            type: 'system',
        });
    }, [addMessage]);

    // ── Task Management ──
    const addTask = useCallback((title, difficulty = 1, category = 'general') => {
        const task = {
            id: Date.now() + Math.random(),
            title,
            difficulty: Math.min(5, Math.max(1, difficulty)),
            category,
            completed: false,
            createdAt: Date.now(),
        };
        setState(prev => ({ ...prev, tasks: [...prev.tasks, task] }));
        return task;
    }, []);

    const completeTask = useCallback((taskId) => {
        setState(prev => {
            const task = prev.tasks.find(t => t.id === taskId);
            if (!task || task.completed) return prev;

            const streakBonus = 1 + (prev.streak * 0.1);
            const pointsEarned = Math.floor(task.difficulty * 10 * streakBonus);
            const salaryEarned = Math.floor(task.difficulty * 50 * streakBonus);

            return {
                ...prev,
                tasks: prev.tasks.map(t => t.id === taskId ? { ...t, completed: true } : t),
                promotionPoints: prev.promotionPoints + pointsEarned,
                bankBalance: prev.bankBalance + salaryEarned,
                netWorth: prev.netWorth + salaryEarned,
                tasksCompletedTotal: prev.tasksCompletedTotal + 1,
            };
        });
    }, []);

    const deleteTask = useCallback((taskId) => {
        setState(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== taskId) }));
    }, []);

    // ── Context Value ──
    const value = {
        ...state,
        activeChannel,
        setActiveChannel,
        channels,
        typingCharacter,
        isLoaded,

        // Actions
        clockIn,
        endShift,
        sendMessage,
        addMessage,
        addTask,
        completeTask,
        deleteTask,
    };

    return (
        <GameContext.Provider value={value}>
            {children}
        </GameContext.Provider>
    );
}

export function useGame() {
    const ctx = useContext(GameContext);
    if (!ctx) throw new Error('useGame must be used inside GameProvider');
    return ctx;
}
