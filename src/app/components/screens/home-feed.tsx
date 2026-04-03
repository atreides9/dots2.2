import { useState, useEffect, useCallback } from 'react';
import { Link, useNavigate } from 'react-router';
import { Bell, Bookmark, RefreshCw } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useUser } from '../../context/user-context';
import { useScrap } from '../../context/scrap-context';
import { api } from '../../lib/api';
import { MOCK_FEED_ARTICLES } from '../../lib/mock-data';
import { checkLevelUp } from '../../lib/gamification';
import { NotificationPanel } from '../notification-panel';
import { URLArticleInput } from '../url-article-input';
import { LevelUpModal } from '../level-up-modal';
import type { ReadingLevel } from '../../lib/gamification';

interface Article {
  id: string;
  title: string;
  platform: string;
  platformIcon: string;
  topics: string[];
  readTime: number;
  thumbnail: string;
  author: string;
  readProgress?: number; // 0-100, for Zeigarnik effect progress bar
}

const DAILY_ARTICLE_LIMIT = 5;
const MAX_REFRESHES = 3;

export function HomeFeed() {
  const { userId } = useUser();
  const navigate = useNavigate();
  const { incrementNewSaves, decrementNewSaves } = useScrap();
  
  // Article state
  const [allArticles, setAllArticles] = useState<Article[]>([]);
  const [visibleArticles, setVisibleArticles] = useState<Article[]>([]);
  const [readingCount, setReadingCount] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savedArticles, setSavedArticles] = useState<Set<string>>(new Set());
  const [justSavedId, setJustSavedId] = useState<string | null>(null);
  
  // Refresh state
  const [refreshCount, setRefreshCount] = useState(0);
  const [shownArticleIds, setShownArticleIds] = useState<Set<string>>(new Set());
  const [isRefreshing, setIsRefreshing] = useState(false);
  
  // Notifications
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Check if we need to reset refresh count (new day)
  useEffect(() => {
    const today = new Date().toDateString();
    const stored = localStorage.getItem('dots-refresh-date');
    
    if (stored !== today) {
      setRefreshCount(0);
      setShownArticleIds(new Set());
      localStorage.setItem('dots-refresh-date', today);
      localStorage.setItem('dots-refresh-count', '0');
    } else {
      const storedCount = parseInt(localStorage.getItem('dots-refresh-count') || '0');
      setRefreshCount(storedCount);
    }
  }, []);

  const loadFeed = useCallback(async (isRefresh = false) => {
    try {
      if (!isRefresh) setLoading(true);
      const data = await api.getFeed(userId);
      setAllArticles(data.articles);
      setReadingCount(data.readingCount);
      
      // Pick 5 articles that haven't been shown yet (using functional state update to avoid stale closure)
      setShownArticleIds(prev => {
        const newArticles = data.articles
          .filter((a: Article) => !prev.has(a.id))
          .slice(0, DAILY_ARTICLE_LIMIT);
        
        setVisibleArticles(newArticles);
        
        // Track these articles as shown
        const newShownIds = new Set(prev);
        newArticles.forEach((a: Article) => newShownIds.add(a.id));
        
        return newShownIds;
      });
    } catch (error) {
      console.error('Failed to load feed:', error);
      // Fallback to local mock data when API is unavailable
      const newArticles = MOCK_FEED_ARTICLES.slice(0, DAILY_ARTICLE_LIMIT);
      setAllArticles(MOCK_FEED_ARTICLES);
      setVisibleArticles(newArticles);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  const loadNotificationCount = useCallback(async () => {
    try {
      const data = await api.getNotifications(userId);
      setUnreadCount(data.unreadCount);
    } catch (error) {
      console.error('Failed to load notification count:', error);
    }
  }, [userId]);

  useEffect(() => {
    loadFeed();
    loadNotificationCount();
  }, [loadFeed, loadNotificationCount]);

  async function handleRefresh() {
    if (refreshCount >= MAX_REFRESHES || isRefreshing) return;

    setIsRefreshing(true);
    
    setTimeout(async () => {
      const newCount = refreshCount + 1;
      setRefreshCount(newCount);
      localStorage.setItem('dots-refresh-count', String(newCount));
      
      await loadFeed(true);
      setIsRefreshing(false);
    }, 600);
  }

  async function handleSaveArticle(article: Article, e: React.MouseEvent) {
    e.preventDefault();
    e.stopPropagation();

    const wasSaved = savedArticles.has(article.id);

    try {
      if (wasSaved) {
        const newSaved = new Set(savedArticles);
        newSaved.delete(article.id);
        setSavedArticles(newSaved);
        decrementNewSaves();

        toast('저장이 취소되었어요', {
          action: {
            label: '되돌리기',
            onClick: () => {
              const restored = new Set(savedArticles);
              restored.add(article.id);
              setSavedArticles(restored);
              incrementNewSaves();
              api.saveArticle(article.id, userId, article).catch(console.error);
            },
          },
        });
      } else {
        const newSaved = new Set(savedArticles);
        newSaved.add(article.id);
        setSavedArticles(newSaved);
        incrementNewSaves();

        setJustSavedId(article.id);
        setTimeout(() => setJustSavedId(null), 600);

        await api.saveArticle(article.id, userId, article);

        toast('나의 서재에 저장됨', {
          description: article.title,
          action: {
            label: '서재 보기 →',
            onClick: () => navigate('/library'),
          },
        });
      }
    } catch (error) {
      console.error('Failed to save article:', error);
      if (!wasSaved) {
        const reverted = new Set(savedArticles);
        reverted.delete(article.id);
        setSavedArticles(reverted);
        decrementNewSaves();
      }
      toast.error('저장에 실패했어요. 다시 시도해주세요.');
    }
  }

  function getGreeting() {
    const hour = new Date().getHours();
    if (hour < 12) return '좋은 아침이에요';
    if (hour < 18) return '오늘의 읽기';
    return '좋은 저녁이에요';
  }

  const remainingRefreshes = MAX_REFRESHES - refreshCount;

  return (
    <div 
      className="min-h-screen bg-[var(--bg-dark)] pb-24 lg:pb-12 overflow-y-auto"
    >
      {/* Header */}
      <header className="px-6 pt-10 pb-6 lg:pt-10 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl lg:text-3xl font-serif text-[var(--text-primary)] mb-1">
              {getGreeting()}
            </h1>
            <p className="text-sm lg:text-base text-[var(--text-muted)]">
              이 시간은 낭비가 아니다
            </p>
          </div>
          <button className="relative p-2" onClick={() => setIsNotificationOpen(true)}>
            <Bell className="w-5 h-5 text-[var(--text-muted)]" />
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2 h-2 bg-[var(--accent-green)] rounded-full"></span>
            )}
          </button>
        </div>

        {/* Daily Progress */}
        <div className="bg-[var(--bg-surface)] rounded-xl p-4 lg:p-5 max-w-xl">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-[var(--text-muted)]">
              오늘의 읽기
            </span>
            <span className="text-sm text-[var(--text-primary)]">
              {readingCount} / {DAILY_ARTICLE_LIMIT}
            </span>
          </div>
          <div className="h-1.5 bg-[var(--bg-dark)] rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-[var(--accent-green)]"
              initial={{ width: 0 }}
              animate={{ width: `${(readingCount / DAILY_ARTICLE_LIMIT) * 100}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* URL Article Input */}
        <div className="mt-6 max-w-2xl">
          <URLArticleInput onArticleAdded={() => loadFeed()} />
        </div>

        {/* Refresh counter badge */}
        <div className="mt-3 flex justify-center">
          {remainingRefreshes > 0 ? (
            <div className="bg-[var(--bg-surface)] text-[var(--accent-green)] text-xs px-3 py-1.5 rounded-full">
              새로고침 {remainingRefreshes}/3 남음
            </div>
          ) : (
            <div className="text-[var(--text-muted)] text-xs px-3 py-1.5">
              내일 새로운 추천이 기다립니다
            </div>
          )}
        </div>
      </header>

      {/* Article Feed */}
      <main className="px-6 max-w-6xl mx-auto">
        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="bg-[var(--bg-surface)] rounded-xl p-4 animate-pulse">
                <div className="h-40 lg:h-48 bg-[var(--bg-dark)] rounded-lg mb-3"></div>
                <div className="h-4 bg-[var(--bg-dark)] rounded w-3/4 mb-2"></div>
                <div className="h-3 bg-[var(--bg-dark)] rounded w-1/2"></div>
              </div>
            ))}
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
              <AnimatePresence mode="popLayout">
                {visibleArticles.map((article, index) => {
                  const isSaved = savedArticles.has(article.id);
                  const isJustSaved = justSavedId === article.id;

                  return (
                    <motion.div
                      key={article.id}
                      layout
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, y: -20 }}
                      transition={{ delay: index * 0.08 }}
                    >
                      <Link
                        to={`/read/${article.id}`}
                        className="block bg-[var(--bg-surface)] rounded-xl overflow-hidden hover:bg-[var(--bg-surface-hover)] transition-colors h-full relative"
                      >
                        {/* Progress bar for partially-read articles (Zeigarnik effect) */}
                        {article.readProgress && article.readProgress > 0 && article.readProgress < 100 && (
                          <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--bg-dark)]">
                            <div
                              className="h-full bg-[var(--accent-green)]"
                              style={{ width: `${article.readProgress}%` }}
                            />
                          </div>
                        )}

                        <div className="p-4 lg:p-5 flex flex-col h-full">
                          {/* Thumbnail */}
                          <div
                            className="w-full h-36 md:h-44 lg:h-48 rounded-lg mb-3 bg-cover bg-center flex-shrink-0"
                            style={{ backgroundImage: `url(${article.thumbnail})` }}
                          />

                          {/* Platform */}
                          <div className="flex items-center gap-2 mb-2">
                            <span className="text-xs">{article.platformIcon}</span>
                            <span className="text-xs text-[var(--text-muted)]">
                              {article.platform}
                            </span>
                          </div>

                          {/* Title */}
                          <h3 className="text-lg font-serif text-[var(--text-primary)] mb-3 line-clamp-2 flex-1">
                            {article.title}
                          </h3>

                          {/* Tags and Actions */}
                          <div className="flex items-center justify-between mt-auto">
                            <div className="flex items-center gap-2 flex-wrap">
                              {article.topics.slice(0, 2).map((topic, i) => (
                                <span
                                  key={i}
                                  className="px-2 py-1 text-xs bg-[var(--bg-dark)] text-[var(--text-muted)] rounded-full"
                                >
                                  {topic}
                                </span>
                              ))}
                              <span className="text-xs text-[var(--text-muted)]">
                                {article.readTime}분
                              </span>
                            </div>

                            <button
                              onClick={(e) => handleSaveArticle(article, e)}
                              className={`relative p-2 rounded-lg border transition-all duration-200 ${
                                isSaved
                                  ? 'border-[var(--accent-green)] bg-[var(--accent-green)]/10'
                                  : 'border-[var(--border)] hover:border-[var(--accent-green)]'
                              }`}
                              aria-label={isSaved ? '저장 취소' : '나의 서재에 저장'}
                            >
                              <motion.div
                                animate={
                                  isJustSaved
                                    ? { scale: [1, 1.4, 0.9, 1.15, 1] }
                                    : { scale: 1 }
                                }
                                transition={{ duration: 0.5, ease: 'easeOut' }}
                              >
                                <Bookmark
                                  className={`w-4 h-4 transition-colors duration-200 ${
                                    isSaved
                                      ? 'text-[var(--accent-green)] fill-[var(--accent-green)]'
                                      : 'text-[var(--text-muted)]'
                                  }`}
                                />
                              </motion.div>
                              <AnimatePresence>
                                {isJustSaved && (
                                  <motion.span
                                    initial={{ scale: 0, opacity: 0.5 }}
                                    animate={{ scale: 2.5, opacity: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.5 }}
                                    className="absolute inset-0 rounded-lg bg-[var(--accent-green)]/20 pointer-events-none"
                                  />
                                )}
                              </AnimatePresence>
                            </button>
                          </div>
                        </div>
                      </Link>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
            </div>

            {/* End-of-feed state with refresh button */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center py-12 lg:py-16 mt-8"
            >
              {remainingRefreshes > 0 ? (
                <div className="flex flex-col items-center gap-4">
                  <p className="text-sm text-[var(--text-muted)] mb-2">
                    더 많은 글을 발견하고 싶으신가요?
                  </p>
                  <motion.button
                    whileTap={{ scale: 0.95 }}
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    className={`flex items-center gap-2 px-6 py-3 rounded-xl transition-all ${
                      isRefreshing
                        ? 'bg-[var(--bg-surface)] text-[var(--text-muted)] cursor-wait'
                        : 'bg-[var(--accent-green)] text-[var(--bg-dark)] hover:shadow-lg hover:shadow-[var(--accent-green)]/20'
                    }`}
                  >
                    <motion.div
                      animate={isRefreshing ? { rotate: 360 } : { rotate: 0 }}
                      transition={isRefreshing ? { duration: 1, repeat: Infinity, ease: 'linear' } : {}}
                    >
                      <RefreshCw className="w-5 h-5" />
                    </motion.div>
                    <span className="text-sm font-medium">
                      {isRefreshing ? '새로운 글을 찾는 중...' : '새로운 글 발견하기'}
                    </span>
                  </motion.button>
                  <p className="text-xs text-[var(--text-muted)]">
                    {remainingRefreshes}번 남음
                  </p>
                </div>
              ) : (
                <div>
                  <div className="w-16 h-16 rounded-full bg-[var(--accent-green)]/10 flex items-center justify-center mx-auto mb-4">
                    <RefreshCw className="w-8 h-8 text-[var(--accent-green)]/50" />
                  </div>
                  <p className="text-lg font-serif text-[var(--text-muted)] mb-2">
                    내일 다시 만나요
                  </p>
                  <p className="text-sm text-[var(--text-muted)]">
                    오늘의 새로고침 횟수를 모두 사용했습니다
                  </p>
                </div>
              )}
            </motion.div>
          </>
        )}
      </main>

      {/* Notification Panel */}
      <NotificationPanel
        isOpen={isNotificationOpen}
        onClose={() => setIsNotificationOpen(false)}
        unreadCount={unreadCount}
        onUnreadCountChange={setUnreadCount}
      />
    </div>
  );
}