import { Router } from 'express';
import { eq, and, sql, ilike, exists } from 'drizzle-orm';
import multer from 'multer';
import sharp from 'sharp';
import { db } from '../db/index.js';
import { projects, projectSkills, projectTags, users } from '../db/schema.js';
import { projectSchema } from '../validators/index.js';
import { asyncHandler, NotFoundError } from '../utils/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { uploadToR2 } from '../services/r2.js';
import { localizeData } from '../utils/localize.js';
import { triggerRevalidation } from '../utils/revalidate.js';

const router = Router();

// Helper to extract pagination parameters
const extractPagination = (query: any) => {
    const page = parseInt(query.page as string, 10) || 1;
    const limit = parseInt(query.limit as string, 10) || 10;
    const offset = (page - 1) * limit;
    return { page, limit, offset };
};

const extractFilters = (query: any) => {
    const filters: any[] = [];
    if (query.highlighted === 'true') filters.push(eq(projects.highlighted, true));
    if (query.highlighted === 'false') filters.push(eq(projects.highlighted, false));
    if (query.published === 'true') filters.push(eq(projects.published, true));
    if (query.published === 'false') filters.push(eq(projects.published, false));
    if (query.search) {
        // Search inside the 'en' localization key for the title
        filters.push(ilike(sql`${projects.title}->>'en'`, `%${query.search}%`));
    }

    if (query.tag) {
        const tagId = parseInt(query.tag as string, 10);
        if (!isNaN(tagId)) {
            filters.push(
                exists(
                    db.select()
                        .from(projectTags)
                        .where(and(
                            eq(projectTags.projectId, projects.id),
                            eq(projectTags.tagId, tagId)
                        ))
                )
            );
        }
    }

    return filters;
};

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

    if (!userId) {
        return res.json({ success: true, data: [] });
    }

    const { page, limit, offset } = extractPagination(req.query);
    const filters = extractFilters(req.query);
    const whereClause = and(eq(projects.userId, userId), ...filters);

    const [totalResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(projects)
        .where(whereClause);

    const total = Number(totalResult?.count || 0);

    const allProjects = await db.query.projects.findMany({
        where: whereClause,
        limit,
        offset,
        with: {
            projectSkills: {
                with: { skill: true },
            },
            projectTags: {
                with: { tag: true },
            },
        },
        orderBy: (projects, { desc }) => [desc(projects.year), desc(projects.createdAt)],
    });

    res.json({
        success: true,
        data: localizeData(allProjects, req.query.lang as string),
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        }
    });
}));

router.get('/user/:username', asyncHandler(async (req, res) => {
    const { username } = req.params;

    const [user] = await db.select().from(users).where(eq(users.username, username!));

    if (!user) {
        throw new NotFoundError('User not found');
    }

    const { page, limit, offset } = extractPagination(req.query);
    const filterConditions: any[] = [eq(projects.userId, user.id), eq(projects.published, true)];

    // For public endpoints, force published=true and allow highlighting, search, and tag filters
    if (req.query.highlighted === 'true') filterConditions.push(eq(projects.highlighted, true));
    if (req.query.highlighted === 'false') filterConditions.push(eq(projects.highlighted, false));
    if (req.query.search) {
        filterConditions.push(ilike(sql`${projects.title}->>'en'`, `%${req.query.search}%`));
    }
    if (req.query.tag) {
        const tagId = parseInt(req.query.tag as string, 10);
        if (!isNaN(tagId)) {
            filterConditions.push(
                exists(db.select().from(projectTags).where(and(eq(projectTags.projectId, projects.id), eq(projectTags.tagId, tagId))))
            );
        }
    }

    const whereClause = and(...filterConditions);

    const [totalResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(projects)
        .where(whereClause);

    const total = Number(totalResult?.count || 0);

    const userProjects = await db.query.projects.findMany({
        where: whereClause,
        limit,
        offset,
        with: {
            projectSkills: {
                with: { skill: true },
            },
            projectTags: {
                with: { tag: true },
            },
        },
        orderBy: (projects, { desc }) => [desc(projects.year), desc(projects.createdAt)],
    });

    res.json({
        success: true,
        data: localizeData(userProjects, req.query.lang as string),
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        }
    });
}));

router.get('/userId/:userId', asyncHandler(async (req, res) => {
    const { userId } = req.params;

    const { page, limit, offset } = extractPagination(req.query);
    const filterConditions: any[] = [eq(projects.userId, userId!), eq(projects.published, true)];

    // For public endpoints, force published=true and allow highlighting, search, and tag filters
    if (req.query.highlighted === 'true') filterConditions.push(eq(projects.highlighted, true));
    if (req.query.highlighted === 'false') filterConditions.push(eq(projects.highlighted, false));
    if (req.query.search) {
        filterConditions.push(ilike(sql`${projects.title}->>'en'`, `%${req.query.search}%`));
    }
    if (req.query.tag) {
        const tagId = parseInt(req.query.tag as string, 10);
        if (!isNaN(tagId)) {
            filterConditions.push(
                exists(db.select().from(projectTags).where(and(eq(projectTags.projectId, projects.id), eq(projectTags.tagId, tagId))))
            );
        }
    }

    const whereClause = and(...filterConditions);

    const [totalResult] = await db
        .select({ count: sql<number>`count(*)` })
        .from(projects)
        .where(whereClause);

    const total = Number(totalResult?.count || 0);

    const userProjects = await db.query.projects.findMany({
        where: whereClause,
        limit,
        offset,
        with: {
            projectSkills: {
                with: { skill: true },
            },
            projectTags: {
                with: { tag: true },
            },
        },
        orderBy: (projects, { desc }) => [desc(projects.year), desc(projects.createdAt)],
    });

    res.json({
        success: true,
        data: localizeData(userProjects, req.query.lang as string),
        meta: {
            total,
            page,
            limit,
            totalPages: Math.ceil(total / limit),
        }
    });
}));

router.get('/user/:username/:slug', asyncHandler(async (req, res) => {
    const { username, slug } = req.params;

    const [user] = await db.select().from(users).where(eq(users.username, username!));

    if (!user) {
        throw new NotFoundError('User not found');
    }

    const project = await db.query.projects.findFirst({
        where: and(eq(projects.slug, slug!), eq(projects.userId, user.id)),
        with: {
            projectSkills: {
                with: {
                    skill: true,
                },
            },
            projectTags: {
                with: {
                    tag: true,
                },
            },
        },
    });

    if (!project) {
        throw new NotFoundError('Project not found');
    }

    res.json({
        success: true,
        data: localizeData(project, req.query.lang as string),
    });
}));

router.get('/userId/:userId/:slug', asyncHandler(async (req, res) => {
    const { userId, slug } = req.params;

    const project = await db.query.projects.findFirst({
        where: and(eq(projects.slug, slug!), eq(projects.userId, userId!)),
        with: {
            projectSkills: {
                with: {
                    skill: true,
                },
            },
            projectTags: {
                with: {
                    tag: true,
                },
            },
        },
    });

    if (!project) {
        throw new NotFoundError('Project not found');
    }

    res.json({
        success: true,
        data: localizeData(project, req.query.lang as string),
    });
}));

router.get('/:slug', asyncHandler(async (req, res) => {
    const { slug } = req.params;
    const userId = req.user?.userId;

    if (!userId) {
        throw new NotFoundError('Project not found');
    }

    const project = await db.query.projects.findFirst({
        where: and(eq(projects.slug, slug!), eq(projects.userId, userId)),
        with: {
            projectSkills: {
                with: {
                    skill: true,
                },
            },
            projectTags: {
                with: {
                    tag: true,
                },
            },
        },
    });

    if (!project) {
        throw new NotFoundError('Project not found');
    }

    res.json({
        success: true,
        data: localizeData(project, req.query.lang as string),
    });
}));

router.post('/', requireAuth, upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'contentImages', maxCount: 20 }
]), asyncHandler(async (req, res) => {
    const validated = projectSchema.parse(req.body);
    const { skillIds, tagIds, publishedAt, ...projectData } = validated;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    const [user] = await db.select().from(users).where(eq(users.id, req.user!.userId));

    if (!user) {
        return res.status(401).json({
            success: false,
            error: 'User not found',
        });
    }

    let coverImageUrl = projectData.coverImage;
    let contentImageUrls: string[] = [];

    if (files?.coverImage?.[0]) {
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const coverBuffer = await sharp(files.coverImage[0].buffer).resize(1200, 900, { fit: 'inside', withoutEnlargement: true }).png({ quality: 80 }).toBuffer();
        const coverName = `${files.coverImage[0].originalname.replace(/\.[^.]+$/, '')}_${date}.png`;
        const result = await uploadToR2(coverBuffer, coverName, user.username, 'projects');

        coverImageUrl = result.url;
    }

    // Upload content images
    if (files?.contentImages) {
        for (const file of files.contentImages) {
            const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const imgBuffer = await sharp(file.buffer).resize(1600, 900, { fit: 'inside', withoutEnlargement: true }).png({ quality: 80 }).toBuffer();
            const imgName = `${file.originalname.replace(/\.[^.]+$/, '')}_${date}.png`;
            const result = await uploadToR2(imgBuffer, imgName, user.username, 'projects');

            contentImageUrls.push(result.url);
        }
    }

    const publishedAtDate = publishedAt ? new Date(publishedAt) : null;

    const [newProject] = await db.insert(projects).values({
        ...projectData,
        coverImage: coverImageUrl,
        contentImages: contentImageUrls.length > 0 ? contentImageUrls : null,
        publishedAt: publishedAtDate,
        userId: req.user!.userId,
    }).returning();

    if (skillIds && skillIds.length > 0) {
        await db.insert(projectSkills).values(
            skillIds.map(skillId => ({
                projectId: newProject!.id,
                skillId,
            }))
        );
    }

    if (tagIds && tagIds.length > 0) {
        await db.insert(projectTags).values(
            tagIds.map(tagId => ({
                projectId: newProject!.id,
                tagId,
            }))
        );
    }

    const result = await db.query.projects.findFirst({
        where: eq(projects.id, newProject!.id),
        with: {
            projectSkills: {
                with: {
                    skill: true,
                },
            },
            projectTags: {
                with: {
                    tag: true,
                },
            },
        },
    });

    if (result) {
        triggerRevalidation('projects');
        triggerRevalidation(`project-${result.slug}`);
    }

    res.status(201).json({
        success: true,
        data: result,
    });
}));

router.put('/:id', requireAuth, upload.fields([
    { name: 'coverImage', maxCount: 1 },
    { name: 'contentImages', maxCount: 20 }
]), asyncHandler(async (req, res) => {
    const { id } = req.params;
    const validated = projectSchema.parse(req.body);
    const { skillIds, tagIds, publishedAt, ...projectData } = validated;
    const files = req.files as { [fieldname: string]: Express.Multer.File[] };

    const [existing] = await db.select().from(projects)
        .where(and(eq(projects.id, id!), eq(projects.userId, req.user!.userId)));

    if (!existing) {
        throw new NotFoundError('Project not found');
    }

    const [user] = await db.select().from(users).where(eq(users.id, req.user!.userId));

    if (!user) {
        return res.status(401).json({
            success: false,
            error: 'User not found',
        });
    }

    let coverImageUrl = projectData.coverImage;
    let contentImageUrls: string[] = existing.contentImages || [];

    if (files?.coverImage?.[0]) {
        const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
        const coverBuffer = await sharp(files.coverImage[0].buffer).resize(1200, 900, { fit: 'inside', withoutEnlargement: true }).png({ quality: 80 }).toBuffer();
        const coverName = `${files.coverImage[0].originalname.replace(/\.[^.]+$/, '')}_${date}.png`;
        const result = await uploadToR2(coverBuffer, coverName, user.username, 'projects');

        coverImageUrl = result.url;
    }

    if (req.body.existingContentImages) {
        try {
            contentImageUrls = JSON.parse(req.body.existingContentImages);
        } catch (e) {
            contentImageUrls = [];
        }
    } else {
        contentImageUrls = existing.contentImages || [];
    }

    if (files?.contentImages) {
        for (const file of files.contentImages) {
            const date = new Date().toISOString().slice(0, 10).replace(/-/g, '');
            const imgBuffer = await sharp(file.buffer).resize(1600, 900, { fit: 'inside', withoutEnlargement: true }).png({ quality: 80 }).toBuffer();
            const imgName = `${file.originalname.replace(/\.[^.]+$/, '')}_${date}.png`;
            const result = await uploadToR2(imgBuffer, imgName, user.username, 'projects');
            contentImageUrls.push(result.url);
        }
    }

    const publishedAtDate = publishedAt ? new Date(publishedAt) : null;

    const [updated] = await db
        .update(projects)
        .set({
            ...projectData,
            coverImage: coverImageUrl,
            contentImages: contentImageUrls.length > 0 ? contentImageUrls : null,
            publishedAt: publishedAtDate,
            updatedAt: new Date()
        })
        .where(eq(projects.id, id!))
        .returning();

    await db.delete(projectSkills).where(eq(projectSkills.projectId, id!));
    await db.delete(projectTags).where(eq(projectTags.projectId, id!));

    if (skillIds && skillIds.length > 0) {
        await db.insert(projectSkills).values(
            skillIds.map(skillId => ({
                projectId: id!,
                skillId,
            }))
        );
    }

    if (tagIds && tagIds.length > 0) {
        await db.insert(projectTags).values(
            tagIds.map(tagId => ({
                projectId: id!,
                tagId,
            }))
        );
    }

    const result = await db.query.projects.findFirst({
        where: eq(projects.id, id!),
        with: {
            projectSkills: {
                with: {
                    skill: true,
                },
            },
            projectTags: {
                with: {
                    tag: true,
                },
            },
        },
    });

    if (result) {
        triggerRevalidation('projects');
        triggerRevalidation(`project-${result.slug}`);
    }

    res.json({
        success: true,
        data: result,
    });
}));

router.delete('/:id', requireAuth, asyncHandler(async (req, res) => {
    const { id } = req.params;

    const [existing] = await db.select().from(projects)
        .where(and(eq(projects.id, id!), eq(projects.userId, req.user!.userId)));

    if (!existing) {
        throw new NotFoundError('Project not found');
    }

    const slug = existing.slug;
    await db.delete(projects).where(eq(projects.id, id!));

    triggerRevalidation('projects');
    if (slug) {
        triggerRevalidation(`project-${slug}`);
    }

    res.json({
        success: true,
        message: 'Project deleted successfully',
    });
}));

export default router;
