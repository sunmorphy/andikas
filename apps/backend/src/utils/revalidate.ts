import { config } from 'dotenv';
config();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';
const WRITINGS_URL = process.env.WRITINGS_URL || 'http://localhost:3002';
const REVALIDATION_SECRET = process.env.REVALIDATION_SECRET;

/**
 * Triggers a webhook request to the Next.js frontend and writings apps to invalidate cached responses.
 * This function is fire-and-forget (non-blocking) so it won't delay CMS save responses.
 */
export function triggerRevalidation(tag?: string, path?: string): void {
    if (!REVALIDATION_SECRET) {
        console.warn('[Revalidation] REVALIDATION_SECRET is not configured. Webhook revalidation skipped.');
        return;
    }

    const targets = Array.from(new Set([FRONTEND_URL, WRITINGS_URL].filter(Boolean)));

    for (const target of targets) {
        try {
            let url = `${target}/api/revalidate?secret=${REVALIDATION_SECRET}`;
            if (tag) {
                url += `&tag=${tag}`;
            } else if (path) {
                url += `&path=${path}`;
            }

            console.log(`[Revalidation] Triggering revalidation on: ${target} (tag: ${tag || 'all'}, path: ${path || 'none'})`);

            fetch(url, { method: 'POST' })
                .then(async (res) => {
                    if (!res.ok) {
                        const text = await res.text().catch(() => '');
                        console.error(`[Revalidation] Failed response from ${target}: ${res.status} ${res.statusText}. Response: ${text}`);
                    } else {
                        console.log(`[Revalidation] Successfully revalidated ${target} (tag: ${tag || 'all'})`);
                    }
                })
                .catch((err) => {
                    console.error(`[Revalidation] Error sending revalidation webhook to ${target}:`, err);
                });
        } catch (error) {
            console.error(`[Revalidation] Unexpected error in triggerRevalidation for ${target}:`, error);
        }
    }
}
