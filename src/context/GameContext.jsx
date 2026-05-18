import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ALL_CHARACTERS, getCharacterById } from '../data/coworkerTemplates';
import { SCHEDULED_EVENTS, RANDOM_EVENTS } from '../data/eventTemplates';
import { generateText } from '../systems/aiClient';
import { getRankById, getNextRank, canPromote, RANKS } from '../utils/levels';
import { buildCoworkerPrompt, buildCoworkerDMPrompt } from '../systems/promptBuilder';
import { generateProjectContext } from '../systems/workplaceGenerator';

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

        // Contextual Workplace
        workplaceVibe: '',
        persistentWorkplace: null,
        projectContext: null,

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
    const [isClockingIn, setIsClockingIn] = useState(false);
    const [typingCharacter, setTypingCharacter] = useState(null);
    const timerRef = useRef(null);
    const eventTimersRef = useRef([]);
    const randomEventRef = useRef(null);
    const isGeneratingRef = useRef(false);
    const saveTimeoutRef = useRef(null);

    // ── Compute dynamic channels ──
    const generatedChannels = state.persistentWorkplace?.persistentChannels || [
        { id: 'general', name: 'general', type: 'channel', description: 'Company-wide announcements' }
    ];
    
    const projectChannels = state.projectContext?.projectChannels || [];
    
    const dmChannels = ALL_CHARACTERS.map(c => {
        const roleInfo = state.persistentWorkplace?.baselineRoles?.[c.id] || { title: 'Employee', emoji: '🧑' };
        return {
            id: `dm_${c.id}`,
            name: c.name,
            type: 'dm',
            characterId: c.id,
            avatar: roleInfo.emoji,
            accentColor: c.accentColor,
            role: roleInfo.title,
        };
    });

    const channels = [...generatedChannels, ...projectChannels, ...dmChannels];

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
                        workplaceVibe: data.workplaceVibe || '',
                        persistentWorkplace: data.persistentWorkplace || null,
                        projectContext: data.projectContext || null,
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
                    workplaceVibe: state.workplaceVibe,
                    persistentWorkplace: state.persistentWorkplace,
                    projectContext: state.projectContext,
                    score: state.netWorth
                }, { merge: true });
            } catch (err) {
                console.error('Failed to save game state:', err);
            }
        }, 2000);
        return () => clearTimeout(saveTimeoutRef.current);
    }, [state.rank, state.bankBalance, state.netWorth, state.promotionPoints, state.streak, state.lastShiftDate, state.tasksCompletedTotal, state.workplaceVibe, state.persistentWorkplace, state.projectContext, currentUser, isLoaded]);

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

            const prompt = buildCoworkerPrompt({
                character,
                persistentWorkplace: state.persistentWorkplace,
                projectContext: state.projectContext,
                coworkerState,
                recentMsgs,
                userGoal: state.userGoal,
                latestUserMessage: event.latestUserMessage || event.promptContext,
                behaviorMode: event.behaviorMode || 'workplace_banter'
            });

            // Simulate typing delay
            await new Promise(r => setTimeout(r, 1500 + Math.random() * 2000));

            const text = await generateText(prompt);

            if (text) {
                const roleInfo = state.persistentWorkplace?.baselineRoles?.[character.id] || { title: 'Employee', emoji: '🧑' };
                addMessage(channelId, {
                    text,
                    senderId: character.id,
                    senderName: character.name,
                    senderAvatar: roleInfo.emoji,
                    senderRole: roleInfo.title,
                    type: 'coworker',
                });
            }
        } catch (err) {
            console.error(`Event ${event.id} failed:`, err);
        } finally {
            setTypingCharacter(null);
            isGeneratingRef.current = false;
        }
    }, [state.coworkerStates, state.messages, state.userGoal, state.persistentWorkplace, state.projectContext]);

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
                    const recentMsgs = (state.messages[channelId] || []).slice(-5)
                        .map(m => `${m.senderName}: ${m.text}`).join('\n');

                    const activeTasks = state.tasks.filter(t => !t.completed).slice(0, 3);
                    
                    const prompt = buildCoworkerDMPrompt({
                        character,
                        persistentWorkplace: state.persistentWorkplace,
                        projectContext: state.projectContext,
                        coworkerState,
                        recentMsgs,
                        userGoal: state.userGoal,
                        activeTasks,
                        latestUserMessage: text,
                        behaviorMode: 'direct_collaboration'
                    });

                    await new Promise(r => setTimeout(r, 1000 + Math.random() * 2000));
                    const response = await generateText(prompt);

                    if (response) {
                        const roleInfo = state.persistentWorkplace?.baselineRoles?.[character.id] || { title: 'Employee', emoji: '🧑' };
                        addMessage(channelId, {
                            text: response,
                            senderId: character.id,
                            senderName: character.name,
                            senderAvatar: roleInfo.emoji,
                            senderRole: roleInfo.title,
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
        if (!channelId.startsWith('dm_') && !isGeneratingRef.current) {
            if (Math.random() < 0.3) {
                const randomCoworker = ALL_CHARACTERS[Math.floor(Math.random() * ALL_CHARACTERS.length)];
                setTimeout(() => {
                    triggerEvent({
                        id: 'reply_to_user',
                        channel: channelId,
                        selectedParticipant: randomCoworker.id,
                        latestUserMessage: text,
                        behaviorMode: 'casual_banter',
                        promptContext: `React naturally to what the user said in the context of the chat. You may agree, joke, help, or be dismissive based on your personality.`,
                    });
                }, 3000 + Math.random() * 5000);
            }
        }
    }, [currentUser, state.coworkerStates, state.messages, state.tasks, state.userGoal, state.persistentWorkplace, state.projectContext, addMessage, triggerEvent]);

    // ── Clock In ──
    const clockIn = useCallback(async (goal, duration) => {
        setIsClockingIn(true);
        const now = Date.now();
        
        let newProjectContext = state.projectContext;
        
        // If the goal is new, generate a new project context
        if (goal.trim() !== '' && (!state.projectContext || state.projectContext.projectName !== goal)) {
            newProjectContext = await generateProjectContext(goal, state.persistentWorkplace);
        }

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
                projectContext: newProjectContext,
            };
        });

        // Welcome message
        const defaultChannel = generatedChannels[0]?.id || 'general';
        const managerRole = state.persistentWorkplace?.baselineRoles?.manager_davis;
        
        addMessage(defaultChannel, {
            text: `Good to have you in today. Let's make it count.`,
            senderId: 'manager_davis',
            senderName: 'Patricia Davis',
            senderAvatar: managerRole?.emoji || '👩‍💼',
            senderRole: managerRole?.title || 'Manager',
            type: 'coworker',
        });
        
        setIsClockingIn(false);
    }, [addMessage, generatedChannels, state.persistentWorkplace, state.projectContext]);

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

        const defaultChannel = generatedChannels[0]?.id || 'general';
        addMessage(defaultChannel, {
            text: `Shift complete. Great work today.`,
            senderId: 'system',
            senderName: 'System',
            senderAvatar: '🏢',
            type: 'system',
        });
    }, [addMessage, generatedChannels]);

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
    
    // ── Update persistent workplace manually (e.g. from settings) ──
    const setPersistentWorkplace = useCallback((workplaceVibe, persistentWorkplace) => {
        setState(prev => ({
            ...prev,
            workplaceVibe,
            persistentWorkplace
        }));
    }, []);

    // ── Context Value ──
    const value = {
        ...state,
        activeChannel,
        setActiveChannel,
        channels,
        typingCharacter,
        isLoaded,
        isClockingIn,

        // Actions
        clockIn,
        endShift,
        sendMessage,
        addMessage,
        addTask,
        completeTask,
        deleteTask,
        setPersistentWorkplace,
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
