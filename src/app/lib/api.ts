import { projectId, publicAnonKey } from '/utils/supabase/info';

const API_BASE = `https://${projectId}.supabase.co/functions/v1/make-server-c5661566`;

const MAX_RETRIES = 2;
const BASE_DELAY_MS = 1000;

async function apiCall<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  let lastError: Error | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      const response = await fetch(`${API_BASE}${endpoint}`, {
        ...options,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${publicAnonKey}`,
          ...options.headers,
        },
      });

      if (!response.ok) {
        const error = await response.json().catch(() => ({ error: 'Unknown error' }));
        throw new Error(error.error || `API call failed: ${response.statusText}`);
      }

      return response.json();
    } catch (error: any) {
      lastError = error;

      // Only retry on network errors (TypeError: Failed to fetch), not on HTTP errors
      const isNetworkError = error instanceof TypeError && error.message.includes('fetch');
      if (!isNetworkError || attempt >= MAX_RETRIES) {
        throw error;
      }

      // Exponential backoff: 1s, 2s
      const delay = BASE_DELAY_MS * Math.pow(2, attempt);
      console.log(`API call to ${endpoint} failed (attempt ${attempt + 1}/${MAX_RETRIES + 1}), retrying in ${delay}ms...`);
      await new Promise((resolve) => setTimeout(resolve, delay));
    }
  }

  throw lastError || new Error('API call failed after retries');
}

export const api = {
  // Articles
  getFeed: (userId: string) =>
    apiCall<{ articles: any[]; readingCount: number; dailyLimit: number }>(
      `/articles/feed?userId=${userId}`
    ),

  saveArticle: (articleId: string, userId: string, article: any) =>
    apiCall('/articles/save', {
      method: 'POST',
      body: JSON.stringify({ articleId, userId, article }),
    }),

  getSavedArticles: (userId: string) =>
    apiCall<{ articles: any[] }>(`/articles/saved?userId=${userId}`),

  getArticle: (articleId: string, userId: string) =>
    apiCall<{ article: any }>(`/articles/${articleId}?userId=${userId}`),

  deleteArticle: (articleId: string, userId: string) =>
    apiCall<{ success: boolean }>(`/articles/${articleId}?userId=${userId}`, {
      method: 'DELETE',
    }),

  parseArticleFromURL: (url: string, userId: string) =>
    apiCall<{ article: any }>('/articles/parse-url', {
      method: 'POST',
      body: JSON.stringify({ url, userId }),
    }),

  // Highlights
  addHighlight: (articleId: string, userId: string, highlight: any) =>
    apiCall('/highlights/add', {
      method: 'POST',
      body: JSON.stringify({ articleId, userId, highlight }),
    }),

  getHighlights: (articleId: string, userId: string) =>
    apiCall<{ highlights: any[] }>(`/highlights/${articleId}?userId=${userId}`),

  deleteHighlight: (highlightId: string, userId: string) =>
    apiCall('/highlights/delete', {
      method: 'POST',
      body: JSON.stringify({ highlightId, userId }),
    }),

  // Reading progress
  incrementReading: (userId: string) =>
    apiCall<{ readingCount: number; dailyLimit: number }>('/reading/increment', {
      method: 'POST',
      body: JSON.stringify({ userId }),
    }),

  // Profile
  getProfile: (userId: string) =>
    apiCall<any>(`/profile/${userId}`),

  // Connections
  getConnectionRecommendation: (userId: string) =>
    apiCall<{
      recommendation: any | null;
      canAdd: boolean;
      remainingMs: number;
      nextAvailableAt: string | null;
    }>(`/connections/recommendation?userId=${userId}`),

  getConnections: (userId: string) =>
    apiCall<{ connections: any[] }>(`/connections/list?userId=${userId}`),

  addConnection: (userId: string, targetUser: any) =>
    apiCall<{ success: boolean; connection: any; nextAvailableAt: string }>(
      '/connections/add',
      {
        method: 'POST',
        body: JSON.stringify({ userId, targetUser }),
      }
    ),

  getConnectionDetail: (userId: string, connectionUserId: string) =>
    apiCall<any>(`/connections/detail?userId=${userId}&connectionUserId=${connectionUserId}`),

  // Notifications
  getNotifications: (userId: string) =>
    apiCall<{ notifications: any[]; unreadCount: number }>(
      `/notifications/list?userId=${userId}`
    ),

  markNotificationRead: (userId: string, notificationId: string) =>
    apiCall<{ success: boolean; unreadCount: number }>(
      '/notifications/mark-read',
      {
        method: 'POST',
        body: JSON.stringify({ userId, notificationId }),
      }
    ),

  markAllNotificationsRead: (userId: string) =>
    apiCall<{ success: boolean; unreadCount: number }>(
      '/notifications/mark-all-read',
      {
        method: 'POST',
        body: JSON.stringify({ userId }),
      }
    ),
};