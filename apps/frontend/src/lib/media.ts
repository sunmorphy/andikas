/**
 * Resolves an image/media URL against NEXT_PUBLIC_IMAGE_HOST if a relative filename is provided.
 */
export function getMediaUrl(src?: unknown): string {
    if (!src || typeof src !== 'string') return '';
    const trimmed = src.trim();
    if (!trimmed) return '';

    // Already an absolute URL, data URI, or relative path starting with /
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:') || trimmed.startsWith('/')) {
        return trimmed;
    }

    const host = (process.env.NEXT_PUBLIC_IMAGE_HOST || process.env.NEXT_PUBLIC_R2_PUBLIC_URL || '').trim().replace(/\/+$/, '');
    const cleanPath = trimmed.replace(/^\/+/, '');

    if (!host) {
        return `/${cleanPath}`;
    }

    return `${host}/${cleanPath}`;
}
