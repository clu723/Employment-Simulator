import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Trophy, X } from 'lucide-react';
import { db } from '../firebase';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';

const Leaderboard = ({ isOpen, onClose }) => {
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (isOpen) {
            const fetchLeaders = async () => {
                setLoading(true);
                try {
                    const q = query(collection(db, "users"), orderBy("score", "desc"), limit(10));
                    const querySnapshot = await getDocs(q);
                    const data = querySnapshot.docs.map(doc => ({
                        id: doc.id,
                        ...doc.data()
                    }));
                    setLeaders(data);
                } catch (error) {
                    console.error("Error fetching leaderboard:", error);
                }
                setLoading(false);
            };
            fetchLeaders();
        }
    }, [isOpen]);

    return (
        <AnimatePresence>
            {isOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        onClick={onClose}
                        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
                    />
                    <motion.div
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="relative w-full max-w-md bg-gray-900 border border-white/10 rounded-2xl shadow-2xl overflow-hidden"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-6 border-b border-white/10 bg-white/5">
                            <div className="flex items-center gap-3">
                                <div className="p-2 bg-yellow-500/20 rounded-full">
                                    <Trophy className="w-6 h-6 text-yellow-500" />
                                </div>
                                <h2 className="text-xl font-bold text-white">Company Leaderboard</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* List */}
                        <div className="p-6 max-h-[60vh] overflow-y-auto custom-scrollbar">
                            {loading ? (
                                <div className="text-center py-8 text-gray-400">Loading scores...</div>
                            ) : leaders.length === 0 ? (
                                <div className="text-center py-8 text-gray-400">No scores yet.</div>
                            ) : (
                                <div className="space-y-2">
                                    {leaders.map((user, index) => (
                                        <motion.div
                                            key={user.id}
                                            initial={{ opacity: 0, x: -20 }}
                                            animate={{ opacity: 1, x: 0 }}
                                            transition={{ delay: index * 0.05 }}
                                            className={`flex items-center justify-between p-3 rounded-lg border ${index === 0 ? 'bg-yellow-500/10 border-yellow-500/30' :
                                                    index === 1 ? 'bg-gray-400/10 border-gray-400/30' :
                                                        index === 2 ? 'bg-orange-500/10 border-orange-500/30' :
                                                            'bg-white/5 border-white/5'
                                                }`}
                                        >
                                            <div className="flex items-center gap-4">
                                                <span className={`font-mono font-bold w-6 text-center ${index === 0 ? 'text-yellow-500' :
                                                        index === 1 ? 'text-gray-300' :
                                                            index === 2 ? 'text-orange-400' :
                                                                'text-gray-500'
                                                    }`}>
                                                    #{index + 1}
                                                </span>
                                                <span className="text-white font-medium truncate max-w-[150px]">
                                                    {user.displayName}
                                                </span>
                                            </div>
                                            <span className="font-mono text-gray-300">
                                                {user.score?.toLocaleString()}
                                            </span>
                                        </motion.div>
                                    ))}
                                </div>
                            )}
                        </div>
                    </motion.div>
                </div>
            )}
        </AnimatePresence>
    );
};

export default Leaderboard;
