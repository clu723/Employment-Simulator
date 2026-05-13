import React from 'react';
import Avatar from '../shared/Avatar';

export default function TypingIndicator({ character }) {
    if (!character) return null;

    return (
        <div className="flex items-center gap-2 px-4 py-2 text-xs text-gray-400">
            <Avatar emoji={character.avatar} color={character.accentColor} size={18} />
            <span className="font-medium">{character.name}</span>
            <span className="flex gap-0.5">
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
                <span className="w-1.5 h-1.5 bg-gray-500 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
            </span>
        </div>
    );
}
