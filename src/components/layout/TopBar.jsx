import React from 'react';
import { Hash, Users } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { getCharacterById } from '../../data/coworkerTemplates';
import Avatar from '../shared/Avatar';

export default function TopBar() {
    const { activeChannel, channels, coworkerStates } = useGame();
    const channel = channels.find(c => c.id === activeChannel);
    if (!channel) return null;

    const isDM = channel.type === 'dm';
    const character = isDM ? getCharacterById(channel.characterId) : null;
    const coworkerState = character ? coworkerStates[character.id] : null;

    return (
        <div className="h-12 border-b border-white/5 bg-[#1e2028] px-4 flex items-center gap-3 shrink-0">
            {isDM ? (
                <>
                    <Avatar emoji={channel.avatar} color={channel.accentColor} size={24} online={coworkerState?.isOnline} />
                    <div className="flex items-center gap-2 min-w-0">
                        <span className="font-semibold text-sm text-white truncate">{channel.name}</span>
                        <span className="text-xs text-gray-500 truncate hidden sm:inline">{channel.role}</span>
                    </div>
                </>
            ) : (
                <>
                    <Hash size={16} className="text-gray-500 shrink-0" />
                    <div className="flex items-center gap-3 min-w-0">
                        <span className="font-semibold text-sm text-white">{channel.name}</span>
                        {channel.description && (
                            <>
                                <div className="w-px h-4 bg-white/10 hidden sm:block" />
                                <span className="text-xs text-gray-500 truncate hidden sm:inline">{channel.description}</span>
                            </>
                        )}
                    </div>
                </>
            )}
        </div>
    );
}
