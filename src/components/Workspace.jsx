import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, Trophy, LogOut, Flame, Pause, Play, MessageSquare, ListTodo } from 'lucide-react';
import { useSimulator } from '../hooks/useSimulator';
import ManagerChat from './ManagerChat';
import TaskList from './TaskList';
import { getLevelFromScore } from '../utils/levels';
import Leaderboard from './Leaderboard';

const Workspace = ({ sessionData, onEndSession }) => {
    const { timeLeft, score, shiftScore, streak, isPaused, setIsPaused, tasksCompleted, tasks, messages, completeTask, bypassTask, deleteTask, addCustomTask, verifyTaskCompletion, formatTime, isActive, setIsActive, error } = useSimulator(sessionData);
    const [showLeaderboard, setShowLeaderboard] = React.useState(false);
    const [activeTab, setActiveTab] = React.useState('tasks'); // 'chat' | 'tasks'

    const level = getLevelFromScore(score);

    // End session when time runs out
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
            <header className="bg-white/5 border-b border-white/10 px-3 py-2 sm:px-6 sm:py-3 shrink-0">
                {/* Row 1: name/goal + action buttons */}
                <div className="flex items-center justify-between gap-2">
                    <div className="min-w-0">
                        <h1 className="text-sm sm:text-base font-bold text-white truncate">{sessionData.name}</h1>
                        <p className="text-xs text-gray-400 truncate max-w-[180px] sm:max-w-xs">Goal: {sessionData.goal}</p>
                    </div>

                    <div className="flex items-center gap-1.5 shrink-0">
                        {/* Leaderboard — icon on mobile, label on desktop */}
                        <button
                            onClick={() => setShowLeaderboard(true)}
                            className="bg-yellow-500/10 hover:bg-yellow-500/20 text-yellow-500 p-2 sm:px-3 sm:py-2 rounded-lg border border-yellow-500/20 transition-colors flex items-center gap-1.5"
                            title="View Leaderboard"
                        >
                            <Trophy size={16} />
                            <span className="hidden sm:inline text-sm">Leaderboard</span>
                        </button>

                        {/* Pause/Resume */}
                        <button
                            onClick={() => setIsPaused(!isPaused)}
                            className={`p-2 sm:px-3 sm:py-2 rounded-lg border flex items-center gap-1.5 transition-colors ${isPaused
                                ? 'bg-yellow-500/20 hover:bg-yellow-500/30 text-yellow-500 border-yellow-500/30'
                                : 'bg-white/10 hover:bg-white/20 text-white border-white/20'
                                }`}
                            title={isPaused ? 'Resume' : 'Pause'}
                        >
                            {isPaused ? <Play size={16} /> : <Pause size={16} />}
                            <span className="hidden sm:inline text-sm">{isPaused ? 'Resume' : 'Pause'}</span>
                        </button>

                        {/* Clock Out */}
                        <button
                            onClick={handleClockOut}
                            className="bg-red-500/10 hover:bg-red-500/20 text-red-400 p-2 sm:px-3 sm:py-2 rounded-lg border border-red-500/20 flex items-center gap-1.5 transition-colors"
                            title="Clock Out"
                        >
                            <LogOut size={16} />
                            <span className="hidden sm:inline text-sm">Clock Out</span>
                        </button>
                    </div>
                </div>

                {/* Row 2: stats bar */}
                <div className="flex items-center gap-4 mt-2 pt-2 border-t border-white/10">
                    {/* Time */}
                    <div className="flex items-center gap-1.5">
                        <Clock size={14} className={timeLeft < 60 ? 'text-red-400' : 'text-blue-400'} />
                        <span className={`font-mono text-sm font-bold ${timeLeft < 60 ? 'text-red-400 animate-pulse' : 'text-blue-400'}`}>
                            {formatTime(timeLeft)}
                        </span>
                    </div>

                    {/* Score */}
                    <div className="flex items-center gap-1.5">
                        <Trophy size={14} className="text-yellow-400" />
                        <span className="font-mono text-sm font-bold text-yellow-400">{Math.round(score).toLocaleString()}</span>
                    </div>

                    {/* Streak */}
                    {streak > 0 && (
                        <div className="flex items-center gap-1.5">
                            <Flame size={14} className="text-orange-500" />
                            <span className="font-mono text-sm font-bold text-orange-500">{streak}d</span>
                        </div>
                    )}

                    {/* Level — hidden on very small screens */}
                    <div className={`hidden xs:flex items-center text-xs font-bold ${level.color} ${level.bg} px-2 py-0.5 rounded-full border ${level.border}`}>
                        {level.title}
                    </div>
                </div>
            </header>

            {/* Error banner */}
            {error && (
                <div className="bg-red-500/20 border-b border-red-500 text-red-200 px-4 py-2 text-sm shrink-0">
                    Failed to connect to company servers
                </div>
            )}

            {/* ── Mobile Tab Bar ── */}
            <div className="flex lg:hidden border-b border-white/10 bg-gray-900 shrink-0">
                <button
                    onClick={() => setActiveTab('chat')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${activeTab === 'chat'
                        ? 'text-blue-400 border-b-2 border-blue-400'
                        : 'text-gray-400 hover:text-white'
                        }`}
                >
                    <MessageSquare size={16} />
                    Manager
                    {messages.length > 0 && (
                        <span className="bg-blue-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
                            {messages.length > 9 ? '9+' : messages.length}
                        </span>
                    )}
                </button>
                <button
                    onClick={() => setActiveTab('tasks')}
                    className={`flex-1 flex items-center justify-center gap-2 py-2.5 text-sm font-medium transition-colors ${activeTab === 'tasks'
                        ? 'text-blue-400 border-b-2 border-blue-400'
                        : 'text-gray-400 hover:text-white'
                        }`}
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
                {/* Desktop: two-column grid */}
                <div className="hidden lg:grid lg:grid-cols-[1.5fr_1fr] gap-6 h-full">
                    <motion.div
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.2 }}
                        className="min-h-0 flex flex-col"
                    >
                        <ManagerChat messages={messages} />
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, x: 20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.3 }}
                        className="min-h-0 flex flex-col"
                    >
                        <TaskList
                            tasks={tasks}
                            onComplete={completeTask}
                            onVerify={verifyTaskCompletion}
                            onBypass={bypassTask}
                            onDeleteTask={deleteTask}
                            onAddTask={addCustomTask}
                        />
                    </motion.div>
                </div>

                {/* Mobile: single tab view */}
                <div className="lg:hidden h-full">
                    <AnimatePresence mode="wait">
                        {activeTab === 'chat' ? (
                            <motion.div
                                key="chat"
                                initial={{ opacity: 0, x: -16 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -16 }}
                                transition={{ duration: 0.15 }}
                                className="h-full"
                            >
                                <ManagerChat messages={messages} />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="tasks"
                                initial={{ opacity: 0, x: 16 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 16 }}
                                transition={{ duration: 0.15 }}
                                className="h-full"
                            >
                                <TaskList
                                    tasks={tasks}
                                    onComplete={completeTask}
                                    onVerify={verifyTaskCompletion}
                                    onBypass={bypassTask}
                                    onDeleteTask={deleteTask}
                                    onAddTask={addCustomTask}
                                />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    );
};

export default Workspace;
