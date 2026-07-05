import { Router } from 'express';
import { generateProjectStory } from '../services/gemini.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/errors.js';

const router = Router();

router.post(
    '/story-description',
    requireAuth,
    asyncHandler(async (req, res) => {
        const { title, description, type, tags, skills, prompt } = req.body;

        if (!title || typeof title !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'The "title" parameter is required and must be a string.',
            });
        }

        try {
            const content = await generateProjectStory({
                title,
                description,
                type,
                tags,
                skills,
                prompt,
            });
            return res.json({
                success: true,
                content,
            });
        } catch (error: any) {
            console.error('Story generation route handler error:', error);
            return res.status(500).json({
                success: false,
                error: error.message || 'Story content generation failed due to an internal server error.',
            });
        }
    })
);

export default router;
