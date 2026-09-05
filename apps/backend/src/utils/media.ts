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

/**
 * Resolves a full public URL for a given filename or URL using the IMAGE_HOST or R2_PUBLIC_URL environment variable.
 * If already an absolute URL (e.g. legacy data), it is returned as-is.
 */
export function getMediaUrl(fileNameOrUrl?: string | null): string | null {
    if (!fileNameOrUrl || typeof fileNameOrUrl !== 'string') return null;
    const trimmed = fileNameOrUrl.trim();
    if (!trimmed) return null;

    // Already an absolute URL or data URI
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://') || trimmed.startsWith('data:')) {
        return trimmed;
    }

    const host = (process.env.IMAGE_HOST || process.env.R2_PUBLIC_URL || '').trim().replace(/\/+$/, '');
    const cleanFileName = trimmed.replace(/^\/+/, '');

    if (!host) {
        return `/${cleanFileName}`;
    }

    return `${host}/${cleanFileName}`;
}

/**
 * Transforms project media fields (coverImage, contentImages) into full URLs for API responses.
 */
export function formatProjectMedia(project: any): any {
    if (!project || typeof project !== 'object') return project;

    const formatted = {...project};

    if (formatted.coverImage) {
        formatted.coverImage = getMediaUrl(formatted.coverImage);
    }

    if (Array.isArray(formatted.contentImages)) {
        formatted.contentImages = formatted.contentImages
            .map((img: string) => getMediaUrl(img))
            .filter(Boolean);
    }

    if (Array.isArray(formatted.projectSkills)) {
        formatted.projectSkills = formatted.projectSkills.map((ps: any) => {
            if (ps?.skill) {
                return {
                    ...ps,
                    skill: formatSkillMedia(ps.skill),
                };
            }
            return ps;
        });
    }

    return formatted;
}

/**
 * Transforms user detail media fields (profilePhoto, resume) into full URLs for API responses.
 */
export function formatUserMedia(userDetail: any): any {
    if (!userDetail || typeof userDetail !== 'object') return userDetail;

    const formatted = {...userDetail};

    if (formatted.profilePhoto) {
        formatted.profilePhoto = getMediaUrl(formatted.profilePhoto);
    }

    if (formatted.resume) {
        formatted.resume = getMediaUrl(formatted.resume);
    }

    return formatted;
}

/**
 * Transforms skill icon into a full URL for API responses.
 */
export function formatSkillMedia(skill: any): any {
    if (!skill || typeof skill !== 'object') return skill;

    const formatted = {...skill};

    if (formatted.icon) {
        formatted.icon = getMediaUrl(formatted.icon);
    }

    return formatted;
}
