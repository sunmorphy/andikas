import { ApiResponse, PaginatedApiResponse, Article, Tag } from '@andikas/types';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000/api';
const USERNAME = (process.env.NEXT_PUBLIC_USERNAME || process.env.NEXT_PUBLIC_MEDIA_PREFIX || '').trim();

export async function fetchArticles(
  options: { page?: number; limit?: number; search?: string; tag?: number } = {},
  lang: string = 'en'
): Promise<PaginatedApiResponse<Article[]>> {
  try {
    const params = new URLSearchParams();
    if (lang) params.set('lang', lang);
    if (options.page) params.set('page', String(options.page));
    if (options.limit) params.set('limit', String(options.limit));
    if (options.search) params.set('search', options.search);
    if (options.tag) params.set('tag', String(options.tag));

    const path = USERNAME ? `/articles/user/${USERNAME}` : '/articles';
    const url = `${API_BASE_URL}${path}?${params.toString()}`;
    const res = await fetch(url, {
      next: { revalidate: 86400, tags: ['articles'] },
    });

    if (!res.ok) {
      return {
        success: false,
        data: [],
        meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
      };
    }

    const json = await res.json();
    return json;
  } catch (error) {
    console.error('Error fetching articles:', error);
    return {
      success: false,
      data: [],
      meta: { total: 0, page: 1, limit: 10, totalPages: 0 },
    };
  }
}

export async function fetchArticleBySlug(
  slug: string,
  lang: string = 'en'
): Promise<Article | null> {
  try {
    const path = USERNAME ? `/articles/user/${USERNAME}/${slug}` : `/articles/${slug}`;
    const url = `${API_BASE_URL}${path}${lang ? `?lang=${lang}` : ''}`;
    const res = await fetch(url, {
      next: { revalidate: 86400, tags: ['articles', `article-${slug}`] },
    });

    if (!res.ok) return null;
    const json: ApiResponse<Article> = await res.json();
    return json.success ? json.data : null;
  } catch (error) {
    console.error(`Error fetching article [${slug}]:`, error);
    return null;
  }
}

export async function fetchTags(type: string = 'writing'): Promise<Tag[]> {
  try {
    const path = USERNAME ? `/tags/user/${USERNAME}` : '/tags';
    const url = `${API_BASE_URL}${path}${type ? `?type=${type}` : ''}`;
    const res = await fetch(url, {
      next: { revalidate: 86400, tags: ['tags'] },
    });

    if (!res.ok) return [];
    const json: ApiResponse<Tag[]> = await res.json();
    return json.success ? json.data : [];
  } catch (error) {
    console.error('Error fetching tags:', error);
    return [];
  }
}
