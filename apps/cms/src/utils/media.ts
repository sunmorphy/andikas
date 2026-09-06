/**
 * CMS Media helper utility for resolving full media URLs against dynamic image hosts and folders.
 */

const MEDIA_EXTENSIONS_REGEX = /\.(png|jpe?g|webp|svg|gif|avif|ico|bmp|tiff?|pdf|mp4|webm|mov|ogg|mp3|wav)(\?.*)?$/i;

let dynamicImageHost = '';
let dynamicMediaPrefix = '';

export function setPublicImageHost(host: string): void {
  dynamicImageHost = host || '';
}

export function setPublicMediaPrefix(prefix: string): void {
  dynamicMediaPrefix = prefix || '';
}

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

export function getMediaConfig() {
  const envTarget =
    import.meta.env.VITE_IMAGE_HOST ||
    import.meta.env.VITE_R2_PUBLIC_URL ||
    '';

  const targetHost = normalizeHost(dynamicImageHost || envTarget);

  const envHostValues = [
    dynamicImageHost,
    import.meta.env.VITE_IMAGE_HOST,
    import.meta.env.VITE_R2_PUBLIC_URL,
    ...(import.meta.env.VITE_LEGACY_IMAGE_HOSTS || import.meta.env.VITE_MEDIA_HOSTS || '').split(','),
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

function resolveFolderPath(folder?: string, cleanFileName?: string): string {
  if (!cleanFileName) return '';
  if (!folder) return cleanFileName;

  if (cleanFileName.includes('/')) {
    return cleanFileName;
  }

  const cleanFolder = folder.replace(/^\/+|\/+$/g, '');
  if (!cleanFolder) return cleanFileName;

  const defaultPrefix = (dynamicMediaPrefix || import.meta.env.VITE_MEDIA_PREFIX || '').replace(/^\/+|\/+$/g, '');
  let resolvedFolder = cleanFolder;
  if (!resolvedFolder.includes('/') && defaultPrefix) {
    resolvedFolder = `${defaultPrefix}/${resolvedFolder}`;
  }

  return `${resolvedFolder}/${cleanFileName}`;
}

/**
 * Resolves an image/media URL against the active image host from env or API config.
 * Supports an optional folder parameter (e.g. 'projects', 'users', 'articles', 'skills')
 * if the given value is a bare filename.
 */
export function resolveMediaUrl(urlOrName?: string | null, folder?: string): string {
  if (!urlOrName || typeof urlOrName !== 'string') return '';
  const trimmed = urlOrName.trim();
  if (!trimmed || trimmed.startsWith('data:') || trimmed.startsWith('blob:') || trimmed.startsWith('mailto:') || trimmed.startsWith('#')) {
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

  if (!MEDIA_EXTENSIONS_REGEX.test(trimmed)) {
    return trimmed;
  }

  const finalPath = resolveFolderPath(folder, cleanPath);

  if (!targetHost) {
    return `/${finalPath}`;
  }

  return `${targetHost}/${finalPath}`;
}

export const getMediaUrl = resolveMediaUrl;
