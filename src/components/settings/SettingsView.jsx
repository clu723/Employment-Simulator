import React, { useState } from 'react';
import { Settings as SettingsIcon, Sparkles, User } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';
import { db } from '../../firebase';
import { doc, setDoc, getDocs, collection, query, where } from 'firebase/firestore';
import { generatePersistentWorkplace } from '../../systems/workplaceGenerator';

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

export default function SettingsView() {
    const { currentUser } = useAuth();
    const { workplaceVibe, setPersistentWorkplace, companyAlias, updateAlias } = useGame();
    
    const [selectedVibe, setSelectedVibe] = useState(workplaceVibe || VIBE_OPTIONS[0]);
    const [loading, setLoading] = useState(false);
    const [vibeError, setVibeError] = useState('');
    const [vibeSuccess, setVibeSuccess] = useState('');

    const [aliasInput, setAliasInput] = useState(companyAlias || '');
    const [aliasSaving, setAliasSaving] = useState(false);
    const [aliasError, setAliasError] = useState('');
    const [aliasSuccess, setAliasSuccess] = useState('');

    const handleSaveVibe = async () => {
        if (selectedVibe === workplaceVibe) {
            setVibeSuccess("No changes made.");
            setTimeout(() => setVibeSuccess(''), 3000);
            return;
        }

        try {
            setLoading(true);
            setVibeError('');
            setVibeSuccess('');

            const newPersistentWorkplace = await generatePersistentWorkplace(selectedVibe);

            if (currentUser) {
                const docRef = doc(db, 'users', currentUser.uid);
                await setDoc(docRef, {
                    workplaceVibe: selectedVibe,
                    persistentWorkplace: newPersistentWorkplace
                }, { merge: true });
            }

            setPersistentWorkplace(selectedVibe, newPersistentWorkplace);
            
            setVibeSuccess("Workplace successfully updated!");
            setTimeout(() => setVibeSuccess(''), 3000);
        } catch (err) {
            console.error(err);
            setVibeError("Failed to update workplace vibe. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const handleSaveAlias = async () => {
        try {
            setAliasError('');
            setAliasSuccess('');
            setAliasSaving(true);

            const trimmed = aliasInput.trim();

            if (trimmed.length < 2) {
                setAliasError('Alias must be at least 2 characters.');
                return;
            }

            if (trimmed.length > 30) {
                setAliasError('Alias must be 30 characters or less.');
                return;
            }

            // Check uniqueness
            if (trimmed.toLowerCase() !== (companyAlias || '').toLowerCase()) {
                const q = query(collection(db, 'users'), where('companyAlias', '==', trimmed));
                const existing = await getDocs(q);
                if (!existing.empty) {
                    setAliasError('This alias is already taken. Please choose another.');
                    return;
                }
            }

            await updateAlias(trimmed);
            setAliasSuccess('Alias updated successfully.');
            setTimeout(() => setAliasSuccess(''), 3000);
        } catch (err) {
            setAliasError(err.message || 'Failed to update alias.');
        } finally {
            setAliasSaving(false);
        }
    };

    return (
        <div className="flex-1 bg-[#0f1117] flex flex-col min-h-0">
            <div className="h-14 border-b border-white/5 bg-[#1a1d24] flex items-center px-6 shrink-0">
                <SettingsIcon size={18} className="text-gray-400 mr-3" />
                <h1 className="text-sm font-semibold text-white tracking-wide">Settings</h1>
            </div>
            
            <div className="flex-1 overflow-y-auto p-6">
                <div className="max-w-2xl mx-auto space-y-8">
                    {/* Alias Section */}
                    <section className="bg-[#1a1d24] border border-white/5 rounded-2xl p-6">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h2 className="text-lg font-semibold text-white mb-1">Edit Alias</h2>
                                <p className="text-sm text-gray-500">Change how you appear to coworkers and on the leaderboard.</p>
                            </div>
                            <div className="p-3 bg-blue-500/10 rounded-xl">
                                <User size={20} className="text-blue-400" />
                            </div>
                        </div>

                        {aliasError && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm mb-6">
                                {aliasError}
                            </div>
                        )}

                        {aliasSuccess && (
                            <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl text-sm mb-6">
                                {aliasSuccess}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Display Alias</label>
                                <input
                                    type="text"
                                    value={aliasInput}
                                    onChange={(e) => setAliasInput(e.target.value)}
                                    placeholder="Enter your alias"
                                    maxLength={30}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white placeholder-gray-600 focus:outline-none focus:border-blue-500/50 transition-colors"
                                />
                                <p className="text-xs text-gray-500 mt-1">2-30 characters. Must be unique across all employees.</p>
                            </div>

                            <button
                                onClick={handleSaveAlias}
                                disabled={aliasSaving || !aliasInput.trim() || aliasInput.trim() === companyAlias}
                                className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
                            >
                                {aliasSaving ? 'Saving...' : 'Save Alias'}
                            </button>
                        </div>
                    </section>

                    {/* Workplace Identity Section */}
                    <section className="bg-[#1a1d24] border border-white/5 rounded-2xl p-6">
                        <div className="flex items-start justify-between mb-6">
                            <div>
                                <h2 className="text-lg font-semibold text-white mb-1">Workplace Identity</h2>
                                <p className="text-sm text-gray-500">Change the overarching vibe of your simulation. This will alter the company name, culture, and your coworkers' base roles.</p>
                            </div>
                            <div className="p-3 bg-blue-500/10 rounded-xl">
                                <Sparkles size={20} className="text-blue-400" />
                            </div>
                        </div>

                        {vibeError && (
                            <div className="bg-red-500/10 border border-red-500/20 text-red-400 px-4 py-3 rounded-xl text-sm mb-6">
                                {vibeError}
                            </div>
                        )}

                        {vibeSuccess && (
                            <div className="bg-green-500/10 border border-green-500/20 text-green-400 px-4 py-3 rounded-xl text-sm mb-6">
                                {vibeSuccess}
                            </div>
                        )}

                        <div className="space-y-4">
                            <div>
                                <label className="block text-xs font-bold text-gray-400 uppercase tracking-wider mb-2">Workplace Vibe</label>
                                <select
                                    value={selectedVibe}
                                    onChange={(e) => setSelectedVibe(e.target.value)}
                                    className="w-full bg-black/30 border border-white/10 rounded-xl px-4 py-3 text-sm text-white focus:outline-none focus:border-blue-500/50 transition-colors appearance-none"
                                >
                                    {VIBE_OPTIONS.map(vibe => (
                                        <option key={vibe} value={vibe} className="bg-[#1a1d24]">{vibe}</option>
                                    ))}
                                </select>
                            </div>

                            <button
                                onClick={handleSaveVibe}
                                disabled={loading || selectedVibe === workplaceVibe}
                                className="w-full sm:w-auto px-6 py-3 bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white text-sm font-semibold rounded-xl transition-colors"
                            >
                                {loading ? 'Regenerating Workplace...' : 'Save & Regenerate'}
                            </button>
                        </div>
                    </section>
                </div>
            </div>
        </div>
    );
}