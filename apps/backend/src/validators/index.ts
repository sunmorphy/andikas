import { z } from 'zod';

const parseJsonIfString = (val: any) => {
    if (typeof val === 'string') {
        if (val.trim() === '') return undefined;
        try {
            return JSON.parse(val);
        } catch (e) {
            return val;
        }
    }
    return val;
};

// Represents {"en": "Hello", "id": "Halo", ...}
export const localizedStringSchema = z.preprocess(
    parseJsonIfString,
    z.object({
        en: z.string().min(1, 'English text is required'),
        id: z.string().optional(),
        de: z.string().optional(),
        ja: z.string().optional(),
        nl: z.string().optional(),
    })
);

// User Details Validation
export const userDetailsSchema = z.object({
    name: z.string().min(1, 'Name is required').max(255),
    role: localizedStringSchema,
    description: localizedStringSchema.optional().nullable(),
    phone: z.string().max(255).optional().nullable(),
    location: localizedStringSchema.optional().nullable(),
    socialMedias: z.preprocess((val) => {
        if (typeof val === 'string') {
            if (val.trim() === '') return null;
            try { return JSON.parse(val); } catch (e) { return val; }
        }
        return val;
    }, z.array(z.string())).optional().nullable(),
    profilePhoto: z.string().optional().nullable(),
    resume: z.string().optional().nullable(),
});

export type UserDetailsInput = z.infer<typeof userDetailsSchema>;

// Skills Validation
export const skillSchema = z.object({
    name: z.string().min(1, 'Name is required').max(255),
    icon: z.string().optional().nullable(),
});

export type SkillInput = z.infer<typeof skillSchema>;

// Tags Validation
export const tagSchema = z.object({
    name: z.string().min(1, 'Name is required').max(255),
    slug: z.string().min(1, 'Slug is required').max(255).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only'),
});

export type TagInput = z.infer<typeof tagSchema>;

// Experience Validation
export const experienceSchema = z.object({
    startYear: z.number().int().min(1900).max(2100),
    endYear: z.number().int().min(1900).max(2100).optional().nullable(),
    companyName: z.string().min(1, 'Company name is required').max(255),
    description: localizedStringSchema.optional().nullable(),
    location: localizedStringSchema,
    skillIds: z.preprocess((val) => {
        if (typeof val === 'string') {
            if (val.trim() === '') return [];
            try { return JSON.parse(val); } catch (e) { return val; }
        }
        return val;
    }, z.array(z.number().int())).default([]),
});

export type ExperienceInput = z.infer<typeof experienceSchema>;

// Education Validation
export const educationSchema = z.object({
    year: z.string().min(1, 'Year is required').max(50),
    institutionName: z.string().min(1, 'Institution name is required').max(255),
    degree: localizedStringSchema,
    description: localizedStringSchema.optional().nullable(),
});

export type EducationInput = z.infer<typeof educationSchema>;

// Certifications Validation
export const certificationSchema = z.object({
    name: localizedStringSchema,
    issuingOrganization: localizedStringSchema,
    year: z.number().int().min(1900).max(2100),
    description: z.string().optional().nullable(),
    certificateLink: z.preprocess(
        (val) => val === '' ? null : val,
        z.string().url().optional().nullable()
    ),
    skillIds: z.preprocess((val) => {
        if (typeof val === 'string') {
            if (val.trim() === '') return [];
            try { return JSON.parse(val); } catch (e) { return val; }
        }
        return val;
    }, z.array(z.number().int())).default([]),
});

export type CertificationInput = z.infer<typeof certificationSchema>;

// Projects Validation
export const projectSchema = z.object({
    title: localizedStringSchema,
    slug: z.string().min(1, 'Slug is required').max(255).regex(/^[a-z0-9-]+$/, 'Slug must be lowercase with hyphens only'),
    year: z.preprocess((val) => {
        if (typeof val === 'string') {
            if (val.trim() === '') return undefined;
            const parsed = parseInt(val, 10);
            return isNaN(parsed) ? val : parsed;
        }
        return val;
    }, z.number({ required_error: "Year is required" }).int().min(1900).max(2100)),
    description: localizedStringSchema,
    type: z.enum(['individual', 'group']).default('individual'),
    content: z.string().min(1, 'Content is required'),
    coverImage: z.string().optional().nullable(),
    githubUrl: z.preprocess(
        (val) => val === '' ? null : val,
        z.string().url().optional().nullable()
    ),
    liveUrl: z.preprocess(
        (val) => val === '' ? null : val,
        z.string().url().optional().nullable()
    ),
    contentImages: z.array(z.string()).optional().nullable(),
    published: z.preprocess(
        (val) => val === 'true' || val === true,
        z.boolean()
    ).default(false),
    highlighted: z.preprocess(
        (val) => val === 'true' || val === true,
        z.boolean()
    ).default(false),
    publishedAt: z.preprocess(
        (val) => (typeof val === 'string' && val.trim() === '') ? null : val,
        z.string().datetime().optional().nullable()
    ),
    skillIds: z.preprocess((val) => {
        if (typeof val === 'string') {
            if (val.trim() === '') return [];
            try { return JSON.parse(val); } catch (e) { return val; }
        }
        return val;
    }, z.array(z.number().int())).default([]),
    tagIds: z.preprocess((val) => {
        if (typeof val === 'string') {
            if (val.trim() === '') return [];
            try { return JSON.parse(val); } catch (e) { return val; }
        }
        return val;
    }, z.array(z.number().int())).default([]),
});

export type ProjectInput = z.infer<typeof projectSchema>;
