import { useState, useEffect, useCallback } from 'react';
import { useParams } from 'react-router';
import { Share2, Settings, BookOpen, Highlighter, Flame, TrendingUp } from 'lucide-react';
import { motion } from 'motion/react';
import { toast } from 'sonner';
import { useUser } from '../../context/user-context';
import { api } from '../../lib/api';
import { SettingsPanel } from '../settings-panel';

interface ProfileData {
  userId: string;
  displayName: string;
  bio: string;
  avatar: string | null;
  joinedAt: string;
  stats: {
    savedArticles: number;
    totalHighlights: number;
  };
}

export function Profile() {
  const params = useParams();
  const { userId: currentUserId } = useUser();
  const userId = params.userId || currentUserId;
  const isOwnProfile = userId === currentUserId;

  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [loading, setLoading] = useState(true);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);

  const loadProfile = useCallback(async () => {
    try {
      const data = await api.getProfile(userId);
      setProfile(data);
    } catch (error) {
      console.error('Failed to load profile:', error);
    } finally {
      setLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const topicBreakdown = [
    { topic: '디자인 철학', percentage: 35 },
    { topic: '인지심리', percentage: 28 },
    { topic: 'UX 리서치', percentage: 18 },
    { topic: '시스템 사고', percentage: 12 },
    { topic: '글쓰기', percentage: 7 },
  ];

  const recentHighlights = [
    {
      id: 1,
      text: '진정한 이해와 통찰은 느린 사고에서 나옵니다.',
      source: '느린 사고가 만드는 깊이',
      platform: 'Brunch'
    },
    {
      id: 2,
      text: '의도적인 읽기란 저자의 논리를 따라가고, 질문을 던지는 것',
      source: '주의력의 경제학',
      platform: 'Medium'
    },
  ];

  const getTenure = (joinedAt: string) => {
    const joined = new Date(joinedAt);
    const now = new Date();
    const months = Math.floor((now.getTime() - joined.getTime()) / (1000 * 60 * 60 * 24 * 30));
    return months;
  };

  const handleShareMonthlyStats = async () => {
    const monthName = new Date().toLocaleDateString('ko-KR', { month: 'long' });
    const shareText = `${monthName} dots 읽기 기록\n\n` +
      `📚 가장 많이 읽은 주제: 디자인 철학\n` +
      `✨ 가장 많이 하이라이트한 글: 느린 사고가 만드는 깊이\n` +
      `🔥 읽기 연속 기록: 7일`;

    // Web Share API 지원 체크
    if (navigator.share) {
      try {
        await navigator.share({
          title: `${monthName} dots 읽기 기록`,
          text: shareText,
        });
        toast.success('공유가 완료되었습니다');
      } catch (error: unknown) {
        // 사용자가 공유를 취소한 경우
        if (error instanceof Error && error.name !== 'AbortError') {
          console.error('Share failed:', error);
          // 공유 실패 시 클립보드로 fallback
          fallbackCopyToClipboard(shareText);
        }
      }
    } else {
      // Web Share API를 지원하지 않는 경우 클립보드로 복사
      fallbackCopyToClipboard(shareText);
    }
  };

  const fallbackCopyToClipboard = async (text: string) => {
    try {
      // Try modern clipboard API first
      await navigator.clipboard.writeText(text);
      toast.success('클립보드에 복사되었습니다', {
        description: '붙여넣기(Ctrl+V)로 공유해보세요'
      });
    } catch (error) {
      console.error('Copy failed:', error);
      
      // Fallback to old-school method
      try {
        const textArea = document.createElement('textarea');
        textArea.value = text;
        textArea.style.position = 'fixed';
        textArea.style.left = '-999999px';
        textArea.style.top = '-999999px';
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        
        const successful = document.execCommand('copy');
        textArea.remove();
        
        if (successful) {
          toast.success('클립보드에 복사되었습니다', {
            description: '붙여넣기(Ctrl+V)로 공유해보세요'
          });
        } else {
          throw new Error('execCommand failed');
        }
      } catch (fallbackError) {
        console.error('Fallback copy failed:', fallbackError);
        toast.error('복사 실패', {
          description: '수동으로 텍스트를 복사해주세요'
        });
      }
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-dark)] flex items-center justify-center">
        <div className="text-[var(--text-muted)]">Loading...</div>
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="min-h-screen bg-[var(--bg-dark)] flex items-center justify-center">
        <div className="text-[var(--text-muted)]">Profile not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-dark)] pb-24 lg:pb-12">
      {/* Header */}
      <header className="px-6 pt-10 pb-6 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl lg:text-3xl font-serif text-[var(--text-primary)]">
            프로필
          </h1>
          {isOwnProfile && (
            <button 
              onClick={() => setIsSettingsOpen(true)}
              className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
              aria-label="설정"
            >
              <Settings className="w-5 h-5" />
            </button>
          )}
        </div>
      </header>

      <main className="px-6 max-w-6xl mx-auto">
        {/* Desktop two-column layout */}
        <div className="lg:grid lg:grid-cols-[1fr_360px] xl:grid-cols-[1fr_420px] lg:gap-8">
          {/* Left Column */}
          <div className="space-y-6">
            {/* Hero Section */}
            <div className="bg-[var(--bg-surface)] rounded-xl p-6">
              <div className="flex items-start gap-4 mb-4">
                <div className="w-16 h-16 lg:w-20 lg:h-20 rounded-full bg-[var(--accent-green)] flex items-center justify-center text-2xl lg:text-3xl font-serif text-white">
                  {profile.displayName[0]}
                </div>
                <div className="flex-1">
                  <h2 className="text-xl lg:text-2xl font-serif text-[var(--text-primary)] mb-1">
                    {profile.displayName}
                  </h2>
                  <p className="text-sm text-[var(--text-muted)] mb-2">
                    {profile.bio}
                  </p>
                  <p className="text-xs text-[var(--text-muted)]">
                    dots {getTenure(profile.joinedAt)}개월째
                  </p>
                </div>
              </div>

              {!isOwnProfile && (
                <button className="w-full py-2 px-4 bg-[var(--accent-green)] text-white rounded-lg text-sm font-medium hover:bg-[var(--accent-green-hover)] transition-colors">
                  비슷하게 읽는 사람이에요
                </button>
              )}
            </div>

            {/* Reading Stats */}
            <div className="bg-[var(--bg-surface)] rounded-xl p-6">
              <h3 className="text-sm text-[var(--text-muted)] mb-4">읽기 통계</h3>
              <div className="grid grid-cols-3 gap-4">
                <div>
                  <div className="text-3xl lg:text-4xl font-serif text-[var(--text-primary)] mb-1">
                    {profile.stats.savedArticles}
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">저장한 글</div>
                </div>
                <div>
                  <div className="text-3xl lg:text-4xl font-serif text-[var(--text-primary)] mb-1">
                    {profile.stats.totalHighlights}
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">하이라이트</div>
                </div>
                <div>
                  <div className="text-3xl lg:text-4xl font-serif text-[var(--text-primary)] mb-1">
                    {Math.floor(profile.stats.savedArticles * 8.5)}
                  </div>
                  <div className="text-xs text-[var(--text-muted)]">평균 읽기/주</div>
                </div>
              </div>
            </div>

            {/* Topic Breakdown */}
            {profile.stats.savedArticles > 0 && (
              <div className="bg-[var(--bg-surface)] rounded-xl p-6">
                <h3 className="text-sm text-[var(--text-muted)] mb-4">주제 분포</h3>
                <div className="space-y-3">
                  {topicBreakdown.map((item, i) => (
                    <div key={i}>
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm text-[var(--text-primary)]">
                          {item.topic}
                        </span>
                        <span className="text-sm text-[var(--text-muted)]">
                          {item.percentage}%
                        </span>
                      </div>
                      <div className="h-2 bg-[var(--bg-dark)] rounded-full overflow-hidden">
                        <motion.div
                          className="h-full bg-[var(--accent-green)]"
                          initial={{ width: 0 }}
                          animate={{ width: `${item.percentage}%` }}
                          transition={{ duration: 0.5, delay: i * 0.1 }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quiet Social Indicators */}
            {!isOwnProfile && (
              <div className="bg-[var(--bg-surface)] rounded-xl p-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--text-muted)]">
                      이 글을 함께 읽은 사람
                    </span>
                    <span className="text-sm text-[var(--text-primary)]">12명</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-[var(--text-muted)]">
                      관심사 겹침 깊이
                    </span>
                    <span className="text-sm text-[var(--accent-green)]">72%</span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right Column */}
          <div className="space-y-6 mt-6 lg:mt-0">
            {/* Monthly Wrapped Card - Spotify Wrapped Style */}
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6 }}
              className="relative overflow-hidden bg-gradient-to-br from-[#3A5A3E] via-[#2A3D2E] to-[#1A2A1E] rounded-2xl p-8 shadow-2xl"
            >
              {/* Decorative background elements */}
              <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent-green)]/5 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-[var(--accent-green)]/10 rounded-full blur-2xl" />
              
              <div className="relative z-10">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                  <div>
                    <p className="text-xs text-[var(--accent-green)] font-semibold tracking-wider uppercase mb-1">
                      {new Date().toLocaleDateString('ko-KR', { month: 'long' })}
                    </p>
                    <h3 className="text-xl font-serif text-[var(--text-primary)]">
                      나의 읽기 여정
                    </h3>
                  </div>
                  <motion.button 
                    whileHover={{ scale: 1.05 }}
                    whileTap={{ scale: 0.95 }}
                    className="p-2.5 text-[var(--text-primary)] bg-white/5 hover:bg-white/10 rounded-xl transition-all backdrop-blur-sm"
                    onClick={handleShareMonthlyStats}
                    aria-label="이번 달 읽기 통계 공유하기"
                  >
                    <Share2 className="w-4 h-4" />
                  </motion.button>
                </div>

                {/* Stats Cards */}
                <div className="space-y-4">
                  {/* Top Topic */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.2 }}
                    className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-[var(--accent-green)]/20 flex items-center justify-center flex-shrink-0">
                        <BookOpen className="w-6 h-6 text-[var(--accent-green)]" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[var(--text-muted)] mb-1">
                          가장 많이 읽은 주제
                        </p>
                        <p className="text-2xl font-serif text-[var(--text-primary)] mb-1 truncate">
                          디자인 철학
                        </p>
                        <div className="flex items-center gap-2">
                          <div className="flex-1 h-1.5 bg-white/10 rounded-full overflow-hidden">
                            <motion.div
                              className="h-full bg-[var(--accent-green)]"
                              initial={{ width: 0 }}
                              animate={{ width: '35%' }}
                              transition={{ delay: 0.4, duration: 0.8 }}
                            />
                          </div>
                          <span className="text-xs text-[var(--accent-green)] font-semibold">35%</span>
                        </div>
                      </div>
                    </div>
                  </motion.div>

                  {/* Most Highlighted */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-white/5 backdrop-blur-sm rounded-xl p-5 border border-white/10"
                  >
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-yellow-500/20 flex items-center justify-center flex-shrink-0">
                        <Highlighter className="w-6 h-6 text-yellow-400" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-[var(--text-muted)] mb-1">
                          가장 많이 하이라이트한 글
                        </p>
                        <p className="text-lg font-serif text-[var(--text-primary)] leading-snug">
                          느린 사고가 만드는 깊이
                        </p>
                      </div>
                    </div>
                  </motion.div>

                  {/* Reading Streak */}
                  <motion.div
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-gradient-to-r from-orange-500/10 to-red-500/10 backdrop-blur-sm rounded-xl p-5 border border-orange-500/20"
                  >
                    <div className="flex items-center gap-4">
                      <motion.div 
                        className="w-12 h-12 rounded-xl bg-orange-500/20 flex items-center justify-center flex-shrink-0"
                        animate={{ 
                          scale: [1, 1.1, 1],
                        }}
                        transition={{ 
                          repeat: Infinity, 
                          duration: 2,
                          ease: "easeInOut" 
                        }}
                      >
                        <Flame className="w-6 h-6 text-orange-400" />
                      </motion.div>
                      <div className="flex-1">
                        <p className="text-xs text-[var(--text-muted)] mb-1">
                          읽기 연속 기록
                        </p>
                        <div className="flex items-baseline gap-2">
                          <motion.span 
                            className="text-4xl font-serif text-[var(--text-primary)]"
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ delay: 0.6, type: "spring" }}
                          >
                            7
                          </motion.span>
                          <span className="text-sm text-[var(--text-muted)]">일</span>
                        </div>
                      </div>
                      <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 0.7 }}
                        className="text-right"
                      >
                        <TrendingUp className="w-5 h-5 text-orange-400 mb-1" />
                        <p className="text-xs text-orange-400 font-semibold">+2일</p>
                      </motion.div>
                    </div>
                  </motion.div>
                </div>

                {/* Footer Message */}
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.8 }}
                  className="mt-6 pt-6 border-t border-white/10 text-center"
                >
                  <p className="text-sm text-[var(--text-muted)] italic">
                    "느리게, 깊이, 의도적으로"
                  </p>
                </motion.div>
              </div>
            </motion.div>

            {/* Recent Highlights */}
            <div className="bg-[var(--bg-surface)] rounded-xl p-6">
              <h3 className="text-sm text-[var(--text-muted)] mb-4">최근 하이라이트</h3>
              <div className="space-y-4">
                {recentHighlights.map((highlight) => (
                  <div
                    key={highlight.id}
                    className="border-l-4 border-[var(--accent-green)] pl-4 py-2"
                  >
                    <p className="text-sm text-[var(--text-primary)] italic mb-2">
                      "{highlight.text}"
                    </p>
                    <div className="text-xs text-[var(--text-muted)]">
                      {highlight.source} · {highlight.platform}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </main>

      {/* Settings Panel */}
      <SettingsPanel
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        userEmail="user@example.com"
      />
    </div>
  );
}