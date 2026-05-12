import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Trophy, LogOut, Flame, Pause, Play, MessageSquare, ListTodo, HelpCircle } from 'lucide-react';
import { useSimulator } from '../hooks/useSimulator';
import ManagerChat from './ManagerChat';
import TaskList from './TaskList';
import { getLevelFromScore } from '../utils/levels';
import Leaderboard from './Leaderboard';
import { useTutorial } from '../context/TutorialContext';

const Workspace = ({ sessionData, onEndSession }) => {
    const { timeLeft, score, shiftScore, streak, isPaused, setIsPaused, tasksCompleted, tasks, messages, completeTask, bypassTask, deleteTask, addCustomTask, verifyTaskCompletion, formatTime, isActive, setIsActive, error } = useSimulator(sessionData);
    const [showLeaderboard, setShowLeaderboard] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState('tasks');
    const { startTutorial } = useTutorial();

    const level = getLevelFromScore(score);

    React.useEffect(() => {
        if (timeLeft <= 0 && isActive) {
            setIsActive(false);
            onEndSession({ score: shiftScore, tasksCompleted });
        }
    }, [timeLeft, isActive, onEndSession, shiftScore, tasksCompleted, setIsActive]);

    const handleClockOut = () => {
        setIsActive(false);
        onEndSession({ score: shiftScore, tasksCompleted });
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white flex flex-col relative">
            <Leaderboard isOpen={showLeaderboard} onClose={() => setShowLeaderboard(false)} />

            {/* ── Header ── */}
            <header className="bg-white/5 border-b border-white/10 p-3 sm:p-4 shrink-0 flex flex-wrap lg:flex-nowrap items-center justify-between gap-y-3 gap-x-4">
                
                {/* Left: Name and Goal */}
                <div className="w-[calc(100%-180px)] lg:w-auto lg:flex-1 min-w-0 order-1">
                    <h1 className="text-sm lg:text-xl font-bold text-white truncate">{sessionData.name}</h1>
                    <p className="text-xs text-gray-400 truncate">Goal: {sessionData.goal}</p>
                </div>

                {/* Right: Actions */}
                <div className="flex items-center justify-end gap-1.5 lg:gap-3 shrink-0 order-2 lg:order-3 lg:flex-1">
                    <button onClick={() => startTutorial('workspace')} title="Tutorial & Help" className="bg-blue-500/20 hover:bg-blue-500/30 text-blue-400 p-2 lg:px-3 lg:py-2 rounded-lg border border-blue-500/30 transition-colors flex items-center gap-1.5">
                        <HelpCircle size={16} />
                        <span className="hidden lg:inline text-sm font-medium">Help</span>
                    </button>
                    <button onClick={() => setShowLeaderboard(true)} data-tutorial="leaderboard-btn" className="bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 p-2 lg:px-3 lg:py-2 rounded-lg border border-yellow-500/20 transition-colors flex items-center gap-1.5" title="View Leaderboard">
                        <Trophy size={16} />
                        <span className="hidden lg:inline text-sm">Leaderboard</span>
                    </button>
                    <button onClick={() => setIsPaused(!isPaused)} className={`p-2 lg:px-3 lg:py-2 rounded-lg border flex items-center gap-1.5 transition-colors ${isPaused ? 'bg-yellow-500/20 text-yellow-500 border-yellow-500/30' : 'bg-white/10 text-white border-white/20'}`} title={isPaused ? 'Resume' : 'Pause'}>
                        {isPaused ? <Play size={16} /> : <Pause size={16} />}
                        <span className="hidden lg:inline text-sm">{isPaused ? 'Resume' : 'Pause'}</span>
                    </button>
                    <button onClick={handleClockOut} data-tutorial="clockout-btn" className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 lg:px-3 lg:py-2 rounded-lg border border-red-500/20 transition-colors flex items-center gap-1.5" title="Clock Out">
                        <LogOut size={16} />
                        <span className="hidden lg:inline text-sm">Clock Out</span>
                    </button>
                </div>

                {/* Center: Stats */}
                <div className="flex items-center gap-4 lg:gap-8 w-full lg:w-auto justify-start lg:justify-center order-3 lg:order-2 border-t border-white/10 pt-2 lg:border-0 lg:pt-0" data-tutorial="header-stats">
                    {/* Time */}
                    <div className="flex flex-col items-center">
                        <span className="hidden lg:block text-xs text-gray-400 uppercase tracking-wider mb-0.5">Time Remaining</span>
                        <div className={`flex items-center gap-1.5 lg:gap-2 font-mono font-bold text-sm lg:text-2xl ${timeLeft < 60 ? 'text-red-400 animate-pulse' : 'text-blue-400'}`}>
                            <Clock className="w-3.5 h-3.5 lg:w-6 lg:h-6" />
                            {formatTime(timeLeft)}
                        </div>
                    </div>

                    {/* Score */}
                    <div className="flex flex-col items-center">
                        <span className="hidden lg:block text-xs text-gray-400 uppercase tracking-wider mb-0.5">Score</span>
                        <div className="flex items-center gap-1.5 lg:gap-2 font-mono font-bold text-sm lg:text-2xl text-yellow-400">
                            <Trophy className="w-3.5 h-3.5 lg:w-6 lg:h-6" />
                            {Math.round(score).toLocaleString()}
                        </div>
                    </div>

                    {/* Streak */}
                    {streak > 0 && (
                        <div className="flex flex-col items-center">
                            <span className="hidden lg:block text-xs text-gray-400 uppercase tracking-wider mb-0.5">Streak</span>
                            <div className="flex items-center gap-1.5 lg:gap-2 font-mono font-bold text-sm lg:text-2xl text-orange-500">
                                <Flame className="w-3.5 h-3.5 lg:w-6 lg:h-6" />
                                {streak}d
                            </div>
                        </div>
                    )}

                    {/* Level */}
                    <div className="flex flex-col items-center ml-auto lg:ml-0">
                        <span className="hidden lg:block text-xs text-gray-400 uppercase tracking-wider opacity-0 mb-0.5">Level</span>
                        <div className={`flex items-center text-xs lg:text-sm font-bold ${level.color} ${level.bg} px-2 py-0.5 lg:px-3 lg:py-1 rounded-full border ${level.border}`}>
                            {level.title}
                        </div>
                    </div>
                </div>

            </header>

            {error && (
                <div className="bg-red-500/20 border-b border-red-500 text-red-200 px-4 py-2 text-sm shrink-0">
                    Failed to connect to company servers
                </div>
            )}

            {/* ── Mobile Tab Bar ── */}
            <div className="flex lg:hidden border-b border-white/10 bg-gray-900 shrink-0">
                <button
                    onClick={() => setActiveTab('chat')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${activeTab === 'chat' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
                >
                    <MessageSquare size={16} />
                    Manager
                    <span className="bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                        {messages.length > 9 ? '9+' : messages.length}
                    </span>
                </button>
                <button
                    onClick={() => setActiveTab('tasks')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${activeTab === 'tasks' ? 'text-blue-400 border-b-2 border-blue-400' : 'text-gray-400 hover:text-white'}`}
                >
                    <ListTodo size={16} />
                    Tasks
                    <span className="bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                        {tasks.filter(t => !t.completed).length}
                    </span>
                </button>
            </div>

            {/* ── Main Content ── */}
            <div className="flex-1 min-h-0 p-3 sm:p-6">
                {/* Desktop */}
                <div className="hidden lg:grid lg:grid-cols-[1.5fr_1fr] gap-6 h-full">
                    <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.2 }} className="min-h-0 flex flex-col h-full">
                        <ManagerChat messages={messages} />
                    </motion.div>
                    <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.3 }} className="min-h-0 flex flex-col h-full">
                        <TaskList tasks={tasks} onComplete={completeTask} onVerify={verifyTaskCompletion} onBypass={bypassTask} onDeleteTask={deleteTask} onAddTask={addCustomTask} />
                    </motion.div>
                </div>

                {/* Mobile tab view */}
                <div className="lg:hidden h-full">
                    <AnimatePresence mode="wait">
                        {activeTab === 'chat' ? (
                            <motion.div key="chat" initial={{ opacity: 0, x: -16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -16 }} transition={{ duration: 0.15 }} className="h-full">
                                <ManagerChat messages={messages} />
                            </motion.div>
                        ) : (
                            <motion.div key="tasks" initial={{ opacity: 0, x: 16 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 16 }} transition={{ duration: 0.15 }} className="h-full">
                                <TaskList tasks={tasks} onComplete={completeTask} onVerify={verifyTaskCompletion} onBypass={bypassTask} onDeleteTask={deleteTask} onAddTask={addCustomTask} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default Workspace;
