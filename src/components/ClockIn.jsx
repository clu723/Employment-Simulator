import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Briefcase, LogOut, HelpCircle, Trophy } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getLevelFromScore } from '../utils/levels';
import { useTutorial } from '../context/TutorialContext';

const ClockIn = ({ onClockIn }) => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
    const { startTutorial, advanceToWorkspace } = useTutorial();
    const [goal, setGoal] = useState('');
    const [duration, setDuration] = useState(30);
    const [error, setError] = useState('');
    const [userScore, setUserScore] = useState(0);

    const derivedName = currentUser?.displayName?.split(' ')[0] || 'Employee';

    useEffect(() => {
        const fetchScore = async () => {
            if (currentUser) {
                try {
                    const docRef = doc(db, 'users', currentUser.uid);
                    const docSnap = await getDoc(docRef);
                    if (docSnap.exists()) {
                        setUserScore(docSnap.data().score || 0);
                    }
                } catch (err) {
                    console.error("Error fetching score:", err);
                }
            }
        };
        fetchScore();
    }, [currentUser]);

    const level = getLevelFromScore(userScore);

    const handleSubmit = (e) => {
        e.preventDefault();
        if (derivedName && goal && duration > 0) {
            advanceToWorkspace();
            onClockIn({ name: derivedName, goal, duration });
        }
    };

    const handleLogout = async () => {
        setError('');
        try { await logout(); } catch { setError('Failed to log out'); }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-[#0f1117] text-white p-4">
            {/* Subtle background glow */}
            <div className="fixed inset-0 pointer-events-none">
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-600/5 rounded-full blur-[120px]" />
            </div>

            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="w-full max-w-md bg-[#1a1d27] border border-white/10 rounded-3xl p-8 shadow-2xl relative z-10"
            >
                {/* Header: Profile & Actions */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-10">
                    <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-blue-600/10 rounded-2xl flex items-center justify-center border border-blue-500/20">
                            <Clock className="w-6 h-6 text-blue-400" />
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-300">Welcome, {derivedName}</span>
                            <div className="flex items-center gap-2">
                                <Trophy size={12} className="text-yellow-500/80" />
                                <span className={`text-xs font-bold ${level.color}`}>{level.title}</span>
                            </div>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => startTutorial('clockin')}
                            title="Help"
                            className="p-2.5 bg-white/5 hover:bg-white/10 text-gray-400 hover:text-white rounded-xl border border-white/5 transition-colors"
                        >
                            <HelpCircle size={18} />
                        </button>
                        <button
                            onClick={handleLogout}
                            title="Logout"
                            className="p-2.5 bg-red-500/5 hover:bg-red-500/10 text-red-400 rounded-xl border border-red-500/10 transition-colors"
                        >
                            <LogOut size={18} />
                        </button>
                    </div>
                </div>

                <div className="mb-10">
                    <h1 className="text-3xl font-bold text-white mb-2">Start your shift</h1>
                    <p className="text-gray-400 text-sm">Set your goal and duration to begin tracking your productivity.</p>
                </div>

                {error && (
                    <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-2xl mb-6 text-sm">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2" data-tutorial="goal-input">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">
                            Current Goal
                        </label>
                        <div className="relative group">
                            <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="text"
                                value={goal}
                                onChange={(e) => setGoal(e.target.value)}
                                className="w-full bg-black/20 border border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all text-white placeholder-gray-600"
                                placeholder="What are you working on?"
                                required
                            />
                        </div>
                    </div>

                    <div className="space-y-2" data-tutorial="duration-input">
                        <label className="text-xs font-semibold text-gray-500 uppercase tracking-wider ml-1">
                            Shift Length (Minutes)
                        </label>
                        <div className="relative group">
                            <Clock className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                            <input
                                type="number"
                                value={duration}
                                onChange={(e) => setDuration(parseInt(e.target.value))}
                                min="1"
                                className="w-full bg-black/20 border border-white/10 rounded-2xl pl-12 pr-4 py-4 focus:outline-none focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/50 transition-all text-white font-mono font-bold"
                                required
                            />
                        </div>
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.01 }}
                        whileTap={{ scale: 0.99 }}
                        type="submit"
                        data-tutorial="clockin-btn"
                        className="w-full bg-blue-600 hover:bg-blue-500 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-900/20 transition-all flex items-center justify-center gap-2"
                    >
                        Clock In
                    </motion.button>
                </form>
            </motion.div>
        </div>
    );
};

export default ClockIn;
