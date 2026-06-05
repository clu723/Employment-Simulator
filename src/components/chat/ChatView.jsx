import React, { useEffect } from 'react';
import { useGame } from '../../context/GameContext';
import { getCharacterById } from '../../data/coworkerTemplates';
import TopBar from '../layout/TopBar';
import MessageList from './MessageList';
import MessageInput from './MessageInput';
import TypingIndicator from './TypingIndicator';

/**
 * Main chat view — assembles TopBar, MessageList, TypingIndicator, and MessageInput.
 * Marks the active channel as read whenever activeChannel changes.
 */
export default function ChatView() {
    const { activeChannel, messages, sendMessage, typingCharacter, markChannelRead } = useGame();
    const channelMessages = messages[activeChannel] || [];

    // Mark channel as read when it becomes active
    useEffect(() => {
        if (activeChannel) {
            markChannelRead(activeChannel);
        }
    }, [activeChannel, markChannelRead]);

    // Resolve typing character info for indicator
    const typingInfo = typingCharacter && typingCharacter.channelId === activeChannel
        ? getCharacterById(typingCharacter.id)
        : null;

    const handleSend = (text, images) => {
        sendMessage(activeChannel, text, images);
    };

    return (
        <div className="flex flex-col h-full">
            <TopBar />
            <MessageList messages={channelMessages} />
            <TypingIndicator character={typingInfo} />
            <MessageInput onSend={handleSend} />
        </div>
    );
}
