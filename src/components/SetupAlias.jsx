import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { Briefcase } from 'lucide-react';

export default function SetupAlias() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [alias, setAlias] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();

        if (!alias.trim()) {
            setError('Please enter a company alias.');
            return;
        }

        if (!currentUser) {
            setError('No authenticated user found. Please log in again.');
            return;
        }

        try {
            setError('');
            setLoading(true);

            const docRef = doc(db, 'users', currentUser.uid);
            await setDoc(docRef, { companyAlias: alias.trim() }, { merge: true });

            navigate('/');
        } catch (err) {
            console.error('Error saving alias:', err);
            setError('Failed to save alias. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-gray-900 via-gray-800 to-black text-white p-4">
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="w-full max-w-md bg-white/10 backdrop-blur-lg rounded-2xl p-8 shadow-2xl border border-white/20"
            >
                <div className="flex justify-center mb-6">
                    <div className="p-3 bg-blue-500/20 rounded-full">
                        <Briefcase className="w-8 h-8 text-blue-400" />
                    </div>
                </div>

                <h2 className="text-2xl font-bold text-center mb-2">Welcome to the Company</h2>
                <p className="text-gray-400 text-center mb-8">Please choose an alias to display on the company leaderboard.</p>

                {error && <div className="bg-red-500/20 border border-red-500 text-red-100 px-4 py-2 rounded mb-4 text-center text-sm">{error}</div>}

                <form onSubmit={handleSubmit} className="space-y-6">
                    <div className="space-y-2">
                        <label className="text-sm font-medium text-gray-300 block">
                            Company Alias
                        </label>
                        <input
                            type="text"
                            value={alias}
                            onChange={(e) => setAlias(e.target.value)}
                            className="w-full bg-black/20 border border-white/10 rounded-lg px-4 py-3 focus:outline-none focus:ring-2 focus:ring-blue-500 transition-all text-white placeholder-gray-500"
                            placeholder="e.g. CodeNinja99"
                            required
                        />
                    </div>

                    <motion.button
                        whileHover={{ scale: 1.02 }}
                        whileTap={{ scale: 0.98 }}
                        type="submit"
                        disabled={loading}
                        className="w-full bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white font-bold py-3 rounded-lg shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
                    >
                        {loading ? 'Saving...' : 'Set Alias and Continue'}
                    </motion.button>
                </form>
            </motion.div>
        </div>
    );
}
