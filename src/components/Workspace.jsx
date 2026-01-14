import React from 'react';
import { motion } from 'framer-motion';
import { Clock, Trophy, LogOut } from 'lucide-react';
import { useSimulator } from '../hooks/useSimulator';
import ManagerChat from './ManagerChat';
import TaskList from './TaskList';

const Workspace = ({ sessionData, onEndSession }) => {
    const { timeLeft, score, tasksCompleted, tasks, messages, completeTask, formatTime, isActive, setIsActive, error } = useSimulator(sessionData);

    // End session when time runs out
    React.useEffect(() => {
        if (timeLeft <= 0 && isActive) {
            setIsActive(false);
            onEndSession({ score, tasksCompleted });
        }
    }, [timeLeft, isActive, onEndSession, score, tasksCompleted, setIsActive]);

    const handleClockOut = () => {
        setIsActive(false);
        onEndSession({ score, tasksCompleted });
    };

    return (
        <div className="min-h-screen bg-gray-900 text-white p-6 flex flex-col">
            {/* Header */}
            <header className="flex justify-between items-center mb-8 bg-white/5 p-4 rounded-xl border border-white/10">
                <div className="flex items-center gap-4">
                    <div className="text-left">
                        <h1 className="text-xl font-bold text-white">{sessionData.name}</h1>
                        <p className="text-xs text-gray-400">Goal: {sessionData.goal}</p>
                    </div>
                </div>

                <div className="flex items-center gap-8">
                    <div className="flex flex-col items-center">
                        <span className="text-xs text-gray-400 uppercase tracking-wider">Time Remaining</span>
                        <div className={`text-2xl font-mono font-bold flex items-center gap-2 ${timeLeft < 60 ? 'text-red-400 animate-pulse' : 'text-blue-400'}`}>
                            <Clock size={20} />
                            {formatTime(timeLeft)}
                        </div>
                    </div>

                    <div className="flex flex-col items-center">
                        <span className="text-xs text-gray-400 uppercase tracking-wider">Score</span>
                        <div className="text-2xl font-mono font-bold text-yellow-400 flex items-center gap-2">
                            <Trophy size={20} />
                            {score.toLocaleString()}
                        </div>
                    </div>
                </div>

                <button
                    onClick={handleClockOut}
                    className="bg-red-500/10 hover:bg-red-500/20 text-red-400 px-4 py-2 rounded-lg border border-red-500/20 flex items-center gap-2 transition-colors"
                >
                    <LogOut size={18} />
                    Clock Out
                </button>
            </header>

            {/* Main Content */}
            {error && (
                <div className="bg-red-500/20 border border-red-500 text-red-200 p-4 rounded-xl mb-6">
                    Error: {error}
                </div>
            )}
            <div className="flex-1 grid grid-cols-1 lg:grid-cols-[1.5fr_1fr] gap-6 overflow-hidden">
                <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                >
                    <ManagerChat messages={messages} />
                </motion.div>

                <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                >
                    <TaskList tasks={tasks} onComplete={completeTask} />
                </motion.div>
            </div>
        </div>
    );
};

export default Workspace;
