import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX } from 'lucide-react';

const ManagerChat = ({ messages }) => {
    const scrollRef = useRef(null);
    const prevMessagesLength = useRef(messages.length);
    const [isMuted, setIsMuted] = useState(false);

    useEffect(() => {
        if (messages.length > prevMessagesLength.current && !isMuted) {
            const audio = new Audio('https://assets.mixkit.co/active_storage/sfx/2574/2574-preview.mp3');
            audio.volume = 0.2;
            audio.play().catch(e => console.log('Audio playback failed:', e));
        }
        prevMessagesLength.current = messages.length;

        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    return (
        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-2xl p-6 h-full flex flex-col min-h-[500px]">
            <div className="flex items-center justify-between mb-4 border-b border-white/10 pb-2">
                <div className="flex items-center gap-2">
                    <h2 className="text-lg font-semibold text-white">Manager</h2>
                </div>
                <button
                    onClick={() => setIsMuted(!isMuted)}
                    className="p-2 hover:bg-white/10 rounded-full transition-colors text-gray-400 hover:text-white"
                    title={isMuted ? "Unmute Notifications" : "Mute Notifications"}
                >
                    {isMuted ? <VolumeX size={20} /> : <Volume2 size={20} />}
                </button>
            </div>

            <div className="flex-1 overflow-y-auto space-y-3 pr-2 custom-scrollbar" ref={scrollRef}>
                <AnimatePresence>
                    {messages.map((msg) => (
                        <motion.div
                            key={msg.id}
                            initial={{ opacity: 0, x: -20 }}
                            animate={{ opacity: 1, x: 0 }}
                            className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-3 text-sm text-gray-200"
                        >
                            <span className="font-bold text-blue-400 text-xs block mb-1">{msg.sender}</span>
                            {msg.text}
                        </motion.div>
                    ))}
                </AnimatePresence>
            </div>
        </div>
    );
};

export default ManagerChat;
