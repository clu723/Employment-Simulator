/**
 * Rank/promotion system — replaces the old score-based levels.
 */

export const RANKS = [
    { id: 'intern',     title: 'Intern',     salary: 200,  color: 'text-gray-400',   bg: 'bg-gray-400/10',   border: 'border-gray-400/20',  promotionThreshold: 0 },
    { id: 'junior',     title: 'Junior',     salary: 500,  color: 'text-green-400',  bg: 'bg-green-400/10',  border: 'border-green-400/20', promotionThreshold: 100 },
    { id: 'associate',  title: 'Associate',  salary: 900,  color: 'text-blue-400',   bg: 'bg-blue-400/10',   border: 'border-blue-400/20',  promotionThreshold: 300 },
    { id: 'senior',     title: 'Senior',     salary: 1500, color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20',promotionThreshold: 600 },
    { id: 'lead',       title: 'Lead',       salary: 2500, color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20',promotionThreshold: 1200 },
    { id: 'manager',    title: 'Manager',    salary: 4000, color: 'text-red-400',    bg: 'bg-red-400/10',    border: 'border-red-400/20',   promotionThreshold: 2500 },
    { id: 'director',   title: 'Director',   salary: 7000, color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20',promotionThreshold: 5000 },
];

/** Get rank object by ID */
export function getRankById(rankId) {
    return RANKS.find(r => r.id === rankId) || RANKS[0];
}

/** Get rank index (0-based) */
export function getRankIndex(rankId) {
    return RANKS.findIndex(r => r.id === rankId);
}

/** Get the next rank, or null if at max */
export function getNextRank(rankId) {
    const idx = getRankIndex(rankId);
    return idx < RANKS.length - 1 ? RANKS[idx + 1] : null;
}

/** Check if promotion points meet the threshold for next rank */
export function canPromote(rankId, promotionPoints) {
    const next = getNextRank(rankId);
    if (!next) return false;
    return promotionPoints >= next.promotionThreshold;
}

/**
 * Legacy compatibility — maps old score to a rank for migration.
 * Used only during data migration from old system.
 */
export function getLevelFromScore(score) {
    if (score < 1000) return RANKS[0];
    if (score < 3000) return RANKS[1];
    if (score < 6000) return RANKS[2];
    if (score < 10000) return RANKS[3];
    if (score < 20000) return RANKS[4];
    if (score < 50000) return RANKS[5];
    return RANKS[6];
}
