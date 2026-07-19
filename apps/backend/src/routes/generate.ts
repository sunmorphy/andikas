import { Router } from 'express';
import multer from 'multer';
import { generateProjectStory } from '../services/gemini.js';
import { requireAuth } from '../middleware/auth.js';
import { asyncHandler } from '../utils/errors.js';

const router = Router();

const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
});

router.post(
    '/story-description',
    requireAuth,
    upload.array('files', 3),
    asyncHandler(async (req, res) => {
        const { title, description, type, tags, skills, prompt } = req.body;

        if (!title || typeof title !== 'string') {
            return res.status(400).json({
                success: false,
                error: 'The "title" parameter is required and must be a string.',
            });
        }

        // Parse array parameters if they are transmitted as stringified JSON (common in multipart forms)
        let parsedTags = tags;
        if (typeof tags === 'string') {
            try {
                parsedTags = JSON.parse(tags);
            } catch {
                parsedTags = [];
            }
        }

        let parsedSkills = skills;
        if (typeof skills === 'string') {
            try {
                parsedSkills = JSON.parse(skills);
            } catch {
                parsedSkills = [];
            }
        }

        // Map uploaded files to buffers
        const uploadedFiles = req.files && Array.isArray(req.files)
            ? (req.files as Express.Multer.File[]).map(file => ({
                buffer: file.buffer,
                originalname: file.originalname,
                mimetype: file.mimetype,
            }))
            : [];

        try {
            const content = await generateProjectStory({
                title,
                description,
                type,
                tags: parsedTags,
                skills: parsedSkills,
                prompt,
                files: uploadedFiles,
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
