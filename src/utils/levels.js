export const getLevelFromScore = (score) => {
    if (score < 1000) {
        return { title: 'Intern', color: 'text-gray-400', bg: 'bg-gray-400/10', border: 'border-gray-400/20' };
    } else if (score < 3000) {
        return { title: 'Junior', color: 'text-green-400', bg: 'bg-green-400/10', border: 'border-green-400/20' };
    } else if (score < 6000) {
        return { title: 'Mid-Level', color: 'text-blue-400', bg: 'bg-blue-400/10', border: 'border-blue-400/20' };
    } else if (score < 10000) {
        return { title: 'Senior', color: 'text-purple-400', bg: 'bg-purple-400/10', border: 'border-purple-400/20' };
    } else if (score < 20000) {
        return { title: 'Lead', color: 'text-orange-400', bg: 'bg-orange-400/10', border: 'border-orange-400/20' };
    } else if (score < 50000) {
        return { title: 'Principal', color: 'text-red-500', bg: 'bg-red-500/10', border: 'border-red-500/20' };
    } else {
        return { title: 'Executive', color: 'text-yellow-500', bg: 'bg-yellow-500/10', border: 'border-yellow-500/20' };
    }
};
