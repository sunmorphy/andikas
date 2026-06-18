import { config } from 'dotenv';
config();

const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3001';
const REVALIDATION_SECRET = process.env.REVALIDATION_SECRET;

/**
 * Triggers a webhook request to the Next.js frontend to invalidate cached responses.
 * This function is fire-and-forget (non-blocking) so it won't delay CMS save responses.
 */
export function triggerRevalidation(tag?: string, path?: string): void {
    if (!REVALIDATION_SECRET) {
        console.warn('[Revalidation] REVALIDATION_SECRET is not configured. Webhook revalidation skipped.');
        return;
    }

    try {
        let url = `${FRONTEND_URL}/api/revalidate?secret=${REVALIDATION_SECRET}`;
        if (tag) {
            url += `&tag=${tag}`;
        } else if (path) {
            url += `&path=${path}`;
        }

        console.log(`[Revalidation] Triggering revalidation on: ${FRONTEND_URL} (tag: ${tag || 'all'}, path: ${path || 'none'})`);

        // Use global fetch (built-in in Bun / Node 18+)
        fetch(url, { method: 'POST' })
            .then(async (res) => {
                if (!res.ok) {
                    const text = await res.text().catch(() => '');
                    console.error(`[Revalidation] Failed response: ${res.status} ${res.statusText}. Response: ${text}`);
                } else {
                    console.log(`[Revalidation] Successfully revalidated tag: ${tag || 'all'}`);
                }
            })
            .catch((err) => {
                console.error('[Revalidation] Error sending revalidation webhook:', err);
            });
    } catch (error) {
        console.error('[Revalidation] Unexpected error in triggerRevalidation:', error);
    }
}
