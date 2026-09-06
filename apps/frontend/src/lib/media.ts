/**
 * Media helper utilities for extracting filenames, resolving full media URLs,
 * and replacing storage host URLs dynamically.
 */

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
 * Allows dynamically changing CDN/media domains via NEXT_PUBLIC_IMAGE_HOST, NEXT_PUBLIC_R2_PUBLIC_URL,
 * or NEXT_PUBLIC_LEGACY_IMAGE_HOSTS / NEXT_PUBLIC_MEDIA_HOSTS.
 */
export function getMediaConfig() {
  const targetHost = normalizeHost(
    process.env.NEXT_PUBLIC_IMAGE_HOST ||
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL ||
    ''
  );

  const envHostValues = [
    process.env.NEXT_PUBLIC_IMAGE_HOST,
    process.env.NEXT_PUBLIC_R2_PUBLIC_URL,
    ...(process.env.NEXT_PUBLIC_LEGACY_IMAGE_HOSTS || process.env.NEXT_PUBLIC_MEDIA_HOSTS || '').split(','),
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
export function isMediaUrl(src?: unknown): boolean {
  if (!src || typeof src !== 'string') return false;
  const trimmed = src.trim();
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

  const defaultPrefix = (process.env.NEXT_PUBLIC_MEDIA_PREFIX || '').replace(/^\/+|\/+$/g, '');
  let resolvedFolder = cleanFolder;
  if (!resolvedFolder.includes('/') && defaultPrefix) {
    resolvedFolder = `${defaultPrefix}/${resolvedFolder}`;
  }

  return `${resolvedFolder}/${cleanFileName}`;
}

/**
 * Resolves an image/media URL against NEXT_PUBLIC_IMAGE_HOST from env.
 * Dynamically swaps any source host defined in env (e.g. previous/legacy CDN domains) to the target host.
 * If folder is specified and src is a bare filename, prepends the resolved folder path.
 */
export function getMediaUrl(src?: unknown, folder?: string): string {
  if (!src || typeof src !== 'string') return '';
  const trimmed = src.trim();
  if (!trimmed || trimmed.startsWith('data:') || trimmed.startsWith('mailto:') || trimmed.startsWith('#')) {
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
    return trimmed;
  }

  // 2. Relative paths
  const cleanPath = trimmed.replace(/^\/+/, '');

  // If it's a page route (no media extension), keep as relative page path
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
 * Replaces host URLs defined in env and relative media links in markdown content
 * with the active NEXT_PUBLIC_IMAGE_HOST dynamically.
 */
export function replaceMediaUrlsInContent(content?: string | null): string {
  if (!content || typeof content !== 'string') return '';

  const { targetHost, sourceHostnames } = getMediaConfig();
  if (!targetHost) return content;

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
