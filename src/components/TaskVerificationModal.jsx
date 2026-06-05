import React, { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Upload, X, CheckCircle2, AlertCircle, Loader2, Send } from 'lucide-react';
import { fileToBase64 } from '../utils/ocr';

const TaskVerificationModal = ({ task, isOpen, onClose, onVerify, onBypass, onCompleteWithProof, getVerificationResult }) => {
    // Support both new flow (verifyScreenshot + completeTaskWithProof) and legacy flow (onVerify = completeTaskWithProof)
    const handleVerify = onVerify;
    const handleCompleteWithProof = onCompleteWithProof || onVerify;
    const handleGetVerificationResult = getVerificationResult || (() => null);

    const [file, setFile] = useState(null);
    const [previewUrl, setPreviewUrl] = useState(null);
    const [status, setStatus] = useState('idle'); // idle, checking, approved, rejected, error, completing
    const [approvalResult, setApprovalResult] = useState(null);
    const [errorMsg, setErrorMsg] = useState('');
    const [feedbackText, setFeedbackText] = useState('');
    const fileInputRef = useRef(null);
    const onCloseRef = useRef(onClose);
    useEffect(() => { onCloseRef.current = onClose; }, [onClose]);

    const resetState = useCallback(() => {
        setFile(null);
        if (previewUrl) URL.revokeObjectURL(previewUrl);
        setPreviewUrl(null);
        setStatus('idle');
        setApprovalResult(null);
        setErrorMsg('');
        setFeedbackText('');
    }, [previewUrl]);

    const handleClose = useCallback(() => {
        resetState();
        onCloseRef.current();
    }, [resetState]);

    // Load stored verification when task opens
    useEffect(() => {
        if (!isOpen || !task) return;
        const stored = handleGetVerificationResult(task.id);
        if (stored) {
            setApprovalResult(stored);
            setStatus(stored.approved ? 'approved' : 'rejected');
            setFeedbackText(stored.approved ? 'Previously evaluated as Approved' : 'Previously evaluated as Not approved');
        }
    }, [isOpen, task, handleGetVerificationResult]);

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
            setFeedbackText('Screenshot updated');
            setStatus('idle');
            setApprovalResult(null);
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
            setFeedbackText('Screenshot updated');
            setStatus('idle');
            setApprovalResult(null);
        }
    };

    const handleSubmit = async () => {
        if (!file) return;

        try {
            setStatus('checking');
            setFeedbackText('Re-evaluating submission...');
            setApprovalResult(null);
            setErrorMsg('');

            const base64Image = await fileToBase64(file);
            const result = await handleVerify(task.id, base64Image);

            if (result && result.approved) {
                setApprovalResult(result);
                setStatus('approved');
                setFeedbackText('New result: Approved');
            } else {
                setApprovalResult(result || { approved: false, reason: 'No reason provided.' });
                setStatus('rejected');
                setFeedbackText('New result: Not approved');
            }
        } catch (err) {
            console.error(err);
            setStatus('error');
            setErrorMsg(err.message || 'Verification failed.');
            setFeedbackText('');
        }
    };

    const handleCompleteTask = async () => {
        if (!task) return;
        try {
            setStatus('completing');
            await handleCompleteWithProof(task.id);
            handleClose();
        } catch (err) {
            console.error(err);
            setStatus('error');
            setErrorMsg(err.message || 'Failed to complete task.');
        }
    };

    if (!isOpen) return null;

    const hasResult = status === 'approved' || status === 'rejected';

    return (
        <AnimatePresence>
            <div
                className="fixed inset-0 z-50 overflow-y-auto custom-scrollbar bg-black/60 backdrop-blur-sm"
                onClick={status === 'checking' || status === 'completing' ? undefined : handleClose}
            >
                <div className="flex min-h-full items-center justify-center p-4 py-8">
                    <motion.div
                        onClick={(e) => e.stopPropagation()}
                        initial={{ opacity: 0, scale: 0.95, y: 20 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 20 }}
                        className="m-auto w-full max-w-lg sm:max-w-xl bg-gray-900 border border-white/10 rounded-2xl shadow-2xl relative"
                    >
                        {/* Header */}
                        <div className="flex items-center justify-between p-4 border-b border-white/10 bg-black/20 rounded-t-2xl">
                            <h2 className="text-lg font-bold text-white flex items-center gap-2">
                                <CheckCircle2 className="text-blue-400" size={20} />
                                Submit proof for full rewards
                            </h2>
                            <button
                                onClick={handleClose}
                                disabled={status === 'checking' || status === 'completing'}
                                className="text-gray-400 hover:text-white transition-colors disabled:opacity-50"
                            >
                                <X size={20} />
                            </button>
                        </div>

                        <div className="p-6">
                            {/* Task Info */}
                            <div className="bg-white/5 rounded-xl p-4 mb-6 border border-white/5">
                                <span className="text-xs text-gray-400 uppercase tracking-wider block mb-1">Task</span>
                                <p className="text-gray-200 text-sm font-medium">{task?.title}</p>
                                <p className="text-xs text-gray-400 mt-2">
                                    Upload a screenshot of your completed work to earn full salary, XP, and progression rewards.
                                </p>
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

                                    {/* Show previous result if file not re-uploaded yet */}
                                    {hasResult && (
                                        <div className="text-center">
                                            <p className="text-xs text-gray-500">{feedbackText}</p>
                                        </div>
                                    )}
                                </div>
                            ) : (
                                <div className="space-y-4">
                                    <div className="relative rounded-xl overflow-hidden border border-white/10 bg-black/40 h-48 flex items-center justify-center">
                                        <img src={previewUrl} alt="Preview" className="max-h-full max-w-full object-contain" />
                                    </div>

                                    {/* Status & Feedback */}
                                    <div className="min-h-12 flex items-center justify-center">
                                        {status === 'checking' && (
                                            <div className="flex flex-col items-center text-blue-400">
                                                <Loader2 className="animate-spin mb-2" size={24} />
                                                <span className="text-sm font-medium">Re-evaluating submission...</span>
                                            </div>
                                        )}
                                        {status === 'approved' && (
                                            <div className="flex flex-col items-center text-green-400 text-center">
                                                <CheckCircle2 size={28} className="mb-1" />
                                                <span className="text-sm font-bold">New result: Approved</span>
                                                <span className="text-xs text-gray-400 mt-0.5">Ready to complete with full rewards.</span>
                                            </div>
                                        )}
                                        {status === 'rejected' && (
                                            <div className="w-full space-y-2">
                                                <div className="flex items-start gap-2 text-amber-400 bg-amber-400/10 p-3 rounded-lg border border-amber-400/20">
                                                    <AlertCircle size={20} className="shrink-0 mt-0.5" />
                                                    <div>
                                                        <span className="text-sm font-bold block">New result: Not approved</span>
                                                        <span className="text-xs text-gray-400 block mt-0.5">
                                                            You can still complete the task with 50% rewards, or try uploading a better screenshot.
                                                        </span>
                                                    </div>
                                                </div>
                                                {approvalResult?.reason && (
                                                    <div className="bg-white/5 rounded-lg p-3 border border-white/10">
                                                        <span className="text-[10px] text-gray-500 uppercase tracking-wider font-bold block mb-1">Reason</span>
                                                        <p className="text-sm text-gray-300">{approvalResult.reason}</p>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                        {status === 'completing' && (
                                            <div className="flex flex-col items-center text-blue-400">
                                                <Loader2 className="animate-spin mb-2" size={24} />
                                                <span className="text-sm font-medium">Completing task...</span>
                                            </div>
                                        )}
                                        {status === 'error' && (
                                            <div className="flex items-center gap-2 text-red-400 bg-red-400/10 p-3 rounded-lg border border-red-400/20 w-full">
                                                <AlertCircle size={20} className="shrink-0" />
                                                <span className="text-sm">{errorMsg}</span>
                                            </div>
                                        )}
                                        {status === 'idle' && feedbackText && (
                                            <div className="text-center">
                                                <span className="text-xs text-gray-400">{feedbackText}</span>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>

                        {/* Footer */}
                        <div className="p-6 pt-0 mt-4 border-t border-white/10 bg-black/5 rounded-b-2xl">
                            <div className="flex flex-col gap-3 mt-6">
                                {/* Main action row */}
                                <div className="flex gap-3">
                                    {status === 'error' && (
                                        <button
                                            onClick={resetState}
                                            className="flex-[1.5] bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center text-sm"
                                        >
                                            Try Again
                                        </button>
                                    )}
                                    {file && status !== 'completing' && (
                                        <button
                                            onClick={() => {
                                                setFile(null);
                                                if (previewUrl) URL.revokeObjectURL(previewUrl);
                                                setPreviewUrl(null);
                                                setStatus('idle');
                                                setApprovalResult(null);
                                                setErrorMsg('');
                                                setFeedbackText('');
                                            }}
                                            className="flex-[1.5] bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center text-sm"
                                        >
                                            Upload Another
                                        </button>
                                    )}
                                    {!file && status !== 'completing' && !hasResult && (
                                        <button
                                            onClick={handleClose}
                                            className="flex-[1.5] bg-white/10 hover:bg-white/20 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center text-sm"
                                        >
                                            Cancel
                                        </button>
                                    )}
                                    {file && status !== 'checking' && status !== 'completing' && (
                                        <button
                                            onClick={handleSubmit}
                                            className="flex-[2] bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                                        >
                                            <CheckCircle2 size={18} />
                                            Submit Proof
                                        </button>
                                    )}
                                </div>

                                {/* Complete / Try New Screenshot row */}
                                {hasResult && !file && (
                                    <div className="flex gap-3">
                                        <button
                                            onClick={handleCompleteTask}
                                            disabled={status === 'completing'}
                                            className="flex-1 bg-green-600 hover:bg-green-500 disabled:opacity-50 text-white font-medium py-2.5 rounded-xl transition-colors flex items-center justify-center gap-2 text-sm"
                                        >
                                            <Send size={16} />
                                            {approvalResult?.approved ? 'Complete Task (Full Rewards)' : 'Complete Task (50% Rewards)'}
                                        </button>
                                        <button
                                            onClick={() => {
                                                setFile(null);
                                                if (previewUrl) URL.revokeObjectURL(previewUrl);
                                                setPreviewUrl(null);
                                                setStatus('idle');
                                                setApprovalResult(null);
                                                setErrorMsg('');
                                                setFeedbackText('');
                                                fileInputRef.current?.click();
                                            }}
                                            className="flex-1 bg-white/5 hover:bg-white/10 text-gray-300 font-medium py-2.5 rounded-xl border border-white/10 transition-colors flex items-center justify-center gap-2 text-sm"
                                        >
                                            <Upload size={16} />
                                            Try New Screenshot
                                        </button>
                                    </div>
                                )}

                                {/* Skip Proof (always available when not completing) */}
                                {!hasResult && status !== 'completing' && (
                                    <button
                                        onClick={() => {
                                            onBypass(task.id);
                                            handleClose();
                                        }}
                                        className="w-full bg-white/5 hover:bg-white/10 text-gray-300 font-medium py-2 rounded-xl border border-white/10 transition-colors flex items-center justify-center gap-2 text-sm"
                                    >
                                        <AlertCircle size={16} />
                                        Skip Proof (50% Rewards)
                                    </button>
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
