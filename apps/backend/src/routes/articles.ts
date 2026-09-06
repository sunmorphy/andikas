import { Router } from 'express';
import { eq, and, or, sql, ilike, exists, desc } from 'drizzle-orm';
import multer from 'multer';
import sharp from 'sharp';
import { db } from '../db/index.js';
import { articles, articleTags, tags, users } from '../db/schema.js';
import { articleSchema } from '../validators/index.js';
import { asyncHandler, NotFoundError } from '../utils/errors.js';
import { requireAuth } from '../middleware/auth.js';
import { uploadToR2 } from '../services/r2.js';
import { localizeData } from '../utils/localize.js';
import { triggerRevalidation } from '../utils/revalidate.js';
import { extractFileName, getMediaUrl } from '../utils/media.js';

const router = Router();

const extractPagination = (query: any) => {
    const page = parseInt(query.page as string, 10) || 1;
    const limit = parseInt(query.limit as string, 10) || 10;
    const offset = (page - 1) * limit;
    return { page, limit, offset };
};

const extractFilters = (query: any) => {
    const filters: any[] = [];
    if (query.published === 'true') filters.push(eq(articles.published, true));
    if (query.published === 'false') filters.push(eq(articles.published, false));
    if (query.search) {
        filters.push(
            or(
                ilike(sql`${articles.title}::text`, `%${query.search}%`),
                ilike(sql`${articles.description}::text`, `%${query.search}%`),
                ilike(sql`${articles.slug}`, `%${query.search}%`)
            )
        );
    }

    if (query.tag) {
        const tagId = parseInt(query.tag as string, 10);
        if (!isNaN(tagId)) {
            filters.push(
                exists(
                    db.select()
                        .from(articleTags)
                        .where(and(
                            eq(articleTags.articleId, articles.id),
                            eq(articleTags.tagId, tagId)
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

function formatArticleMedia(article: any) {
    if (!article) return article;
    return {
        ...article,
        coverImage: getMediaUrl(article.coverImage),
    };
}

router.get('/user/:username', asyncHandler(async (req, res) => {
    const username = req.params.username as string;
    const lang = req.query.lang as string || 'en';
    const { page, limit, offset } = extractPagination(req.query);

    const user = await db.query.users.findFirst({
        where: eq(users.username, username),
    });

    if (!user) {
        throw new NotFoundError('User not found');
    }

    const filters = [
        eq(articles.userId, user.id),
        eq(articles.published, true),
        ...extractFilters(req.query),
    ];

    const whereClause = and(...filters);

    const [totalCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(articles)
        .where(whereClause);

    const total = totalCount?.count || 0;
    const totalPages = Math.ceil(total / limit);

    const userArticles = await db.query.articles.findMany({
        where: whereClause,
        orderBy: [desc(articles.publishedAt), desc(articles.createdAt)],
        limit,
        offset,
        with: {
            articleTags: {
                with: {
                    tag: true,
                },
            },
        },
    });

    const localized = userArticles.map((art) => formatArticleMedia(localizeData(art, lang)));

    res.json({
        success: true,
        data: localized,
        meta: {
            page,
            limit,
            total,
            totalPages,
        },
    });
}));

router.get('/user/:username/:slug', asyncHandler(async (req, res) => {
    const username = req.params.username as string;
    const slug = req.params.slug as string;
    const lang = req.query.lang as string || 'en';

    const user = await db.query.users.findFirst({
        where: eq(users.username, username),
    });

    if (!user) {
        throw new NotFoundError('User not found');
    }

    const article = await db.query.articles.findFirst({
        where: and(
            eq(articles.userId, user.id),
            eq(articles.slug, slug),
            eq(articles.published, true)
        ),
        with: {
            articleTags: {
                with: {
                    tag: true,
                },
            },
        },
    });

    if (!article) {
        throw new NotFoundError('Article not found');
    }

    const localized = formatArticleMedia(localizeData(article, lang));

    res.json({
        success: true,
        data: localized,
    });
}));

router.get('/', requireAuth, asyncHandler(async (req, res) => {
    const userId = req.user!.userId;
    const { page, limit, offset } = extractPagination(req.query);

    const filters = [
        eq(articles.userId, userId),
        ...extractFilters(req.query),
    ];

    const whereClause = and(...filters);

    const [totalCount] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(articles)
        .where(whereClause);

    const total = totalCount?.count || 0;
    const totalPages = Math.ceil(total / limit);

    const userArticles = await db.query.articles.findMany({
        where: whereClause,
        orderBy: [desc(articles.createdAt)],
        limit,
        offset,
        with: {
            articleTags: {
                with: {
                    tag: true,
                },
            },
        },
    });

    const formatted = userArticles.map(formatArticleMedia);

    res.json({
        success: true,
        data: formatted,
        meta: {
            page,
            limit,
            total,
            totalPages,
        },
    });
}));

router.get('/:id', requireAuth, asyncHandler(async (req, res) => {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const article = await db.query.articles.findFirst({
        where: and(
            eq(articles.id, id),
            eq(articles.userId, userId)
        ),
        with: {
            articleTags: {
                with: {
                    tag: true,
                },
            },
        },
    });

    if (!article) {
        throw new NotFoundError('Article not found');
    }

    res.json({
        success: true,
        data: formatArticleMedia(article),
    });
}));

router.post('/', requireAuth, upload.single('coverImage'), asyncHandler(async (req, res) => {
    const userId = req.user!.userId;

    const parseJsonField = (val: any) => {
        if (typeof val === 'string') {
            try { return JSON.parse(val); } catch { return val; }
        }
        return val;
    };

    const rawData = {
        title: parseJsonField(req.body.title),
        slug: req.body.slug,
        description: parseJsonField(req.body.description),
        content: req.body.content,
        published: req.body.published,
        publishedAt: req.body.publishedAt,
        readingTime: req.body.readingTime,
        tagIds: parseJsonField(req.body.tagIds),
    };

    const validated = articleSchema.parse(rawData);

    let coverImage = extractFileName(req.body.coverImage) || null;
    if (req.file) {
        const optimizedBuffer = await sharp(req.file.buffer)
            .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 85 })
            .toBuffer();

        const uploadResult = await uploadToR2(
            optimizedBuffer,
            `articles/cover_${validated.slug}_${Date.now()}.webp`,
            'image/webp'
        );
        coverImage = uploadResult.name;
    }

    // Auto-calculate reading time if not explicitly passed
    let readingTime = validated.readingTime;
    if (!readingTime || readingTime <= 0) {
        const words = validated.content.trim().split(/\s+/).length;
        readingTime = Math.max(1, Math.round(words / 200));
    }

    const publishedAtDate = validated.published
        ? (validated.publishedAt ? new Date(validated.publishedAt) : new Date())
        : null;

    const newArticle = await db.transaction(async (tx) => {
        const [article] = await tx.insert(articles).values({
            userId,
            title: validated.title,
            slug: validated.slug,
            description: validated.description || null,
            content: validated.content,
            coverImage,
            published: validated.published,
            publishedAt: publishedAtDate,
            readingTime,
        }).returning();

        if (!article) {
            throw new Error('Failed to create article');
        }

        if (validated.tagIds && validated.tagIds.length > 0) {
            await tx.insert(articleTags).values(
                validated.tagIds.map((tagId) => ({
                    articleId: article.id,
                    tagId,
                }))
            );
        }

        return article;
    });

    if (!newArticle) {
        throw new Error('Failed to create article');
    }

    triggerRevalidation('articles');

    const created = await db.query.articles.findFirst({
        where: eq(articles.id, newArticle.id),
        with: {
            articleTags: {
                with: {
                    tag: true,
                },
            },
        },
    });

    res.status(201).json({
        success: true,
        data: formatArticleMedia(created),
    });
}));

router.put('/:id', requireAuth, upload.single('coverImage'), asyncHandler(async (req, res) => {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const existingArticle = await db.query.articles.findFirst({
        where: and(
            eq(articles.id, id),
            eq(articles.userId, userId)
        ),
    });

    if (!existingArticle) {
        throw new NotFoundError('Article not found');
    }

    const parseJsonField = (val: any) => {
        if (typeof val === 'string') {
            try { return JSON.parse(val); } catch { return val; }
        }
        return val;
    };

    const rawData = {
        title: parseJsonField(req.body.title),
        slug: req.body.slug,
        description: parseJsonField(req.body.description),
        content: req.body.content,
        published: req.body.published,
        publishedAt: req.body.publishedAt,
        readingTime: req.body.readingTime,
        tagIds: parseJsonField(req.body.tagIds),
    };

    const validated = articleSchema.parse(rawData);

    let coverImage = extractFileName(req.body.coverImage) || existingArticle.coverImage;
    if (req.file) {
        const optimizedBuffer = await sharp(req.file.buffer)
            .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
            .webp({ quality: 85 })
            .toBuffer();

        const uploadResult = await uploadToR2(
            optimizedBuffer,
            `articles/cover_${validated.slug}_${Date.now()}.webp`,
            'image/webp'
        );
        coverImage = uploadResult.name;
    }

    let readingTime = validated.readingTime;
    if (!readingTime || readingTime <= 0) {
        const words = validated.content.trim().split(/\s+/).length;
        readingTime = Math.max(1, Math.round(words / 200));
    }

    const publishedAtDate = validated.published
        ? (validated.publishedAt ? new Date(validated.publishedAt) : (existingArticle.publishedAt || new Date()))
        : null;

    await db.transaction(async (tx) => {
        await tx.update(articles).set({
            title: validated.title,
            slug: validated.slug,
            description: validated.description || null,
            content: validated.content,
            coverImage,
            published: validated.published,
            publishedAt: publishedAtDate,
            readingTime,
            updatedAt: new Date(),
        }).where(eq(articles.id, id));

        await tx.delete(articleTags).where(eq(articleTags.articleId, id));
        if (validated.tagIds && validated.tagIds.length > 0) {
            await tx.insert(articleTags).values(
                validated.tagIds.map((tagId) => ({
                    articleId: id,
                    tagId,
                }))
            );
        }
    });

    triggerRevalidation('articles');

    const updated = await db.query.articles.findFirst({
        where: eq(articles.id, id),
        with: {
            articleTags: {
                with: {
                    tag: true,
                },
            },
        },
    });

    res.json({
        success: true,
        data: formatArticleMedia(updated),
    });
}));

router.delete('/:id', requireAuth, asyncHandler(async (req, res) => {
    const userId = req.user!.userId;
    const id = req.params.id as string;

    const existingArticle = await db.query.articles.findFirst({
        where: and(
            eq(articles.id, id),
            eq(articles.userId, userId)
        ),
    });

    if (!existingArticle) {
        throw new NotFoundError('Article not found');
    }

    await db.delete(articles).where(eq(articles.id, id));

    triggerRevalidation('articles');

    res.json({
        success: true,
        message: 'Article deleted successfully',
    });
}));

export default router;
