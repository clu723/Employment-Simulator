import React, { useState } from 'react';
import { Plus, X, CheckCircle2, Circle, Trash2, Star } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { motion, AnimatePresence } from 'framer-motion';

export default function TaskBoard() {
    const { tasks, addTask, completeTask, deleteTask } = useGame();
    const [showAdd, setShowAdd] = useState(false);
    const [newTitle, setNewTitle] = useState('');
    const [newDifficulty, setNewDifficulty] = useState(1);

    const activeTasks = tasks.filter(t => !t.completed);
    const completedTasks = tasks.filter(t => t.completed);
    const [showCompleted, setShowCompleted] = useState(false);

    const handleAdd = (e) => {
        e.preventDefault();
        if (newTitle.trim()) {
            addTask(newTitle.trim(), newDifficulty);
            setNewTitle('');
            setNewDifficulty(1);
            setShowAdd(false);
        }
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="h-12 border-b border-white/5 bg-[#1e2028] px-4 flex items-center justify-between shrink-0">
                <h2 className="font-semibold text-sm text-white">Tasks</h2>
                <button
                    onClick={() => setShowAdd(true)}
                    className="flex items-center gap-1.5 px-2.5 py-1 bg-blue-600 hover:bg-blue-500 text-white text-xs font-medium rounded-lg transition-colors"
                >
                    <Plus size={14} /> New Task
                </button>
            </div>

            {/* Content */}
            <div className="flex-1 overflow-y-auto p-4 space-y-2 custom-scrollbar">
                {activeTasks.length === 0 && !showAdd && (
                    <div className="text-center py-12">
                        <p className="text-gray-600 text-sm">No active tasks.</p>
                        <p className="text-gray-700 text-xs mt-1">Create a task or wait for your manager to assign one.</p>
                    </div>
                )}

                {/* Add task form */}
                <AnimatePresence>
                    {showAdd && (
                        <motion.form
                            initial={{ opacity: 0, y: -10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            onSubmit={handleAdd}
                            className="bg-[#1e2028] border border-white/10 rounded-xl p-4 space-y-3"
                        >
                            <input
                                type="text"
                                value={newTitle}
                                onChange={e => setNewTitle(e.target.value)}
                                placeholder="What needs to be done?"
                                className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50"
                                autoFocus
                            />
                            <div className="flex items-center gap-2">
                                <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold">Difficulty</span>
                                <div className="flex gap-1">
                                    {[1, 2, 3, 4, 5].map(d => (
                                        <button
                                            key={d}
                                            type="button"
                                            onClick={() => setNewDifficulty(d)}
                                            className={`w-7 h-7 rounded-lg text-xs font-bold transition-colors ${
                                                newDifficulty === d
                                                    ? 'bg-yellow-500/20 border border-yellow-500 text-yellow-500'
                                                    : 'bg-white/5 border border-white/10 text-gray-500 hover:border-white/20'
                                            }`}
                                        >
                                            {d}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex gap-2">
                                <button type="button" onClick={() => setShowAdd(false)} className="flex-1 py-2 bg-white/5 hover:bg-white/10 text-white text-xs font-medium rounded-lg transition-colors">
                                    Cancel
                                </button>
                                <button type="submit" disabled={!newTitle.trim()} className="flex-[2] py-2 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-xs font-bold rounded-lg transition-colors">
                                    Create
                                </button>
                            </div>
                        </motion.form>
                    )}
                </AnimatePresence>

                {/* Active tasks */}
                <AnimatePresence>
                    {activeTasks.map(task => (
                        <motion.div
                            key={task.id}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="group flex items-center gap-3 bg-[#1e2028] border border-white/5 rounded-xl p-3 hover:border-white/10 transition-colors"
                        >
                            <button onClick={() => completeTask(task.id)} className="text-gray-500 hover:text-green-400 transition-colors shrink-0">
                                <Circle size={20} />
                            </button>
                            <div className="flex-1 min-w-0">
                                <p className="text-sm text-gray-200 truncate">{task.title}</p>
                                <div className="flex gap-0.5 mt-1">
                                    {[...Array(task.difficulty)].map((_, i) => (
                                        <Star key={i} size={10} className="text-yellow-500/60 fill-yellow-500/60" />
                                    ))}
                                </div>
                            </div>
                            <button onClick={() => deleteTask(task.id)} className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-600 hover:text-red-400 transition-all rounded-lg hover:bg-red-400/10 shrink-0">
                                <Trash2 size={14} />
                            </button>
                        </motion.div>
                    ))}
                </AnimatePresence>

                {/* Completed section */}
                {completedTasks.length > 0 && (
                    <div className="mt-4">
                        <button onClick={() => setShowCompleted(!showCompleted)} className="text-[10px] text-gray-500 uppercase tracking-wider font-bold hover:text-gray-400 transition-colors">
                            Completed ({completedTasks.length}) {showCompleted ? '▾' : '▸'}
                        </button>
                        {showCompleted && (
                            <div className="mt-2 space-y-1">
                                {completedTasks.map(task => (
                                    <div key={task.id} className="flex items-center gap-3 px-3 py-2 rounded-lg opacity-40">
                                        <CheckCircle2 size={18} className="text-green-500 shrink-0" />
                                        <span className="text-sm text-gray-400 line-through truncate">{task.title}</span>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                )}
            </div>
        </div>
    );
}
