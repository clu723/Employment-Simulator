import React, { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react';
import { useAuth } from './AuthContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { ALL_CHARACTERS, getCharacterById } from '../data/coworkerTemplates';
import { SCHEDULED_EVENTS, RANDOM_EVENTS } from '../data/eventTemplates';
import { generateText, generateVision } from '../systems/aiClient';
import { approveScreenshot } from '../systems/screenshotApproval';
import { generateTasks, getRandomManagerMessage } from '../systems/taskGenerator';
import { getRankById, getNextRank, canPromote, RANKS } from '../utils/levels';
import { buildCoworkerPrompt, buildCoworkerDMPrompt } from '../systems/promptBuilder';
import { generateProjectContext } from '../systems/workplaceGenerator';
import { summarizeMemory } from '../systems/memorySystem';

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
        isPaused: false,
        shiftTasksCompleted: 0, // tasks completed this shift
        wagePenaltyUntil: null, // timestamp: penalty for clocking out without completing tasks

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
        
        // Apartment
        apartmentItems: ['basic_desk'],

        // Meta
        companyAlias: '',
        hasCompletedOnboarding: false,

        // Unread tracking: { channelId: lastViewedTimestamp }
        channelLastViewed: {},
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
    const taskGenerationLockRef = useRef(false);
    const completedCountRef = useRef(0);
    const pendingVerificationsRef = useRef({}); // taskId -> { approved, confidence, reason, imageData, timestamp }
    const prevCompletedCountRef = useRef(0);
    const ensureTasksRef = useRef(null); // Will hold ensureMinimumTasks after creation
    const shiftWasActiveRef = useRef(false);
    const activeChannelRef = useRef(activeChannel);
    activeChannelRef.current = activeChannel;

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
                        apartmentItems: data.apartmentItems || ['basic_desk'],
                        companyAlias: data.companyAlias || '',
                        hasCompletedOnboarding: data.hasCompletedOnboarding || false,
                        channelLastViewed: data.channelLastViewed || {},
                        wagePenaltyUntil: data.wagePenaltyUntil || null,
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
                    apartmentItems: state.apartmentItems,
                    companyAlias: state.companyAlias,
                    hasCompletedOnboarding: state.hasCompletedOnboarding,
                    channelLastViewed: state.channelLastViewed,
                    wagePenaltyUntil: state.wagePenaltyUntil,
                    score: state.netWorth
                }, { merge: true });
            } catch (err) {
                console.error('Failed to save game state:', err);
            }
        }, 2000);
        return () => clearTimeout(saveTimeoutRef.current);
    }, [state.rank, state.bankBalance, state.netWorth, state.promotionPoints, state.streak, state.lastShiftDate, state.tasksCompletedTotal, state.workplaceVibe, state.persistentWorkplace, state.projectContext, state.apartmentItems, state.companyAlias, state.hasCompletedOnboarding, state.channelLastViewed, state.wagePenaltyUntil, currentUser, isLoaded]);

    // ── Shift Timer ──
    useEffect(() => {
        if (!state.shiftActive || state.isPaused) {
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
    }, [state.shiftActive, state.isPaused]);

    // ── End shift when timer runs out ──
    useEffect(() => {
        if (state.timeRemaining <= 0 && state.shiftActive) {
            endShift();
        }
    }, [state.timeRemaining, state.shiftActive]);

    // ── Scheduled Events ──
    useEffect(() => {
        if (!state.shiftActive || state.isPaused) {
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
    }, [state.shiftActive, state.shiftStartTime, state.isPaused]);

    // ── Random Events (check every 60s) ──
    useEffect(() => {
        if (!state.shiftActive || state.isPaused) {
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
    }, [state.shiftActive, state.isPaused]);

    // ── Add a message to a channel ──
    const addMessage = useCallback((channelId, msg) => {
        const message = {
            id: Date.now() + Math.random(),
            timestamp: Date.now(),
            ...msg,
        };
        setState(prev => {
            // Auto-mark as read if message arrives on the currently active channel
            const isActiveChannel = channelId === activeChannelRef.current;
            const update = {
                ...prev,
                messages: {
                    ...prev.messages,
                    [channelId]: [...(prev.messages[channelId] || []), message],
                },
            };
            if (isActiveChannel) {
                update.channelLastViewed = {
                    ...prev.channelLastViewed,
                    [channelId]: Date.now(),
                };
            }
            return update;
        });
    }, []);

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

            const hasImages = event.images && event.images.length > 0;

            const prompt = buildCoworkerPrompt({
                character,
                persistentWorkplace: state.persistentWorkplace,
                projectContext: state.projectContext,
                coworkerState,
                recentMsgs,
                userGoal: state.userGoal,
                latestUserMessage: event.latestUserMessage || event.promptContext,
                behaviorMode: event.behaviorMode || 'workplace_banter',
                hasImages
            });

            // Simulate typing delay
            await new Promise(r => setTimeout(r, 1500 + Math.random() * 2000));

            const text = hasImages
                ? await generateVision(prompt, event.images)
                : await generateText(prompt);

            if (text) {
                const roleInfo = state.persistentWorkplace?.baselineRoles?.[character.id] || { title: 'Employee', emoji: '🧑' };
                addMessage(channelId, {
                    text,
                    images: event.images,
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
    }, [state.coworkerStates, state.messages, state.userGoal, state.persistentWorkplace, state.projectContext, addMessage]);

    // ── Send a user message ──
    const sendMessage = useCallback(async (channelId, text, images = []) => {
        addMessage(channelId, {
            text,
            images,
            senderId: 'user',
            senderName: state.companyAlias || currentUser?.displayName?.split(' ')[0] || 'You',
            senderAvatar: '🧑',
            type: 'user',
        });

        const hasImages = images.length > 0;

        // If paused, skip AI responses but still show user message
        const skipAI = state.isPaused;

        // If DM, trigger AI response
        if (channelId.startsWith('dm_') && !skipAI) {
            const characterId = channelId.replace('dm_', '');
            const character = getCharacterById(characterId);
            if (character && !isGeneratingRef.current) {
                isGeneratingRef.current = true;
                await new Promise(r => setTimeout(r, 1500 + Math.random() * 5000));
                setTypingCharacter({ id: character.id, channelId });

                try {
                    const coworkerState = state.coworkerStates[character.id] || {};
                    const recentMsgs = (state.messages[channelId] || []).slice(-5)
                        .map(m => {
                            const imgHint = m.images && m.images.length > 0 ? ' [sent an image]' : '';
                            return `${m.senderName}: ${m.text || ''}${imgHint}`;
                        }).join('\n');

                    const activeTasks = state.tasks.filter(t => !t.completed).slice(0, 3);
                    
                    const prompt = buildCoworkerDMPrompt({
                        character,
                        persistentWorkplace: state.persistentWorkplace,
                        projectContext: state.projectContext,
                        coworkerState,
                        recentMsgs,
                        userGoal: state.userGoal,
                        activeTasks,
                        latestUserMessage: text || (images.length > 0 ? '[User sent an image]' : ''),
                        behaviorMode: 'direct_collaboration',
                        hasImages
                    });

                    await new Promise(r => setTimeout(r, 3000 + Math.random() * 3000));
                    const response = hasImages
                        ? await generateVision(prompt, images)
                        : await generateText(prompt);

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

        // If team-chat or general, coworker chimes in after a longer random delay
        if (!channelId.startsWith('dm_') && !isGeneratingRef.current && !skipAI) {
            const randomCoworker = ALL_CHARACTERS[Math.floor(Math.random() * ALL_CHARACTERS.length)];
            setTimeout(() => {
                triggerEvent({
                    id: 'reply_to_user',
                    channel: channelId,
                    selectedParticipant: randomCoworker.id,
                    latestUserMessage: text,
                    behaviorMode: 'casual_banter',
                    promptContext: `React naturally to what the user said in the context of the chat. You may agree, joke, help, or be dismissive based on your personality.`,
                    images
                });
            }, 5000 + Math.random() * 25000);
        }
    }, [currentUser, state.coworkerStates, state.messages, state.tasks, state.userGoal, state.companyAlias, state.persistentWorkplace, state.projectContext, state.isPaused, addMessage, triggerEvent]);

    const clockIn = useCallback(async (goal, duration) => {
        setIsClockingIn(true);
        const now = Date.now();
        const today = new Date().toDateString();
        
        let newProjectContext = state.projectContext;
        
        // If the goal is new, generate a new project context
        if (goal.trim() !== '' && (!state.projectContext || state.projectContext.projectName !== goal)) {
            newProjectContext = await generateProjectContext(goal, state.persistentWorkplace);
        }

        const isNewDay = state.lastShiftDate !== today && state.lastShiftDate !== null;
        let rentDeducted = 0;

        if (isNewDay) {
            rentDeducted = 100 + ((state.apartmentItems.length - 1) * 50);
        }

        setState(prev => {
            // Streak logic
            let newStreak = prev.streak;
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
                bankBalance: prev.bankBalance - rentDeducted,
                coworkerStates: updatedCoworkerStates,
                projectContext: newProjectContext,
                hasCompletedOnboarding: true,
                shiftTasksCompleted: 0, // reset for new shift
            };
        });

        const defaultChannel = generatedChannels[0]?.id || 'general';

        if (!state.hasCompletedOnboarding) {
            // First time onboarding tutorial
            addMessage(defaultChannel, {
                text: `Welcome to the company network. I've set up your profile and your virtual apartment.`,
                senderId: 'system',
                senderName: 'System',
                senderAvatar: '🏢',
                type: 'system',
            });
            setTimeout(() => {
                addMessage(defaultChannel, {
                    text: `Your goal is to complete tasks to earn promotions and salary. You can use your salary to upgrade your apartment and increase your net worth.`,
                    senderId: 'system',
                    senderName: 'System',
                    senderAvatar: '🏢',
                    type: 'system',
                });
            }, 2000);
            setTimeout(() => {
                addMessage(defaultChannel, {
                    text: `Your coworkers are online. You can chat with them in the general channel or click their names to DM them. Good luck.`,
                    senderId: 'system',
                    senderName: 'System',
                    senderAvatar: '🏢',
                    type: 'system',
                });
            }, 4000);
        }

        if (isNewDay && rentDeducted > 0) {
            addMessage(defaultChannel, {
                text: `Daily living expenses of $${rentDeducted} have been deducted from your account.`,
                senderId: 'system',
                senderName: 'System',
                senderAvatar: '🏢',
                type: 'system',
            });
        }

        // Welcome message & First Task Assignment via LLM
        const managerRole = state.persistentWorkplace?.baselineRoles?.manager_davis;
        const managerChar = getCharacterById('manager_davis');
        
        let allNewTasks = [];

        try {
            const prompt = `You are Patricia Davis, the manager. The user just clocked in.
Give a short 1-2 sentence welcome message, and assign them their FIRST specific task to get started.
Format your response exactly like this:
Welcome Message
TASK: First specific task description`;

            const response = await generateText(prompt);
            let msgText = "Good to have you in today. Let's make it count.";
            let taskText = "Review previous work";

            if (response && response.includes("TASK:")) {
                const parts = response.split("TASK:");
                msgText = parts[0].trim();
                taskText = parts[1].trim();
            } else if (response) {
                msgText = response;
                taskText = `Get started on: ${goal}`;
            }

            addMessage(defaultChannel, {
                text: msgText,
                senderId: 'manager_davis',
                senderName: 'Patricia Davis',
                senderAvatar: managerRole?.emoji || '👩‍💼',
                senderRole: managerRole?.title || 'Manager',
                type: 'coworker',
            });

            // Build the first task
            allNewTasks.push({
                id: Date.now() + Math.random(),
                title: taskText,
                difficulty: 1,
                category: 'general',
                completed: false,
                createdAt: Date.now(),
            });

            // Generate 2 additional tasks immediately to reach exactly 3 total
            try {
                const extraTasks = await generateTasks(2, {
                    userGoal: goal,
                    completedTasks: [],
                    activeTasks: [taskText],
                    projectContext: newProjectContext,
                });
                for (const t of extraTasks) {
                    if (!allNewTasks.some(existing => existing.title === t.title)) {
                        allNewTasks.push({
                            id: Date.now() + Math.random(),
                            title: t.title,
                            difficulty: Math.min(5, Math.max(1, t.difficulty)),
                            category: t.category || 'general',
                            completed: false,
                            createdAt: Date.now(),
                        });
                    }
                }
            } catch (e) {
                console.error("Failed to generate extra tasks:", e);
            }

        } catch (err) {
            console.error("Failed to generate start task:", err);
            addMessage(defaultChannel, {
                text: `Good to have you in today. Let's make it count.`,
                senderId: 'manager_davis',
                senderName: 'Patricia Davis',
                senderAvatar: managerRole?.emoji || '👩‍💼',
                senderRole: managerRole?.title || 'Manager',
                type: 'coworker',
            });
            allNewTasks.push({
                id: Date.now() + Math.random(),
                title: `Get started on: ${goal}`,
                difficulty: 1,
                category: 'general',
                completed: false,
                createdAt: Date.now(),
            });
        }

        // Add ALL tasks in a SINGLE atomic setState — no races, no refs, exactly 3 tasks
        if (allNewTasks.length > 0) {
            setState(prev => ({ ...prev, tasks: [...prev.tasks, ...allNewTasks] }));
        }

        // Announce extra tasks beyond the first (the welcome message already covers task #1)
        if (allNewTasks.length > 1) {
            setTimeout(() => {
                const welcomeChannel = generatedChannels[0]?.id || 'general';
                addMessage(welcomeChannel, {
                    text: `Here are a few tasks to get you started.`,
                    senderId: 'manager_davis',
                    senderName: 'Patricia Davis',
                    senderAvatar: managerRole?.emoji || '👩‍💼',
                    senderRole: managerRole?.title || 'Manager',
                    type: 'coworker',
                });
            }, 2000);
        }

        setIsClockingIn(false);
    }, [addMessage, generatedChannels, state.persistentWorkplace, state.projectContext, state.lastShiftDate, state.apartmentItems, state.bankBalance]);

    // ── Clock Out / End Shift ──
    const endShift = useCallback(() => {
        let promotedTo = null;
        
        // --- Memory Summarization ---
        // Capture messages from this shift to summarize
        const shiftStart = state.shiftStartTime;
        const recentMessages = [];
        Object.values(state.messages).forEach(channelMsgs => {
            channelMsgs.forEach(msg => {
                if (msg.timestamp >= shiftStart) {
                    recentMessages.push(msg);
                }
            });
        });

        // Group by character
        const charInteractions = {};
        recentMessages.forEach(msg => {
            // Include messages sent by the character
            if (msg.type === 'coworker' && msg.senderId) {
                if (!charInteractions[msg.senderId]) charInteractions[msg.senderId] = [];
                charInteractions[msg.senderId].push(msg);
            }
            // Include user messages that might be in a DM with them
            if (msg.type === 'user') {
                // If this message was in a DM, associate it with that character
                // We'd have to know the channel ID. But simple approximation: just add user messages to all characters they recently interacted with in DMs.
                // For a more accurate way, we can check if it's a DM channel:
            }
        });
        
        // A better approach to group: iterate over characters, find their DMs, or general messages they were part of
        for (const char of ALL_CHARACTERS) {
            const dmChannel = `dm_${char.id}`;
            const msgsInDM = (state.messages[dmChannel] || []).filter(m => m.timestamp >= shiftStart);
            const msgsInGeneral = (state.messages['general'] || []).filter(m => m.timestamp >= shiftStart && (m.senderId === char.id || m.senderId === 'user'));
            
            const relevantMsgs = [...msgsInDM, ...msgsInGeneral].sort((a, b) => a.timestamp - b.timestamp);
            
            // Only summarize if they actually spoke or the user spoke to them directly in DM
            if (relevantMsgs.length > 0 && msgsInDM.length > 0) {
                const prevSummary = state.coworkerStates[char.id]?.memorySummary || '';
                
                // Fire and forget the summarization
                summarizeMemory(char.id, relevantMsgs, prevSummary, state.persistentWorkplace)
                    .then(newSummary => {
                        setState(prev => {
                            if (!prev.coworkerStates[char.id]) return prev;
                            return {
                                ...prev,
                                coworkerStates: {
                                    ...prev.coworkerStates,
                                    [char.id]: {
                                        ...prev.coworkerStates[char.id],
                                        memorySummary: newSummary
                                    }
                                }
                            };
                        });
                    })
                    .catch(console.error);
            }
        }
        // -----------------------------

        setState(prev => {
            const updatedCoworkerStates = { ...prev.coworkerStates };
            for (const char of ALL_CHARACTERS) {
                if (updatedCoworkerStates[char.id]) {
                    updatedCoworkerStates[char.id] = { ...updatedCoworkerStates[char.id], isOnline: false };
                }
            }

            // Calculate salary earned this shift
            const didCompleteTasks = prev.shiftTasksCompleted > 0;
            const inPenalty = (prev.wagePenaltyUntil || 0) > Date.now();
            const rank = getRankById(prev.rank);
            const streakBonus = 1 + (prev.streak * 0.1);
            let shiftSalary = 0;
            if (didCompleteTasks) {
                shiftSalary = Math.floor(rank.salary * streakBonus * (prev.shiftDuration / 60));
                if (inPenalty) {
                    shiftSalary = Math.floor(shiftSalary * 0.85);
                }
            }

            // Promotion Logic
            let newRankId = prev.rank;
            let newPromotionPoints = prev.promotionPoints;
            const nextRank = getNextRank(prev.rank);

            if (nextRank && prev.promotionPoints >= nextRank.promotionThreshold) {
                newRankId = nextRank.id;
                newPromotionPoints = prev.promotionPoints - nextRank.promotionThreshold;
                promotedTo = nextRank;
            }

            return {
                ...prev,
                shiftActive: false,
                timeRemaining: 0,
                tasks: [], // clear all tasks from this shift
                bankBalance: prev.bankBalance + shiftSalary,
                netWorth: prev.netWorth + shiftSalary,
                rank: newRankId,
                promotionPoints: newPromotionPoints,
                coworkerStates: updatedCoworkerStates,
            };
        });

        const defaultChannel = generatedChannels[0]?.id || 'general';
        
        if (promotedTo) {
            const managerRole = state.persistentWorkplace?.baselineRoles?.manager_davis;
            addMessage(defaultChannel, {
                text: `Attention everyone: Please congratulate ${currentUser?.displayName?.split(' ')[0] || 'our colleague'} on their promotion to ${promotedTo.title}! Well deserved.`,
                senderId: 'manager_davis',
                senderName: 'Patricia Davis',
                senderAvatar: managerRole?.emoji || '👩‍💼',
                senderRole: managerRole?.title || 'Manager',
                type: 'coworker',
            });
        }

        addMessage(defaultChannel, {
            text: `Shift complete. Great work today.`,
            senderId: 'system',
            senderName: 'System',
            senderAvatar: '🏢',
            type: 'system',
        });
    }, [addMessage, generatedChannels, state.persistentWorkplace, currentUser]);

    // ── Apply wage penalty (called from Sidebar confirm dialog) ──
    const applyPenalty = useCallback(() => {
        const penaltyUntil = Date.now() + 7 * 24 * 60 * 60 * 1000;
        setState(prev => ({
            ...prev,
            wagePenaltyUntil: penaltyUntil,
        }));
        const defaultChannel = generatedChannels[0]?.id || 'general';
        addMessage(defaultChannel, {
            text: `⚠️ Warning: You clocked out without completing any tasks. A 15% salary penalty has been applied to all shifts for the next 7 days.`,
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

    const completeTask = useCallback((taskId, rewardMultiplier = 1.0) => {
        setState(prev => {
            const task = prev.tasks.find(t => t.id === taskId);
            if (!task || task.completed) return prev;

            const streakBonus = 1 + (prev.streak * 0.1);
            const pointsEarned = Math.floor(task.difficulty * 10 * streakBonus * rewardMultiplier);
            const salaryEarned = Math.floor(task.difficulty * 50 * streakBonus * rewardMultiplier);

            return {
                ...prev,
                tasks: prev.tasks.map(t => t.id === taskId ? { ...t, completed: true } : t),
                promotionPoints: prev.promotionPoints + pointsEarned,
                bankBalance: prev.bankBalance + salaryEarned,
                netWorth: prev.netWorth + salaryEarned,
                tasksCompletedTotal: prev.tasksCompletedTotal + 1,
                shiftTasksCompleted: prev.shiftTasksCompleted + 1,
            };
        });
    }, []);

    // ── Ensure minimum 3 active tasks (with generation lock) ──
    const ensureMinimumTasks = useCallback(() => {
        // Prevent concurrent generation runs
        if (taskGenerationLockRef.current) return;

        const activeTasks = state.tasks.filter(t => !t.completed);
        const count = activeTasks.length;
        if (count >= 3) return;

        taskGenerationLockRef.current = true;
        const needed = 3 - count;
        const activeTaskTitles = activeTasks.map(t => t.title);

        generateTasks(needed, {
            userGoal: state.userGoal,
            completedTasks: state.tasks.filter(t => t.completed).map(t => t.title),
            activeTasks: activeTaskTitles,
            projectContext: state.projectContext,
        }).then(newTasks => {
            if (newTasks.length === 0) {
                taskGenerationLockRef.current = false;
                return;
            }

            setState(current => {
                const currentActiveTitles = current.tasks.filter(t => !t.completed).map(t => t.title);
                // Filter out any duplicates
                const filtered = newTasks.filter(t => !currentActiveTitles.includes(t.title));

                if (filtered.length === 0 && newTasks.length > 0) {
                    filtered.push({
                        title: `${newTasks[0].title} (follow-up)`,
                        difficulty: newTasks[0].difficulty,
                        category: newTasks[0].category,
                    });
                }

                const tasksToAdd = filtered.slice(0, needed).map(t => ({
                    id: Date.now() + Math.random(),
                    title: t.title,
                    difficulty: Math.min(5, Math.max(1, t.difficulty)),
                    category: t.category || 'general',
                    completed: false,
                    createdAt: Date.now(),
                }));

                if (tasksToAdd.length === 0) {
                    taskGenerationLockRef.current = false;
                    return current;
                }

                // Post manager message about the new task(s)
                const defaultChannel = current.persistentWorkplace?.persistentChannels?.[0]?.id || 'general';
                const managerMsg = getRandomManagerMessage();
                const msgText = tasksToAdd.length === 1
                    ? `${managerMsg} New task: "${tasksToAdd[0].title}".`
                    : `${managerMsg} New tasks added.`;

                setTimeout(() => {
                    addMessage(defaultChannel, {
                        text: msgText,
                        senderId: 'manager_davis',
                        senderName: 'Patricia Davis',
                        senderAvatar: current.persistentWorkplace?.baselineRoles?.manager_davis?.emoji || '👩‍💼',
                        senderRole: current.persistentWorkplace?.baselineRoles?.manager_davis?.title || 'Manager',
                        type: 'coworker',
                    });
                }, 1000);

                taskGenerationLockRef.current = false;

                return {
                    ...current,
                    tasks: [...current.tasks, ...tasksToAdd],
                };
            });
        }).catch(err => {
            console.error('Failed to generate tasks:', err);
            taskGenerationLockRef.current = false;
        });
    }, [state.tasks, state.userGoal, state.projectContext, addMessage]);

    // Store in ref so earlier hooks (like clockIn) can call it
    ensureTasksRef.current = ensureMinimumTasks;

    // ── Safety net: ensure minimum tasks whenever a task is completed ──
    useEffect(() => {
        if (!state.shiftActive || state.isPaused) return;
        const completedCount = state.tasks.filter(t => t.completed).length;
        if (completedCount > prevCompletedCountRef.current) {
            ensureMinimumTasks();
        }
        prevCompletedCountRef.current = completedCount;
    }, [state.tasks, state.shiftActive, ensureMinimumTasks]);

    // ── Pure screenshot verification (no task completion) ──
    // Can be called unlimited times per task; each call overwrites the previous result.
    const verifyScreenshot = useCallback(async (taskId, base64Image) => {
        let taskTitle = 'a task';
        let taskObj = null;
        // Peek at current state (non-blocking — we just need task info for the LLM prompt)
        setState(prev => {
            const t = prev.tasks.find(x => x.id === taskId);
            if (t) {
                taskTitle = t.title;
                taskObj = t;
            }
            return prev; // don't mutate
        });

        let approval;
        try {
            approval = await approveScreenshot(taskObj || { title: taskTitle, category: 'general' }, base64Image);
        } catch (err) {
            console.error('Screenshot approval failed:', err);
            approval = { approved: false, confidence: 0, reason: 'Verification service unavailable.' };
        }

        // Store the latest verification result, overwriting any previous attempt
        pendingVerificationsRef.current[taskId] = {
            ...approval,
            imageData: base64Image,
            timestamp: Date.now(),
        };

        return approval;
    }, []);

    // ── Complete task using the LATEST stored verification result ──
    const completeTaskWithProof = useCallback(async (taskId) => {
        // Retrieve the latest verification for this task (or default to rejected)
        const pending = pendingVerificationsRef.current[taskId];
        const approval = pending || { approved: false, confidence: 0, reason: 'No screenshot submitted.' };
        const imageData = pending?.imageData || null;

        let taskTitle = 'a task';
        setState(prev => {
            const t = prev.tasks.find(x => x.id === taskId);
            if (t) taskTitle = t.title;
            return prev;
        });

        // 1. Complete task with appropriate multiplier
        const multiplier = approval.approved ? 1.0 : 0.5;
        completeTask(taskId, multiplier);

        // 2. Post a system message in the general channel
        const defaultChannel = generatedChannels[0]?.id || 'general';
        const statusText = approval.approved
            ? `📊 Task completed: "${taskTitle}". Screenshot approved — full rewards granted.`
            : `⚠️ Task completed: "${taskTitle}". Screenshot not approved — 50% rewards granted. Reason: ${approval.reason}`;
        addMessage(defaultChannel, {
            text: statusText,
            senderId: 'system',
            senderName: 'System',
            senderAvatar: '🏢',
            type: 'system',
            images: imageData ? [imageData] : undefined,
        });

        // 3. Trigger coworker/manager reactions (only if approved, to keep feedback meaningful)
        if (approval.approved && imageData) {
            setTimeout(async () => {
                setTypingCharacter({ id: 'manager_davis', channelId: defaultChannel });
                try {
                    const character = getCharacterById('manager_davis');
                    const managerRole = state.persistentWorkplace?.baselineRoles?.['manager_davis'] || { title: 'Manager', emoji: '👩‍💼' };

                    const prompt = `You are ${character.name}, working as the Manager at ${state.persistentWorkplace?.companyName || 'the company'}.
You are reviewing the proof of work uploaded by the user for the completed task: "${taskTitle}".
The user uploaded an image proof of their work.
Review the proof image, and react naturally as the manager. You can offer professional praise or constructive critique based on your personality (${character.basePersonality}).
Keep your response concise, realistic, and direct.`;

                    const comment = await generateVision(prompt, [imageData]);
                    
                    if (comment) {
                        addMessage(defaultChannel, {
                            text: comment,
                            senderId: 'manager_davis',
                            senderName: character.name,
                            senderAvatar: managerRole.emoji,
                            senderRole: managerRole.title,
                            type: 'coworker',
                        });
                    }
                } catch (err) {
                    console.error('Manager task reaction failed:', err);
                } finally {
                    setTypingCharacter(null);
                }
            }, 3000 + Math.random() * 2000);

            if (Math.random() < 0.7) {
                setTimeout(async () => {
                    const coworkers = ALL_CHARACTERS.filter(c => c.id !== 'manager_davis');
                    const coworker = coworkers[Math.floor(Math.random() * coworkers.length)];
                    
                    setTypingCharacter({ id: coworker.id, channelId: defaultChannel });
                    try {
                        const coworkerRole = state.persistentWorkplace?.baselineRoles?.[coworker.id] || { title: 'Employee', emoji: '🧑' };
                        const prompt = `You are ${coworker.name}, working as a ${coworkerRole.title} at ${state.persistentWorkplace?.companyName || 'the company'}.
Your coworker just completed the task: "${taskTitle}" and uploaded a proof image.
React casually and naturally to this proof of work. You can be supportive, slightly competitive, joke, or comment on the proof itself, matching your personality (${coworker.basePersonality}).
Keep your response concise, realistic, and direct.`;

                        const comment = await generateVision(prompt, [imageData]);
                        if (comment) {
                            addMessage(defaultChannel, {
                                text: comment,
                                senderId: coworker.id,
                                senderName: coworker.name,
                                senderAvatar: coworkerRole.emoji,
                                senderRole: coworkerRole.title,
                                type: 'coworker',
                            });
                        }
                    } catch (err) {
                        console.error('Coworker task reaction failed:', err);
                    } finally {
                        setTypingCharacter(null);
                    }
                }, 8000 + Math.random() * 4000);
            }
        }

        // 4. Clear pending verification for this task
        delete pendingVerificationsRef.current[taskId];

        // 5. Ensure minimum active tasks are maintained
        ensureMinimumTasks();

        return approval;
    }, [completeTask, addMessage, generatedChannels, state.persistentWorkplace, state.coworkerStates, ensureMinimumTasks]);

    // ── Get the latest stored verification result for a task ──
    const getVerificationResult = useCallback((taskId) => {
        return pendingVerificationsRef.current[taskId] || null;
    }, []);

    const completeTaskWithoutProof = useCallback((taskId) => {
        let taskTitle = 'a task';
        setState(prev => {
            const t = prev.tasks.find(x => x.id === taskId);
            if (t) taskTitle = t.title;
            return prev;
        });

        // Complete task with 0.5 multiplier
        completeTask(taskId, 0.5);

        const defaultChannel = generatedChannels[0]?.id || 'general';
        addMessage(defaultChannel, {
            text: `⚠️ Task completed without proof: "${taskTitle}". Only earned 50% rewards.`,
            senderId: 'system',
            senderName: 'System',
            senderAvatar: '🏢',
            type: 'system',
        });

        // Ensure minimum active tasks are maintained
        ensureMinimumTasks();
    }, [completeTask, addMessage, generatedChannels, ensureMinimumTasks]);

    const setCompanyAlias = useCallback((companyAlias) => {
        setState(prev => ({
            ...prev,
            companyAlias,
        }));
    }, []);

    const updateAlias = useCallback(async (newAlias) => {
        if (!currentUser) throw new Error('Not authenticated');
        if (newAlias.trim().length < 2) throw new Error('Alias must be at least 2 characters');
        if (newAlias.trim().length > 30) throw new Error('Alias must be 30 characters or less');

        await setDoc(doc(db, 'users', currentUser.uid), {
            companyAlias: newAlias.trim(),
        }, { merge: true });

        setState(prev => ({ ...prev, companyAlias: newAlias.trim() }));
    }, [currentUser]);

    const deleteTask = useCallback((taskId) => {
        setState(prev => ({ ...prev, tasks: prev.tasks.filter(t => t.id !== taskId) }));
        ensureMinimumTasks();
    }, [ensureMinimumTasks]);
    
    // ── Update persistent workplace manually (e.g. from settings) ──
    const setPersistentWorkplace = useCallback((workplaceVibe, persistentWorkplace) => {
        setState(prev => ({
            ...prev,
            workplaceVibe,
            persistentWorkplace
        }));
    }, []);

    // ── Apartment Management ──
    const buyApartmentItem = useCallback((item) => {
        setState(prev => {
            if (prev.apartmentItems.includes(item.id) || prev.bankBalance < item.cost) {
                return prev;
            }
            return {
                ...prev,
                bankBalance: prev.bankBalance - item.cost,
                // Notice netWorth is NOT reduced, as they retain the asset value
                apartmentItems: [...prev.apartmentItems, item.id],
            };
        });
    }, []);

    // ── Pause / Resume ──
    const togglePause = useCallback(() => {
        setState(prev => ({ ...prev, isPaused: !prev.isPaused }));
    }, []);

    // ── Unread Tracking ──
    const markChannelRead = useCallback((channelId) => {
        setState(prev => ({
            ...prev,
            channelLastViewed: {
                ...prev.channelLastViewed,
                [channelId]: Date.now(),
            },
        }));
    }, []);

    const getUnreadCount = useCallback((channelId) => {
        const msgs = state.messages[channelId] || [];
        if (msgs.length === 0) return 0;
        const lastViewed = state.channelLastViewed[channelId] || 0;
        return msgs.filter(m => m.timestamp > lastViewed).length;
    }, [state.messages, state.channelLastViewed]);

    const isChannelUnread = useCallback((channelId) => {
        return getUnreadCount(channelId) > 0;
    }, [getUnreadCount]);

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
        applyPenalty,
        sendMessage,
        addMessage,
        addTask,
        completeTask,
        completeTaskWithProof,
        completeTaskWithoutProof,
        verifyScreenshot,
        getVerificationResult,
        deleteTask,
        setPersistentWorkplace,
        buyApartmentItem,
        setCompanyAlias,
        updateAlias,
        markChannelRead,
        getUnreadCount,
        isChannelUnread,
        togglePause,
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
