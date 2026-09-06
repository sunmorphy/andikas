/**
 * Media helper utilities for extracting filenames and resolving full media URLs.
 */

/**
 * Extracts just the filename from a URL or relative path.
 * Example:
 * "https://cdn.example.com/folder/sub/image.png" -> "image.png"
 * "/uploads/image.png" -> "image.png"
 * "image.png" -> "image.png"
 */
export function extractFileName(urlOrPath?: string | null): string | null {
    if (!urlOrPath || typeof urlOrPath !== 'string') return null;
    const trimmed = urlOrPath.trim();
    if (!trimmed) return null;

    try {
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
            const parsed = new URL(trimmed);
            const segments = parsed.pathname.split('/').filter(Boolean);
            return segments.pop() || trimmed;
        }
    } catch {
        // Fallback to basic string splitting if URL parsing fails
    }

    const segments = (trimmed.split('?')[0] ?? '').split('/').filter(Boolean);
    return segments.pop() || trimmed;
}

const MEDIA_EXTENSIONS_REGEX = /\.(png|jpe?g|webp|svg|gif|avif|ico|bmp|tiff?|pdf|mp4|webm|mov|ogg|mp3|wav)(\?.*)?$/i;

function normalizeHost(host?: string | null): string {
    if (!host || typeof host !== 'string') return '';
    const trimmed = host.trim().replace(/\/+$/, '');
    if (!trimmed) return '';
    if (!/^https?:\/\//i.test(trimmed)) {
        return `https://${trimmed}`;
    }
    return trimmed;
}

function getHostname(urlOrHost: string): string {
    try {
        const url = new URL(normalizeHost(urlOrHost));
        return url.hostname.toLowerCase();
    } catch {
        return (urlOrHost.toLowerCase().replace(/^(https?:\/\/)?/, '').split('/')[0]) || '';
    }
}

/**
 * Retrieves the target host and all configured source hostnames from environment variables.
 * Allows dynamically changing CDN/media domains via IMAGE_HOST, R2_PUBLIC_URL, or LEGACY_IMAGE_HOSTS.
 */
export function getMediaConfig() {
    const targetHost = normalizeHost(process.env.IMAGE_HOST || process.env.R2_PUBLIC_URL || '');

    const envHostValues = [
        process.env.IMAGE_HOST,
        process.env.R2_PUBLIC_URL,
        ...(process.env.LEGACY_IMAGE_HOSTS || process.env.MEDIA_HOSTS || '').split(','),
    ];

    const sourceHostnames = new Set<string>();
    for (const raw of envHostValues) {
        if (!raw) continue;
        const hostname = getHostname(raw);
        if (hostname) {
            sourceHostnames.add(hostname);
        }
    }

    return { targetHost, sourceHostnames };
}

/**
 * Checks whether a given string is a media URL (matches configured env hostnames or has a media file extension).
 */
export function isMediaUrl(urlOrPath?: string | null): boolean {
    if (!urlOrPath || typeof urlOrPath !== 'string') return false;
    const trimmed = urlOrPath.trim();
    if (!trimmed || trimmed.startsWith('data:') || trimmed.startsWith('mailto:') || trimmed.startsWith('#')) {
        return false;
    }

    const { sourceHostnames } = getMediaConfig();

    try {
        if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
            const parsed = new URL(trimmed);
            if (sourceHostnames.has(parsed.hostname.toLowerCase())) {
                return true;
            }
            return false;
        }
    } catch {
        // Fall through to relative check
    }

    if (MEDIA_EXTENSIONS_REGEX.test(trimmed)) return true;

    return false;
}

function resolveFolderPath(folder?: string, cleanFileName?: string): string {
    if (!cleanFileName) return '';
    if (!folder) return cleanFileName;

    // If cleanFileName already has directory segments, keep as is
    if (cleanFileName.includes('/')) {
        return cleanFileName;
    }

    const cleanFolder = folder.replace(/^\/+|\/+$/g, '');
    if (!cleanFolder) return cleanFileName;

    const defaultPrefix = (process.env.MEDIA_PREFIX || '').replace(/^\/+|\/+$/g, '');
    let resolvedFolder = cleanFolder;
    if (!resolvedFolder.includes('/') && defaultPrefix) {
        resolvedFolder = `${defaultPrefix}/${resolvedFolder}`;
    }

    return `${resolvedFolder}/${cleanFileName}`;
}

/**
 * Resolves a full public URL for a given filename or URL using the configured target host from env.
 * Dynamically swaps any source host defined in env (e.g. previous/legacy CDN domains) to the target host.
 * If folder is specified and fileNameOrUrl is a bare filename, prepends the resolved folder path.
 */
export function getMediaUrl(fileNameOrUrl?: string | null, folder?: string): string | null {
    if (!fileNameOrUrl || typeof fileNameOrUrl !== 'string') return null;
    const trimmed = fileNameOrUrl.trim();
    if (!trimmed) return null;

    if (trimmed.startsWith('data:') || trimmed.startsWith('mailto:') || trimmed.startsWith('#')) {
        return trimmed;
    }

    const { targetHost, sourceHostnames } = getMediaConfig();

    // 1. Absolute URL check
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
        try {
            const parsed = new URL(trimmed);
            if (sourceHostnames.has(parsed.hostname.toLowerCase())) {
                const cleanPath = (parsed.pathname + parsed.search).replace(/^\/+/, '');
                if (!targetHost) {
                    return `/${cleanPath}`;
                }
                return `${targetHost}/${cleanPath}`;
            }
        } catch {
            // ignore
        }
        // Other absolute external URLs remain untouched
        return trimmed;
    }

    // 2. Relative path check
    const cleanPath = trimmed.replace(/^\/+/, '');

    // If it's a page route (no media extension), keep as-is
    if (!MEDIA_EXTENSIONS_REGEX.test(trimmed)) {
        return trimmed;
    }

    const finalPath = resolveFolderPath(folder, cleanPath);

    if (!targetHost) {
        return `/${finalPath}`;
    }

    return `${targetHost}/${finalPath}`;
}

/**
 * Dynamically replaces host URLs defined in env and relative media links in markdown content.
 */
export function replaceMediaUrlsInContent(content: any): any {
    if (!content) return content;

    const { targetHost, sourceHostnames } = getMediaConfig();
    if (!targetHost) return content;

    if (typeof content === 'string') {
        let result = content;

        // Replace absolute URLs matching any configured host from env
        if (sourceHostnames.size > 0) {
            const escaped = Array.from(sourceHostnames).map(h => h.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'));
            const hostRegex = new RegExp(`https?:\\/\\/(?:${escaped.join('|')})\\/([^\\s\\)"'<>]+)`, 'gi');
            result = result.replace(hostRegex, (_match, path) => {
                return `${targetHost}/${path.replace(/^\/+/, '')}`;
            });
        }

        // Markdown image with media extension: ![alt](/path/to/image.png) -> ![alt](https://targetHost/path/to/image.png)
        result = result.replace(/(\!\[[^\]]*\]\()(\/[^\)\s]+)(\))/g, (match, prefix, path, suffix) => {
            if (MEDIA_EXTENSIONS_REGEX.test(path)) {
                return `${prefix}${targetHost}/${path.replace(/^\/+/, '')}${suffix}`;
            }
            return match;
        });

        // Markdown link with media extension: [text](/path/to/file.pdf) -> [text](https://targetHost/path/to/file.pdf)
        result = result.replace(/(\[[^\]]*\]\()(\/[^\)\s]+)(\))/g, (match, prefix, path, suffix) => {
            if (MEDIA_EXTENSIONS_REGEX.test(path)) {
                return `${prefix}${targetHost}/${path.replace(/^\/+/, '')}${suffix}`;
            }
            return match;
        });

        return result;
    }

    if (typeof content === 'object') {
        const transformed: Record<string, any> = Array.isArray(content) ? [] : {};
        for (const [key, value] of Object.entries(content)) {
            transformed[key] = replaceMediaUrlsInContent(value);
        }
        return transformed;
    }

    return content;
}

/**
 * Transforms project media fields (coverImage, contentImages, content) into full URLs for API responses.
 */
export function formatProjectMedia(project: any, username?: string): any {
    if (!project || typeof project !== 'object') return project;

    const userFolder = (username || project?.user?.username || process.env.MEDIA_PREFIX || '').trim();
    const folder = userFolder ? `${userFolder}/projects` : 'projects';

    const formatted = {...project};

    if (formatted.coverImage) {
        formatted.coverImage = getMediaUrl(formatted.coverImage, folder);
    }

    if (formatted.content) {
        formatted.content = replaceMediaUrlsInContent(formatted.content);
    }

    if (Array.isArray(formatted.contentImages)) {
        formatted.contentImages = formatted.contentImages
            .map((img: string) => getMediaUrl(img, folder))
            .filter(Boolean);
    }

    if (Array.isArray(formatted.projectSkills)) {
        formatted.projectSkills = formatted.projectSkills.map((ps: any) => {
            if (ps?.skill) {
                return {
                    ...ps,
                    skill: formatSkillMedia(ps.skill, userFolder),
                };
            }
            return ps;
        });
    }

    return formatted;
}

/**
 * Transforms article media fields (coverImage, content) into full URLs for API responses.
 */
export function formatArticleMedia(article: any, username?: string): any {
    if (!article || typeof article !== 'object') return article;

    const userFolder = (username || article?.user?.username || process.env.MEDIA_PREFIX || '').trim();
    const folder = userFolder ? `${userFolder}/articles` : 'articles';

    const formatted = {...article};

    if (formatted.coverImage) {
        formatted.coverImage = getMediaUrl(formatted.coverImage, folder);
    }

    if (formatted.content) {
        formatted.content = replaceMediaUrlsInContent(formatted.content);
    }

    return formatted;
}

/**
 * Transforms user detail media fields (profilePhoto, resume) into full URLs for API responses.
 */
export function formatUserMedia(userDetail: any, username?: string): any {
    if (!userDetail || typeof userDetail !== 'object') return userDetail;

    const userFolder = (username || userDetail?.username || userDetail?.user?.username || process.env.MEDIA_PREFIX || '').trim();
    const folder = userFolder ? `${userFolder}/users` : 'users';

    const formatted = {...userDetail};

    if (formatted.profilePhoto) {
        formatted.profilePhoto = getMediaUrl(formatted.profilePhoto, folder);
    }

    if (formatted.resume) {
        formatted.resume = getMediaUrl(formatted.resume, folder);
    }

    return formatted;
}

/**
 * Transforms skill icon into a full URL for API responses.
 */
export function formatSkillMedia(skill: any, username?: string): any {
    if (!skill || typeof skill !== 'object') return skill;

    const userFolder = (username || skill?.user?.username || process.env.MEDIA_PREFIX || '').trim();
    const folder = userFolder ? `${userFolder}/skills` : 'skills';

    const formatted = {...skill};

    if (formatted.icon) {
        formatted.icon = getMediaUrl(formatted.icon, folder);
    }

    return formatted;
}
