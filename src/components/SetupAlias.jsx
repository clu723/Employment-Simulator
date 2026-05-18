import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { useAuth } from '../context/AuthContext';
import { db } from '../firebase';
import { doc, setDoc } from 'firebase/firestore';
import { User, Sparkles, ChevronRight } from 'lucide-react';
import { generatePersistentWorkplace } from '../systems/workplaceGenerator';

const VIBE_OPTIONS = [
    "Creative Startup",
    "Cozy Productivity Studio",
    "Chaotic Remote Collective",
    "Indie Collaboration Lab",
    "Corporate Dystopia",
    "Creator Agency",
    "Minimalist Focus Hub",
    "Experimental Think Tank"
];

export default function SetupAlias() {
    const { currentUser } = useAuth();
    const navigate = useNavigate();
    const [step, setStep] = useState(1);
    const [alias, setAlias] = useState('');
    const [workplaceVibe, setWorkplaceVibe] = useState(VIBE_OPTIONS[0]);
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const handleNext = () => {
        if (step === 1 && !alias.trim()) {
            setError('Please enter a display name.');
            return;
        }
        setError('');
        setStep(2);
    };

    const handleSubmit = async () => {
        if (!workplaceVibe) {
            setError('Please select a workplace vibe.');
            return;
        }
        if (!currentUser) {
            setError('No authenticated user found. Please log in again.');
            return;
        }

        try {
            setError('');
            setLoading(true);

            // Generate persistent workplace context based on vibe
            const persistentWorkplace = await generatePersistentWorkplace(workplaceVibe);

            const docRef = doc(db, 'users', currentUser.uid);
            await setDoc(docRef, {
                companyAlias: alias.trim(),
                workplaceVibe,
                persistentWorkplace,
                projectContext: null, // Initialized as null, set during first Clock In
                rank: 'intern',
                bankBalance: 0,
                netWorth: 0,
                promotionPoints: 0,
                streak: 0,
            }, { merge: true });
            
            navigate('/');
        } catch (err) {
            console.error('Error saving profile:', err);
            setError('Failed to set up workspace. Please try again.');
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-[#0f1117] p-4">
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4 }}
                className="w-full max-w-sm"
            >
                {/* Logo */}
                <div className="text-center mb-8">
                    <div className="inline-flex items-center justify-center w-14 h-14 bg-blue-600/10 rounded-2xl mb-4">
                        <span className="text-2xl">🏢</span>
                    </div>
                    <h1 className="text-2xl font-bold text-white tracking-tight mb-1">Welcome to the Simulator</h1>
                    <p className="text-sm text-gray-500">Let's generate your workplace</p>
                </div>

                {/* Step indicator */}
                <div className="flex items-center justify-center gap-2 mb-6">
                    <div className={`w-8 h-1 rounded-full transition-colors ${step >= 1 ? 'bg-blue-500' : 'bg-white/10'}`} />
                    <div className={`w-8 h-1 rounded-full transition-colors ${step >= 2 ? 'bg-blue-500' : 'bg-white/10'}`} />
                </div>

                <div className="bg-[#1a1d24] border border-white/5 rounded-2xl p-6">
                    {error && (
                        <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-3 py-2 rounded-xl text-xs mb-4 text-center">
                            {error}
                        </div>
                    )}

                    {step === 1 ? (
                        <motion.div
                            initial={{ opacity: 0, x: -10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-5"
                        >
                            <div>
                                <h2 className="text-lg font-semibold text-white mb-1">Choose your alias</h2>
                                <p className="text-xs text-gray-500">This is how you'll appear on the company leaderboard.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Display Name</label>
                                <div className="relative group">
                                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                                    <input
                                        type="text"
                                        value={alias}
                                        onChange={(e) => setAlias(e.target.value)}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                                        placeholder="e.g. CodeNinja99"
                                        autoFocus
                                    />
                                </div>
                            </div>
                            <motion.button
                                whileHover={{ scale: 1.01 }}
                                whileTap={{ scale: 0.99 }}
                                onClick={handleNext}
                                className="w-full bg-blue-600 hover:bg-blue-500 text-white font-semibold py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                            >
                                Next <ChevronRight size={16} />
                            </motion.button>
                        </motion.div>
                    ) : (
                        <motion.div
                            initial={{ opacity: 0, x: 10 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="space-y-5"
                        >
                            <div>
                                <h2 className="text-lg font-semibold text-white mb-1">Select Workplace Vibe</h2>
                                <p className="text-xs text-gray-500">The AI will generate a persistent company context based on this vibe.</p>
                            </div>
                            <div className="space-y-2">
                                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-wider ml-1">Vibe Preset</label>
                                <div className="relative group">
                                    <Sparkles className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-500 group-focus-within:text-blue-500 transition-colors" />
                                    <select
                                        value={workplaceVibe}
                                        onChange={(e) => setWorkplaceVibe(e.target.value)}
                                        className="w-full bg-black/30 border border-white/10 rounded-xl pl-10 pr-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors appearance-none"
                                    >
                                        {VIBE_OPTIONS.map(vibe => (
                                            <option key={vibe} value={vibe} className="bg-[#1a1d24]">
                                                {vibe}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                            
                            {loading && (
                                <div className="text-xs text-blue-400 text-center animate-pulse py-2">
                                    Generating your persistent workplace...
                                </div>
                            )}

                            <div className="flex gap-2">
                                <button
                                    onClick={() => setStep(1)}
                                    disabled={loading}
                                    className="flex-1 py-3 bg-white/5 hover:bg-white/10 disabled:opacity-50 text-white text-sm font-medium rounded-xl transition-colors"
                                >
                                    Back
                                </button>
                                <motion.button
                                    whileHover={{ scale: 1.01 }}
                                    whileTap={{ scale: 0.99 }}
                                    onClick={handleSubmit}
                                    disabled={loading}
                                    className="flex-[2] py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-bold rounded-xl transition-colors"
                                >
                                    {loading ? 'Setting up...' : 'Start Simulator'}
                                </motion.button>
                            </div>
                        </motion.div>
                    )}
                </div>

                <p className="text-center mt-6 text-[9px] text-gray-700 uppercase tracking-[0.2em]">
                    Step {step} of 2
                </p>
            </motion.div>
        </div>
    );
}
