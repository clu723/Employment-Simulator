import React from 'react';
import { Check } from 'lucide-react';
import { useGame } from '../../context/GameContext';
import { formatMoney } from '../../utils/formatters';

// ── Apartment image assets ──
import baseAptImg from '../../assets/apartment/1_base_apartment.png';
import basicDeskImg from '../../assets/apartment/2_basic_desk.png';
import secondMonitorImg from '../../assets/apartment/3_second_monitor.png';
import officePlantImg from '../../assets/apartment/4_office_plant.png';
import coffeeMachineImg from '../../assets/apartment/5_coffee_machine.png';
import rgbKeyboardImg from '../../assets/apartment/6_rgb_keyboard.png';
import standingDeskImg from '../../assets/apartment/7_standing_desk.png';
import officeCatImg from '../../assets/apartment/8_office_cat.png';
import cityViewImg from '../../assets/apartment/9_city_view_window.png';
import gamingChairImg from '../../assets/apartment/10_gaming_chair.png';
import neonSignImg from '../../assets/apartment/11_neon_sign.png';
import officeDogImg from '../../assets/apartment/12_office_dog.png';

const APARTMENT_ITEMS = [
    { id: 'basic_desk', name: 'Basic Desk', emoji: '🪑', cost: 0, category: 'furniture', description: 'A simple workstation. It gets the job done.', image: basicDeskImg, roomX: '50%', roomY: '70%' },
    { id: 'monitor', name: 'Second Monitor', emoji: '🖥️', cost: 500, category: 'tech', description: 'Double the screens, double the productivity... theoretically.', image: secondMonitorImg, roomX: '60%', roomY: '55%' },
    { id: 'plant', name: 'Office Plant', emoji: '🪴', cost: 200, category: 'decor', description: 'A little greenery to brighten your workspace.', image: officePlantImg, roomX: '20%', roomY: '60%' },
    { id: 'coffee_machine', name: 'Coffee Machine', emoji: '☕', cost: 400, category: 'appliance', description: 'Essential survival equipment.', image: coffeeMachineImg, roomX: '80%', roomY: '65%' },
    { id: 'rgb_keyboard', name: 'RGB Keyboard', emoji: '⌨️', cost: 800, category: 'tech', description: 'Does it make you type faster? Probably not. Worth it? Absolutely.', image: rgbKeyboardImg, roomX: '55%', roomY: '78%' },
    { id: 'standing_desk', name: 'Standing Desk', emoji: '🏋️', cost: 1500, category: 'furniture', description: 'For when you want to pretend you\'re being healthy.', image: standingDeskImg, roomX: '50%', roomY: '68%', replaces: 'basic_desk' },
    { id: 'cat', name: 'Office Cat', emoji: '🐱', cost: 2000, category: 'pet', description: 'Provides emotional support and walks across your keyboard.', image: officeCatImg, roomX: '35%', roomY: '75%' },
    { id: 'city_view', name: 'City View Upgrade', emoji: '🏙️', cost: 5000, category: 'apartment', description: 'Upgrade to a corner unit with skyline views.', image: cityViewImg, roomX: '0%', roomY: '0%', isBackground: true },
    { id: 'gaming_chair', name: 'Gaming Chair', emoji: '🎮', cost: 1200, category: 'furniture', description: 'Ergonomic comfort that screams "I take breaks seriously."', image: gamingChairImg, roomX: '42%', roomY: '72%' },
    { id: 'neon_sign', name: 'Neon Sign', emoji: '💡', cost: 600, category: 'decor', description: '"Hustle" — or whatever motivates you.', image: neonSignImg, roomX: '50%', roomY: '15%' },
    { id: 'dog', name: 'Office Dog', emoji: '🐕', cost: 3000, category: 'pet', description: 'Will attend all your standups. Won\'t take notes.', image: officeDogImg, roomX: '75%', roomY: '80%' },
    { id: 'penthouse', name: 'Penthouse Upgrade', emoji: '🏠', cost: 15000, category: 'apartment', description: 'The ultimate flex. Rooftop terrace included.' },
];

// Items that should layer below furniture (background elements)
const BACKGROUND_ITEM_IDS = ['city_view'];

export default function ApartmentView() {
    const { bankBalance, apartmentItems, buyApartmentItem } = useGame();

    const buyItem = (item) => {
        buyApartmentItem(item);
    };

    // Resolve which items are visible in the room
    // Items with "replaces" hide the replaced item
    const ownedItems = APARTMENT_ITEMS.filter(item => apartmentItems.includes(item.id));
    const replacedIds = ownedItems.filter(i => i.replaces).map(i => i.replaces);
    const visibleItems = ownedItems.filter(i => !replacedIds.includes(i.id));

    // Separate background items (like city view window) from furniture
    const bgItems = visibleItems.filter(i => BACKGROUND_ITEM_IDS.includes(i.id));
    const fgItems = visibleItems.filter(i => !BACKGROUND_ITEM_IDS.includes(i.id));

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="h-12 border-b border-white/5 bg-[#1e2028] px-4 flex items-center justify-between shrink-0">
                <h2 className="font-semibold text-sm text-white">Apartment</h2>
                <span className="text-xs font-mono font-bold text-green-400">{formatMoney(bankBalance)}</span>
            </div>

            <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
                {/* ── Room Visualization ── */}
                <div className="relative w-full overflow-hidden rounded-2xl border border-white/5 mb-6" style={{ aspectRatio: '2 / 1' }}>
                    {/* Base apartment background */}
                    <img
                        src={baseAptImg}
                        alt="Apartment"
                        className="absolute inset-0 w-full h-full object-cover"
                    />

                    {/* Background items (city view window, etc.) */}
                    {bgItems.map(item => (
                        item.image && (
                            <img
                                key={item.id}
                                src={item.image}
                                alt={item.name}
                                className="absolute w-full h-full object-cover"
                                style={{ left: item.roomX, top: item.roomY }}
                            />
                        )
                    ))}

                    {/* Furniture & foreground items */}
                    {fgItems.map(item => (
                        item.image && (
                            <img
                                key={item.id}
                                src={item.image}
                                alt={item.name}
                                className="absolute w-auto h-auto max-w-[30%] max-h-[40%] object-contain drop-shadow-lg"
                                style={{
                                    left: item.roomX,
                                    top: item.roomY,
                                    transform: 'translate(-50%, -50%)',
                                }}
                            />
                        )
                    ))}

                    {/* Empty state overlay */}
                    {apartmentItems.length <= 1 && (
                        <div className="absolute inset-0 flex items-center justify-center bg-black/30">
                            <p className="text-sm text-gray-300 bg-black/60 px-4 py-2 rounded-xl backdrop-blur-sm">
                                Complete tasks to earn money and upgrade your space
                            </p>
                        </div>
                    )}

                    {/* Item count badge */}
                    <div className="absolute bottom-3 right-3 bg-black/60 backdrop-blur-sm text-xs text-gray-300 px-3 py-1 rounded-full">
                        {apartmentItems.length} item{apartmentItems.length !== 1 ? 's' : ''}
                    </div>
                </div>

                {/* ── Shop ── */}
                <h3 className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-3 px-1">Upgrades</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {APARTMENT_ITEMS.filter(item => !apartmentItems.includes(item.id)).map(item => {
                        const canAfford = bankBalance >= item.cost;
                        return (
                            <div key={item.id} className="bg-[#1e2028] border border-white/5 rounded-xl p-3 flex items-center gap-3">
                                {item.image ? (
                                    <img src={item.image} alt={item.name} className="w-10 h-10 object-contain rounded-lg bg-white/5 shrink-0" />
                                ) : (
                                    <span className="text-2xl shrink-0">{item.emoji}</span>
                                )}
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
                                    {item.cost === 0 ? 'Free' : formatMoney(item.cost)}
                                </button>
                            </div>
                        );
                    })}
                </div>

                {/* ── Owned items list ── */}
                {apartmentItems.length > 1 && (
                    <>
                        <h3 className="text-[10px] uppercase tracking-wider font-bold text-gray-500 mb-3 mt-6 px-1">Owned</h3>
                        <div className="space-y-1">
                            {ownedItems.map(item => (
                                <div key={item.id} className="flex items-center gap-2 px-3 py-2 text-sm text-gray-400">
                                    <Check size={14} className="text-green-500" />
                                    {item.image ? (
                                        <img src={item.image} alt={item.name} className="w-5 h-5 object-contain rounded" />
                                    ) : (
                                        <span>{item.emoji}</span>
                                    )}
                                    <span>{item.name}</span>
                                </div>
                            ))}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
