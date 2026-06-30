import express from 'express';
import cors from 'cors';
import * as helmetModule from 'helmet';
import * as rateLimitModule from 'express-rate-limit';
import { errorHandler, asyncHandler } from './utils/errors.js';
import { authenticate } from './middleware/auth.js';

const helmet = (helmetModule.default || helmetModule) as any;
const rateLimit = (rateLimitModule.default || rateLimitModule) as any;
import { sql } from 'drizzle-orm';
import { db } from './db/index.js';

// Import routes
import authRouter from './routes/auth.js';
import userRouter from './routes/user.js';
import skillsRouter from './routes/skills.js';
import experienceRouter from './routes/experience.js';
import educationRouter from './routes/education.js';
import certificationsRouter from './routes/certifications.js';
import projectsRouter from './routes/projects.js';
import tagsRouter from './routes/tags.js';
import uploadRouter from './routes/upload.js';
import translateRouter from './routes/translate.js';

const app = express();
const PORT = process.env.PORT || 3000;

// Security Middleware
app.use(helmet());

// Prevent any search engine from indexing API responses or resources
app.use((req, res, next) => {
    res.setHeader('X-Robots-Tag', 'noindex, nofollow');
    next();
});

// Serve a flat robots.txt on the API domain to disallow crawler crawling
app.get('/robots.txt', (req, res) => {
    res.type('text/plain');
    res.send('User-agent: *\nDisallow: /\n');
});

app.use(cors({
    origin: (origin, callback) => {
        // Allow requests with no origin (like mobile apps or curl requests)
        if (!origin) return callback(null, true);

        try {
            const url = new URL(origin);
            const isAllowedSubdomain = url.hostname === 'andikas.dev' || url.hostname.endsWith('.andikas.dev');
            const isLocalhost = url.hostname === 'localhost' || url.hostname.endsWith('.localhost');

            if (isAllowedSubdomain || isLocalhost) {
                return callback(null, true);
            }
        } catch (e) {
            // Ignore URL parsing errors
        }

        // Fallback to allowed origins env variable if set
        const envOrigins = process.env.ALLOWED_ORIGINS
            ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
            : [
                'https://andikas-cms.vercel.app',
                'https://andikas-dev.vercel.app'
            ];

        if (envOrigins.includes(origin)) {
            return callback(null, true);
        }

        return callback(null, false);
    },
    credentials: true,
}));

// Rate limiting (max 100 requests per 15 minutes per IP)
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 100,
    standardHeaders: true,
    legacyHeaders: false,
});
app.use(limiter);

app.use(express.json());
app.use(authenticate);

// Health check
app.get('/health', asyncHandler(async (req, res) => {
    try {
        await db.execute(sql`SELECT 1`);
        res.json({ status: 'ok', database: 'warm', message: 'Portfolio API and database are warm' });
    } catch (dbError) {
        console.error('Database warming query failed:', dbError);
        res.status(500).json({ status: 'error', database: 'cold/failed', message: 'API is running but database query failed' });
    }
}));

// API Routes
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/skills', skillsRouter);
app.use('/api/experience', experienceRouter);
app.use('/api/education', educationRouter);
app.use('/api/certifications', certificationsRouter);
app.use('/api/projects', projectsRouter);
app.use('/api/tags', tagsRouter);
app.use('/api/upload', uploadRouter);
app.use('/api/translate', translateRouter);

// 404 handler
app.use((req, res) => {
    res.status(404).json({
        success: false,
        error: 'Route not found',
    });
});

app.use(errorHandler);

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
    console.log(`API endpoints available at http://localhost:${PORT}/api`);
});
