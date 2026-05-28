import React from 'react';
import { Lock, Check } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { formatMoney } from '../../utils/formatters';

const APARTMENT_ITEMS = [
    { id: 'basic_desk', name: 'Basic Desk', emoji: '🪑', cost: 0, category: 'furniture', description: 'A simple workstation. It gets the job done.' },
    { id: 'monitor', name: 'Second Monitor', emoji: '🖥️', cost: 500, category: 'tech', description: 'Double the screens, double the productivity... theoretically.' },
    { id: 'plant', name: 'Office Plant', emoji: '🪴', cost: 200, category: 'decor', description: 'A little greenery to brighten your workspace.' },
    { id: 'coffee_machine', name: 'Coffee Machine', emoji: '☕', cost: 400, category: 'appliance', description: 'Essential survival equipment.' },
    { id: 'rgb_keyboard', name: 'RGB Keyboard', emoji: '⌨️', cost: 800, category: 'tech', description: 'Does it make you type faster? Probably not. Worth it? Absolutely.' },
    { id: 'standing_desk', name: 'Standing Desk', emoji: '🏋️', cost: 1500, category: 'furniture', description: 'For when you want to pretend you\'re being healthy.' },
    { id: 'cat', name: 'Office Cat', emoji: '🐱', cost: 2000, category: 'pet', description: 'Provides emotional support and walks across your keyboard.' },
    { id: 'city_view', name: 'City View Upgrade', emoji: '🏙️', cost: 5000, category: 'apartment', description: 'Upgrade to a corner unit with skyline views.' },
    { id: 'gaming_chair', name: 'Gaming Chair', emoji: '🎮', cost: 1200, category: 'furniture', description: 'Ergonomic comfort that screams "I take breaks seriously."' },
    { id: 'neon_sign', name: 'Neon Sign', emoji: '💡', cost: 600, category: 'decor', description: '"Hustle" — or whatever motivates you.' },
    { id: 'dog', name: 'Office Dog', emoji: '🐕', cost: 3000, category: 'pet', description: 'Will attend all your standups. Won\'t take notes.' },
    { id: 'penthouse', name: 'Penthouse Upgrade', emoji: '🏠', cost: 15000, category: 'apartment', description: 'The ultimate flex. Rooftop terrace included.' },
];

export default function ApartmentView() {
    const { bankBalance, apartmentItems, buyApartmentItem } = useGame();

    const buyItem = (item) => {
        buyApartmentItem(item);
    };

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="h-12 border-b border-white/5 bg-[#1e2028] px-4 flex items-center justify-between shrink-0">
                <h2 className="font-semibold text-sm text-white">Apartment</h2>
                <span className="text-xs font-mono font-bold text-green-400">{formatMoney(bankBalance)}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {/* Current apartment visualization */}
                <div className="bg-[#1e2028] border border-white/5 rounded-2xl p-6 mb-6 text-center">
                    <div className="text-4xl mb-3 space-x-2">
                        {apartmentItems.map(id => {
                            const item = APARTMENT_ITEMS.find(i => i.id === id);
                            return item ? <span key={id} title={item.name}>{item.emoji}</span> : null;
                        })}
                    </div>
                    <p className="text-xs text-gray-500">Your workspace • {apartmentItems.length} items</p>
                </div>

                {/* Shop */}
                <h3 className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-3 px-1">Upgrades</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {APARTMENT_ITEMS.filter(item => !apartmentItems.includes(item.id)).map(item => {
                        const canAfford = bankBalance >= item.cost;
                        return (
                            <div key={item.id} className="bg-[#1e2028] border border-white/5 rounded-xl p-3 flex items-center gap-3">
                                <span className="text-2xl shrink-0">{item.emoji}</span>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm text-white font-medium truncate">{item.name}</p>
                                    <p className="text-[10px] text-gray-500 truncate">{item.description}</p>
                                </div>
                                <button
                                    onClick={() => buyItem(item)}
                                    disabled={!canAfford}
                                    className={`shrink-0 px-2.5 py-1 text-xs font-bold rounded-lg transition-colors ${
                                        canAfford
                                            ? 'bg-green-600/20 text-green-400 hover:bg-green-600/30 border border-green-500/20'
                                            : 'bg-white/5 text-gray-600 border border-white/5 cursor-not-allowed'
                                    }`}
                                >
                                    {formatMoney(item.cost)}
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* Owned items list */}
                {apartmentItems.length > 1 && (
                    <>
                        <h3 className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-3 mt-6 px-1">Owned</h3>
                        <div className="space-y-1">
                            {apartmentItems.map(id => {
                                const item = APARTMENT_ITEMS.find(i => i.id === id);
                                if (!item) return null;
                                return (
                                    <div key={id} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400">
                                        <Check size={14} className="text-green-500" />
                                        <span>{item.emoji} {item.name}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
