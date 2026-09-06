import { ApiResponse, PaginatedMeta, User, Experience, Education, Certification, Project, Skill, Tag } from '@andikas/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
const USERNAME = (process.env.NEXT_PUBLIC_USERNAME || process.env.NEXT_PUBLIC_MEDIA_PREFIX || '').trim();

export async function fetchUser(username: string = USERNAME, lang: string = 'en'): Promise<User | null> {
    try {
        const path = username ? `/user/${username}` : '/user';
        const url = `${API_BASE_URL}${path}${lang ? `?lang=${lang}` : ''}`;
        const res = await fetch(url, { next: { revalidate: 86400, tags: ['user'] } });
        if (!res.ok) return null;
        const json: ApiResponse<User> = await res.json();
        return json.success ? json.data : null;
    } catch (error) {
        console.error('Error fetching user:', error);
        return null;
    }
}

export async function fetchSkills(username: string = USERNAME): Promise<Skill[]> {
    try {
        const path = username ? `/skills/user/${username}` : '/skills';
        const res = await fetch(`${API_BASE_URL}${path}`, { next: { revalidate: 86400, tags: ['skills'] } });
        if (!res.ok) return [];
        const json: ApiResponse<Skill[]> = await res.json();
        return json.success ? json.data : [];
    } catch (error) {
        console.error('Error fetching skills:', error);
        return [];
    }
}

export async function fetchTags(username: string = USERNAME, type: string = 'project'): Promise<Tag[]> {
    try {
        const path = username ? `/tags/user/${username}` : '/tags';
        const url = `${API_BASE_URL}${path}${type ? `?type=${type}` : ''}`;
        const res = await fetch(url, { next: { revalidate: 86400, tags: ['tags'] } });
        if (!res.ok) return [];
        const json: ApiResponse<Tag[]> = await res.json();
        return json.success ? json.data : [];
    } catch (error) {
        console.error('Error fetching tags:', error);
        return [];
    }
}

export async function fetchExperience(username: string = USERNAME, lang: string = 'en'): Promise<Experience[]> {
    try {
        const path = username ? `/experience/user/${username}` : '/experience';
        const url = `${API_BASE_URL}${path}${lang ? `?lang=${lang}` : ''}`;
        const res = await fetch(url, { next: { revalidate: 86400, tags: ['experience'] } });
        if (!res.ok) return [];
        const json: ApiResponse<Experience[]> = await res.json();
        return json.success ? json.data : [];
    } catch (error) {
        console.error('Error fetching experience:', error);
        return [];
    }
}

export async function fetchEducation(username: string = USERNAME, lang: string = 'en'): Promise<Education[]> {
    try {
        const path = username ? `/education/user/${username}` : '/education';
        const url = `${API_BASE_URL}${path}${lang ? `?lang=${lang}` : ''}`;
        const res = await fetch(url, { next: { revalidate: 86400, tags: ['education'] } });
        if (!res.ok) return [];
        const json: ApiResponse<Education[]> = await res.json();
        return json.success ? json.data : [];
    } catch (error) {
        console.error('Error fetching education:', error);
        return [];
    }
}

export async function fetchCertifications(username: string = USERNAME, lang: string = 'en'): Promise<Certification[]> {
    try {
        const path = username ? `/certifications/user/${username}` : '/certifications';
        const url = `${API_BASE_URL}${path}${lang ? `?lang=${lang}` : ''}`;
        const res = await fetch(url, { next: { revalidate: 86400, tags: ['certifications'] } });
        if (!res.ok) return [];
        const json: ApiResponse<Certification[]> = await res.json();
        return json.success ? json.data : [];
    } catch (error) {
        console.error('Error fetching certifications:', error);
        return [];
    }
}

export interface ProjectSearchParams {
    page?: number;
    limit?: number;
    published?: boolean;
    highlighted?: boolean;
    search?: string;
    tag?: number;
}

export async function fetchProjects(username: string = USERNAME, params?: ProjectSearchParams, lang: string = 'en'): Promise<{ data: Project[], meta?: PaginatedMeta }> {
    try {
        const urlParams = new URLSearchParams();
        if (params?.page) urlParams.append('page', params.page.toString());
        if (params?.limit) urlParams.append('limit', params.limit.toString());
        if (params?.published !== undefined) urlParams.append('published', params.published.toString());
        if (params?.highlighted !== undefined) urlParams.append('highlighted', params.highlighted.toString());
        if (params?.search) urlParams.append('search', params.search);
        if (params?.tag) urlParams.append('tag', params.tag.toString());
        if (lang) urlParams.append('lang', lang);

        const queryString = urlParams.toString();
        const path = username ? `/projects/user/${username}` : '/projects';
        const url = `${API_BASE_URL}${path}${queryString ? `?${queryString}` : ''}`;

        const res = await fetch(url, { next: { revalidate: 86400, tags: ['projects'] } });
        if (!res.ok) return { data: [] };
        const json = await res.json();
        if (!json.success) return { data: [] };

        if (json.meta) {
            return { data: json.data as Project[], meta: json.meta as PaginatedMeta };
        }

        return { data: json.data as Project[] };
    } catch (error) {
        console.error('Error fetching projects:', error);
        return { data: [] };
    }
}

export async function fetchProjectBySlug(slug: string, username: string = USERNAME, lang: string = 'en'): Promise<Project | null> {
    try {
        const path = username ? `/projects/user/${username}/${slug}` : `/projects/${slug}`;
        const url = `${API_BASE_URL}${path}${lang ? `?lang=${lang}` : ''}`;
        const res = await fetch(url, { next: { revalidate: 86400, tags: ['projects', `project-${slug}`] } });
        if (!res.ok) return null;
        const json: ApiResponse<Project> = await res.json();
        return json.success ? json.data : null;
    } catch (error) {
        console.error(`Error fetching project ${slug}:`, error);
        return null;
    }
}
