/**
 * Time and money formatting utilities.
 */

/** Format seconds into MM:SS */
export function formatTime(seconds) {
    const mins = Math.floor(Math.max(0, seconds) / 60);
    const secs = Math.max(0, seconds) % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
}

/** Format a number as currency: $1,234.56 */
export function formatMoney(amount) {
    return `$${Math.floor(amount).toLocaleString()}`;
}

/** Format a timestamp as relative time: "2m ago", "1h ago" */
export function formatRelativeTime(timestamp) {
    const now = Date.now();
    const diff = now - timestamp;
    const seconds = Math.floor(diff / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 60) return 'just now';
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return new Date(timestamp).toLocaleDateString();
}

/** Format a timestamp as clock time: "10:34 AM" */
export function formatClockTime(timestamp) {
    return new Date(timestamp).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' });
}

/** Format a date as "Mon, Jan 5" */
export function formatDate(timestamp) {
    return new Date(timestamp).toLocaleDateString([], { weekday: 'short', month: 'short', day: 'numeric' });
}
