// src/utils/date.ts

/**
 * Format ISO date string into human-readable locale date format.
 */
export function formatDate(
    date: string | number | Date,
    options: Intl.DateTimeFormatOptions = {
        year: "numeric",
        month: "short",
        day: "numeric",
    },
    locale: string = "en-US"
): string {
    const parsedDate = date instanceof Date ? date : new Date(date);
    if (isNaN(parsedDate.getTime())) return "Invalid Date";
    return new Intl.DateTimeFormat(locale, options).format(parsedDate);
}

/**
 * Format relative elapsed time (e.g. "3 hours ago", "2 days ago").
 */
export function formatRelativeTime(date: string | number | Date): string {
    const parsedDate = date instanceof Date ? date : new Date(date);
    if (isNaN(parsedDate.getTime())) return "Unknown";

    const elapsedSeconds = Math.floor((Date.now() - parsedDate.getTime()) / 1000);

    if (elapsedSeconds < 60) return "Just now";
    const minutes = Math.floor(elapsedSeconds / 60);
    if (minutes < 60) return `${minutes}m ago`;
    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;
    const days = Math.floor(hours / 24);
    if (days < 30) return `${days}d ago`;
    const months = Math.floor(days / 30);
    if (months < 12) return `${months}mo ago`;
    const years = Math.floor(months / 12);
    return `${years}y ago`;
}
