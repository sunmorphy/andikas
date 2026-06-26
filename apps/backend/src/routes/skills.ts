import { Router } from 'express';
import { eq, and, asc, sql } from 'drizzle-orm';
import multer from 'multer';
import sharp from 'sharp';
import { db } from '../db/index.js';
import { skills, users } from '../db/schema.js';
import { skillSchema } from '../validators/index.js';
import { asyncHandler, NotFoundError } from '../utils/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { uploadToR2 } from '../services/r2.js';
import { triggerRevalidation } from '../utils/revalidate.js';

const router = Router();

const storage = multer.memoryStorage();
const upload = multer({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        } else {
            cb(new Error('Only image files are allowed'));
        }
    },
});


router.get('/', asyncHandler(async (req, res) => {
    const userId = req.user?.userId;

    const allSkills = userId
        ? await db.select().from(skills).where(eq(skills.userId, userId)).orderBy(asc(skills.order))
        : [];

    res.json({
        success: true,
        data: allSkills,
    });
}));

router.get('/user/:username', asyncHandler(async (req, res) => {
    const { username } = req.params;

    const [user] = await db.select().from(users).where(eq(users.username, username!));

    if (!user) {
        throw new NotFoundError('User not found');
    }

    const userSkills = await db.select().from(skills).where(eq(skills.userId, user.id)).orderBy(asc(skills.order));

    res.json({
        success: true,
        data: userSkills,
    });
}));

router.get('/userId/:userId', asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const userSkills = await db.select().from(skills).where(eq(skills.userId, userId!)).orderBy(asc(skills.order));

    res.json({
        success: true,
        data: userSkills,
    });
}));

router.get('/:id', asyncHandler(async (req, res) => {
    const skillId = parseInt(req.params.id!, 10);
    const userId = req.user?.userId;

    if (isNaN(skillId)) throw new NotFoundError('Invalid skill ID');

    const query = userId
        ? db.select().from(skills).where(and(eq(skills.id, skillId), eq(skills.userId, userId)))
        : db.select().from(skills).where(eq(skills.id, skillId)).limit(0);

    const [skill] = await query;

    if (!skill) {
        throw new NotFoundError('Skill not found');
    }

    res.json({
        success: true,
        data: skill,
    });
}));

router.post('/', requireAuth, upload.single('icon'), asyncHandler(async (req, res) => {
    const validated = skillSchema.parse(req.body);

    if (!req.file) {
        return res.status(400).json({
            success: false,
            error: 'Icon file is required',
        });
    }

    const [user] = await db.select().from(users).where(eq(users.id, req.user!.userId));

    if (!user) {
        return res.status(401).json({
            success: false,
            error: 'User not found',
        });
    }

    const iconBuffer = await sharp(req.file.buffer).png({ quality: 80 }).toBuffer();
    const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
    const iconName = `${req.file.originalname.replace(/\.[^.]+$/, '')}_${date}.png`;
    const result = await uploadToR2(iconBuffer, iconName, user.username, 'skills');

    const [maxOrderResult] = await db
        .select({ maxOrder: sql<number>`COALESCE(MAX(${skills.order}), 0)` })
        .from(skills)
        .where(eq(skills.userId, req.user!.userId));
    const nextOrder = (maxOrderResult?.maxOrder ?? 0) + 1;

    const [newSkill] = await db.insert(skills).values({
        name: validated.name,
        icon: result.url,
        userId: req.user!.userId,
        order: nextOrder,
    }).returning();

    triggerRevalidation('skills');

    res.status(201).json({
        success: true,
        data: newSkill,
    });
}));

router.put('/reorder', requireAuth, asyncHandler(async (req, res) => {
    const { ids } = req.body;
    if (!Array.isArray(ids)) {
        return res.status(400).json({
            success: false,
            error: 'ids must be an array of IDs',
        });
    }

    const parsedIds = ids.map(id => typeof id === 'string' ? parseInt(id, 10) : id).filter(id => !isNaN(id));

    await db.transaction(async (tx) => {
        for (let i = 0; i < parsedIds.length; i++) {
            await tx.update(skills)
                .set({ order: i, updatedAt: new Date() })
                .where(and(eq(skills.id, parsedIds[i]!), eq(skills.userId, req.user!.userId)));
        }
    });

    triggerRevalidation('skills');

    res.json({
        success: true,
        message: 'Skills reordered successfully',
    });
}));

router.put('/:id', requireAuth, upload.single('icon'), asyncHandler(async (req, res) => {
    const skillId = parseInt(req.params.id!, 10);
    const validated = skillSchema.parse(req.body);

    if (isNaN(skillId)) throw new NotFoundError('Invalid skill ID');

    const [existing] = await db.select().from(skills)
        .where(and(eq(skills.id, skillId), eq(skills.userId, req.user!.userId)));

    if (!existing) {
        throw new NotFoundError('Skill not found');
    }

    let iconUrl = existing.icon;

    if (req.file) {
        const [user] = await db.select().from(users).where(eq(users.id, req.user!.userId));

        if (!user) {
            return res.status(401).json({
                success: false,
                error: 'User not found',
            });
        }

        const iconBuffer = await sharp(req.file.buffer).png({ quality: 80 }).toBuffer();
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const iconName = `${req.file.originalname.replace(/\.[^.]+$/, '')}_${date}.png`;
        const result = await uploadToR2(iconBuffer, iconName, user.username, 'skills');

        iconUrl = result.url;
    }

    const [updated] = await db
        .update(skills)
        .set({ 
            name: validated.name, 
            icon: iconUrl, 
            order: validated.order ?? existing.order,
            updatedAt: new Date() 
        })
        .where(eq(skills.id, skillId))
        .returning();

    triggerRevalidation('skills');

    res.json({
        success: true,
        data: updated,
    });
}));

router.delete('/:id', requireAuth, asyncHandler(async (req, res) => {
    const skillId = parseInt(req.params.id!, 10);

    if (isNaN(skillId)) throw new NotFoundError('Invalid skill ID');

    const [existing] = await db.select().from(skills)
        .where(and(eq(skills.id, skillId), eq(skills.userId, req.user!.userId)));

    if (!existing) {
        throw new NotFoundError('Skill not found');
    }

    await db.delete(skills).where(eq(skills.id, skillId));

    triggerRevalidation('skills');

    res.json({
        success: true,
        message: 'Skill deleted successfully',
    });
}));

export default router;
