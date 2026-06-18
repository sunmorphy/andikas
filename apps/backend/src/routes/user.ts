import { Router } from 'express';
import { eq } from 'drizzle-orm';
import multer from 'multer';
import sharp from 'sharp';
import { db } from '../db/index.js';
import { userDetails, users } from '../db/schema.js';
import { userDetailsSchema } from '../validators/index.js';
import { asyncHandler, NotFoundError } from '../utils/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { localizeData } from '../utils/localize.js';
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
        if (file.mimetype.startsWith('image/') || file.mimetype === 'application/pdf') {
            cb(null, true);
        } else {
            cb(new Error('Only image and PDF files are allowed'));
        }
    },
});

router.get('/', asyncHandler(async (req, res) => {
    const userId = req.user?.userId;

    if (!userId) {
        return res.status(401).json({
            success: false,
            error: 'Authentication required',
        });
    }

    const userDetail = await db.query.userDetails.findFirst({
        where: eq(userDetails.userId, userId),
    });

    if (!userDetail) {
        throw new NotFoundError('User details not found');
    }

    const [user] = await db.select({ email: users.email }).from(users).where(eq(users.id, userId));

    res.json({
        success: true,
        data: {
            ...localizeData(userDetail, req.query.lang as string),
            email: user?.email,
        },
    });
}));

router.get('/:username', asyncHandler(async (req, res) => {
    const { username } = req.params;

    const [user] = await db.select().from(users).where(eq(users.username, username!));

    if (!user) {
        throw new NotFoundError('User not found');
    }

    const userDetail = await db.query.userDetails.findFirst({
        where: eq(userDetails.userId, user.id),
    });

    if (!userDetail) {
        throw new NotFoundError('User details not found');
    }

    res.json({
        success: true,
        data: {
            ...localizeData(userDetail, req.query.lang as string),
            email: user.email,
        },
    });
}));

router.get('/userId/:userId', asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const userDetail = await db.query.userDetails.findFirst({
        where: eq(userDetails.userId, userId!),
    });

    if (!userDetail) {
        throw new NotFoundError('User details not found');
    }

    const [user] = await db.select({ email: users.email }).from(users).where(eq(users.id, userId!));

    res.json({
        success: true,
        data: {
            ...localizeData(userDetail, req.query.lang as string),
            email: user?.email,
        },
    });
}));

router.post('/', requireAuth, upload.fields([{ name: 'profilePhoto', maxCount: 1 }, { name: 'resume', maxCount: 1 }]), asyncHandler(async (req, res) => {
    const validated = userDetailsSchema.parse(req.body);
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    const [user] = await db.select().from(users).where(eq(users.id, req.user!.userId));
    if (!user) return res.status(401).json({ success: false, error: 'User not found' });

    const [existing] = await db.select().from(userDetails).where(eq(userDetails.userId, req.user!.userId));
    if (existing) {
        return res.status(400).json({
            success: false,
            error: 'User details already exist. Use PUT to update.',
        });
    }

    let profilePhotoUrl = validated.profilePhoto;
    let resumeUrl = validated.resume;

    if (files?.profilePhoto?.[0] || files?.resume?.[0]) {

        if (files?.profilePhoto?.[0]) {
            const file = files.profilePhoto[0];
            const isGif = file.mimetype === 'image/gif' || file.originalname.toLowerCase().endsWith('.gif');
            let photoBuffer = file.buffer;
            let photoName = file.originalname;
            const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');

            if (isGif) {
                const ext = file.originalname.split('.').pop() || 'gif';
                photoName = `${file.originalname.replace(/\.[^.]+$/, '')}_${date}.${ext}`;
            } else {
                photoBuffer = await sharp(file.buffer).resize(800, 800, { fit: 'inside', withoutEnlargement: true }).png({ quality: 80 }).toBuffer();
                photoName = `${file.originalname.replace(/\.[^.]+$/, '')}_${date}.png`;
            }

            const result = await uploadToR2(photoBuffer, photoName, user.username, 'users');
            profilePhotoUrl = result.url;
        }

        if (files?.resume?.[0]) {
            const file = files.resume[0];
            const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const ext = file.originalname.split('.').pop() || 'pdf';
            const resumeName = `${file.originalname.replace(/\.[^.]+$/, '')}_${date}.${ext}`;
            const result = await uploadToR2(file.buffer, resumeName, user.username, 'users');
            resumeUrl = result.url;
        }
    }

    const [newUser] = await db.insert(userDetails).values({
        ...validated,
        profilePhoto: profilePhotoUrl,
        resume: resumeUrl,
        userId: req.user!.userId,
    }).returning();

    triggerRevalidation('user');

    res.status(201).json({
        success: true,
        data: {
            ...localizeData(newUser, req.query.lang as string),
            email: user.email,
        },
    });
}));

router.put('/', requireAuth, upload.fields([{ name: 'profilePhoto', maxCount: 1 }, { name: 'resume', maxCount: 1 }]), asyncHandler(async (req, res) => {
    const validated = userDetailsSchema.parse(req.body);
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    const [user] = await db.select().from(users).where(eq(users.id, req.user!.userId));
    if (!user) return res.status(401).json({ success: false, error: 'User not found' });

    const [existing] = await db.select().from(userDetails).where(eq(userDetails.userId, req.user!.userId));
    if (!existing) {
        throw new NotFoundError('User details not found. Use POST to create.');
    }

    let profilePhotoUrl = validated.profilePhoto;
    let resumeUrl = validated.resume;

    if (files?.profilePhoto?.[0] || files?.resume?.[0]) {

        if (files?.profilePhoto?.[0]) {
            const file = files.profilePhoto[0];
            const isGif = file.mimetype === 'image/gif' || file.originalname.toLowerCase().endsWith('.gif');
            let photoBuffer = file.buffer;
            let photoName = file.originalname;
            const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');

            if (isGif) {
                const ext = file.originalname.split('.').pop() || 'gif';
                photoName = `${file.originalname.replace(/\.[^.]+$/, '')}_${date}.${ext}`;
            } else {
                photoBuffer = await sharp(file.buffer).resize(800, 800, { fit: 'inside', withoutEnlargement: true }).png({ quality: 80 }).toBuffer();
                photoName = `${file.originalname.replace(/\.[^.]+$/, '')}_${date}.png`;
            }

            const result = await uploadToR2(photoBuffer, photoName, user.username, 'users');
            profilePhotoUrl = result.url;
        }

        if (files?.resume?.[0]) {
            const file = files.resume[0];
            const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const ext = file.originalname.split('.').pop() || 'pdf';
            const resumeName = `${file.originalname.replace(/\.[^.]+$/, '')}_${date}.${ext}`;
            const result = await uploadToR2(file.buffer, resumeName, user.username, 'users');
            resumeUrl = result.url;
        }
    }

    const [updated] = await db
        .update(userDetails)
        .set({ ...validated, profilePhoto: profilePhotoUrl, resume: resumeUrl, updatedAt: new Date() })
        .where(eq(userDetails.id, existing.id))
        .returning();

    triggerRevalidation('user');

    res.json({
        success: true,
        data: {
            ...localizeData(updated, req.query.lang as string),
            email: user.email,
        },
    });
}));

export default router;
