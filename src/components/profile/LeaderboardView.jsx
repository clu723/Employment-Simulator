import React, { useEffect, useState } from 'react';
import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '../../firebase';
import { Trophy, Medal, User } from 'lucide-react';
import { formatMoney } from '../../utils/formatters';
import { getRankById } from '../../utils/levels';
import { useAuth } from '../../context/AuthContext';
import Avatar from '../shared/Avatar';

export default function LeaderboardView() {
    const { currentUser } = useAuth();
    const [leaders, setLeaders] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLeaderboard = async () => {
            try {
                const q = query(collection(db, 'users'), orderBy('netWorth', 'desc'), limit(20));
                const querySnapshot = await getDocs(q);
                const data = [];
                querySnapshot.forEach((doc) => {
                    data.push({ id: doc.id, ...doc.data() });
                });
                setLeaders(data);
            } catch (err) {
                console.error("Failed to fetch leaderboard:", err);
            } finally {
                setLoading(false);
            }
        };
        fetchLeaderboard();
    }, []);

    if (loading) {
        return (
            <div className="flex items-center justify-center h-full text-gray-500">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-white/20"></div>
            </div>
        );
    }

    return (
        <div className="flex flex-col h-full bg-[#13151a]">
            {/* Header */}
            <div className="h-12 border-b border-white/5 bg-[#1e2028] px-4 flex items-center shrink-0">
                <h2 className="font-semibold text-sm text-white flex items-center gap-2">
                    <Trophy size={16} className="text-yellow-500" />
                    Global Leaderboard
                </h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                <div className="bg-[#1e2028] border border-white/5 rounded-2xl overflow-hidden">
                    {/* Header Row */}
                    <div className="grid grid-cols-[40px_1fr_100px] gap-4 px-4 py-3 bg-white/5 text-xs uppercase tracking-wider font-bold text-gray-400 border-b border-white/5">
                        <div className="text-center">#</div>
                        <div>Employee</div>
                        <div className="text-right">Net Worth</div>
                    </div>

                    {/* List */}
                    <div className="divide-y divide-white/5">
                        {leaders.map((user, index) => {
                            const isCurrentUser = currentUser && user.id === currentUser.uid;
                            const rankData = getRankById(user.rank || 'intern');
                            const displayName = user.companyAlias || 'Anonymous Employee';

                            let RankIcon = null;
                            if (index === 0) RankIcon = <Trophy size={16} className="text-yellow-400" />;
                            else if (index === 1) RankIcon = <Medal size={16} className="text-gray-300" />;
                            else if (index === 2) RankIcon = <Medal size={16} className="text-amber-600" />;

                            return (
                                <div 
                                    key={user.id} 
                                    className={`grid grid-cols-[40px_1fr_100px] gap-4 px-4 py-3 items-center transition-colors ${
                                        isCurrentUser ? 'bg-blue-500/10' : 'hover:bg-white/5'
                                    }`}
                                >
                                    {/* Rank */}
                                    <div className="text-center font-mono font-bold text-gray-500 flex justify-center items-center h-full">
                                        {RankIcon || <span className="text-xs">{index + 1}</span>}
                                    </div>

                                    {/* User Info */}
                                    <div className="flex items-center gap-3 min-w-0">
                                        <Avatar emoji="🧑" size={32} />
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className={`font-medium truncate ${isCurrentUser ? 'text-blue-400 font-bold' : 'text-white'}`}>
                                                    {displayName}
                                                </span>
                                                {isCurrentUser && (
                                                    <span className="bg-blue-500 text-white text-[9px] uppercase font-bold px-1.5 py-0.5 rounded">You</span>
                                                )}
                                            </div>
                                            <div className={`text-xs truncate ${rankData.color || 'text-gray-500'}`}>
                                                {rankData.title}
                                            </div>
                                        </div>
                                    </div>

                                    {/* Net Worth */}
                                    <div className="text-right font-mono font-bold text-green-400">
                                        {formatMoney(user.netWorth || 0)}
                                    </div>
                                </div>
                            );
                        })}
                        {leaders.length === 0 && (
                            <div className="p-8 text-center text-gray-500 text-sm">
                                No employees found.
                            </div>
                        )}
                    </div>
                </div>
            </div>
        </div>
    );
}
