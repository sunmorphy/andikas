import { Router } from 'express';
import { translateText } from '../services/gemini.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/errors.js';

const router = Router();

// Endpoint for executing translation, protected to prevent abuse of API limits
router.post(
    '/',
    requireAuth,
    asyncHandler(async (req, res) => {
        const { text, targetLangs } = req.body;

        if (!text || typeof text !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'The "text" body parameter is required and must be a string.',
            });
        }

        if (targetLangs && (!Array.isArray(targetLangs) || targetLangs.some(l => typeof l !== 'string'))) {
            return res.status(400).json({
                success: false,
                error: 'The "targetLangs" parameter, if provided, must be an array of strings.',
            });
        }

        try {
            const translations = await translateText(text, targetLangs);
            return res.json({
                success: true,
                translations,
            });
        } catch (error: any) {
            console.error('Translation route handler error:', error);
            return res.status(500).json({
                success: false,
                error: error.message || 'Translation failed due to an internal server error.',
            });
        }
    })
);

export default router;
