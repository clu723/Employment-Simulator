import React, { useState, useRef } from 'react';
import { Send, Paperclip, X, Image as ImageIcon } from 'lucide-react';
import { fileToBase64 } from '../../utils/ocr';

/**
 * Chat input bar with text input, image upload, drag-and-drop, and send.
 * Enter sends, Shift+Enter for newline.
 */
export default function MessageInput({ onSend, disabled }) {
    const [text, setText] = useState('');
    const [images, setImages] = useState([]); // { file, previewUrl, base64 }[]
    const [isDragOver, setIsDragOver] = useState(false);
    const fileInputRef = useRef(null);
    const textareaRef = useRef(null);

    const handleSend = async () => {
        if (!text.trim() && images.length === 0) return;
        const base64Images = images.map(img => img.base64);
        onSend(text.trim(), base64Images);
        setText('');
        clearImages();
        // Reset textarea height
        if (textareaRef.current) textareaRef.current.style.height = 'auto';
    };

    const handleKeyDown = (e) => {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault();
            handleSend();
        }
    };

    const handleTextChange = (e) => {
        setText(e.target.value);
        // Auto-grow textarea
        const ta = e.target;
        ta.style.height = 'auto';
        ta.style.height = Math.min(ta.scrollHeight, 120) + 'px';
    };

    const addFiles = async (files) => {
        for (const file of files) {
            if (!file.type.startsWith('image/')) continue;
            const base64 = await fileToBase64(file);
            const previewUrl = URL.createObjectURL(file);
            setImages(prev => [...prev, { file, previewUrl, base64 }]);
        }
    };

    const handleFileChange = (e) => {
        if (e.target.files) addFiles(Array.from(e.target.files));
        e.target.value = '';
    };

    const removeImage = (index) => {
        setImages(prev => {
            const copy = [...prev];
            URL.revokeObjectURL(copy[index].previewUrl);
            copy.splice(index, 1);
            return copy;
        });
    };

    const clearImages = () => {
        images.forEach(img => URL.revokeObjectURL(img.previewUrl));
        setImages([]);
    };

    const handleDrop = (e) => {
        e.preventDefault();
        setIsDragOver(false);
        if (e.dataTransfer.files) addFiles(Array.from(e.dataTransfer.files));
    };

    return (
        <div
            className={`border-t border-white/5 p-3 shrink-0 ${isDragOver ? 'bg-blue-500/5' : ''}`}
            onDragOver={(e) => { e.preventDefault(); setIsDragOver(true); }}
            onDragLeave={() => setIsDragOver(false)}
            onDrop={handleDrop}
        >
            {/* Image previews */}
            {images.length > 0 && (
                <div className="flex gap-2 mb-2 flex-wrap">
                    {images.map((img, i) => (
                        <div key={i} className="relative group">
                            <img src={img.previewUrl} alt="" className="w-16 h-16 object-cover rounded-lg border border-white/10" />
                            <button
                                onClick={() => removeImage(i)}
                                className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-red-500 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                            >
                                <X size={10} className="text-white" />
                            </button>
                        </div>
                    ))}
                </div>
            )}

            <div className="flex items-end gap-2 bg-[#2a2d35] rounded-xl px-3 py-2 border border-white/5 focus-within:border-blue-500/30 transition-colors">
                {/* Upload button */}
                <button
                    onClick={() => fileInputRef.current?.click()}
                    className="p-1.5 text-gray-500 hover:text-gray-300 hover:bg-white/5 rounded-lg transition-colors shrink-0 mb-0.5"
                    title="Attach image"
                >
                    <Paperclip size={18} />
                </button>
                <input
                    ref={fileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={handleFileChange}
                    className="hidden"
                />

                {/* Text input */}
                <textarea
                    ref={textareaRef}
                    value={text}
                    onChange={handleTextChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Message..."
                    disabled={disabled}
                    rows={1}
                    className="flex-1 bg-transparent text-sm text-white placeholder-gray-600 resize-none focus:outline-none max-h-[120px] py-1"
                />

                {/* Send button */}
                <button
                    onClick={handleSend}
                    disabled={disabled || (!text.trim() && images.length === 0)}
                    className="p-1.5 text-blue-500 hover:text-blue-400 disabled:text-gray-700 disabled:cursor-not-allowed transition-colors shrink-0 mb-0.5"
                >
                    <Send size={18} />
                </button>
            </div>

            {isDragOver && (
                <div className="absolute inset-0 bg-blue-500/10 border-2 border-dashed border-blue-500/30 rounded-xl flex items-center justify-center pointer-events-none z-10">
                    <div className="flex items-center gap-2 text-blue-400 text-sm font-medium">
                        <ImageIcon size={20} />
                        Drop image here
                    </div>
                </div>
            )}
        </div>
    );
}
