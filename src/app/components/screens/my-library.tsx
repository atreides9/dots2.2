import { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router';
import { MessageSquare, Trash2 } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useUser } from '../../context/user-context';
import { useScrap } from '../../context/scrap-context';
import { api } from '../../lib/api';
import { MOCK_SAVED_ARTICLES } from '../../lib/mock-data';
import { ReadingMap } from '../reading-map';
import { URLArticleInput } from '../url-article-input';

interface SavedArticle {
  id: string;
  title: string;
  platform: string;
  topics: string[];
  savedAt: string;
}

export function MyLibrary() {
  const { userId } = useUser();
  const { clearNewSaves } = useScrap();
  const [savedArticles, setSavedArticles] = useState<SavedArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);
  const [selectedTopic, setSelectedTopic] = useState<string | null>(null);

  const loadSavedArticles = useCallback(async () => {
    try {
      setError(false);
      setLoading(true);
      const data = await api.getSavedArticles(userId);
      setSavedArticles(data.articles);
    } catch (err) {
      console.error('Failed to load saved articles:', err);
      // Fallback to local mock data when API is unavailable
      setSavedArticles(MOCK_SAVED_ARTICLES as any);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    clearNewSaves();
    loadSavedArticles();
  }, [clearNewSaves, loadSavedArticles]);

  const topicCounts = savedArticles.reduce((acc, article) => {
    article.topics?.forEach((topic: string) => {
      acc[topic] = (acc[topic] || 0) + 1;
    });
    return acc;
  }, {} as Record<string, number>);

  const topTopics = Object.entries(topicCounts)
    .sort(([, a], [, b]) => b - a)
    .slice(0, 8);

  // Convert to ReadingMap format
  const topicsForMap = Object.entries(topicCounts)
    .map(([topic, count]) => ({ topic, count }))
    .sort((a, b) => b.count - a.count);

  const filteredArticles = selectedTopic
    ? savedArticles.filter(article => article.topics?.includes(selectedTopic))
    : savedArticles;

  async function handleDeleteArticle(e: React.MouseEvent, articleId: string) {
    e.preventDefault(); // Prevent navigation
    
    if (!confirm('이 글을 삭제하시겠습니까?')) {
      return;
    }

    try {
      await api.deleteArticle(articleId, userId);
      toast.success('글이 삭제되었습니다');
      await loadSavedArticles();
    } catch (error) {
      console.error('Failed to delete article:', error);
      toast.error('글 삭제에 실패했습니다');
    }
  }

  return (
    <div className="min-h-screen bg-[var(--bg-dark)] pb-20 lg:pb-8">
      {/* Header */}
      <div className="bg-[var(--bg-surface)] border-b border-[var(--border)] px-4 lg:px-8 py-6">
        <h1 className="text-2xl lg:text-3xl font-serif font-semibold text-[var(--text-primary)]">
          내 보관함
        </h1>
        <p className="text-sm text-[var(--text-muted)] mt-2">
          저장한 글 {savedArticles.length}개
        </p>
      </div>

      <div className="max-w-6xl mx-auto px-4 lg:px-8 py-6 lg:py-8">
        {/* URL Input */}
        <URLArticleInput onArticleAdded={loadSavedArticles} />

        {/* Reading Map */}
        <div className="mb-8">
          <ReadingMap 
            topics={topicsForMap} 
            totalArticles={savedArticles.length}
            onTopicClick={setSelectedTopic}
            selectedTopic={selectedTopic}
          />
        </div>

        {/* Topic Filters */}
        {topTopics.length > 0 && (
          <div className="mb-6">
            <h2 className="text-sm font-medium text-[var(--text-muted)] mb-3">
              주제별 필터
            </h2>
            <div className="flex flex-wrap gap-2">
              <button
                onClick={() => setSelectedTopic(null)}
                className={`px-4 py-2 rounded-full text-sm transition-all ${
                  selectedTopic === null
                    ? 'bg-[var(--accent-green)] text-white'
                    : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)]'
                }`}
              >
                전체 ({savedArticles.length})
              </button>
              {topTopics.map(([topic, count]) => (
                <button
                  key={topic}
                  onClick={() => setSelectedTopic(topic)}
                  className={`px-4 py-2 rounded-full text-sm transition-all ${
                    selectedTopic === topic
                      ? 'bg-[var(--accent-green)] text-white'
                      : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)]'
                  }`}
                >
                  {topic} ({count})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Saved Articles */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <div className="w-8 h-8 border-2 border-[var(--accent-green)] border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
              <p className="text-sm text-[var(--text-muted)]">불러오는 중...</p>
            </div>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4 opacity-50" />
              <p className="text-sm text-[var(--text-muted)]">
                글을 불러오지 못했습니다
              </p>
              <button
                onClick={loadSavedArticles}
                className="mt-4 px-4 py-2 bg-[var(--accent-green)] text-white rounded-lg text-sm hover:bg-[var(--accent-green-hover)] transition-colors"
              >
                다시 시도
              </button>
            </div>
          </div>
        ) : filteredArticles.length === 0 ? (
          <div className="flex items-center justify-center py-20">
            <div className="text-center">
              <MessageSquare className="w-12 h-12 text-[var(--text-muted)] mx-auto mb-4 opacity-50" />
              <p className="text-sm text-[var(--text-muted)]">
                {selectedTopic
                  ? `"${selectedTopic}" 주제의 저장된 글이 없습니다`
                  : '저장된 글이 없습니다'}
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-2">
                Home Feed에서 관심 있는 글을 저장해보세요
              </p>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <AnimatePresence mode="popLayout">
              {filteredArticles.map((article, index) => (
                <motion.div
                  key={article.id}
                  layout
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  transition={{ duration: 0.2, delay: index * 0.03 }}
                  className="relative group"
                >
                  <Link
                    to={`/reader/${article.id}`}
                    className="block bg-[var(--bg-surface)] rounded-xl p-4 hover:bg-[var(--bg-surface-hover)] transition-all border border-[var(--border)] hover:border-[var(--accent-green)]"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="text-xs text-[var(--text-muted)]">
                        {article.platform}
                      </span>
                      <span className="text-xs text-[var(--text-muted)]">
                        {new Date(article.savedAt).toLocaleDateString('ko-KR', {
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    <h3 className="font-serif text-base lg:text-lg text-[var(--text-primary)] mb-3 line-clamp-2 group-hover:text-[var(--accent-green)] transition-colors">
                      {article.title}
                    </h3>

                    {article.topics && article.topics.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {article.topics.slice(0, 3).map((topic) => (
                          <span
                            key={topic}
                            className="px-2 py-1 bg-[var(--bg-dark)] text-[var(--text-muted)] text-xs rounded"
                          >
                            {topic}
                          </span>
                        ))}
                      </div>
                    )}
                  </Link>
                  
                  {/* Delete button - shows on hover */}
                  <button
                    onClick={(e) => handleDeleteArticle(e, article.id)}
                    className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 bg-[var(--bg-dark)] hover:bg-red-500 text-[var(--text-muted)] hover:text-white rounded-lg p-2 transition-all shadow-lg"
                    aria-label="글 삭제"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  );
}