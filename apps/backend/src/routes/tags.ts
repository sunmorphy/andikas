import { Router } from 'express';
import { eq, and } from 'drizzle-orm';
import { db } from '../db/index.js';
import { tags, users } from '../db/schema.js';
import { tagSchema } from '../validators/index.js';
import { asyncHandler, NotFoundError } from '../utils/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { triggerRevalidation } from '../utils/revalidate.js';

const router = Router();

router.get('/', asyncHandler(async (req, res) => {
    const userId = req.user?.userId;

    const allTags = userId
        ? await db.select().from(tags).where(eq(tags.userId, userId))
        : [];

    res.json({
        success: true,
        data: allTags,
    });
}));

router.get('/user/:username', asyncHandler(async (req, res) => {
    const { username } = req.params;

    const [user] = await db.select().from(users).where(eq(users.username, username!));

    if (!user) {
        throw new NotFoundError('User not found');
    }

    const userTags = await db.select().from(tags).where(eq(tags.userId, user.id));

    res.json({
        success: true,
        data: userTags,
    });
}));

router.get('/userId/:userId', asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const userTags = await db.select().from(tags).where(eq(tags.userId, userId!));

    res.json({
        success: true,
        data: userTags,
    });
}));

router.get('/:id', asyncHandler(async (req, res) => {
    const tagId = parseInt(req.params.id!, 10);
    const userId = req.user?.userId;

    if (isNaN(tagId)) throw new NotFoundError('Invalid tag ID');

    const query = userId
        ? db.select().from(tags).where(and(eq(tags.id, tagId), eq(tags.userId, userId)))
        : db.select().from(tags).where(eq(tags.id, tagId)).limit(0);

    const [tag] = await query;

    if (!tag) {
        throw new NotFoundError('Tag not found');
    }

    res.json({
        success: true,
        data: tag,
    });
}));

router.post('/', requireAuth, asyncHandler(async (req, res) => {
    const validated = tagSchema.parse(req.body);

    const [existing] = await db.select().from(tags)
        .where(and(eq(tags.slug, validated.slug), eq(tags.userId, req.user!.userId)));

    if (existing) {
        return res.status(400).json({
            success: false,
            error: 'Tag with this slug already exists',
        });
    }

    const [newTag] = await db.insert(tags).values({
        ...validated,
        userId: req.user!.userId,
    }).returning();

    triggerRevalidation('tags');
    triggerRevalidation('projects');

    res.status(201).json({
        success: true,
        data: newTag,
    });
}));

router.put('/:id', requireAuth, asyncHandler(async (req, res) => {
    const tagId = parseInt(req.params.id!, 10);
    const validated = tagSchema.parse(req.body);

    if (isNaN(tagId)) throw new NotFoundError('Invalid tag ID');

    const [existing] = await db.select().from(tags)
        .where(and(eq(tags.id, tagId), eq(tags.userId, req.user!.userId)));

    if (!existing) {
        throw new NotFoundError('Tag not found');
    }

    const [updated] = await db
        .update(tags)
        .set({ ...validated, updatedAt: new Date() })
        .where(eq(tags.id, tagId))
        .returning();

    triggerRevalidation('tags');
    triggerRevalidation('projects');

    res.json({
        success: true,
        data: updated,
    });
}));

router.delete('/:id', requireAuth, asyncHandler(async (req, res) => {
    const tagId = parseInt(req.params.id!, 10);

    if (isNaN(tagId)) throw new NotFoundError('Invalid tag ID');

    const [existing] = await db.select().from(tags)
        .where(and(eq(tags.id, tagId), eq(tags.userId, req.user!.userId)));

    if (!existing) {
        throw new NotFoundError('Tag not found');
    }

    await db.delete(tags).where(eq(tags.id, tagId));

    triggerRevalidation('tags');
    triggerRevalidation('projects');

    res.json({
        success: true,
        message: 'Tag deleted successfully',
    });
}));

export default router;
