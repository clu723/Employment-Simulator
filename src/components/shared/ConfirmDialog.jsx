import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle, LogOut, Info } from 'lucide-react';

const variantConfig = {
    danger: {
        icon: AlertTriangle,
        iconColor: 'text-red-400',
        confirmBg: 'bg-red-600 hover:bg-red-500',
        border: 'border-red-500/20',
    },
    warning: {
        icon: AlertTriangle,
        iconColor: 'text-amber-400',
        confirmBg: 'bg-amber-600 hover:bg-amber-500',
        border: 'border-amber-500/20',
    },
    info: {
        icon: Info,
        iconColor: 'text-blue-400',
        confirmBg: 'bg-blue-600 hover:bg-blue-500',
        border: 'border-blue-500/20',
    },
};

const ConfirmDialog = ({
    isOpen,
    onClose,
    title,
    message,
    confirmText = 'Confirm',
    cancelText = 'Cancel',
    onConfirm,
    variant = 'info',
    icon: CustomIcon,
    confirmDisabled = false,
}) => {
    if (!isOpen) return null;

    const config = variantConfig[variant] || variantConfig.info;
    const Icon = CustomIcon || config.icon;

    return (
        <AnimatePresence>
            <div
                className="fixed inset-0 z-50 overflow-y-auto custom-scrollbar bg-black/60 backdrop-blur-sm"
                onClick={onClose}
            >
                <div className="flex min-h-full items-center justify-center p-4 py-8">
                    <motion.div
                        onClick={(e) => e.stopPropagation()}
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="m-auto w-full max-w-md bg-gray-900 border border-white/10 rounded-2xl shadow-2xl relative"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20 rounded-t-2xl">
                            <div className="flex items-center gap-2">
                                <Icon className={config.iconColor} size={20} />
                                <h2 className="text-lg font-bold text-white">{title}</h2>
                            </div>
                            <button
                                onClick={onClose}
                                className="text-gray-400 hover:text-white transition-colors"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        {/* Body */}
                        <div className="p-6">
                            <p className="text-sm text-gray-300 leading-relaxed whitespace-pre-wrap">
                                {message}
                            </p>
                        </div>

                        {/* Footer */}
                        <div className="p-4 pt-0 flex gap-3 border-t border-white/10 bg-black/5 rounded-b-2xl mt-4">
                            <button
                                onClick={onClose}
                                className="flex-1 py-2.5 bg-white/10 hover:bg-white/20 text-white font-medium rounded-xl transition-colors text-sm"
                            >
                                {cancelText}
                            </button>
                            <button
                                onClick={onConfirm}
                                disabled={confirmDisabled}
                                className={`flex-1 py-2.5 text-white font-medium rounded-xl transition-colors text-sm disabled:opacity-50 ${config.confirmBg}`}
                            >
                                {confirmText}
                            </button>
                        </div>
                    </motion.div>
                </div>
            </div>
        </AnimatePresence>
    );
};

export default ConfirmDialog;
