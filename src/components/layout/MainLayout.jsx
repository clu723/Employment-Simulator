import React, { useState } from 'react';
import { Menu, X } from 'lucide-react';
import Sidebar from './Sidebar';
import ChatView from '../chat/ChatView';
import TaskBoard from '../tasks/TaskBoard';
import ProfileView from '../profile/ProfileView';
import ApartmentView from '../profile/ApartmentView';
import LeaderboardView from '../profile/LeaderboardView';
import SettingsView from '../settings/SettingsView';

/**
 * Main application shell: sidebar + content area.
 * Routes content based on currentView state.
 */
export default function MainLayout() {
    const [currentView, setCurrentView] = useState('chat');
    const [sidebarOpen, setSidebarOpen] = useState(false);

    const handleNavigate = (view) => {
        setCurrentView(view);
        setSidebarOpen(false); // Close sidebar on mobile after nav
    };

    const renderContent = () => {
        switch (currentView) {
            case 'tasks': return <TaskBoard />;
            case 'profile': return <ProfileView />;
            case 'apartment': return <ApartmentView />;
            case 'leaderboard': return <LeaderboardView />;
            case 'settings': return <SettingsView />;
            case 'chat':
            default: return <ChatView />;
        }
    };

    return (
        <div className="h-screen bg-[#15171e] text-white flex overflow-hidden">
            {/* Mobile hamburger */}
            <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden fixed top-3 left-3 z-50 p-2 bg-[#1a1d24] border border-white/10 rounded-lg text-gray-400 hover:text-white transition-colors"
            >
                <Menu size={20} />
            </button>

            {/* Sidebar - desktop */}
            <div className="hidden lg:block">
                <Sidebar onNavigate={handleNavigate} currentView={currentView} />
            </div>

            {/* Sidebar - mobile overlay */}
            {sidebarOpen && (
                <div className="lg:hidden fixed inset-0 z-40">
                    <div className="absolute inset-0 bg-black/60" onClick={() => setSidebarOpen(false)} />
                    <div className="relative z-10 h-full">
                        <Sidebar onNavigate={handleNavigate} currentView={currentView} />
                        <button
                            onClick={() => setSidebarOpen(false)}
                            className="absolute top-3 right-3 p-2 bg-white/10 rounded-lg text-gray-300 hover:text-white"
                        >
                            <X size={18} />
                        </button>
                    </div>
                </div>
            )}

            {/* Main content area */}
            <div className="flex-1 flex flex-col min-w-0">
                {renderContent()}
            </div>
        </div>
    );
}
