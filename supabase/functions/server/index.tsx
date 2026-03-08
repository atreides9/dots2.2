import { Hono } from "npm:hono";
import { cors } from "npm:hono/cors";
import { logger } from "npm:hono/logger";
import * as kv from "./kv_store.tsx";

const app = new Hono();

// Enable logger
app.use('*', logger(console.log));

// Enable CORS for all routes and methods
app.use(
  "/*",
  cors({
    origin: "*",
    allowHeaders: ["Content-Type", "Authorization"],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    exposeHeaders: ["Content-Length"],
    maxAge: 600,
  }),
);

// Health check endpoint
app.get("/make-server-c5661566/health", (c) => {
  return c.json({ status: "ok" });
});

// Get curated article feed
app.get("/make-server-c5661566/articles/feed", async (c) => {
  try {
    const userId = c.req.query("userId") || "default";
    const todayKey = `articles:feed:v2:${new Date().toISOString().split('T')[0]}`;
    
    // Check if today's feed is cached
    let feed = await kv.get(todayKey);
    
    if (!feed) {
      // Generate fresh feed with sample articles
      feed = generateDailyFeed();
      await kv.set(todayKey, feed);
    }
    
    // Get user's reading count for today
    const readingKey = `user:${userId}:reading:${new Date().toISOString().split('T')[0]}`;
    const readingCount = await kv.get(readingKey) || 0;
    
    return c.json({ 
      articles: feed,
      readingCount,
      dailyLimit: 5
    });
  } catch (error) {
    console.log(`Error fetching feed: ${error}`);
    return c.json({ error: "Failed to fetch feed" }, 500);
  }
});

// Save/bookmark an article
app.post("/make-server-c5661566/articles/save", async (c) => {
  try {
    const body = await c.req.json();
    const { articleId, userId, article } = body;
    
    if (!articleId || !userId) {
      return c.json({ error: "Missing required fields" }, 400);
    }
    
    const saveKey = `user:${userId}:saved:${articleId}`;
    await kv.set(saveKey, {
      ...article,
      savedAt: new Date().toISOString()
    });
    
    // Update saved articles list
    const savedListKey = `user:${userId}:saved:list`;
    let savedList = await kv.get(savedListKey) || [];
    if (!savedList.includes(articleId)) {
      savedList = [articleId, ...savedList];
      await kv.set(savedListKey, savedList);
    }
    
    return c.json({ success: true });
  } catch (error) {
    console.log(`Error saving article: ${error}`);
    return c.json({ error: "Failed to save article" }, 500);
  }
});

// Get user's saved articles
app.get("/make-server-c5661566/articles/saved", async (c) => {
  try {
    const userId = c.req.query("userId") || "default";
    const savedListKey = `user:${userId}:saved:list`;
    const savedList = await kv.get(savedListKey) || [];
    
    // Fetch all saved articles
    const articles = [];
    for (const articleId of savedList) {
      const saveKey = `user:${userId}:saved:${articleId}`;
      const article = await kv.get(saveKey);
      if (article) {
        articles.push(article);
      }
    }
    
    // If no articles saved yet, return pre-populated mock saved articles
    if (articles.length === 0) {
      return c.json({ articles: generateMockSavedArticles() });
    }
    
    return c.json({ articles });
  } catch (error) {
    console.log(`Error fetching saved articles: ${error}`);
    return c.json({ error: "Failed to fetch saved articles" }, 500);
  }
});

// Get a single article by ID
app.get("/make-server-c5661566/articles/:articleId", async (c) => {
  try {
    const articleId = c.req.param("articleId");
    const userId = c.req.query("userId") || "default";
    
    if (!articleId) {
      return c.json({ error: "Missing articleId" }, 400);
    }

    // Try to get from saved articles first
    const saveKey = `user:${userId}:saved:${articleId}`;
    let article = await kv.get(saveKey);

    // If not found in saved, check if it's in the daily feed
    if (!article) {
      const todayKey = `articles:feed:v2:${new Date().toISOString().split('T')[0]}`;
      const feed = await kv.get(todayKey);
      if (feed) {
        article = feed.find((a: any) => a.id === articleId);
      }
    }

    if (!article) {
      return c.json({ error: "Article not found" }, 404);
    }

    return c.json({ article });
  } catch (error) {
    console.log(`Error fetching article: ${error}`);
    return c.json({ error: "Failed to fetch article" }, 500);
  }
});

// Delete a saved article
app.delete("/make-server-c5661566/articles/:articleId", async (c) => {
  try {
    const articleId = c.req.param("articleId");
    const userId = c.req.query("userId") || "default";
    
    if (!articleId || !userId) {
      return c.json({ error: "Missing required parameters" }, 400);
    }

    // Remove from saved articles
    const saveKey = `user:${userId}:saved:${articleId}`;
    await kv.del(saveKey);
    
    // Update saved articles list
    const savedListKey = `user:${userId}:saved:list`;
    let savedList = await kv.get(savedListKey) || [];
    savedList = savedList.filter((id: string) => id !== articleId);
    await kv.set(savedListKey, savedList);

    // Also delete associated highlights
    const highlightKey = `user:${userId}:article:${articleId}:highlights`;
    await kv.del(highlightKey);

    console.log(`Successfully deleted article ${articleId} for user ${userId}`);

    return c.json({ success: true });
  } catch (error) {
    console.log(`Error deleting article: ${error}`);
    return c.json({ error: "Failed to delete article" }, 500);
  }
});

// Parse article from URL
app.post("/make-server-c5661566/articles/parse-url", async (c) => {
  try {
    const body = await c.req.json();
    const { url, userId } = body;
    
    if (!url || !userId) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    console.log(`Parsing article from URL: ${url}`);

    // Validate URL format
    let parsedUrl;
    try {
      parsedUrl = new URL(url);
    } catch (urlError) {
      console.log(`Invalid URL format: ${urlError}`);
      return c.json({
        error: "Invalid URL",
        details: "올바른 URL 형식이 아닙니다. https:// 로 시작하는 전체 URL을 입력해주세요."
      }, 400);
    }

    // Check for supported protocols
    if (!['http:', 'https:'].includes(parsedUrl.protocol)) {
      return c.json({
        error: "Unsupported protocol",
        details: "HTTP 또는 HTTPS 프로토콜만 지원됩니다."
      }, 400);
    }

    // Fetch the page with timeout
    let response;
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout

      response = await fetch(url, {
        signal: controller.signal,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'Accept-Language': 'ko-KR,ko;q=0.9,en-US;q=0.8,en;q=0.7',
          'Cache-Control': 'no-cache',
          'Pragma': 'no-cache',
        },
        redirect: 'follow',
      });

      clearTimeout(timeoutId);
    } catch (fetchError: any) {
      console.log(`Error fetching URL: ${fetchError}`);
      
      // Provide specific error messages
      let errorDetails = '다시 시도해주세요.';
      
      if (fetchError.name === 'AbortError') {
        errorDetails = '요청 시간이 초과되었습니다. 페이지가 응답하지 않거나 너무 느립니다.';
      } else if (fetchError.message.includes('ENOTFOUND') || fetchError.message.includes('getaddrinfo')) {
        errorDetails = '도메인을 찾을 수 없습니다. URL을 확인해주세요.';
      } else if (fetchError.message.includes('ECONNREFUSED')) {
        errorDetails = '서버가 연결을 거부했습니다. 사이트가 작동 중인지 확인해주세요.';
      } else if (fetchError.message.includes('certificate') || fetchError.message.includes('SSL')) {
        errorDetails = 'SSL 인증서 오류입니다. 사이트의 보안 설정을 확인해주세요.';
      } else if (fetchError.message.includes('CORS')) {
        errorDetails = 'CORS 정책으로 인해 접근할 수 없습니다. 다른 URL을 시도해주세요.';
      } else {
        errorDetails = `네트워크 오류: ${fetchError.message}`;
      }
      
      return c.json({ 
        error: "Failed to fetch URL", 
        details: errorDetails
      }, 500);
    }

    if (!response.ok) {
      console.log(`HTTP error: ${response.status} ${response.statusText}`);
      
      let errorDetails = '';
      switch (response.status) {
        case 403:
          errorDetails = '접근이 거부되었습니다. 사이트에서 자동 접근을 차단하고 있습니다.';
          break;
        case 404:
          errorDetails = '페이지를 찾을 수 없습니다. URL을 확인해주세요.';
          break;
        case 429:
          errorDetails = '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.';
          break;
        case 500:
        case 502:
        case 503:
          errorDetails = '사이트 서버에 문제가 있습니다. 나중에 다시 시도해주세요.';
          break;
        default:
          errorDetails = `HTTP ${response.status}: ${response.statusText}`;
      }
      
      return c.json({ 
        error: "Failed to fetch URL", 
        details: errorDetails
      }, response.status >= 500 ? 500 : 400);
    }

    let html;
    try {
      html = await response.text();
      console.log(`Successfully fetched HTML (${html.length} characters)`);
      
      if (html.length < 100) {
        return c.json({
          error: "Invalid page content",
          details: "페이지 내용이 너무 짧습니다. 올바른 웹페이지인지 확인해주세요."
        }, 400);
      }
    } catch (textError: any) {
      console.log(`Error reading response text: ${textError}`);
      return c.json({ 
        error: "Failed to read page content", 
        details: `응답을 읽을 수 없습니다: ${textError.message}` 
      }, 500);
    }
    
    // Extract metadata
    let metadata;
    try {
      metadata = extractMetadata(html, url);
      console.log(`Extracted metadata: title="${metadata.title}", author="${metadata.author}"`);
    } catch (metadataError) {
      console.log(`Error extracting metadata: ${metadataError}`);
      return c.json({ 
        error: "Failed to extract metadata", 
        details: metadataError.message 
      }, 500);
    }
    
    if (!metadata.title) {
      console.log('No title found in metadata');
      return c.json({ 
        error: 'Could not extract article title',
        details: '페이지에서 제목을 찾을 수 없습니다. 다른 URL을 시도해보세요.' 
      }, 400);
    }

    // Generate article ID
    const articleId = `parsed-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    // Determine platform from URL
    const platform = getPlatformFromURL(url);
    
    const article = {
      id: articleId,
      title: metadata.title,
      author: metadata.author || '알 수 없음',
      platform: platform.name,
      platformIcon: platform.icon,
      topics: metadata.topics || ['일반'],
      readTime: estimateReadTime(metadata.content || metadata.description || ''),
      thumbnail: metadata.image,
      excerpt: metadata.description || metadata.content?.substring(0, 150) + '...',
      content: metadata.content || metadata.description,
      url: url,
      addedAt: new Date().toISOString(),
    };

    // Save to user's library
    const saveKey = `user:${userId}:saved:${articleId}`;
    await kv.set(saveKey, {
      ...article,
      savedAt: new Date().toISOString()
    });
    
    // Update saved articles list
    const savedListKey = `user:${userId}:saved:list`;
    let savedList = await kv.get(savedListKey) || [];
    if (!savedList.includes(articleId)) {
      savedList = [articleId, ...savedList];
      await kv.set(savedListKey, savedList);
    }

    console.log(`Successfully parsed and saved article: ${article.title}`);

    return c.json({ article });
  } catch (error: any) {
    console.log(`Unexpected error parsing article from URL: ${error}`);
    console.log(`Error stack: ${error.stack}`);
    return c.json({ 
      error: "Failed to parse article", 
      details: error.message || '알 수 없는 오류가 발생했습니다.' 
    }, 500);
  }
});

// Add/update highlight
app.post("/make-server-c5661566/highlights/add", async (c) => {
  try {
    const body = await c.req.json();
    const { articleId, userId, highlight } = body;
    
    if (!articleId || !userId || !highlight) {
      return c.json({ error: "Missing required fields" }, 400);
    }
    
    const highlightKey = `user:${userId}:article:${articleId}:highlights`;
    let highlights = await kv.get(highlightKey) || [];
    
    highlights = [{
      id: `highlight-${Date.now()}`,
      ...highlight,
      createdAt: new Date().toISOString()
    }, ...highlights];
    
    await kv.set(highlightKey, highlights);
    
    return c.json({ success: true, highlights });
  } catch (error) {
    console.log(`Error adding highlight: ${error}`);
    return c.json({ error: "Failed to add highlight" }, 500);
  }
});

// Get article highlights
app.get("/make-server-c5661566/highlights/:articleId", async (c) => {
  try {
    const articleId = c.req.param("articleId");
    const userId = c.req.query("userId") || "default";
    
    const highlightKey = `user:${userId}:article:${articleId}:highlights`;
    const highlights = await kv.get(highlightKey) || [];
    
    return c.json({ highlights });
  } catch (error) {
    console.log(`Error fetching highlights: ${error}`);
    return c.json({ error: "Failed to fetch highlights" }, 500);
  }
});

// Delete a highlight
app.post("/make-server-c5661566/highlights/delete", async (c) => {
  try {
    const body = await c.req.json();
    const { highlightId, userId } = body;
    
    if (!highlightId || !userId) {
      return c.json({ error: "Missing required fields" }, 400);
    }
    
    // Find and delete the highlight from all articles
    const savedListKey = `user:${userId}:saved:list`;
    const savedList = await kv.get(savedListKey) || [];
    
    for (const articleId of savedList) {
      const highlightKey = `user:${userId}:article:${articleId}:highlights`;
      let highlights = await kv.get(highlightKey) || [];
      const originalLength = highlights.length;
      
      highlights = highlights.filter((h: any) => h.id !== highlightId);
      
      if (highlights.length !== originalLength) {
        await kv.set(highlightKey, highlights);
        return c.json({ success: true });
      }
    }
    
    return c.json({ error: "Highlight not found" }, 404);
  } catch (error) {
    console.log(`Error deleting highlight: ${error}`);
    return c.json({ error: "Failed to delete highlight" }, 500);
  }
});

// Increment reading count
app.post("/make-server-c5661566/reading/increment", async (c) => {
  try {
    const body = await c.req.json();
    const { userId } = body;
    
    if (!userId) {
      return c.json({ error: "Missing userId" }, 400);
    }
    
    const readingKey = `user:${userId}:reading:${new Date().toISOString().split('T')[0]}`;
    const currentCount = await kv.get(readingKey) || 0;
    const newCount = currentCount + 1;
    
    await kv.set(readingKey, newCount);
    
    return c.json({ readingCount: newCount, dailyLimit: 5 });
  } catch (error) {
    console.log(`Error incrementing reading count: ${error}`);
    return c.json({ error: "Failed to increment reading count" }, 500);
  }
});

// Get user profile/stats
app.get("/make-server-c5661566/profile/:userId", async (c) => {
  try {
    const userId = c.req.param("userId");
    
    const profileKey = `user:${userId}:profile`;
    let profile = await kv.get(profileKey);
    
    if (!profile) {
      // Create default profile
      profile = {
        userId,
        displayName: "Reader",
        bio: "독서를 사랑하는 사람",
        avatar: null,
        joinedAt: new Date().toISOString()
      };
      await kv.set(profileKey, profile);
    }
    
    // Get stats
    const savedListKey = `user:${userId}:saved:list`;
    const savedList = await kv.get(savedListKey) || [];
    
    // Count total highlights
    let totalHighlights = 0;
    for (const articleId of savedList) {
      const highlightKey = `user:${userId}:article:${articleId}:highlights`;
      const highlights = await kv.get(highlightKey) || [];
      totalHighlights += highlights.length;
    }
    
    return c.json({
      ...profile,
      stats: {
        savedArticles: savedList.length,
        totalHighlights
      }
    });
  } catch (error) {
    console.log(`Error fetching profile: ${error}`);
    return c.json({ error: "Failed to fetch profile" }, 500);
  }
});

// ====== Connections ======

// Pool of mock recommended users
const MOCK_USERS_POOL = [
  {
    userId: 'rec-user-001',
    displayName: '심층독서가',
    bio: '깊이 있는 독서를 사랑합니다',
    sharedTopics: ['디자인 철학', '행동경제학', '인지심리'],
    overlapPercentage: 72,
    recentReads: ['느린 사고가 만드는 깊이 있는 디자인', '넛지 디자인: 선택을 설계하는 기술'],
    readingStreak: 14,
    totalSaved: 47,
  },
  {
    userId: 'rec-user-002',
    displayName: '의미찾기',
    bio: '글 속에서 의미를 찾는 시간이 좋아요',
    sharedTopics: ['인지심리', '학습 이론'],
    overlapPercentage: 68,
    recentReads: ['시스템 1과 시스템 2 사이에서', '좋은 질문이 좋은 답보다 중요한 이유'],
    readingStreak: 7,
    totalSaved: 32,
  },
  {
    userId: 'rec-user-003',
    displayName: '느린산책자',
    bio: '천천히 걸으며 읽는 사람',
    sharedTopics: ['창의성', '글쓰기', '디자인 철학'],
    overlapPercentage: 64,
    recentReads: ['창의성은 제약에서 시작된다', '읽기와 쓰기, 그리고 생각하기'],
    readingStreak: 21,
    totalSaved: 63,
  },
  {
    userId: 'rec-user-004',
    displayName: '생각정원사',
    bio: '생각의 씨앗을 심고 가꿉니다',
    sharedTopics: ['시스템 사고', '비판적 사고', '제품 사고'],
    overlapPercentage: 61,
    recentReads: ['복잡계와 시스템 사고의 즐거움', '사용자를 이해한다는 것의 의미'],
    readingStreak: 9,
    totalSaved: 28,
  },
  {
    userId: 'rec-user-005',
    displayName: '조용한관찰자',
    bio: '관찰하고 기록하는 것을 좋아합니다',
    sharedTopics: ['UX 리서치', '인지심리', '제품 사고'],
    overlapPercentage: 70,
    recentReads: ['인지 부하를 줄이는 인터페이스 디자인', '주의력의 경제학'],
    readingStreak: 12,
    totalSaved: 41,
  },
];

// Get connection recommendation (1 person)
app.get("/make-server-c5661566/connections/recommendation", async (c) => {
  try {
    const userId = c.req.query("userId") || "default";

    // Get existing connections to exclude them
    const connectionsKey = `user:${userId}:connections:list`;
    const connections = await kv.get(connectionsKey) || [];
    const connectedIds = connections.map((conn: any) => conn.userId);

    // Get cooldown info
    const cooldownKey = `user:${userId}:connections:lastAdded`;
    const lastAdded = await kv.get(cooldownKey);
    const now = Date.now();
    const cooldownMs = 3 * 24 * 60 * 60 * 1000; // 3 days
    const canAdd = !lastAdded || (now - lastAdded) >= cooldownMs;
    const remainingMs = lastAdded ? Math.max(0, cooldownMs - (now - lastAdded)) : 0;

    // Pick a recommendation not already connected
    const available = MOCK_USERS_POOL.filter(u => !connectedIds.includes(u.userId));
    
    // Deterministic pick based on day — changes every 3 days
    const dayIndex = Math.floor(now / cooldownMs);
    const recommendation = available.length > 0
      ? available[dayIndex % available.length]
      : null;

    return c.json({
      recommendation,
      canAdd,
      remainingMs,
      nextAvailableAt: lastAdded ? new Date(lastAdded + cooldownMs).toISOString() : null,
    });
  } catch (error) {
    console.log(`Error fetching connection recommendation: ${error}`);
    return c.json({ error: "Failed to fetch recommendation" }, 500);
  }
});

// Get user's connections
app.get("/make-server-c5661566/connections/list", async (c) => {
  try {
    const userId = c.req.query("userId") || "default";
    const connectionsKey = `user:${userId}:connections:list`;
    let connections = await kv.get(connectionsKey);

    // Return pre-populated mock connections if empty
    if (!connections || connections.length === 0) {
      connections = [
        {
          userId: 'conn-user-001',
          displayName: '사려깊은독자',
          sharedTopics: ['디자인 철학', '인지심리', 'UX 리서치'],
          overlapPercentage: 78,
          lastReadInCommon: '느린 사고가 만드는 깊',
          connectedAt: new Date(Date.now() - 15 * 86400000).toISOString(),
        },
        {
          userId: 'conn-user-002',
          displayName: '생각하는사람',
          sharedTopics: ['시스템 사고', '비판적 사고'],
          overlapPercentage: 65,
          lastReadInCommon: '주의력의 경제학',
          connectedAt: new Date(Date.now() - 8 * 86400000).toISOString(),
        },
        {
          userId: 'conn-user-003',
          displayName: '조용한탐구자',
          sharedTopics: ['글쓰기', '창의성', '학습 이론'],
          overlapPercentage: 58,
          lastReadInCommon: '창의성은 제약에서 시작된다',
          connectedAt: new Date(Date.now() - 4 * 86400000).toISOString(),
        },
      ];
      await kv.set(connectionsKey, connections);
    }

    return c.json({ connections });
  } catch (error) {
    console.log(`Error fetching connections list: ${error}`);
    return c.json({ error: "Failed to fetch connections" }, 500);
  }
});

// Add a connection (with 3-day cooldown)
app.post("/make-server-c5661566/connections/add", async (c) => {
  try {
    const body = await c.req.json();
    const { userId, targetUser } = body;

    if (!userId || !targetUser) {
      return c.json({ error: "Missing required fields: userId and targetUser" }, 400);
    }

    // Check cooldown
    const cooldownKey = `user:${userId}:connections:lastAdded`;
    const lastAdded = await kv.get(cooldownKey);
    const now = Date.now();
    const cooldownMs = 3 * 24 * 60 * 60 * 1000;

    if (lastAdded && (now - lastAdded) < cooldownMs) {
      const remainingMs = cooldownMs - (now - lastAdded);
      return c.json({
        error: "Cooldown active",
        remainingMs,
        nextAvailableAt: new Date(lastAdded + cooldownMs).toISOString(),
      }, 429);
    }

    // Add to connections list
    const connectionsKey = `user:${userId}:connections:list`;
    const connections = await kv.get(connectionsKey) || [];

    // Check not already connected
    if (connections.some((conn: any) => conn.userId === targetUser.userId)) {
      return c.json({ error: "Already connected with this user" }, 409);
    }

    const newConnection = {
      ...targetUser,
      connectedAt: new Date().toISOString(),
    };
    connections.unshift(newConnection);
    await kv.set(connectionsKey, connections);

    // Set cooldown timestamp
    await kv.set(cooldownKey, now);

    return c.json({
      success: true,
      connection: newConnection,
      nextAvailableAt: new Date(now + cooldownMs).toISOString(),
    });
  } catch (error) {
    console.log(`Error adding connection: ${error}`);
    return c.json({ error: "Failed to add connection" }, 500);
  }
});

// Get connection detail
app.get("/make-server-c5661566/connections/detail", async (c) => {
  try {
    const userId = c.req.query("userId");
    const connectionUserId = c.req.query("connectionUserId");

    if (!userId || !connectionUserId) {
      return c.json({ error: "Missing required parameters" }, 400);
    }

    // Find the connection in the user's connections list
    const connectionsKey = `user:${userId}:connections:list`;
    const connections = await kv.get(connectionsKey) || [];
    const connection = connections.find((conn: any) => conn.userId === connectionUserId);

    if (!connection) {
      return c.json({ error: "Connection not found" }, 404);
    }

    // Generate mock detailed data based on the connection
    const detail = {
      userId: connection.userId,
      displayName: connection.displayName,
      bio: connection.userId === 'conn-user-001' 
        ? '디자인과 인지심리의 교차점을 탐구하는 사람입니다.' 
        : connection.userId === 'conn-user-002'
        ? '복잡한 시스템을 이해하고 본질을 찾는 것을 좋아합니다.'
        : '조용히 깊이 탐구하며 배우는 것을 즐깁니다.',
      avatar: null,
      sharedTopics: connection.sharedTopics || [],
      overlapPercentage: connection.overlapPercentage || 0,
      readingStreak: Math.floor(Math.random() * 30) + 5,
      totalSaved: Math.floor(Math.random() * 100) + 20,
      connectedAt: connection.connectedAt,
      recentReads: [
        {
          articleId: 'article-1',
          title: '느린 사고가 만드는 깊이 있는 디자인',
          author: '익명',
          platform: 'Brunch',
          readAt: new Date(Date.now() - 2 * 86400000).toISOString(),
          excerpt: '디지털 시대 우리는 끊임없이 빠른 정보 소비를 강요받습니다. 그러나 진정한 이해와 통찰은 느린 사고에서 나옵니다.'
        },
        {
          articleId: 'article-2',
          title: '주의력의 경제학',
          author: '김지우',
          platform: 'Medium',
          readAt: new Date(Date.now() - 5 * 86400000).toISOString(),
          excerpt: '정보 과잉 시대, 우리의 주의력은 가장 희소한 자원이 되었습니다.'
        },
        {
          articleId: 'article-3',
          title: '창의성은 제약에서 시작된다',
          author: '박서연',
          platform: 'Brunch',
          readAt: new Date(Date.now() - 7 * 86400000).toISOString(),
          excerpt: '무한한 자유보다 적절한 제약이 더 창의적인 결과를 만들어냅니다.'
        }
      ],
      recentHighlights: [
        {
          id: 'highlight-1',
          text: '진정한 이해와 통찰은 느린 사고에서 나옵니다.',
          articleTitle: '느린 사고가 만드는 깊이 있는 디자인',
          color: 'yellow',
          createdAt: new Date(Date.now() - 2 * 86400000).toISOString()
        },
        {
          id: 'highlight-2',
          text: '우리의 주의력은 가장 희소한 자원이 되었습니다.',
          articleTitle: '주의력의 경제학',
          color: 'green',
          createdAt: new Date(Date.now() - 5 * 86400000).toISOString()
        },
        {
          id: 'highlight-3',
          text: '적절한 제약이 더 창의적인 결과를 만들어냅니다.',
          articleTitle: '창의성은 제약에서 시작된다',
          color: 'blue',
          createdAt: new Date(Date.now() - 7 * 86400000).toISOString()
        }
      ]
    };

    return c.json(detail);
  } catch (error) {
    console.log(`Error fetching connection detail: ${error}`);
    return c.json({ error: "Failed to fetch connection detail" }, 500);
  }
});

// ====== Notifications ======

// Get user notifications
app.get("/make-server-c5661566/notifications/list", async (c) => {
  try {
    const userId = c.req.query("userId") || "default";
    const notificationsKey = `user:${userId}:notifications:list`;
    let notifications = await kv.get(notificationsKey);

    // Generate mock notifications if empty
    if (!notifications || notifications.length === 0) {
      const now = Date.now();
      notifications = [
        {
          id: 'notif-001',
          type: 'new_connection',
          title: '사려깊은독자님과 연결되었어요',
          message: '디자인 철학에 관심이 비슷해요',
          icon: '👥',
          isRead: false,
          createdAt: new Date(now - 2 * 60 * 60 * 1000).toISOString(), // 2시간 전
          actionUrl: '/connections',
        },
        {
          id: 'notif-002',
          type: 'highlight_milestone',
          title: '하이라이트 10개 달성',
          message: '꾸준한 독서 습관이 빛을 발하고 있어요',
          icon: '✨',
          isRead: false,
          createdAt: new Date(now - 5 * 60 * 60 * 1000).toISOString(), // 5시간 전
          actionUrl: '/library',
        },
        {
          id: 'notif-003',
          type: 'reading_streak',
          title: '7일 연속 읽기 달성',
          message: '이 시간은 낭비가 아니에요',
          icon: '🔥',
          isRead: true,
          createdAt: new Date(now - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1일 전
          actionUrl: '/profile',
        },
        {
          id: 'notif-004',
          type: 'shared_article',
          title: '생각하는사람님도 같은 글을 읽었어요',
          message: '주의력의 경제학',
          icon: '📚',
          isRead: true,
          createdAt: new Date(now - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2일 전
          actionUrl: '/library',
        },
        {
          id: 'notif-005',
          type: 'new_recommendation',
          title: '새로운 추천인을 찾았어요',
          message: '취향이 비슷한 독서인을 만나보세요',
          icon: '💫',
          isRead: true,
          createdAt: new Date(now - 3 * 24 * 60 * 60 * 1000).toISOString(), // 3일 전
          actionUrl: '/connections',
        },
      ];
      await kv.set(notificationsKey, notifications);
    }

    // Count unread
    const unreadCount = notifications.filter((n: any) => !n.isRead).length;

    return c.json({
      notifications: notifications.slice(0, 10), // Miller's Law: 최대 10개만
      unreadCount,
    });
  } catch (error) {
    console.log(`Error fetching notifications: ${error}`);
    return c.json({ error: "Failed to fetch notifications" }, 500);
  }
});

// Mark notification as read
app.post("/make-server-c5661566/notifications/mark-read", async (c) => {
  try {
    const body = await c.req.json();
    const { userId, notificationId } = body;

    if (!userId || !notificationId) {
      return c.json({ error: "Missing required fields" }, 400);
    }

    const notificationsKey = `user:${userId}:notifications:list`;
    let notifications = await kv.get(notificationsKey) || [];

    // Mark as read
    notifications = notifications.map((n: any) =>
      n.id === notificationId ? { ...n, isRead: true } : n
    );

    await kv.set(notificationsKey, notifications);

    const unreadCount = notifications.filter((n: any) => !n.isRead).length;

    return c.json({ success: true, unreadCount });
  } catch (error) {
    console.log(`Error marking notification as read: ${error}`);
    return c.json({ error: "Failed to mark notification as read" }, 500);
  }
});

// Mark all notifications as read
app.post("/make-server-c5661566/notifications/mark-all-read", async (c) => {
  try {
    const body = await c.req.json();
    const { userId } = body;

    if (!userId) {
      return c.json({ error: "Missing userId" }, 400);
    }

    const notificationsKey = `user:${userId}:notifications:list`;
    let notifications = await kv.get(notificationsKey) || [];

    // Mark all as read
    notifications = notifications.map((n: any) => ({ ...n, isRead: true }));
    await kv.set(notificationsKey, notifications);

    return c.json({ success: true, unreadCount: 0 });
  } catch (error) {
    console.log(`Error marking all notifications as read: ${error}`);
    return c.json({ error: "Failed to mark all as read" }, 500);
  }
});

// Helper: generate daily feed with exactly 10 articles
function generateDailyFeed() {
  const articles = [
    {
      id: 'article-fixed-001',
      title: '느린 사고가 만드는 깊이 있는 디자인',
      platform: 'Brunch',
      platformIcon: '📝',
      topics: ['디자인 철학', '인지심리'],
      readTime: 8,
      thumbnail: 'https://images.unsplash.com/photo-1546098073-4d874a1c59f8?w=400&h=300&fit=crop',
      author: '김지윤',
      excerpt: '빠른 것이 좋은 것이라는 가정을 뒤집는 느린 디자인의 세계',
      content: generateSampleContent(),
      readProgress: 35, // Partially read (Zeigarnik effect)
    },
    {
      id: 'article-fixed-002',
      title: '주의력의 경제학: 디지털 시대의 집중력',
      platform: 'Medium',
      platformIcon: '✍️',
      topics: ['행동경제학', '인지심리'],
      readTime: 12,
      thumbnail: 'https://images.unsplash.com/photo-1639414839192-0562f4065ffd?w=400&h=300&fit=crop',
      author: '이준호',
      excerpt: '유한한 자원인 주의력을 어떻게 분배할 것인가',
      content: generateSampleContent()
    },
    {
      id: 'article-fixed-003',
      title: '좋은 질문이 좋은 답보다 중요한 이유',
      platform: 'Velog',
      platformIcon: '💻',
      topics: ['비판적 사고', '학습 이론'],
      readTime: 7,
      thumbnail: 'https://images.unsplash.com/photo-1524995997946-a1c2e315a42f?w=400&h=300&fit=crop',
      author: '박서연',
      excerpt: '질문의 기술이 사고의 깊이를 결정한다',
      content: generateSampleContent(),
      readProgress: 62, // Partially read (Zeigarnik effect)
    },
    {
      id: 'article-fixed-004',
      title: '시스템 1과 시스템 2 사이에서',
      platform: '브런치',
      platformIcon: '📝',
      topics: ['인지심리', '제품 사고'],
      readTime: 10,
      thumbnail: 'https://images.unsplash.com/photo-1729105140273-b5e886a4f999?w=400&h=300&fit=crop',
      author: '정민수',
      excerpt: '카너먼의 이중과정이론으로 보는 사용자 행동',
      content: generateSampleContent()
    },
    {
      id: 'article-fixed-005',
      title: '창의성은 제약에서 시작된다',
      platform: 'ㅍㅍㅅㅅ',
      platformIcon: '📰',
      topics: ['창의성', '디자인 철학'],
      readTime: 6,
      thumbnail: 'https://images.unsplash.com/photo-1656877280226-ebf9ea8b1303?w=400&h=300&fit=crop',
      author: '최하은',
      excerpt: '한계가 오히려 더 나은 결과를 이끄는 이유',
      content: generateSampleContent()
    },
    {
      id: 'article-fixed-006',
      title: '읽기와 쓰기, 그리고 생각하기',
      platform: 'Brunch',
      platformIcon: '📝',
      topics: ['글쓰기', '학습 이론'],
      readTime: 9,
      thumbnail: 'https://images.unsplash.com/photo-1513001900722-370f803f498d?w=400&h=300&fit=crop',
      author: '한소희',
      excerpt: '읽는 행위가 어떻게 사고를 형성하는가',
      content: generateSampleContent()
    },
    {
      id: 'article-fixed-007',
      title: '인지 부하를 줄이는 인터페이스 디자인',
      platform: 'Medium',
      platformIcon: '✍️',
      topics: ['UX 리서치', '인지심리'],
      readTime: 11,
      thumbnail: 'https://images.unsplash.com/photo-1766250533363-01b974b2ba32?w=400&h=300&fit=crop',
      author: '오태현',
      excerpt: 'Miller의 법칙부터 Hick의 법칙까지',
      content: generateSampleContent()
    },
    {
      id: 'article-fixed-008',
      title: '복잡계와 시스템 사고의 즐거움',
      platform: 'Velog',
      platformIcon: '💻',
      topics: ['시스템 사고', '비판적 사고'],
      readTime: 14,
      thumbnail: 'https://images.unsplash.com/photo-1670182088755-48d7171e5e44?w=400&h=300&fit=crop',
      author: '류지원',
      excerpt: '나비효과에서 피드백 루프까지, 세상을 보는 새로운 렌즈',
      content: generateSampleContent()
    },
    {
      id: 'article-fixed-009',
      title: '사용자를 이해한다는 것의 의미',
      platform: '브런치',
      platformIcon: '📝',
      topics: ['UX 리서치', '제품 사고'],
      readTime: 8,
      thumbnail: 'https://images.unsplash.com/photo-1545875589-7bacdcc464ae?w=400&h=300&fit=crop',
      author: '강다인',
      excerpt: '데이터 너머의 공감, 리서치의 본질',
      content: generateSampleContent()
    },
    {
      id: 'article-fixed-010',
      title: '넛지 디자인: 선택을 설계하는 기술',
      platform: 'Medium',
      platformIcon: '✍️',
      topics: ['행동경제학', '제품 사고'],
      readTime: 10,
      thumbnail: 'https://images.unsplash.com/photo-1546098073-4d874a1c59f8?w=400&h=300&fit=crop',
      author: '윤서준',
      excerpt: '탈러와 선스타인이 말하는 자유주의적 개입주의',
      content: generateSampleContent()
    },
    {
      id: 'article-fixed-011',
      title: '미니멀리즘과 본질적 사고',
      platform: 'Brunch',
      platformIcon: '📝',
      topics: ['디자인 철학', '창의성'],
      readTime: 7,
      thumbnail: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=400&h=300&fit=crop',
      author: '송민지',
      excerpt: '더하기보다 빼기의 미학',
      content: generateSampleContent()
    },
    {
      id: 'article-fixed-012',
      title: '메타인지: 생각에 대한 생각',
      platform: 'Medium',
      platformIcon: '✍️',
      topics: ['학습 이론', '인지심리'],
      readTime: 9,
      thumbnail: 'https://images.unsplash.com/photo-1434030216411-0b793f4b4173?w=400&h=300&fit=crop',
      author: '김태영',
      excerpt: '어떻게 더 나은 학습자가 될 것인가',
      content: generateSampleContent()
    },
    {
      id: 'article-fixed-013',
      title: '정보의 숲에서 길을 잃지 않는 법',
      platform: 'Velog',
      platformIcon: '💻',
      topics: ['비판적 사고', '시스템 사고'],
      readTime: 11,
      thumbnail: 'https://images.unsplash.com/photo-1481627834876-b7833e8f5570?w=400&h=300&fit=crop',
      author: '이현우',
      excerpt: '정보 과부하 시대의 생존 전략',
      content: generateSampleContent()
    },
    {
      id: 'article-fixed-014',
      title: '루틴의 힘: 습관이 만드는 변화',
      platform: '브런치',
      platformIcon: '📝',
      topics: ['행동경제학', '학습 이론'],
      readTime: 8,
      thumbnail: 'https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?w=400&h=300&fit=crop',
      author: '정수빈',
      excerpt: '작은 습관이 만드는 큰 차이',
      content: generateSampleContent()
    },
    {
      id: 'article-fixed-015',
      title: '대화의 기술: 듣기의 중요성',
      platform: 'Medium',
      platformIcon: '✍️',
      topics: ['UX 리서치', '비판적 사고'],
      readTime: 6,
      thumbnail: 'https://images.unsplash.com/photo-1573496359142-b8d87734a5a2?w=400&h=300&fit=crop',
      author: '박지현',
      excerpt: '공감적 경청이 이끄는 깊은 이해',
      content: generateSampleContent()
    }
  ];
  
  return articles;
}

// Helper: generate mock saved articles (10 pre-populated for reading map)
function generateMockSavedArticles() {
  const now = new Date();
  return [
    {
      id: 'saved-001',
      title: '느린 사고가 만드는 깊이 있는 디자인',
      platform: 'Brunch',
      topics: ['디자인 철학', '인지심리'],
      savedAt: new Date(now.getTime() - 1 * 86400000).toISOString(),
    },
    {
      id: 'saved-002',
      title: '주의력의 경제학: 디지털 시대의 집중력',
      platform: 'Medium',
      topics: ['행동경제학', '인지심리'],
      savedAt: new Date(now.getTime() - 2 * 86400000).toISOString(),
    },
    {
      id: 'saved-003',
      title: '좋은 질문이 좋은 답보다 중요한 이유',
      platform: 'Velog',
      topics: ['비판적 사고', '학습 이론'],
      savedAt: new Date(now.getTime() - 3 * 86400000).toISOString(),
    },
    {
      id: 'saved-004',
      title: '시스템 1과 시스템 2 사이에서',
      platform: '브런치',
      topics: ['인지심리', '제품 사고'],
      savedAt: new Date(now.getTime() - 4 * 86400000).toISOString(),
    },
    {
      id: 'saved-005',
      title: '창의성은 제약에서 시작된다',
      platform: 'ㅍㅍㅅㅅ',
      topics: ['창의성', '디자인 철학'],
      savedAt: new Date(now.getTime() - 5 * 86400000).toISOString(),
    },
    {
      id: 'saved-006',
      title: '읽기와 쓰기, 그리고 생각하기',
      platform: 'Brunch',
      topics: ['글쓰기', '학습 이론'],
      savedAt: new Date(now.getTime() - 6 * 86400000).toISOString(),
    },
    {
      id: 'saved-007',
      title: '인지 부하를 줄이는 인터페이스 디자인',
      platform: 'Medium',
      topics: ['UX 리서치', '인지심리'],
      savedAt: new Date(now.getTime() - 7 * 86400000).toISOString(),
    },
    {
      id: 'saved-008',
      title: '복잡계와 시스템 사고의 즐거움',
      platform: 'Velog',
      topics: ['시스템 사고', '비판적 사고'],
      savedAt: new Date(now.getTime() - 8 * 86400000).toISOString(),
    },
    {
      id: 'saved-009',
      title: '사용자를 이해한다는 것의 의미',
      platform: '브런치',
      topics: ['UX 리서치', '제품 사고'],
      savedAt: new Date(now.getTime() - 9 * 86400000).toISOString(),
    },
    {
      id: 'saved-010',
      title: '넛지 디자인: 선택을 설계하는 기술',
      platform: 'Medium',
      topics: ['행동경제학', '제품 사고'],
      savedAt: new Date(now.getTime() - 10 * 86400000).toISOString(),
    },
  ];
}

function generateSampleContent() {
  return `# 느린 사고의 가치

디지털 시대에 우리는 끊임없이 빠른 정보 소비를 강요받습니다. 그러나 진정한 이해와 통찰은 느린 사고에서 나옵니다.

## 시스템 1과 시스템 2

대니얼 카너먼이 말한 두 가지 사고 시스템을 떠올려봅시다. 시스템 1은 빠르고 직관적이며, 시스템 2는 느리고 의도적입니다.

깊이 있는 학습과 창의적 사고는 시스템 2의 영역입니다. 우리가 글을 읽을 때, 특히 어려운 개념을 다루는 때, 우리는 시스템 2를 활성화해야 합니다.

## 의도적인 읽기

의도적인 읽기란 무엇일까요? 그것은 단순히 글자를 눈으로 따라가는 것이 아니라, 저자의 논리를 따라가고, 질문을 던지고, 자신의 경험과 연결하는 능동적인 과정입니다.

이러한 읽기는 시간이 걸립니다. 그러나 그 시간은 낭비가 아닙니다. 오히려 가장 가치 있는 투자입니다.

## 결론

빠른 정보 소비의 시대에, 느린 사고와 의도적인 읽기는 우리의 피난처입니다. 이것이 바로 독서의 성소가 필요한 이유입니다.`;
}

function extractMetadata(html: string, url: string) {
  // Extract meta tags using regex
  const getMetaContent = (name: string) => {
    const regex = new RegExp(`<meta[^>]*(?:name|property)=["']${name}["'][^>]*content=["']([^"']*)["']`, 'i');
    const match = html.match(regex);
    return match ? match[1] : '';
  };

  // Extract title
  const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
  const title = titleMatch ? titleMatch[1].trim() : 
                getMetaContent('og:title') || 
                getMetaContent('twitter:title') || '';

  // Extract author
  const author = getMetaContent('author') || 
                 getMetaContent('article:author') || 
                 getMetaContent('twitter:creator') || '';

  // Extract description
  const description = getMetaContent('description') || 
                     getMetaContent('og:description') || 
                     getMetaContent('twitter:description') || '';

  // Extract image
  const image = getMetaContent('og:image') || 
               getMetaContent('twitter:image') || '';

  // Extract keywords/topics
  const keywordsStr = getMetaContent('keywords') || getMetaContent('article:tag') || '';
  const topics = keywordsStr ? keywordsStr.split(',').map((t: string) => t.trim()).filter(Boolean) : [];

  // Extract main content (simplified approach)
  // Remove scripts, styles, and comments
  let cleanHtml = html
    .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
    .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
    .replace(/<!--[\s\S]*?-->/g, '');

  // Extract text from p tags
  const paragraphs: string[] = [];
  const pRegex = /<p[^>]*>([\s\S]*?)<\/p>/gi;
  let match;
  while ((match = pRegex.exec(cleanHtml)) !== null) {
    const text = match[1]
      .replace(/<[^>]*>/g, '') // Remove HTML tags
      .replace(/&nbsp;/g, ' ')
      .replace(/&amp;/g, '&')
      .replace(/&lt;/g, '<')
      .replace(/&gt;/g, '>')
      .replace(/&quot;/g, '"')
      .trim();
    
    if (text && text.length > 20) { // Only meaningful paragraphs
      paragraphs.push(text);
    }
  }

  // Extract text from headers
  const headers: string[] = [];
  const headerRegex = /<h[1-6][^>]*>([\s\S]*?)<\/h[1-6]>/gi;
  while ((match = headerRegex.exec(cleanHtml)) !== null) {
    const text = match[1]
      .replace(/<[^>]*>/g, '')
      .trim();
    
    if (text && text.length > 2) {
      headers.push(`## ${text}`);
    }
  }

  // Combine content
  const content = [...headers, ...paragraphs].slice(0, 50).join('\n\n');

  return {
    title,
    author,
    description,
    image,
    topics: topics.length > 0 ? topics.slice(0, 5) : ['일반'],
    content: content || description,
  };
}

function getPlatformFromURL(url: string) {
  const platforms = [
    { name: 'Brunch', icon: '📝', regex: /brunch\.co/ },
    { name: 'Medium', icon: '✍️', regex: /medium\.com/ },
    { name: 'Velog', icon: '💻', regex: /velog\.io/ },
    { name: 'ㅍㅍㅅㅅ', icon: '📰', regex: /ppss\.co/ },
  ];

  for (const platform of platforms) {
    if (platform.regex.test(url)) {
      return platform;
    }
  }

  return { name: 'Unknown', icon: '❓' };
}

function estimateReadTime(content: string) {
  const wordsPerMinute = 200;
  const words = content.split(/\s+/).length;
  return Math.ceil(words / wordsPerMinute);
}

Deno.serve(app.fetch);