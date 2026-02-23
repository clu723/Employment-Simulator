import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, FileText, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { extractTextFromImage } from '../utils/ocr';

const TaskVerificationModal = ({ task, isOpen, onClose, onVerify, onBypass }) => {
    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, ocr, llm, success, error
    const [progress, setProgress] = useState(0);
    const [errorMsg, setErrorMsg] = useState('');
    const fileInputRef = useRef(null);

    const handleFileChange = (e) => {
        const selectedFile = e.target.files[0];
        if (selectedFile) {
            if (!selectedFile.type.startsWith('image/')) {
                setErrorMsg('Please upload an image file.');
                return;
            }
            setFile(selectedFile);
            setPreviewUrl(URL.createObjectURL(selectedFile));
            setErrorMsg('');
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        const droppedFile = e.dataTransfer.files[0];
        if (droppedFile) {
            if (!droppedFile.type.startsWith('image/')) {
                setErrorMsg('Please upload an image file.');
                return;
            }
            setFile(droppedFile);
            setPreviewUrl(URL.createObjectURL(droppedFile));
            setErrorMsg('');
        }
    };

    const handleSubmit = async () => {
        if (!file) return;

        try {
            setStatus('ocr');
            setProgress(0);

            // 1. Run OCR
            const extractedText = await extractTextFromImage(file, setProgress);

            if (!extractedText || extractedText.trim() === '') {
                throw new Error("No text could be found in the image.");
            }

            // 2. Run LLM Verification
            setStatus('llm');
            await onVerify(task.id, extractedText);

            setStatus('success');
            setTimeout(() => {
                handleClose();
            }, 1500);

        } catch (err) {
            console.error(err);
            setStatus('error');
            setErrorMsg(err.message || 'Verification failed.');
        }
    };

    const handleClose = () => {
        setFile(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setStatus('idle');
        setProgress(0);
        setErrorMsg('');
        onClose();
    };

    if (!isOpen) return null;

    return (
        <AnimatePresence>
            <div
                className="fixed inset-0 z-50 overflow-y-auto custom-scrollbar bg-black/60 backdrop-blur-sm"
                onClick={status === 'ocr' || status === 'llm' ? undefined : handleClose}
            >
                <div className="flex min-h-full items-center justify-center p-4 py-8">
                    <motion.div
                        onClick={(e) => e.stopPropagation()}
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="m-auto w-full max-w-6xl bg-gray-900 border border-white/10 rounded-2xl shadow-2xl relative"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20 rounded-t-2xl">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <CheckCircle2 className="text-blue-400" size={20} />
                                Verify Task Completion
                            </h2>
                            <button
                                onClick={handleClose}
                                disabled={status === 'ocr' || status === 'llm'}
                                className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            {/* Task Info */}
                            <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/5">
                                <span className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Task</span>
                                <p className="text-gray-200 text-sm font-medium">{task?.text}</p>
                            </div>

                            {/* Upload Area */}
                            {!file ? (
                                <div className="space-y-4">
                                    <div
                                        className="border-2 border-dashed border-white/20 rounded-xl p-8 hover:border-blue-400/50 hover:bg-blue-400/5 transition-all text-center cursor-pointer group"
                                        onDragOver={(e) => e.preventDefault()}
                                        onDrop={handleDrop}
                                        onClick={() => fileInputRef.current?.click()}
                                    >
                                        <input
                                            type="file"
                                            ref={fileInputRef}
                                            onChange={handleFileChange}
                                            accept="image/*"
                                            className="hidden"
                                        />
                                        <div className="bg-white/5 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:bg-blue-400/20 group-hover:text-blue-400 transition-colors">
                                            <Upload size={24} className="text-gray-400 group-hover:text-blue-400" />
                                        </div>
                                        <h3 className="text-white font-medium mb-1">Upload Screenshot Proof</h3>
                                        <p className="text-sm text-gray-400 mb-4">Drag and drop or click to browse</p>
                                        <p className="text-xs text-gray-500">Supports PNG, JPG, JPEG</p>
                                    </div>
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/40 h-48 flex items-center justify-center">
                                        <img src={previewUrl} alt="Preview" className="max-h-full max-w-full object-contain" />
                                    </div>

                                    {/* Status Indicators */}
                                    <div className="h-14 flex items-center justify-center">
                                        {status === 'ocr' && (
                                            <div className="flex flex-col items-center text-blue-400">
                                                <Loader2 className="animate-spin mb-2" size={24} />
                                                <span className="text-sm font-medium flex items-center gap-2">
                                                    <FileText size={16} /> Extracting Text... {progress}%
                                                </span>
                                            </div>
                                        )}
                                        {status === 'llm' && (
                                            <div className="flex flex-col items-center text-purple-400">
                                                <Loader2 className="animate-spin mb-2" size={24} />
                                                <span className="text-sm font-medium">Manager is reviewing proof...</span>
                                            </div>
                                        )}
                                        {status === 'success' && (
                                            <div className="flex flex-col items-center text-green-400">
                                                <CheckCircle2 size={32} className="mb-2" />
                                                <span className="text-sm font-medium">Verification Complete!</span>
                                            </div>
                                        )}
                                        {status === 'error' && (
                                            <div className="flex items-center gap-2 text-red-400 bg-red-400/10 p-3 rounded-lg border border-red-400/20 w-full">
                                                <AlertCircle size={20} className="shrink-0" />
                                                <span className="text-sm">{errorMsg}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 pt-0 mt-4 border-t border-white/10">
                            {/* Action Buttons */}
                            <div className="flex flex-col gap-3 mt-6">
                                {(status === 'idle' || status === 'error') && (
                                    <>
                                        <div className="flex gap-3">
                                            {file ? (
                                                <button
                                                    onClick={() => {
                                                        setFile(null);
                                                        if (previewUrl) URL.revokeObjectURL(previewUrl);
                                                        setPreviewUrl(null);
                                                        setStatus('idle');
                                                        setErrorMsg('');
                                                    }}
                                                    className="flex-[1.5] bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center text-sm"
                                                >
                                                    Upload Another
                                                </button>
                                            ) : (
                                                <button
                                                    onClick={handleClose}
                                                    className="flex-[1.5] bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center text-sm"
                                                >
                                                    Cancel
                                                </button>
                                            )}
                                            <button
                                                onClick={handleSubmit}
                                                disabled={!file}
                                                className="flex-[2] bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                                            >
                                                <CheckCircle2 size={18} />
                                                Submit Proof
                                            </button>
                                        </div>
                                        <button
                                            onClick={() => {
                                                onBypass(task.id);
                                                handleClose();
                                            }}
                                            className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 font-medium py-2 rounded-xl border border-red-500/20 transition-colors flex items-center justify-center gap-2 text-sm"
                                        >
                                            <AlertCircle size={16} />
                                            Bypass Manager (Earn 50% Points)
                                        </button>
                                    </>
                                )}
                            </div>
                        </div>
                    </motion.div>
                </div>
            </div>
        </AnimatePresence>
    );
};

export default TaskVerificationModal;
