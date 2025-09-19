// Simple in-memory + localStorage backed entities for demo purposes
export type KeyEntity = { name: string; type: string; confidence?: number };
export type ArticleType = {
  id: string;
  title: string;
  content: string;
  summary?: string;
  source_url?: string;
  author?: string;
  published_date?: string; // ISO date
  created_date?: string; // ISO date
  topics?: string[];
  sentiment?: 'positive' | 'negative' | 'neutral';
  credibility_score?: number; // 0-100
  key_entities?: KeyEntity[];
  reading_time?: number; // minutes
  image_url?: string;
  audio_url?: string;
};

export type UserProfileType = {
  id: string;
  preferred_topics?: string[];
  reading_preferences?: {
    audio_enabled?: boolean;
    summary_length?: 'short' | 'medium' | 'long';
    language?: string;
    notification_frequency?: 'daily' | 'weekly' | 'off';
  };
  created_by: string; // user email
};

export type BookmarkedArticleType = {
  id: string;
  article_id: string;
  created_by: string; // user email
  notes?: string;
};

const LS_PREFIX = 'intellweave_';
function load<T>(key: string, fallback: T): T {
  try {
    const raw = localStorage.getItem(LS_PREFIX + key);
    return raw ? JSON.parse(raw) as T : fallback;
  } catch {
    return fallback;
  }
}
function save<T>(key: string, value: T) {
  localStorage.setItem(LS_PREFIX + key, JSON.stringify(value));
}

function genId(prefix: string) {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2,8)}`;
}

// Backend API client
import api from '@/api/client';

export const Article = {
  async list(sort?: string, limit?: number): Promise<ArticleType[]> {
    try {
      // Prefer personalized feed; fallback to recent
      try {
        const items = await api.get<ArticleType[]>(`/feed/personalized?limit=${limit || 50}`);
        return items;
      } catch {}
      const items = await api.get<ArticleType[]>(`/feed/recent?limit=${limit || 50}`);
      return items;
    } catch {
      // fallback to local
      let items = load<ArticleType[]>('articles', []);
      if (sort) {
        if (sort === '-created_date') items = [...items].sort((a,b)=> (new Date(b.created_date || b.published_date || 0).getTime()) - (new Date(a.created_date || a.published_date || 0).getTime()));
        if (sort === '-credibility_score') items = [...items].sort((a,b)=> (b.credibility_score||0)-(a.credibility_score||0));
      }
      if (limit) return items.slice(0, limit);
      return items;
    }
  },
  async get(id: string): Promise<ArticleType | undefined> {
    try {
      return await api.get<ArticleType>(`/article/${encodeURIComponent(id)}`);
    } catch {
      const items = load<ArticleType[]>('articles', []);
      return items.find(a=>a.id===id);
    }
  },
  async create(data: Omit<ArticleType, 'id' | 'created_date'>): Promise<ArticleType> {
    try {
      const created = await api.post<ArticleType>(`/article/`, {
        title: data.title,
        content: data.content,
        author: data.author,
        source_url: data.source_url,
      });
      return created;
    } catch {
      const items = load<ArticleType[]>('articles', []);
      const item: ArticleType = { id: genId('art'), created_date: new Date().toISOString(), ...data } as any;
      items.unshift(item);
      save('articles', items);
      return item;
    }
  }
};

export const UserProfile = {
  async filter(query: Partial<Pick<UserProfileType, 'created_by'>>): Promise<UserProfileType[]> {
    try {
      const userId = (query.created_by || '').split('@')[0] || 'u_demo';
      const prof = await api.get<UserProfileType | null>(`/profiles/${encodeURIComponent(userId)}`);
      return prof ? [prof] : [];
    } catch {
      const items = load<UserProfileType[]>('user_profiles', []);
      if (query.created_by) return items.filter(p=>p.created_by===query.created_by);
      return items;
    }
  },
  async update(id: string, patch: Partial<UserProfileType>): Promise<UserProfileType> {
    try {
      const updated = await api.post<UserProfileType>(`/profiles/${encodeURIComponent(id)}`, patch);
      return updated;
    } catch {
      const items = load<UserProfileType[]>('user_profiles', []);
      const idx = items.findIndex(p=>p.id===id);
      if (idx>=0) {
        items[idx] = { ...items[idx], ...patch } as UserProfileType;
        save('user_profiles', items);
        return items[idx];
      }
      throw new Error('profile not found');
    }
  },
  async create(data: Omit<UserProfileType, 'id' | 'created_by'> & { created_by?: string }): Promise<UserProfileType> {
    try {
      const userId = (data.created_by || 'guest@example.com').split('@')[0] || 'u_demo';
      const created = await api.post<UserProfileType>(`/profiles/${encodeURIComponent(userId)}`, { preferred_topics: data.preferred_topics || [] });
      return created;
    } catch {
      const items = load<UserProfileType[]>('user_profiles', []);
      const created_by = data.created_by || 'guest@example.com';
      const item: UserProfileType = { id: genId('prof'), created_by, preferred_topics: [], ...data } as UserProfileType;
      items.push(item);
      save('user_profiles', items);
      return item;
    }
  }
};

export const BookmarkedArticle = {
  async filter(query: Partial<Pick<BookmarkedArticleType, 'created_by'>>): Promise<BookmarkedArticleType[]> {
    try {
      const userId = (query.created_by || '').split('@')[0] || 'u_demo';
      const arts = await api.get<ArticleType[]>(`/bookmarks?user_id=${encodeURIComponent(userId)}`);
      return arts.map(a => ({ id: genId('bm'), article_id: a.id, created_by: query.created_by || 'guest@example.com' }));
    } catch {
      const items = load<BookmarkedArticleType[]>('bookmarks', []);
      if (query.created_by) return items.filter(b=>b.created_by===query.created_by);
      return items;
    }
  },
  async create(data: Omit<BookmarkedArticleType, 'id' | 'created_by'> & { created_by?: string }): Promise<BookmarkedArticleType> {
    try {
      const userId = (data.created_by || 'guest@example.com').split('@')[0] || 'u_demo';
      await api.post(`/bookmarks?user_id=${encodeURIComponent(userId)}&article_id=${encodeURIComponent(data.article_id)}`);
      return { id: genId('bm'), article_id: data.article_id, created_by: data.created_by || 'guest@example.com' } as BookmarkedArticleType;
    } catch {
      const items = load<BookmarkedArticleType[]>('bookmarks', []);
      const created_by = data.created_by || 'guest@example.com';
      if (items.some(b=>b.created_by===created_by && b.article_id===data.article_id)) {
        return items.find(b=>b.created_by===created_by && b.article_id===data.article_id)!;
      }
      const item: BookmarkedArticleType = { id: genId('bm'), created_by, notes: '', ...data } as BookmarkedArticleType;
      items.unshift(item);
      save('bookmarks', items);
      return item;
    }
  },
  async deleteByArticleId(article_id: string, created_by: string): Promise<void> {
    try {
      const userId = (created_by || 'guest@example.com').split('@')[0] || 'u_demo';
      await api.del(`/bookmarks?user_id=${encodeURIComponent(userId)}&article_id=${encodeURIComponent(article_id)}`);
    } catch {
      const items = load<BookmarkedArticleType[]>('bookmarks', []);
      const next = items.filter(b=>!(b.created_by===created_by && b.article_id===article_id));
      save('bookmarks', next);
    }
  }
};
