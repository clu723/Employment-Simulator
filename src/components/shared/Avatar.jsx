import React from 'react';

/**
 * Reusable emoji avatar component.
 * Renders an emoji inside a colored circle with optional online indicator.
 */
export default function Avatar({ emoji = '🧑', color = '#6b7280', size = 36, online, className = '' }) {
    return (
        <div
            className={`relative inline-flex items-center justify-center rounded-lg shrink-0 ${className}`}
            style={{
                width: size,
                height: size,
                backgroundColor: `${color}20`,
                fontSize: size * 0.5,
            }}
        >
            <span className="leading-none">{emoji}</span>
            {online !== undefined && (
                <div
                    className={`absolute -bottom-0.5 -right-0.5 rounded-full border-2 border-[#1a1d24] ${online ? 'bg-green-500' : 'bg-gray-600'}`}
                    style={{ width: size * 0.3, height: size * 0.3 }}
                />
            )}
        </div>
    );
}
