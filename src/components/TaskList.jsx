import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle, Trash2, Plus, X, Star, AlertTriangle } from 'lucide-react';
import TaskVerificationModal from './TaskVerificationModal';

const TaskList = ({ tasks, onComplete, onVerify, onBypass, onDeleteTask, onAddTask }) => {
    const [selectedTask, setSelectedTask] = useState(null);
    const [isAddingTask, setIsAddingTask] = useState(false);
    const [newTaskText, setNewTaskText] = useState('');
    const [newTaskDifficulty, setNewTaskDifficulty] = useState(1);
    const [taskToDelete, setTaskToDelete] = useState(null);

    const activeTasks = tasks.filter(t => !t.completed);

    const handleAddTask = (e) => {
        e.preventDefault();
        if (newTaskText.trim()) {
            onAddTask(newTaskText.trim(), newTaskDifficulty);
            resetAddForm();
        }
    };

    const resetAddForm = () => {
        setNewTaskText('');
        setNewTaskDifficulty(1);
        setIsAddingTask(false);
    };

    const confirmDelete = () => {
        if (taskToDelete) {
            onDeleteTask(taskToDelete.id);
            setTaskToDelete(null);
        }
    };

    return (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 h-full flex flex-col relative overflow-hidden">
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-white">Current Tasks</h2>
                    <span className="bg-blue-500 text-xs px-2 py-0.5 rounded-full text-white">{activeTasks.length}</span>
                </div>
                <button
                    onClick={() => setIsAddingTask(true)}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-sm font-medium transition-colors"
                >
                    <Plus size={16} />
                    Add Custom Task
                </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                <AnimatePresence initial={false}>
                    {activeTasks.length === 0 ? (
                        <p className="text-gray-500 text-center mt-10">No active tasks. Good job!</p>
                    ) : (
                        activeTasks.map((task) => (
                            <motion.div
                                key={task.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, scale: 0.95 }}
                                className="group flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl p-3 cursor-pointer transition-all relative"
                            >
                                <div
                                    className="text-gray-400 group-hover:text-green-400 transition-colors"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setSelectedTask(task);
                                    }}
                                >
                                    <Circle size={20} />
                                </div>
                                <div
                                    className="flex-1"
                                    onClick={() => setSelectedTask(task)}
                                >
                                    <p className="text-gray-200 text-sm">{task.text}</p>
                                    <div className="flex gap-1 mt-1">
                                        {[...Array(Math.max(0, Math.floor(task.difficulty || 0)))].map((_, i) => (
                                            <div key={i} className="w-1.5 h-1.5 rounded-full bg-yellow-500/50" />
                                        ))}
                                    </div>
                                </div>
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        setTaskToDelete(task);
                                    }}
                                    className="opacity-0 group-hover:opacity-100 p-2 text-gray-500 hover:text-red-400 transition-all rounded-lg hover:bg-red-400/10"
                                >
                                    <Trash2 size={16} />
                                </button>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>

            {/* Add Task Modal */}
            <AnimatePresence>
                {isAddingTask && (
                    <div className="absolute inset-0 z-20 bg-gray-900/90 backdrop-blur-sm p-6 flex flex-col justify-center">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-gray-800 border border-white/10 rounded-2xl p-6 shadow-2xl"
                        >
                            <div className="flex items-center justify-between mb-6">
                                <h3 className="text-lg font-bold text-white">Create New Task</h3>
                                <button onClick={resetAddForm} className="text-gray-400 hover:text-white">
                                    <X size={20} />
                                </button>
                            </div>

                            <form onSubmit={handleAddTask} className="space-y-6">
                                <div>
                                    <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Description</label>
                                    <input
                                        autoFocus
                                        type="text"
                                        value={newTaskText}
                                        onChange={(e) => setNewTaskText(e.target.value)}
                                        placeholder="What needs to be done?"
                                        className="w-full bg-black/20 border border-white/10 rounded-xl px-4 py-3 text-white placeholder:text-gray-500 focus:border-blue-500/50 outline-none transition-colors"
                                    />
                                </div>

                                <div>
                                    <label className="block text-xs text-gray-400 uppercase tracking-wider mb-2">Difficulty ({newTaskDifficulty})</label>
                                    <div className="flex gap-3">
                                        {[1, 2, 3, 4, 5].map((level) => (
                                            <button
                                                key={level}
                                                type="button"
                                                onClick={() => setNewTaskDifficulty(level)}
                                                className={`flex-1 py-2 rounded-lg border transition-all ${newTaskDifficulty === level
                                                        ? 'bg-yellow-500/20 border-yellow-500 text-yellow-500'
                                                        : 'bg-white/5 border-white/10 text-gray-400 hover:border-white/20'
                                                    }`}
                                            >
                                                {level}
                                            </button>
                                        ))}
                                    </div>
                                </div>

                                <div className="flex gap-3 pt-2">
                                    <button
                                        type="button"
                                        onClick={resetAddForm}
                                        className="flex-1 py-3 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-colors"
                                    >
                                        Cancel
                                    </button>
                                    <button
                                        type="submit"
                                        disabled={!newTaskText.trim()}
                                        className="flex-1 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-white font-medium rounded-xl transition-colors"
                                    >
                                        Create Task
                                    </button>
                                </div>
                            </form>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            {/* Delete Confirmation Modal */}
            <AnimatePresence>
                {taskToDelete && (
                    <div className="absolute inset-0 z-30 bg-black/60 backdrop-blur-sm flex items-center justify-center p-6">
                        <motion.div
                            initial={{ opacity: 0, scale: 0.95 }}
                            animate={{ opacity: 1, scale: 1 }}
                            exit={{ opacity: 0, scale: 0.95 }}
                            className="bg-gray-900 border border-red-500/20 rounded-2xl p-6 w-full shadow-2xl text-center"
                        >
                            <div className="w-12 h-12 bg-red-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertTriangle className="text-red-400" size={24} />
                            </div>
                            <h3 className="text-lg font-bold text-white mb-2">Delete Task?</h3>
                            <p className="text-gray-400 text-sm mb-6">
                                Are you sure you want to remove "<span className="text-gray-200">{taskToDelete.text}</span>"? This cannot be undone.
                            </p>
                            <div className="flex gap-3">
                                <button
                                    onClick={() => setTaskToDelete(null)}
                                    className="flex-1 py-2.5 bg-white/5 hover:bg-white/10 text-white font-medium rounded-xl transition-colors"
                                >
                                    No, Keep it
                                </button>
                                <button
                                    onClick={confirmDelete}
                                    className="flex-1 py-2.5 bg-red-600 hover:bg-red-500 text-white font-medium rounded-xl transition-colors"
                                >
                                    Yes, Delete
                                </button>
                            </div>
                        </motion.div>
                    </div>
                )}
            </AnimatePresence>

            <TaskVerificationModal
                task={selectedTask}
                isOpen={!!selectedTask}
                onClose={() => setSelectedTask(null)}
                onVerify={onVerify}
                onBypass={onBypass}
            />
        </div>
    );
};

export default TaskList;
