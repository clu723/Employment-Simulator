import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Clock, Briefcase, User, LogOut } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { Link, useNavigate } from 'react-router-dom';
import { db } from '../firebase';
import { doc, getDoc } from 'firebase/firestore';
import { getLevelFromScore } from '../utils/levels';

const ClockIn = ({ onClockIn }) => {
    const { currentUser, logout } = useAuth();
    const navigate = useNavigate();
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
            onClockIn({ name: derivedName, goal, duration });
        }
    };

    const handleLogout = async () => {
        setError('');
        try {
            await logout();
        } catch {
            setError('Failed to log out');
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20"
            >
                <div className="flex justify-between items-center mb-8">
                    <div className="flex items-center justify-center">
                        <div className="p-3 bg-blue-500/20 rounded-full">
                            <Clock className="w-8 h-8 text-blue-400" />
                        </div>
                    </div>
                    <div>
                        {currentUser ? (
                            <div className="flex flex-col items-start">
                                <div className="flex items-center gap-4">
                                    <span className="text-sm text-gray-300">Welcome {derivedName}!</span>
                                    <button onClick={handleLogout} className="text-sm text-red-400 hover:text-red-300 flex items-center gap-1">
                                        <LogOut size={16} /> Logout
                                    </button>
                                </div>
                                <div className={`text-xs font-bold mt-1 ${level.color}`}>
                                    {level.title}
                                </div>
                            </div>
                        ) : (
                            <div className="flex items-center gap-4">
                                <Link to="/login" className="text-sm text-blue-400 hover:text-blue-300">Login</Link>
                            </div>
                        )}
                    </div>
                </div>

                <h1 className="text-3xl font-bold text-center mb-2">Employment Simulator</h1>
                <p className="text-gray-400 text-center mb-8">Clock in to start your shift.</p>
                {error && <div className="bg-red-500/20 border border-red-500 text-red-100 px-4 py-2 rounded mb-4 text-center text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <Briefcase size={16} /> Work Goal
                        </label>
                        <input
                            type="text"
                            value={goal}
                            onChange={(e) => setGoal(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white placeholder-gray-500"
                            placeholder="e.g., Complete the project report"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                            <Clock size={16} /> Shift Duration (Minutes)
                        </label>
                        <input
                            type="number"
                            value={duration}
                            onChange={(e) => setDuration(parseInt(e.target.value))}
                            min="1"
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white placeholder-gray-500"
                            required
                        />
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-500/20 transition-all"
                    >
                        Clock In
                    </motion.button>
                </form>
            </motion.div>
        </div>
    );
};

export default ClockIn;
