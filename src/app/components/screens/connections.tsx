import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router';
import { Clock, BookOpen, Sparkles, UserPlus, Check } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useUser } from '../../context/user-context';
import { api } from '../../lib/api';
import { MOCK_CONNECTIONS, MOCK_RECOMMENDATION } from '../../lib/mock-data';

interface RecommendedUser {
  userId: string;
  displayName: string;
  bio: string;
  sharedTopics: string[];
  overlapPercentage: number;
  recentReads: string[];
  readingStreak: number;
  totalSaved: number;
}

interface Connection {
  userId: string;
  displayName: string;
  sharedTopics: string[];
  overlapPercentage: number;
  lastReadInCommon: string;
  connectedAt: string;
}

export function Connections() {
  const { userId } = useUser();
  const navigate = useNavigate();
  const [recommendation, setRecommendation] = useState<RecommendedUser | null>(null);
  const [canAdd, setCanAdd] = useState(true);
  const [remainingMs, setRemainingMs] = useState(0);
  const [connections, setConnections] = useState<Connection[]>([]);
  const [loading, setLoading] = useState(true);
  const [adding, setAdding] = useState(false);
  const [justAdded, setJustAdded] = useState(false);

  const loadData = useCallback(async () => {
    try {
      const [recData, connData] = await Promise.all([
        api.getConnectionRecommendation(userId),
        api.getConnections(userId),
      ]);
      setRecommendation(recData.recommendation);
      setCanAdd(recData.canAdd);
      setRemainingMs(recData.remainingMs);
      setConnections(connData.connections);
    } catch (error) {
      console.error('Failed to load connections data:', error);
      // Fallback to local mock data when API is unavailable
      setRecommendation(MOCK_RECOMMENDATION);
      setCanAdd(true);
      setConnections(MOCK_CONNECTIONS);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Live countdown timer
  useEffect(() => {
    if (remainingMs <= 0 || canAdd) return;
    const interval = setInterval(() => {
      setRemainingMs((prev) => {
        const next = prev - 1000;
        if (next <= 0) {
          setCanAdd(true);
          return 0;
        }
        return next;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [remainingMs, canAdd]);

  async function handleAddConnection() {
    if (!recommendation || !canAdd || adding) return;
    setAdding(true);
    try {
      await api.addConnection(userId, {
        userId: recommendation.userId,
        displayName: recommendation.displayName,
        sharedTopics: recommendation.sharedTopics,
        overlapPercentage: recommendation.overlapPercentage,
        lastReadInCommon: recommendation.recentReads[0] || '',
      });
      setJustAdded(true);
      toast('연결되었습니다', {
        description: `${recommendation.displayName}님과 조용히 연결되었어요`,
      });
      // Refresh data after a moment
      setTimeout(() => {
        loadData();
        setJustAdded(false);
      }, 2500);
    } catch (error: any) {
      if (error.message?.includes('Cooldown')) {
        toast('아직 쿨다운 중이에요', {
          description: '3일에 한 명만 연결할 수 있어요',
        });
      } else {
        console.error('Failed to add connection:', error);
        toast('연결에 실패했어요');
      }
    } finally {
      setAdding(false);
    }
  }

  function formatCountdown(ms: number): string {
    const totalSeconds = Math.floor(ms / 1000);
    const days = Math.floor(totalSeconds / 86400);
    const hours = Math.floor((totalSeconds % 86400) / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    if (days > 0) return `${days}일 ${hours}시간`;
    if (hours > 0) return `${hours}시간 ${minutes}분`;
    return `${minutes}분`;
  }

  function getTimeSince(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    if (days === 0) return '오늘';
    if (days === 1) return '어제';
    if (days < 7) return `${days}일 전`;
    if (days < 30) return `${Math.floor(days / 7)}주 전`;
    return `${Math.floor(days / 30)}개월 전`;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-dark)] pb-24 lg:pb-12">
        <header className="px-6 pt-10 pb-6 max-w-4xl mx-auto">
          <div className="h-8 w-24 bg-[var(--bg-surface)] rounded animate-pulse mb-2" />
          <div className="h-5 w-56 bg-[var(--bg-surface)] rounded animate-pulse" />
        </header>
        <div className="px-6 max-w-4xl mx-auto space-y-6">
          <div className="h-64 bg-[var(--bg-surface)] rounded-2xl animate-pulse" />
          <div className="h-32 bg-[var(--bg-surface)] rounded-xl animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-dark)] pb-24 lg:pb-12">
      {/* Header */}
      <header className="px-6 pt-10 pb-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
        >
          <h1 className="text-2xl lg:text-3xl font-serif text-[var(--text-primary)] mb-1">
            연결
          </h1>
          <p className="text-sm lg:text-base text-[var(--text-muted)]">
            비슷하게 읽는 사람들과의 조용한 연결
          </p>
        </motion.div>
      </header>

      <main className="px-6 max-w-4xl mx-auto space-y-10">
        {/* ===== Recommendation: Hero Card (1 person) ===== */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Sparkles className="w-4 h-4 text-[var(--accent-green)]" />
            <h2 className="text-sm text-[var(--text-muted)]">
              오늘의 추천
            </h2>
          </div>

          {recommendation ? (
            <div className="relative overflow-hidden rounded-2xl border border-[var(--accent-green)]/20 bg-gradient-to-br from-[var(--bg-surface)] to-[var(--accent-green)]/[0.04]">
              {/* Subtle glow effect */}
              <div className="absolute top-0 right-0 w-48 h-48 bg-[var(--accent-green)]/[0.06] rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />

              <div className="relative p-6 lg:p-8">
                {/* Top: Avatar + Name + Bio */}
                <div className="flex items-start gap-5 mb-6">
                  <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-2xl bg-gradient-to-br from-[var(--accent-green)] to-[#6B8E76] flex items-center justify-center text-2xl lg:text-3xl font-serif text-white flex-shrink-0 shadow-lg shadow-[var(--accent-green)]/20">
                    {recommendation.displayName[0]}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xl lg:text-2xl font-serif text-[var(--text-primary)] mb-1">
                      {recommendation.displayName}
                    </h3>
                    <p className="text-sm text-[var(--text-muted)] mb-3">
                      {recommendation.bio}
                    </p>
                    {/* Mini stats */}
                    <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
                      <span className="flex items-center gap-1">
                        <BookOpen className="w-3.5 h-3.5" />
                        {recommendation.totalSaved}편 저장
                      </span>
                      <span>🔥 {recommendation.readingStreak}일 연속</span>
                    </div>
                  </div>
                </div>

                {/* Overlap visualization */}
                <div className="mb-6">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs text-[var(--text-muted)]">관심사 겹침</span>
                    <span className="text-sm font-medium text-[var(--accent-green)]">
                      {recommendation.overlapPercentage}%
                    </span>
                  </div>
                  <div className="h-2 rounded-full bg-[var(--bg-dark)] overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${recommendation.overlapPercentage}%` }}
                      transition={{ duration: 0.8, delay: 0.3, ease: 'easeOut' }}
                      className="h-full rounded-full bg-gradient-to-r from-[var(--accent-green)] to-[#6B8E76]"
                    />
                  </div>
                </div>

                {/* Shared topics */}
                <div className="mb-5">
                  <span className="text-xs text-[var(--text-muted)] block mb-2">
                    공유 관심사
                  </span>
                  <div className="flex flex-wrap gap-2">
                    {recommendation.sharedTopics.map((topic) => (
                      <span
                        key={topic}
                        className="px-3 py-1.5 text-xs rounded-full bg-[var(--accent-green)]/10 text-[var(--accent-green)] border border-[var(--accent-green)]/15"
                      >
                        {topic}
                      </span>
                    ))}
                  </div>
                </div>

                {/* Recent reads in common */}
                {recommendation.recentReads.length > 0 && (
                  <div className="mb-6">
                    <span className="text-xs text-[var(--text-muted)] block mb-2">
                      최근 비슷하게 읽은 글
                    </span>
                    <div className="space-y-2">
                      {recommendation.recentReads.map((title, i) => (
                        <div
                          key={i}
                          className="flex items-center gap-2 text-sm text-[var(--text-primary)]/80"
                        >
                          <span className="w-1 h-1 rounded-full bg-[var(--accent-green)] flex-shrink-0" />
                          <span className="truncate">{title}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* CTA Button or Cooldown */}
                <AnimatePresence mode="wait">
                  {justAdded ? (
                    <motion.div
                      key="added"
                      initial={{ opacity: 0, scale: 0.95 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[var(--accent-green)]/15 text-[var(--accent-green)]"
                    >
                      <Check className="w-5 h-5" />
                      <span className="text-sm font-medium">연결되었어요</span>
                    </motion.div>
                  ) : canAdd ? (
                    <motion.button
                      key="add"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      onClick={handleAddConnection}
                      disabled={adding}
                      whileTap={{ scale: 0.98 }}
                      className="w-full flex items-center justify-center gap-2 py-3.5 rounded-xl bg-[var(--accent-green)] hover:bg-[var(--accent-green-hover)] text-white transition-colors disabled:opacity-50"
                    >
                      <UserPlus className="w-4.5 h-4.5" />
                      <span className="text-sm font-medium">
                        {adding ? '연결 중...' : '조용히 연결하기'}
                      </span>
                    </motion.button>
                  ) : (
                    <motion.div
                      key="cooldown"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="flex items-center justify-center gap-3 py-3.5 rounded-xl bg-[var(--bg-dark)] border border-[var(--border)]"
                    >
                      <Clock className="w-4 h-4 text-[var(--text-muted)]" />
                      <div className="text-center">
                        <p className="text-sm text-[var(--text-muted)]">
                          <span className="text-[var(--text-primary)] font-medium">
                            {formatCountdown(remainingMs)}
                          </span>
                          {' '}후에 연결할 수 있어요
                        </p>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </div>
          ) : (
            <div className="rounded-2xl border border-[var(--border)] bg-[var(--bg-surface)] p-8 text-center">
              <p className="text-sm text-[var(--text-muted)]">
                모든 추천 독자와 연결되었어요
              </p>
              <p className="text-xs text-[var(--text-muted)] mt-1">
                더 많이 읽으면 새로운 추천이 나타나요
              </p>
            </div>
          )}
        </motion.section>

        {/* 3일 쿨다운 설명 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center gap-3 px-4 py-3 rounded-lg bg-[var(--bg-surface)]/60"
        >
          <Clock className="w-4 h-4 text-[var(--text-muted)] flex-shrink-0" />
          <p className="text-xs text-[var(--text-muted)] leading-relaxed">
            dots는 의도적인 연결을 지향해요. 3일에 한 명, 천천히 관계를 쌓아가세요.
          </p>
        </motion.div>

        {/* ===== My Connections ===== */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <h2 className="text-sm text-[var(--text-muted)] mb-4">
            내 연결 ({connections.length})
          </h2>

          {connections.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-base font-serif text-[var(--text-primary)] mb-2">
                아직 연결이 없어요
              </p>
              <p className="text-sm text-[var(--text-muted)]">
                위에서 추천된 독자를 연결해보세요
              </p>
            </div>
          ) : (
            <div className="space-y-2">
              {connections.map((connection, index) => (
                <motion.div
                  key={connection.userId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index }}
                  onClick={() => navigate(`/connections/${connection.userId}`)}
                  className="group flex items-center gap-4 bg-[var(--bg-surface)] rounded-xl px-4 py-3.5 lg:px-5 lg:py-4 hover:bg-[var(--bg-surface-hover)] transition-all cursor-pointer border border-transparent hover:border-[var(--accent-green)]/20"
                  role="button"
                  tabIndex={0}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      navigate(`/connections/${connection.userId}`);
                    }
                  }}
                >
                  {/* Small avatar — muted, no gradient */}
                  <div className="w-10 h-10 rounded-full bg-[var(--bg-dark)] border border-[var(--border)] flex items-center justify-center text-sm font-serif text-[var(--text-muted)] flex-shrink-0">
                    {connection.displayName[0]}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h3 className="text-sm text-[var(--text-primary)]">
                        {connection.displayName}
                      </h3>
                      <span className="text-[11px] text-[var(--accent-green)]">
                        {connection.overlapPercentage}%
                      </span>
                    </div>
                    <div className="flex items-center gap-2 overflow-hidden">
                      {connection.sharedTopics.slice(0, 3).map((topic) => (
                        <span
                          key={topic}
                          className="px-2 py-0.5 text-[11px] bg-[var(--bg-dark)] text-[var(--text-muted)] rounded-full whitespace-nowrap"
                        >
                          {topic}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Right: connected since */}
                  <div className="flex-shrink-0 text-right hidden sm:block">
                    {connection.lastReadInCommon && (
                      <p className="text-[11px] text-[var(--text-muted)] truncate max-w-[160px] mb-0.5">
                        {connection.lastReadInCommon}
                      </p>
                    )}
                    <p className="text-[11px] text-[var(--text-muted)]/60">
                      {getTimeSince(connection.connectedAt)} 연결
                    </p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </motion.section>
      </main>
    </div>
  );
}