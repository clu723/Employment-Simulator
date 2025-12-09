import React from 'react';
import { motion } from 'framer-motion';
import { Trophy, CheckCircle, RotateCcw } from 'lucide-react';

const Summary = ({ results, onRestart }) => {
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-900 text-white p-4">
            <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20 text-center"
            >
                <div className="flex justify-center mb-6">
                    <div className="p-4 bg-yellow-500/20 rounded-full">
                        <Trophy className="w-12 h-12 text-yellow-400" />
                    </div>
                </div>

                <h1 className="text-3xl font-bold mb-2">Shift Complete!</h1>
                <p className="text-gray-400 mb-8">Here is how you performed today.</p>

                <div className="grid grid-cols-2 gap-4 mb-8">
                    <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                        <p className="text-gray-400 text-sm mb-1">Total Score</p>
                        <p className="text-2xl font-bold text-yellow-400">{results.score.toLocaleString()}</p>
                    </div>
                    <div className="bg-black/20 p-4 rounded-xl border border-white/5">
                        <p className="text-gray-400 text-sm mb-1">Tasks Done</p>
                        <p className="text-2xl font-bold text-blue-400">{results.tasksCompleted}</p>
                    </div>
                </div>

                <motion.button
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={onRestart}
                    className="w-full bg-white text-gray-900 font-bold py-3 rounded-lg shadow-lg hover:bg-gray-100 transition-all flex items-center justify-center gap-2"
                >
                    <RotateCcw size={18} />
                    Start New Shift
                </motion.button>
            </motion.div>
        </div>
    );
};

export default Summary;
