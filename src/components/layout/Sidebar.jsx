import React, { useState } from 'react';
import { Hash, Volume2, ChevronDown, ChevronRight, MessageSquare, ListTodo, Home, User, Clock, LogOut, Play, Pause, Square, Flame, Settings, Trophy } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { useAuth } from '../../context/AuthContext';
import { ALL_CHARACTERS } from '../../data/coworkerTemplates';
import { getRankById } from '../../utils/levels';
import { formatTime, formatMoney } from '../../utils/formatters';
import Avatar from '../shared/Avatar';
import ConfirmDialog from '../shared/ConfirmDialog';

export default function Sidebar({ onNavigate, currentView }) {
    const { channels, activeChannel, setActiveChannel, shiftActive, clockIn, endShift, applyPenalty, timeRemaining, bankBalance, rank, streak, coworkerStates, persistentWorkplace, isClockingIn, companyAlias, markChannelRead, isChannelUnread, getUnreadCount, isPaused, togglePause, shiftTasksCompleted } = useGame();
    const { logout } = useAuth();
    const [channelsOpen, setChannelsOpen] = useState(true);
    const [dmsOpen, setDmsOpen] = useState(true);
    const [showClockIn, setShowClockIn] = useState(false);
    const [clockInGoal, setClockInGoal] = useState('');
    const [clockInDuration, setClockInDuration] = useState(30);

    // Confirm dialog states
    const [showClockOutConfirm, setShowClockOutConfirm] = useState(false);
    const [showClockOutWarning, setShowClockOutWarning] = useState(false);
    const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);

    const regularChannels = channels.filter(c => c.type === 'channel');
    const dmChannels = channels.filter(c => c.type === 'dm');
    const rankData = getRankById(rank);
    const companyName = persistentWorkplace?.companyName || 'NexTask Inc.';

    const handleChannelClick = (channelId) => {
        markChannelRead(channelId);
        setActiveChannel(channelId);
        onNavigate('chat');
    };

    const handleClockIn = (e) => {
        e.preventDefault();
        if (clockInGoal.trim() && clockInDuration > 0) {
            clockIn(clockInGoal.trim(), clockInDuration);
            setShowClockIn(false);
            setClockInGoal('');
        }
    };

    return (
        <aside className="w-[260px] h-screen bg-[#1a1d24] border-r border-white/5 flex flex-col shrink-0 select-none">
            {/* Company Header */}
            <div className="px-4 h-14 flex items-center justify-between border-b border-white/5 shrink-0">
                <h1 className="text-[15px] font-bold text-white tracking-tight">{companyName}</h1>
                <button onClick={() => setShowLogoutConfirm(true)} className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-white/5 rounded-lg transition-colors" title="Logout">
                    <LogOut size={16} />
                </button>
            </div>

            {/* Shift Status */}
            <div className="px-3 py-3 border-b border-white/5 shrink-0">
                {shiftActive ? (
                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                                <span className="text-xs font-semibold text-green-400 uppercase tracking-wider">On Shift</span>
                            </div>
                            <span className="font-mono text-sm font-bold text-white">{formatTime(timeRemaining)}</span>
                        </div>
                        {streak > 0 && (
                            <div className="flex items-center gap-1 text-orange-400 text-[10px] font-bold">
                                <Flame size={10} /> {streak} day streak
                            </div>
                        )}
                        <div className="flex gap-2">
                            <button
                                onClick={togglePause}
                                className={`flex-1 flex items-center justify-center gap-2 py-1.5 text-xs font-medium rounded-lg border transition-colors ${
                                    isPaused
                                        ? 'bg-yellow-500/20 text-yellow-400 border-yellow-500/20 hover:bg-yellow-500/30'
                                        : 'bg-white/5 text-gray-300 border-white/10 hover:bg-white/10'
                                }`}
                            >
                                {isPaused ? <Play size={12} /> : <Pause size={12} />}
                                {isPaused ? 'Resume' : 'Pause'}
                            </button>
                            <button
                                onClick={() => {
                                    if (shiftTasksCompleted > 0) {
                                        setShowClockOutConfirm(true);
                                    } else {
                                        setShowClockOutWarning(true);
                                    }
                                }}
                                className="flex-1 flex items-center justify-center gap-2 py-1.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-medium rounded-lg border border-red-500/10 transition-colors"
                            >
                                <Square size={12} /> Clock Out
                            </button>
                        </div>
                    </div>
                ) : showClockIn ? (
                    <form onSubmit={handleClockIn} className="space-y-2">
                        <input
                            type="text"
                            value={clockInGoal}
                            onChange={e => setClockInGoal(e.target.value)}
                            placeholder="What's your goal today?"
                            className="w-full bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white placeholder-gray-500 focus:outline-none focus:border-blue-500/50"
                            autoFocus
                            required
                        />
                        <div className="flex gap-2">
                            <input
                                type="number"
                                value={clockInDuration}
                                onChange={e => setClockInDuration(parseInt(e.target.value) || 30)}
                                min="1"
                                className="w-20 bg-black/30 border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono focus:outline-none focus:border-blue-500/50"
                            />
                            <span className="text-[10px] text-gray-500 self-center">min</span>
                            <button type="submit" disabled={isClockingIn} className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white text-xs font-bold py-2 rounded-lg transition-colors">
                                {isClockingIn ? '...' : 'Start'}
                            </button>
                        </div>
                        <button type="button" disabled={isClockingIn} onClick={() => setShowClockIn(false)} className="w-full text-[10px] text-gray-500 hover:text-gray-300 disabled:opacity-50 transition-colors">
                            Cancel
                        </button>
                    </form>
                ) : (
                    <button
                        onClick={() => setShowClockIn(true)}
                        className="w-full flex items-center justify-center gap-2 py-2 bg-green-600/10 hover:bg-green-600/20 text-green-400 text-xs font-semibold rounded-lg border border-green-500/20 transition-colors"
                    >
                        <Play size={14} /> Clock In
                    </button>
                )}
            </div>

            {/* Scrollable nav area */}
            <div className="flex-1 overflow-y-auto py-3 space-y-1 custom-scrollbar">
                {/* Channels section */}
                <button onClick={() => setChannelsOpen(!channelsOpen)} className="flex items-center gap-1 px-3 py-0.5 text-[11px] font-semibold text-gray-500 hover:text-gray-300 uppercase tracking-wider w-full text-left transition-colors">
                    {channelsOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                    Channels
                </button>
                {channelsOpen && regularChannels.map(ch => {
                    const unread = isChannelUnread(ch.id);
                    const unreadCount = getUnreadCount(ch.id);
                    const isActive = activeChannel === ch.id && currentView === 'chat';
                    return (
                        <button
                            key={ch.id}
                            onClick={() => handleChannelClick(ch.id)}
                            className={`flex items-center gap-2 px-3 py-1.5 mx-2 rounded-md text-sm w-[calc(100%-16px)] text-left transition-colors ${
                                isActive
                                    ? 'bg-blue-600/20 text-white'
                                    : unread
                                        ? 'text-white font-semibold hover:bg-white/5'
                                        : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                            }`}
                        >
                            <Hash size={14} className="shrink-0 opacity-60" />
                            {unread && (
                                <div className="w-2 h-2 rounded-full bg-blue-500 shrink-0" />
                            )}
                            <span className="truncate">{ch.name}</span>
                            {unreadCount > 0 && (
                                <span className="ml-auto text-[10px] font-bold text-blue-400 bg-blue-500/20 px-1.5 py-0.5 rounded-full">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </button>
                    );
                })}

                {/* DMs section */}
                <button onClick={() => setDmsOpen(!dmsOpen)} className="flex items-center gap-1 px-3 py-0.5 mt-3 text-[11px] font-semibold text-gray-500 hover:text-gray-300 uppercase tracking-wider w-full text-left transition-colors">
                    {dmsOpen ? <ChevronDown size={10} /> : <ChevronRight size={10} />}
                    Direct Messages
                </button>
                {dmsOpen && dmChannels.map(dm => {
                    const coworkerState = coworkerStates[dm.characterId] || {};
                    const unread = isChannelUnread(dm.id);
                    const unreadCount = getUnreadCount(dm.id);
                    const isActive = activeChannel === dm.id && currentView === 'chat';
                    return (
                        <button
                            key={dm.id}
                            onClick={() => handleChannelClick(dm.id)}
                            className={`flex items-center gap-2 px-3 py-1.5 mx-2 rounded-md text-sm w-[calc(100%-16px)] text-left transition-colors ${
                                isActive
                                    ? 'bg-blue-600/20 text-white'
                                    : unread
                                        ? 'text-white font-semibold hover:bg-white/5'
                                        : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                            }`}
                        >
                            <Avatar emoji={dm.avatar} color={dm.accentColor} size={22} online={coworkerState.isOnline} />
                            <span className="truncate">{dm.name}</span>
                            {unreadCount > 0 && (
                                <span className="ml-auto text-[10px] font-bold text-blue-400 bg-blue-500/20 px-1.5 py-0.5 rounded-full">
                                    {unreadCount > 99 ? '99+' : unreadCount}
                                </span>
                            )}
                        </button>
                    );
                })}

                {/* Divider */}
                <div className="border-t border-white/5 my-3 mx-3" />

                {/* Navigation Items */}
                <button
                    onClick={() => onNavigate('tasks')}
                    className={`flex items-center gap-2 px-3 py-1.5 mx-2 rounded-md text-sm w-[calc(100%-16px)] text-left transition-colors ${
                        currentView === 'tasks' ? 'bg-blue-600/20 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                    }`}
                >
                    <ListTodo size={14} className="shrink-0 opacity-60" />
                    <span>Tasks</span>
                </button>
                <button
                    onClick={() => onNavigate('leaderboard')}
                    className={`flex items-center gap-2 px-3 py-1.5 mx-2 rounded-md text-sm w-[calc(100%-16px)] text-left transition-colors ${
                        currentView === 'leaderboard' ? 'bg-blue-600/20 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                    }`}
                >
                    <Trophy size={14} className="shrink-0 opacity-60 text-yellow-500" />
                    <span>Leaderboard</span>
                </button>
                <button
                    onClick={() => onNavigate('apartment')}
                    className={`flex items-center gap-2 px-3 py-1.5 mx-2 rounded-md text-sm w-[calc(100%-16px)] text-left transition-colors ${
                        currentView === 'apartment' ? 'bg-blue-600/20 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                    }`}
                >
                    <Home size={14} className="shrink-0 opacity-60" />
                    <span>Apartment</span>
                </button>
                <button
                    onClick={() => onNavigate('profile')}
                    className={`flex items-center gap-2 px-3 py-1.5 mx-2 rounded-md text-sm w-[calc(100%-16px)] text-left transition-colors ${
                        currentView === 'profile' ? 'bg-blue-600/20 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                    }`}
                >
                    <User size={14} className="shrink-0 opacity-60" />
                    <span>Profile</span>
                </button>
                <button
                    onClick={() => onNavigate('settings')}
                    className={`flex items-center gap-2 px-3 py-1.5 mx-2 rounded-md text-sm w-[calc(100%-16px)] text-left transition-colors ${
                        currentView === 'settings' ? 'bg-blue-600/20 text-white' : 'text-gray-400 hover:bg-white/5 hover:text-gray-200'
                    }`}
                >
                    <Settings size={14} className="shrink-0 opacity-60" />
                    <span>Settings</span>
                </button>
            </div>

            {/* Footer: User info */}
            <div className="px-3 py-3 border-t border-white/5 shrink-0">
                <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2 min-w-0">
                        <Avatar emoji="🧑" color="#6b7280" size={28} online={shiftActive} />
                        <div className="min-w-0">
                            <div className="text-xs font-medium text-white truncate">{companyAlias || 'Employee'}</div>
                            <div className={`text-[10px] font-bold ${rankData.color}`}>{rankData.title}</div>
                        </div>
                    </div>
                    <span className="text-xs font-mono font-bold text-green-400">{formatMoney(bankBalance)}</span>
                </div>
            </div>

            {/* ── Confirm Dialogs ── */}

            {/* Clock Out (tasks completed) */}
            <ConfirmDialog
                isOpen={showClockOutConfirm}
                onClose={() => setShowClockOutConfirm(false)}
                title="End Shift"
                message="You have completed tasks this shift. Are you sure you want to clock out now?"
                confirmText="Clock Out"
                cancelText="Keep Working"
                onConfirm={() => {
                    setShowClockOutConfirm(false);
                    endShift();
                }}
                variant="info"
            />

            {/* Clock Out Warning (no tasks completed — penalty) */}
            <ConfirmDialog
                isOpen={showClockOutWarning}
                onClose={() => setShowClockOutWarning(false)}
                title="⚠️ End Shift Without Completing Tasks?"
                message="You haven't completed any tasks this shift. If you clock out now, a 15% salary penalty will be applied to ALL shifts for the next 7 days. Are you sure you want to proceed?"
                confirmText="Clock Out Anyway"
                cancelText="Keep Working"
                onConfirm={() => {
                    setShowClockOutWarning(false);
                    applyPenalty();
                    endShift();
                }}
                variant="danger"
            />

            {/* Logout Confirm */}
            <ConfirmDialog
                isOpen={showLogoutConfirm}
                onClose={() => setShowLogoutConfirm(false)}
                title="Log Out"
                message="Are you sure you want to log out? Your progress will be saved."
                confirmText="Log Out"
                cancelText="Cancel"
                onConfirm={() => {
                    setShowLogoutConfirm(false);
                    logout();
                }}
                variant="warning"
                icon={LogOut}
            />
        </aside>
    );
}
