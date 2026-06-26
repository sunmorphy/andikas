import { pgTable, uuid, text, varchar, timestamp, integer, json, boolean, serial } from 'drizzle-orm/pg-core';
import { relations } from 'drizzle-orm';

// Users Table
export const users = pgTable('users', {
    id: uuid('id').defaultRandom().primaryKey(),
    email: varchar('email', { length: 255 }).notNull().unique(),
    username: varchar('username', { length: 50 }).notNull().unique(),
    password: varchar('password', { length: 255 }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// User Details Table
export const userDetails = pgTable('user_details', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().unique().references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    role: json('role').notNull().$type<Record<string, string | undefined>>(),
    description: json('description').$type<Record<string, string | undefined>>(),
    phone: varchar('phone', { length: 255 }),
    location: json('location').$type<Record<string, string | undefined>>(),
    socialMedias: json('social_medias').$type<string[]>(),
    profilePhoto: text('profile_photo'),
    resume: text('resume'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Skills Table
export const skills = pgTable('skills', {
    id: serial('id').primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: varchar('name', { length: 255 }).notNull(),
    icon: text('icon').notNull(), // URL to image hosting
    order: integer('order').default(0).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Experience Table
export const experience = pgTable('experience', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    startYear: integer('start_year').notNull(),
    endYear: integer('end_year'), // null means currently employed
    companyName: varchar('company_name', { length: 255 }).notNull(),
    description: json('description').$type<Record<string, string | undefined>>(),
    location: json('location').$type<Record<string, string | undefined>>(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Education Table
export const education = pgTable('education', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    year: varchar('year', { length: 50 }).notNull(), // e.g., "2001-2008"
    institutionName: varchar('institution_name', { length: 255 }).notNull(),
    degree: json('degree').notNull().$type<Record<string, string | undefined>>(),
    description: json('description').$type<Record<string, string | undefined>>(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Certifications Table
export const certifications = pgTable('certifications', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    name: json('name').notNull().$type<Record<string, string | undefined>>(),
    issuingOrganization: json('issuing_organization').notNull().$type<Record<string, string | undefined>>(),
    year: integer('year').notNull(),
    description: text('description'),
    certificateLink: text('certificate_link'),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Projects Table (Medium-style articles)
export const projects = pgTable('projects', {
    id: uuid('id').defaultRandom().primaryKey(),
    userId: uuid('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
    title: json('title').notNull().$type<Record<string, string | undefined>>(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    content: text('content').notNull(), // Rich text/markdown content
    coverImage: text('cover_image'),
    contentImages: json('content_images').$type<string[]>(), // Image gallery
    githubUrl: varchar('github_url', { length: 255 }),
    liveUrl: varchar('live_url', { length: 255 }),
    published: boolean('published').default(false).notNull(),
    highlighted: boolean('highlighted').default(false).notNull(), // Featured/highlighted project
    publishedAt: timestamp('published_at'),
    year: integer('year').notNull(),
    description: json('description').$type<Record<string, string | undefined>>(),
    type: varchar('type', { length: 50 }).default('individual').notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

// Junction Tables for Many-to-Many Relationships

// Experience-Skills Junction Table
export const experienceSkills = pgTable('experience_skills', {
    id: uuid('id').defaultRandom().primaryKey(),
    experienceId: uuid('experience_id').notNull().references(() => experience.id, { onDelete: 'cascade' }),
    skillId: integer('skill_id').notNull().references(() => skills.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Certification-Skills Junction Table
export const certificationSkills = pgTable('certification_skills', {
    id: uuid('id').defaultRandom().primaryKey(),
    certificationId: uuid('certification_id').notNull().references(() => certifications.id, { onDelete: 'cascade' }),
    skillId: integer('skill_id').notNull().references(() => skills.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Project-Skills Junction Table
export const projectSkills = pgTable('project_skills', {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id').notNull().references(() => projects.id, { onDelete: 'cascade' }),
    skillId: integer('skill_id').notNull().references(() => skills.id, { onDelete: 'cascade' }),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

// Relations

export const experienceRelations = relations(experience, ({ many }) => ({
    experienceSkills: many(experienceSkills),
}));

export const tags = pgTable('tags', {
    id: serial('id').primaryKey(),
    userId: uuid('user_id').references(() => users.id, { onDelete: 'cascade' }).notNull(),
    name: varchar('name', { length: 255 }).notNull(),
    slug: varchar('slug', { length: 255 }).notNull().unique(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
    updatedAt: timestamp('updated_at').defaultNow().notNull(),
});

export const projectTags = pgTable('project_tags', {
    id: uuid('id').defaultRandom().primaryKey(),
    projectId: uuid('project_id').references(() => projects.id, { onDelete: 'cascade' }).notNull(),
    tagId: integer('tag_id').references(() => tags.id, { onDelete: 'cascade' }).notNull(),
    createdAt: timestamp('created_at').defaultNow().notNull(),
});

export const usersRelations = relations(users, ({ one, many }) => ({
    experienceSkills: many(experienceSkills),
    certifications: many(certifications),
    projects: many(projects),
    tags: many(tags),
}));

export const skillsRelations = relations(skills, ({ many }) => ({
    experienceSkills: many(experienceSkills),
    certificationSkills: many(certificationSkills),
    projectSkills: many(projectSkills),
}));

export const experienceSkillsRelations = relations(experienceSkills, ({ one }) => ({
    experience: one(experience, {
        fields: [experienceSkills.experienceId],
        references: [experience.id],
    }),
    skill: one(skills, {
        fields: [experienceSkills.skillId],
        references: [skills.id],
    }),
}));

export const certificationsRelations = relations(certifications, ({ many }) => ({
    certificationSkills: many(certificationSkills),
}));

export const certificationSkillsRelations = relations(certificationSkills, ({ one }) => ({
    certification: one(certifications, {
        fields: [certificationSkills.certificationId],
        references: [certifications.id],
    }),
    skill: one(skills, {
        fields: [certificationSkills.skillId],
        references: [skills.id],
    }),
}));

export const projectsRelations = relations(projects, ({ one, many }) => ({
    user: one(users, {
        fields: [projects.userId],
        references: [users.id],
    }),
    projectSkills: many(projectSkills),
    projectTags: many(projectTags),
}));

export const projectSkillsRelations = relations(projectSkills, ({ one }) => ({
    project: one(projects, {
        fields: [projectSkills.projectId],
        references: [projects.id],
    }),
    skill: one(skills, {
        fields: [projectSkills.skillId],
        references: [skills.id],
    }),
}));

export const tagsRelations = relations(tags, ({ one, many }) => ({
    user: one(users, {
        fields: [tags.userId],
        references: [users.id],
    }),
    projectTags: many(projectTags),
}));

export const projectTagsRelations = relations(projectTags, ({ one }) => ({
    project: one(projects, {
        fields: [projectTags.projectId],
        references: [projects.id],
    }),
    tag: one(tags, {
        fields: [projectTags.tagId],
        references: [tags.id],
    }),
}));
