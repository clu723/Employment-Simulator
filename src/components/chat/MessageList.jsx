import React, { useEffect, useRef } from 'react';
import MessageItem from './MessageItem';

/**
 * Scrolling message list with auto-scroll and message grouping.
 * Messages from the same sender in sequence are visually grouped.
 */
export default function MessageList({ messages = [] }) {
    const scrollRef = useRef(null);
    const prevLengthRef = useRef(messages.length);

    // Auto-scroll on new messages
    useEffect(() => {
        if (messages.length > prevLengthRef.current && scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
        prevLengthRef.current = messages.length;
    }, [messages.length]);

    // Also scroll on initial render
    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, []);

    if (messages.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                    <p className="text-gray-600 text-sm">No messages yet.</p>
                    <p className="text-gray-700 text-xs mt-1">Start a conversation or clock in to begin your shift.</p>
                </div>
            </div>
        );
    }

    return (
        <div ref={scrollRef} className="flex-1 overflow-y-auto custom-scrollbar pb-2">
            {messages.map((msg, index) => {
                const prevMsg = index > 0 ? messages[index - 1] : null;
                const isFirstInGroup = !prevMsg || prevMsg.senderId !== msg.senderId || prevMsg.type === 'system' || msg.type === 'system';

                return (
                    <MessageItem
                        key={msg.id}
                        message={msg}
                        isFirstInGroup={isFirstInGroup}
                    />
                );
            })}
        </div>
    );
}
