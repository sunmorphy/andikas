export interface User {
    id: string;
    name: string;
    role: string;
    description: string;
    socialMedias: string[];
    profilePhoto: string;
    createdAt: string;
    updatedAt: string;
    username?: string;
    email?: string;
    phone?: string;
    location?: string;
    resume?: string;
}

export interface Skill {
    id: string;
    name: string;
    icon: string;
    order?: number;
    createdAt: string;
    updatedAt: string;
}

export interface Tag {
    id: number;
    name: string;
    slug: string;
}

export interface Experience {
    id: string;
    startYear: number;
    endYear: number | null;
    companyName: string;
    description: string;
    location: string;
    experienceSkills: ExperienceSkills[];
    createdAt: string;
    updatedAt: string;
}

export interface ExperienceSkills {
    id: string;
    experienceId: string;
    skillId: number;
    createdAt: string;
    skill: Skill;
}

export interface Education {
    id: string;
    year: string;
    institutionName: string;
    degree: string;
    description: string;
    createdAt: string;
    updatedAt: string;
}

export interface Certification {
    id: string;
    name: string;
    issuingOrganization: string;
    year: number;
    description: string;
    certificateLink: string;
    skills: Skill[];
    createdAt: string;
    updatedAt: string;
}

export interface Project {
    id: string;
    title: string;
    slug: string;
    description: string;
    type: string;
    githubUrl: string;
    liveUrl: string;
    content: string;
    published: boolean;
    highlighted: boolean;
    publishedAt: string;
    year: number;
    coverImage: string;
    contentImages: string[];
    skills: Skill[];
    projectTags: ProjectTag[];
    createdAt: string;
    updatedAt: string;
}

export interface ProjectTag {
    id: string;
    projectId: string;
    tagId: number;
    createdAt: string;
    tag: Tag;
}

export interface ApiResponse<T> {
    success: boolean;
    data: T;
    error?: string;
}

export interface PaginatedMeta {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface PaginatedApiResponse<T> {
    success: boolean;
    data: T;
    meta: PaginatedMeta;
    error?: string;
}
