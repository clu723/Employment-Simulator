import React from 'react';
import Avatar from '../shared/Avatar';
import { formatClockTime } from '../../utils/formatters';

/**
 * Renders a single message with avatar, name, role badge, timestamp,
 * and optional inline images. Supports message grouping.
 */
export default function MessageItem({ message, isFirstInGroup }) {
    const isUser = message.type === 'user';
    const isSystem = message.type === 'system';

    if (isSystem) {
        return (
            <div className="flex items-center gap-3 px-4 py-1.5">
                <div className="flex-1 border-t border-white/5" />
                <span className="text-[10px] text-gray-500 font-medium shrink-0">{message.text}</span>
                <div className="flex-1 border-t border-white/5" />
            </div>
        );
    }

    // Render simple markdown: **bold**, *italic*, `code`, ```code blocks```
    const renderText = (text) => {
        if (!text) return null;

        // Handle code blocks first
        const codeBlockRegex = /```([\s\S]*?)```/g;
        const parts = [];
        let lastIndex = 0;
        let match;

        while ((match = codeBlockRegex.exec(text)) !== null) {
            if (match.index > lastIndex) {
                parts.push({ type: 'text', content: text.slice(lastIndex, match.index) });
            }
            parts.push({ type: 'codeblock', content: match[1].trim() });
            lastIndex = match.index + match[0].length;
        }
        if (lastIndex < text.length) {
            parts.push({ type: 'text', content: text.slice(lastIndex) });
        }

        return parts.map((part, i) => {
            if (part.type === 'codeblock') {
                return (
                    <pre key={i} className="bg-black/40 border border-white/5 rounded-lg px-3 py-2 my-1 text-xs font-mono text-gray-300 overflow-x-auto">
                        {part.content}
                    </pre>
                );
            }
            // Inline formatting
            return (
                <span key={i} dangerouslySetInnerHTML={{
                    __html: part.content
                        .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold text-white">$1</strong>')
                        .replace(/\*(.*?)\*/g, '<em>$1</em>')
                        .replace(/`(.*?)`/g, '<code class="bg-white/5 px-1.5 py-0.5 rounded text-[13px] font-mono text-pink-400">$1</code>')
                        .replace(/\n/g, '<br/>')
                }} />
            );
        });
    };

    // Determine accent color for the name
    const getNameColor = () => {
        if (isUser) return 'text-blue-400';
        if (message.senderRole === 'Engineering Manager') return 'text-red-400';
        return 'text-gray-200';
    };

    return (
        <div className={`group flex gap-3 px-4 hover:bg-white/[0.02] transition-colors ${isFirstInGroup ? 'pt-2' : 'pt-0.5'}`}>
            {/* Avatar column */}
            <div className="w-9 shrink-0">
                {isFirstInGroup && (
                    <Avatar
                        emoji={message.senderAvatar}
                        color={isUser ? '#3b82f6' : '#6b7280'}
                        size={36}
                    />
                )}
            </div>

            {/* Content */}
            <div className="flex-1 min-w-0">
                {isFirstInGroup && (
                    <div className="flex items-baseline gap-2 mb-0.5">
                        <span className={`text-sm font-bold ${getNameColor()}`}>{message.senderName}</span>
                        {message.senderRole && !isUser && (
                            <span className="text-[10px] text-gray-600 font-medium">{message.senderRole}</span>
                        )}
                        <span className="text-[10px] text-gray-600">{formatClockTime(message.timestamp)}</span>
                    </div>
                )}
                <div className="text-sm text-gray-300 leading-relaxed">
                    {renderText(message.text)}
                </div>
                {/* Inline images */}
                {message.images && message.images.length > 0 && (
                    <div className="flex gap-2 mt-2 flex-wrap">
                        {message.images.map((img, i) => (
                            <img
                                key={i}
                                src={`data:image/png;base64,${img}`}
                                alt="attachment"
                                className="max-w-[300px] max-h-[200px] rounded-lg border border-white/10 object-cover cursor-pointer hover:opacity-90 transition-opacity"
                            />
                        ))}
                    </div>
                )}
            </div>
        </div>
    );
}
