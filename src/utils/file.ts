// src/utils/file.ts

/**
 * Format bytes into human-readable binary file size (KB, MB, GB).
 */
export function formatBytes(bytes: number, decimals: number = 1): string {
    if (bytes === 0) return "0 Bytes";
    if (bytes < 0 || isNaN(bytes)) return "0 Bytes";

    const k = 1024;
    const dm = decimals < 0 ? 0 : decimals;
    const sizes = ["Bytes", "KB", "MB", "GB", "TB"];

    const i = Math.floor(Math.log(bytes) / Math.log(k));
    const normalizedIndex = Math.min(i, sizes.length - 1);

    return `${parseFloat((bytes / Math.pow(k, normalizedIndex)).toFixed(dm))} ${sizes[normalizedIndex]}`;
}

/**
 * Extract lowercased file extension from a file name or path.
 */
export function getFileExtension(filename: string): string {
    const lastDotIndex = filename.lastIndexOf(".");
    if (lastDotIndex <= 0) return "";
    return filename.slice(lastDotIndex + 1).toLowerCase();
}

/**
 * Validate that a file does not exceed maximum allowable bytes threshold.
 */
export function isValidFileSize(file: { size: number }, maxBytes: number): boolean {
    return file.size <= maxBytes;
}
