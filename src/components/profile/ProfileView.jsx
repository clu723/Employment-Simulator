import React from 'react';
import { useGame } from '../../context/GameContext';
import { getRankById, getNextRank, RANKS } from '../../utils/levels';
import { formatMoney } from '../../utils/formatters';
import { Trophy, Flame, Star, TrendingUp, Briefcase } from 'lucide-react';
import Avatar from '../shared/Avatar';
import { useAuth } from '../../context/AuthContext';

export default function ProfileView() {
    const { currentUser } = useAuth();
    const { rank, bankBalance, netWorth, promotionPoints, streak, tasksCompletedTotal } = useGame();
    const rankData = getRankById(rank);
    const nextRank = getNextRank(rank);

    const promotionPercent = nextRank
        ? Math.min(100, Math.floor((promotionPoints / nextRank.promotionThreshold) * 100))
        : 100;

    const displayName = currentUser?.displayName?.split(' ')[0] || 'Employee';

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="h-12 border-b border-white/5 bg-[#1e2028] px-4 flex items-center shrink-0">
                <h2 className="font-semibold text-sm text-white">Profile</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
                {/* Profile Card */}
                <div className="bg-[#1e2028] border border-white/5 rounded-2xl p-6 mb-6">
                    <div className="flex items-center gap-4 mb-6">
                        <Avatar emoji="🧑" color="#3b82f6" size={56} />
                        <div>
                            <h3 className="text-xl font-bold text-white">{displayName}</h3>
                            <div className={`text-sm font-bold ${rankData.color}`}>{rankData.title}</div>
                        </div>
                    </div>

                    {/* Stats Grid */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                            <div className="flex items-center gap-1.5 text-green-400 mb-1">
                                <TrendingUp size={12} />
                                <span className="text-[10px] uppercase tracking-wider font-bold">Net Worth</span>
                            </div>
                            <span className="text-lg font-bold font-mono text-white">{formatMoney(netWorth)}</span>
                        </div>
                        <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                            <div className="flex items-center gap-1.5 text-blue-400 mb-1">
                                <Briefcase size={12} />
                                <span className="text-[10px] uppercase tracking-wider font-bold">Balance</span>
                            </div>
                            <span className="text-lg font-bold font-mono text-white">{formatMoney(bankBalance)}</span>
                        </div>
                        <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                            <div className="flex items-center gap-1.5 text-orange-400 mb-1">
                                <Flame size={12} />
                                <span className="text-[10px] uppercase tracking-wider font-bold">Streak</span>
                            </div>
                            <span className="text-lg font-bold font-mono text-white">{streak}d</span>
                        </div>
                        <div className="bg-black/20 rounded-xl p-3 border border-white/5">
                            <div className="flex items-center gap-1.5 text-yellow-400 mb-1">
                                <Star size={12} />
                                <span className="text-[10px] uppercase tracking-wider font-bold">Tasks Done</span>
                            </div>
                            <span className="text-lg font-bold font-mono text-white">{tasksCompletedTotal}</span>
                        </div>
                    </div>
                </div>

                {/* Promotion Progress */}
                <div className="bg-[#1e2028] border border-white/5 rounded-2xl p-6 mb-6">
                    <h4 className="text-xs uppercase tracking-wider font-bold text-gray-500 mb-4">Promotion Progress</h4>
                    <div className="flex items-center justify-between mb-2">
                        <span className={`text-sm font-bold ${rankData.color}`}>{rankData.title}</span>
                        {nextRank ? (
                            <span className={`text-sm font-bold ${nextRank.color}`}>{nextRank.title}</span>
                        ) : (
                            <span className="text-sm font-bold text-yellow-500">Max Rank</span>
                        )}
                    </div>
                    <div className="w-full bg-white/5 rounded-full h-2 mb-2">
                        <div
                            className="h-2 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500"
                            style={{ width: `${promotionPercent}%` }}
                        />
                    </div>
                    <p className="text-xs text-gray-500">
                        {nextRank ? `${promotionPoints} / ${nextRank.promotionThreshold} promotion points` : 'You\'ve reached the top!'}
                    </p>
                </div>

                {/* Salary Info */}
                <div className="bg-[#1e2028] border border-white/5 rounded-2xl p-6">
                    <h4 className="text-xs uppercase tracking-wider font-bold text-gray-500 mb-4">Compensation</h4>
                    <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-400">Base salary per shift</span>
                        <span className="text-sm font-bold text-green-400 font-mono">{formatMoney(rankData.salary)}</span>
                    </div>
                    {streak > 0 && (
                        <div className="flex items-center justify-between mt-2">
                            <span className="text-sm text-gray-400">Streak bonus ({streak}d)</span>
                            <span className="text-sm font-bold text-orange-400 font-mono">+{streak * 10}%</span>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}
