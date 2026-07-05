import { ApiResponse, PaginatedMeta, User, Experience, Education, Certification, Project, Skill, Tag } from '@andikas/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
const USERNAME = 'andikas';

export async function fetchUser(username: string = USERNAME, lang: string = 'en'): Promise<User | null> {
    try {
        const url = `${API_BASE_URL}/user/${username}${lang ? `?lang=${lang}` : ''}`;
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
        const res = await fetch(`${API_BASE_URL}/skills/user/${username}`, { next: { revalidate: 86400, tags: ['skills'] } });
        if (!res.ok) return [];
        const json: ApiResponse<Skill[]> = await res.json();
        return json.success ? json.data : [];
    } catch (error) {
        console.error('Error fetching skills:', error);
        return [];
    }
}

export async function fetchTags(username: string = USERNAME): Promise<Tag[]> {
    try {
        const res = await fetch(`${API_BASE_URL}/tags/user/${username}`, { next: { revalidate: 86400, tags: ['tags'] } });
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
        const url = `${API_BASE_URL}/experience/user/${username}${lang ? `?lang=${lang}` : ''}`;
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
        const url = `${API_BASE_URL}/education/user/${username}${lang ? `?lang=${lang}` : ''}`;
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
        const url = `${API_BASE_URL}/certifications/user/${username}${lang ? `?lang=${lang}` : ''}`;
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
        const url = `${API_BASE_URL}/projects/user/${username}${queryString ? `?${queryString}` : ''}`;

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
        const url = `${API_BASE_URL}/projects/user/${username}/${slug}${lang ? `?lang=${lang}` : ''}`;
        const res = await fetch(url, { next: { revalidate: 86400, tags: ['projects', `project-${slug}`] } });
        if (!res.ok) return null;
        const json: ApiResponse<Project> = await res.json();
        return json.success ? json.data : null;
    } catch (error) {
        console.error(`Error fetching project ${slug}:`, error);
        return null;
    }
}
