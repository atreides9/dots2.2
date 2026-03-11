import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, Share2, MoreVertical, Bookmark, MessageSquare, ExternalLink, Highlighter, X } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useUser } from '../../context/user-context';
import { api } from '../../lib/api';

export function ReaderView() {
  const { articleId } = useParams();
  const navigate = useNavigate();
  const { userId } = useUser();
  const [article, setArticle] = useState<any>(null);
  const [highlights, setHighlights] = useState<any[]>([]);
  const [showTopBar, setShowTopBar] = useState(true);
  const [readingProgress, setReadingProgress] = useState(0);
  const [readingMode, setReadingMode] = useState<'dark' | 'sepia' | 'light'>('dark');
  const [selectedText, setSelectedText] = useState('');
  const [showHighlightMenu, setShowHighlightMenu] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);

  const loadArticleAndHighlights = useCallback(async () => {
    try {
      // Fetch real article data from server
      const articleData = await api.getArticle(articleId!, userId);
      setArticle(articleData.article);

      const highlightsData = await api.getHighlights(articleId!, userId);
      setHighlights(highlightsData.highlights);
    } catch (error) {
      console.error('Failed to load article:', error);
      toast.error('글을 불러오지 못했습니다');
      
      // Redirect to library if article not found
      setTimeout(() => navigate('/library'), 2000);
    }
  }, [articleId, userId, navigate]);

  useEffect(() => {
    loadArticleAndHighlights();

    async function incrementReadingCount() {
      try {
        await api.incrementReading(userId);
      } catch (error) {
        console.error('Failed to increment reading count:', error);
      }
    }
    incrementReadingCount();

    const handleScroll = () => {
      const currentScrollY = window.scrollY;
      
      const windowHeight = window.innerHeight;
      const documentHeight = document.documentElement.scrollHeight;
      const progress = (currentScrollY / (documentHeight - windowHeight)) * 100;
      setReadingProgress(Math.min(100, Math.max(0, progress)));

      if (currentScrollY > lastScrollY.current && currentScrollY > 100) {
        setShowTopBar(false);
      } else {
        setShowTopBar(true);
      }
      lastScrollY.current = currentScrollY;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [loadArticleAndHighlights, userId]);

  async function handleAddHighlight(color: string) {
    if (!selectedText) return;

    try {
      const highlight = {
        text: selectedText,
        color,
      };

      await api.addHighlight(articleId!, userId, highlight);
      await loadArticleAndHighlights();
      setShowHighlightMenu(false);
      setSelectedText('');
      
      // Clear selection
      window.getSelection()?.removeAllRanges();
      
      // Show success feedback
      toast.success('하이라이트가 추가되었습니다', {
        description: selectedText.substring(0, 50) + (selectedText.length > 50 ? '...' : ''),
      });
    } catch (error) {
      console.error('Failed to add highlight:', error);
      toast.error('하이라이트 추가에 실패했습니다');
    }
  }

  async function handleDeleteHighlight(highlightId: string) {
    try {
      await api.deleteHighlight(highlightId, userId);
      await loadArticleAndHighlights();
      toast.success('하이라이트가 삭제되었습니다');
    } catch (error) {
      console.error('Failed to delete highlight:', error);
      toast.error('하이라이트 삭제에 실패했습니다');
    }
  }

  const modeStyles = {
    dark: {
      bg: 'bg-[#191A1E]',
      text: 'text-[#CDD2D8]',
    },
    sepia: {
      bg: 'bg-[#E9EDF2]',
      text: 'text-[#323438]',
    },
    light: {
      bg: 'bg-white',
      text: 'text-[#17181B]',
    },
  };

  const currentMode = modeStyles[readingMode];

  if (!article) {
    return (
      <div className="min-h-screen bg-[var(--bg-dark)] flex items-center justify-center">
        <div className="text-[var(--text-muted)]">Loading...</div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${currentMode.bg} transition-colors duration-300`}>
      {/* Reading Progress Bar */}
      <div className="fixed top-0 left-0 right-0 h-0.5 bg-black/10 z-50">
        <motion.div
          className="h-full bg-[var(--accent-green)]"
          style={{ width: `${readingProgress}%` }}
        />
      </div>

      {/* Top Bar */}
      <AnimatePresence>
        {showTopBar && (
          <motion.header
            initial={{ y: -100 }}
            animate={{ y: 0 }}
            exit={{ y: -100 }}
            className={`fixed top-0 left-0 right-0 ${currentMode.bg} border-b border-black/10 z-40`}
          >
            <div className="flex items-center justify-between px-6 py-4 max-w-7xl mx-auto">
              <button
                onClick={() => navigate('/')}
                className={`p-2 -ml-2 ${currentMode.text} flex items-center gap-2`}
              >
                <ArrowLeft className="w-5 h-5" />
                <span className="hidden md:inline text-sm">돌아가기</span>
              </button>

              <div className="flex items-center gap-1">
                <button
                  onClick={() => setReadingMode('dark')}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    readingMode === 'dark'
                      ? 'bg-[var(--accent-green)] text-white'
                      : `${currentMode.text} opacity-50 hover:opacity-80`
                  }`}
                >
                  Dark
                </button>
                <button
                  onClick={() => setReadingMode('sepia')}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    readingMode === 'sepia'
                      ? 'bg-[var(--accent-green)] text-white'
                      : `${currentMode.text} opacity-50 hover:opacity-80`
                  }`}
                >
                  Sepia
                </button>
                <button
                  onClick={() => setReadingMode('light')}
                  className={`px-3 py-1.5 rounded-lg text-xs transition-colors ${
                    readingMode === 'light'
                      ? 'bg-[var(--accent-green)] text-white'
                      : `${currentMode.text} opacity-50 hover:opacity-80`
                  }`}
                >
                  Light
                </button>
              </div>

              <div className="flex items-center gap-2">
                <button className={`p-2 ${currentMode.text}`}>
                  <Share2 className="w-5 h-5" />
                </button>
                <button className={`p-2 ${currentMode.text}`}>
                  <MoreVertical className="w-5 h-5" />
                </button>
              </div>
            </div>
          </motion.header>
        )}
      </AnimatePresence>

      {/* Desktop: Two-column layout with highlights sidebar */}
      <div className="max-w-7xl mx-auto lg:flex lg:gap-12">
        {/* Article Content */}
        <main className="max-w-2xl mx-auto px-6 pt-24 pb-32 lg:flex-1 lg:max-w-none lg:pl-8 xl:pl-16 lg:pr-0">
          <div className="lg:max-w-[680px]">
            {/* Source Attribution */}
            <div className="flex items-center gap-2 mb-6">
              <span className="text-xl">{article.platformIcon}</span>
              <a
                href="#"
                className={`text-sm ${currentMode.text} opacity-70 hover:opacity-100 flex items-center gap-1`}
              >
                {article.platform} 원문 보기
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            {/* Article Header */}
            <h1 className={`text-3xl lg:text-4xl font-serif font-bold ${currentMode.text} mb-4 leading-tight`}>
              {article.title}
            </h1>

            <div className={`text-sm ${currentMode.text} opacity-60 mb-8 lg:mb-12`}>
              {article.author} · {article.platform} · {article.date}
            </div>

            {/* Article Body */}
            <div
              ref={contentRef}
              className={`prose prose-lg ${currentMode.text}`}
              style={{
                fontSize: '17px',
                lineHeight: '1.85',
                letterSpacing: '0.01em',
              }}
              onMouseUp={() => {
                const selection = window.getSelection();
                const text = selection?.toString().trim();
                if (text && text.length > 0) {
                  setSelectedText(text);
                  setShowHighlightMenu(true);
                }
              }}
            >
              {article.content.split('\n\n').map((paragraph: string, i: number) => (
                <p key={i} className="mb-6">
                  {paragraph}
                </p>
              ))}
            </div>

            {/* Highlights Section (mobile only, shown inline) */}
            <div className="lg:hidden">
              {highlights.length > 0 && (
                <div className="mt-12 pt-8 border-t border-black/10">
                  <h3 className={`text-lg font-serif ${currentMode.text} mb-4`}>
                    내 하이라이트 ({highlights.length})
                  </h3>
                  <div className="space-y-4">
                    {highlights.map((highlight) => (
                      <div
                        key={highlight.id}
                        className="p-4 rounded-lg border-l-4"
                        style={{
                          borderColor: highlight.color === 'yellow' ? '#FCD34D' : 
                                       highlight.color === 'green' ? '#4A7C59' : '#60A5FA',
                          backgroundColor: `${highlight.color === 'yellow' ? '#FCD34D' : 
                                            highlight.color === 'green' ? '#4A7C59' : '#60A5FA'}10`,
                        }}
                      >
                        <p className={`${currentMode.text} italic`}>"{highlight.text}"</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        </main>

        {/* Desktop Highlights Sidebar */}
        <aside className="hidden lg:block lg:w-80 xl:w-96 lg:flex-shrink-0 pt-24 pr-8 xl:pr-16 pb-32">
          <div className="sticky top-28">
            <h3 className={`text-sm font-medium ${currentMode.text} opacity-60 mb-4 uppercase tracking-wider`}>
              하이라이트
            </h3>
            {highlights.length > 0 ? (
              <div className="space-y-3">
                {highlights.map((highlight, index) => (
                  <motion.div
                    key={highlight.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="group relative p-4 rounded-xl border-l-4 transition-all hover:shadow-md"
                    style={{
                      borderColor: highlight.color === 'yellow' ? '#FCD34D' : 
                                   highlight.color === 'green' ? '#4A7C59' : '#60A5FA',
                      backgroundColor: `${highlight.color === 'yellow' ? '#FCD34D' : 
                                        highlight.color === 'green' ? '#4A7C59' : '#60A5FA'}10`,
                    }}
                  >
                    <p className={`${currentMode.text} italic text-sm pr-8`}>\"{highlight.text}\"</p>
                    <button
                      onClick={() => handleDeleteHighlight(highlight.id)}
                      className="absolute top-2 right-2 p-1.5 rounded-lg opacity-0 group-hover:opacity-100 transition-opacity bg-black/20 hover:bg-black/30"
                      aria-label="하이라이트 삭제"
                    >
                      <X className="w-3.5 h-3.5 text-white" />
                    </button>
                  </motion.div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <Highlighter className={`w-12 h-12 ${currentMode.text} opacity-20 mx-auto mb-3`} />
                <p className={`text-sm ${currentMode.text} opacity-40`}>
                  텍스트를 선택해서<br />하이라이트를 추가하세요
                </p>
              </div>
            )}

            {/* Reading info */}
            <div className="mt-8 pt-6 border-t border-black/10">
              <div className={`text-xs ${currentMode.text} opacity-40 space-y-2`}>
                <div className="flex justify-between">
                  <span>예상 읽기 시간</span>
                  <span>{article.readTime}분</span>
                </div>
                <div className="flex justify-between">
                  <span>읽기 진행률</span>
                  <span>{Math.round(readingProgress)}%</span>
                </div>
              </div>
            </div>
          </div>
        </aside>
      </div>

      {/* Floating Highlight Menu */}
      <AnimatePresence>
        {showHighlightMenu && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => {
                setShowHighlightMenu(false);
                setSelectedText('');
              }}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-40"
            />
            
            {/* Menu */}
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ type: 'spring', damping: 25, stiffness: 300 }}
              className="fixed bottom-24 lg:bottom-20 left-1/2 -translate-x-1/2 z-50"
            >
              <div className="bg-[var(--bg-surface)] rounded-2xl shadow-2xl p-2 border border-[var(--border)]">
                {/* Color options */}
                <div className="flex items-center gap-2 mb-2">
                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAddHighlight('yellow')}
                    className="relative group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-yellow-300 hover:bg-yellow-400 transition-all shadow-lg hover:shadow-xl flex items-center justify-center">
                      <Highlighter className="w-5 h-5 text-yellow-800" />
                    </div>
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      노랑
                    </span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAddHighlight('green')}
                    className="relative group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-[var(--accent-green)] hover:brightness-110 transition-all shadow-lg hover:shadow-xl flex items-center justify-center">
                      <Highlighter className="w-5 h-5 text-white" />
                    </div>
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      초록
                    </span>
                  </motion.button>

                  <motion.button
                    whileHover={{ scale: 1.1 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => handleAddHighlight('blue')}
                    className="relative group"
                  >
                    <div className="w-12 h-12 rounded-xl bg-blue-400 hover:bg-blue-500 transition-all shadow-lg hover:shadow-xl flex items-center justify-center">
                      <Highlighter className="w-5 h-5 text-white" />
                    </div>
                    <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-xs text-[var(--text-muted)] opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">
                      파랑
                    </span>
                  </motion.button>

                  <div className="w-px h-10 bg-[var(--border)] mx-1" />

                  <motion.button
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    onClick={() => {
                      setShowHighlightMenu(false);
                      setSelectedText('');
                      window.getSelection()?.removeAllRanges();
                    }}
                    className="px-4 py-2.5 rounded-xl text-sm font-medium text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-dark)] transition-colors"
                  >
                    취소
                  </motion.button>
                </div>
                
                {/* Selected text preview */}
                <div className="px-3 py-2 bg-[var(--bg-dark)] rounded-xl">
                  <p className="text-xs text-[var(--text-muted)] line-clamp-2 italic">
                    "{selectedText.substring(0, 100)}{selectedText.length > 100 ? '...' : ''}"
                  </p>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-[var(--bg-surface)] border-t border-[var(--border)] z-40">
        <div className="max-w-7xl mx-auto px-6 lg:px-8 xl:px-16 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <MessageSquare className="w-5 h-5" />
              <span className="text-sm">{highlights.length}</span>
            </button>
            <button className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)]">
              <Bookmark className="w-5 h-5" />
            </button>
          </div>
          <div className="text-sm text-[var(--text-muted)]">
            {Math.ceil((100 - readingProgress) * article.readTime / 100)}분 남음
          </div>
        </div>
      </div>
    </div>
  );
}