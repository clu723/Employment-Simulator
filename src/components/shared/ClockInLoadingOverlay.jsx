import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Building2, Sparkles, Laptop, ShieldCheck } from 'lucide-react';

const LOADING_MESSAGES = [
    "Connecting to secure workplace server...",
    "Coworkers are joining the virtual workspace...",
    "Manager is preparing today's tasks...",
    "Syncing company channels & databases...",
    "Retrieving project files and requirements...",
    "Applying local environment configurations...",
    "Almost ready..."
];

export default function ClockInLoadingOverlay() {
    const [messageIndex, setMessageIndex] = useState(0);

    useEffect(() => {
        const interval = setInterval(() => {
            setMessageIndex((prev) => (prev + 1) % LOADING_MESSAGES.length);
        }, 2500);
        return () => clearInterval(interval);
    }, []);

    // Get an icon based on message progress
    const getActiveIcon = () => {
        if (messageIndex <= 1) return <Building2 className="w-8 h-8 text-blue-400" />;
        if (messageIndex <= 3) return <Laptop className="w-8 h-8 text-indigo-400" />;
        if (messageIndex <= 5) return <Sparkles className="w-8 h-8 text-violet-400" />;
        return <ShieldCheck className="w-8 h-8 text-emerald-400" />;
    };

    return (
        <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.5 }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#090b11]/90 backdrop-blur-xl select-none"
        >
            {/* Glowing background highlights */}
            <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-blue-500/10 rounded-full blur-[128px] pointer-events-none" />
            <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-indigo-500/10 rounded-full blur-[128px] pointer-events-none" />

            <div className="relative flex flex-col items-center max-w-md px-6 text-center space-y-8">
                {/* Visual Anchor / Pulsing Ring */}
                <div className="relative">
                    <motion.div
                        animate={{
                            scale: [1, 1.15, 1],
                            opacity: [0.3, 0.6, 0.3],
                        }}
                        transition={{
                            duration: 3,
                            repeat: Infinity,
                            ease: "easeInOut",
                        }}
                        className="absolute inset-0 bg-blue-500/20 rounded-full blur-xl"
                    />
                    <motion.div
                        animate={{ rotate: 360 }}
                        transition={{
                            duration: 12,
                            repeat: Infinity,
                            ease: "linear",
                        }}
                        className="relative flex items-center justify-center w-24 h-24 rounded-full border-2 border-dashed border-blue-500/30 bg-black/40 backdrop-blur-md shadow-2xl"
                    >
                        <motion.div
                            key={messageIndex}
                            initial={{ scale: 0.8, opacity: 0 }}
                            animate={{ scale: 1, opacity: 1 }}
                            exit={{ scale: 0.8, opacity: 0 }}
                            transition={{ duration: 0.3 }}
                            className="flex items-center justify-center"
                        >
                            {getActiveIcon()}
                        </motion.div>
                    </motion.div>
                </div>

                {/* Brand Header */}
                <div className="space-y-1">
                    <h2 className="text-xl font-bold tracking-tight text-white">Clocking In</h2>
                    <p className="text-xs text-gray-500 uppercase tracking-[0.2em] font-medium">Starting Your Shift</p>
                </div>

                {/* Rotating Message Container with height preservation */}
                <div className="h-12 flex items-center justify-center w-full">
                    <AnimatePresence mode="wait">
                        <motion.p
                            key={messageIndex}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -10 }}
                            transition={{ duration: 0.4, ease: "easeInOut" }}
                            className="text-sm font-medium text-gray-300 tracking-wide text-center"
                        >
                            {LOADING_MESSAGES[messageIndex]}
                        </motion.p>
                    </AnimatePresence>
                </div>

                {/* Slim, Premium Loading Progress Bar */}
                <div className="w-64 h-[4px] bg-white/5 rounded-full overflow-hidden relative">
                    <motion.div
                        initial={{ width: "0%" }}
                        animate={{ width: "95%" }}
                        transition={{
                            duration: 20,
                            ease: "easeOut",
                        }}
                        className="h-full bg-gradient-to-r from-blue-500 via-indigo-500 to-violet-500 rounded-full shadow-[0_0_8px_rgba(59,130,246,0.5)]"
                    />
                </div>

                {/* Security/Onboarding Footnote */}
                <div className="text-[10px] text-gray-600 flex items-center justify-center gap-1.5 pt-4">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                    Secure workplace sandbox active
                </div>
            </div>
        </motion.div>
    );
}
