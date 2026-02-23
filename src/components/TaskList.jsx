import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { CheckCircle2, Circle } from 'lucide-react';

const TaskList = ({ tasks, onComplete }) => {
    const activeTasks = tasks.filter(t => !t.completed);

    return (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-4 h-[300px] flex flex-col">
            <div className="flex items-center gap-2 mb-4 border-b border-white/10 pb-2">
                <h2 className="text-lg font-semibold text-white">Current Tasks</h2>
                <span className="bg-blue-500 text-xs px-2 py-0.5 rounded-full text-white">{activeTasks.length}</span>
            </div>

            <div className="flex-1 overflow-y-auto space-y-2 pr-2 custom-scrollbar">
                <AnimatePresence>
                    {activeTasks.length === 0 ? (
                        <p className="text-gray-500 text-center mt-10">No active tasks. Good job!</p>
                    ) : (
                        activeTasks.map((task) => (
                            <motion.div
                                key={task.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, x: 20 }}
                                className="group flex items-center gap-3 bg-white/5 hover:bg-white/10 border border-white/5 rounded-xl p-3 cursor-pointer transition-all"
                                onClick={() => onComplete(task.id)}
                            >
                                <div className="text-gray-400 group-hover:text-green-400 transition-colors">
                                    <Circle size={20} />
                                </div>
                                <div className="flex-1">
                                    <p className="text-gray-200 text-sm">{task.text}</p>
                                    <div className="flex gap-1 mt-1">
                                        {[...Array(Math.max(0, Math.floor(task.difficulty || 0)))].map((_, i) => (
                                            <div key={i} className="w-1.5 h-1.5 rounded-full bg-yellow-500/50" />
                                        ))}
                                    </div>
                                </div>
                            </motion.div>
                        ))
                    )}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default TaskList;
