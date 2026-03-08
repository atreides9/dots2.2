import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router';
import { ArrowLeft, BookOpen, Highlighter, TrendingUp, Calendar, Eye } from 'lucide-react';
import { motion } from 'motion/react';
import { useUser } from '../../context/user-context';
import { api } from '../../lib/api';

interface ConnectionDetail {
  userId: string;
  displayName: string;
  bio: string;
  avatar: string | null;
  sharedTopics: string[];
  overlapPercentage: number;
  readingStreak: number;
  totalSaved: number;
  connectedAt: string;
  recentReads: Array<{
    articleId: string;
    title: string;
    author: string;
    platform: string;
    readAt: string;
    excerpt: string;
  }>;
  recentHighlights: Array<{
    id: string;
    text: string;
    articleTitle: string;
    color: string;
    createdAt: string;
  }>;
}

export function ConnectionDetail() {
  const { connectionUserId } = useParams();
  const navigate = useNavigate();
  const { userId } = useUser();
  const [connection, setConnection] = useState<ConnectionDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadConnectionDetail() {
      try {
        const data = await api.getConnectionDetail(userId, connectionUserId!);
        setConnection(data);
      } catch (error) {
        console.error('Failed to load connection detail:', error);
      } finally {
        setLoading(false);
      }
    }

    loadConnectionDetail();
  }, [userId, connectionUserId]);

  function getTimeSince(dateStr: string): string {
    const diff = Date.now() - new Date(dateStr).getTime();
    const days = Math.floor(diff / 86400000);
    const hours = Math.floor((diff % 86400000) / 3600000);
    
    if (days === 0) {
      if (hours === 0) return '방금';
      return `${hours}시간 전`;
    }
    if (days === 1) return '어제';
    if (days < 7) return `${days}일 전`;
    if (days < 30) return `${Math.floor(days / 7)}주 전`;
    return `${Math.floor(days / 30)}개월 전`;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[var(--bg-dark)] pb-24 lg:pb-12">
        <div className="max-w-4xl mx-auto px-6 pt-10">
          <div className="h-10 w-32 bg-[var(--bg-surface)] rounded animate-pulse mb-8" />
          <div className="h-64 bg-[var(--bg-surface)] rounded-2xl animate-pulse mb-6" />
          <div className="h-96 bg-[var(--bg-surface)] rounded-2xl animate-pulse" />
        </div>
      </div>
    );
  }

  if (!connection) {
    return (
      <div className="min-h-screen bg-[var(--bg-dark)] flex items-center justify-center">
        <div className="text-center">
          <p className="text-[var(--text-muted)] mb-4">연결을 찾을 수 없습니다</p>
          <button
            onClick={() => navigate('/connections')}
            className="text-[var(--accent-green)] hover:underline"
          >
            연결 목록으로 돌아가기
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[var(--bg-dark)] pb-24 lg:pb-12">
      {/* Header with back button */}
      <header className="px-6 pt-10 pb-6 max-w-4xl mx-auto">
        <motion.button
          initial={{ opacity: 0, x: -10 }}
          animate={{ opacity: 1, x: 0 }}
          onClick={() => navigate('/connections')}
          className="flex items-center gap-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors mb-6"
        >
          <ArrowLeft className="w-5 h-5" />
          <span className="text-sm">연결로 돌아가기</span>
        </motion.button>
      </header>

      <main className="px-6 max-w-4xl mx-auto space-y-8">
        {/* User Profile Card */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="relative overflow-hidden rounded-2xl border border-[var(--accent-green)]/20 bg-gradient-to-br from-[var(--bg-surface)] to-[var(--accent-green)]/[0.04] p-8"
        >
          {/* Decorative glow */}
          <div className="absolute top-0 right-0 w-64 h-64 bg-[var(--accent-green)]/[0.06] rounded-full blur-3xl -translate-y-1/2 translate-x-1/4 pointer-events-none" />

          <div className="relative">
            {/* Avatar and basic info */}
            <div className="flex items-start gap-6 mb-6">
              <div className="w-24 h-24 rounded-2xl bg-gradient-to-br from-[var(--accent-green)] to-[#6B8E76] flex items-center justify-center text-4xl font-serif text-white flex-shrink-0 shadow-lg shadow-[var(--accent-green)]/20">
                {connection.displayName[0]}
              </div>
              <div className="flex-1 min-w-0">
                <h1 className="text-3xl font-serif text-[var(--text-primary)] mb-2">
                  {connection.displayName}
                </h1>
                <p className="text-sm text-[var(--text-muted)] mb-4">
                  {connection.bio}
                </p>
                
                {/* Stats row */}
                <div className="flex items-center gap-6 text-sm">
                  <div className="flex items-center gap-2">
                    <BookOpen className="w-4 h-4 text-[var(--accent-green)]" />
                    <span className="text-[var(--text-primary)]">{connection.totalSaved}편 저장</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <TrendingUp className="w-4 h-4 text-orange-400" />
                    <span className="text-[var(--text-primary)]">{connection.readingStreak}일 연속</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Calendar className="w-4 h-4 text-[var(--text-muted)]" />
                    <span className="text-[var(--text-muted)] text-xs">
                      {getTimeSince(connection.connectedAt)} 연결
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Overlap visualization */}
            <div className="mb-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-[var(--text-muted)]">관심사 겹침</span>
                <span className="text-sm font-medium text-[var(--accent-green)]">
                  {connection.overlapPercentage}%
                </span>
              </div>
              <div className="h-2 rounded-full bg-[var(--bg-dark)] overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  animate={{ width: `${connection.overlapPercentage}%` }}
                  transition={{ duration: 0.8, delay: 0.2, ease: 'easeOut' }}
                  className="h-full rounded-full bg-gradient-to-r from-[var(--accent-green)] to-[#6B8E76]"
                />
              </div>
            </div>

            {/* Shared topics */}
            <div>
              <span className="text-xs text-[var(--text-muted)] block mb-3">공유 관심사</span>
              <div className="flex flex-wrap gap-2">
                {connection.sharedTopics.map((topic) => (
                  <span
                    key={topic}
                    className="px-3 py-1.5 text-xs rounded-full bg-[var(--accent-green)]/10 text-[var(--accent-green)] border border-[var(--accent-green)]/15"
                  >
                    {topic}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </motion.section>

        {/* Recent Reads */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Eye className="w-4 h-4 text-[var(--text-muted)]" />
            <h2 className="text-sm text-[var(--text-muted)]">
              최근 읽은 글 ({connection.recentReads.length})
            </h2>
          </div>

          {connection.recentReads.length > 0 ? (
            <div className="space-y-3">
              {connection.recentReads.map((read, index) => (
                <motion.div
                  key={read.articleId}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index }}
                  onClick={() => navigate(`/read/${read.articleId}`)}
                  className="group bg-[var(--bg-surface)] rounded-xl p-5 hover:bg-[var(--bg-surface-hover)] transition-all cursor-pointer border border-transparent hover:border-[var(--accent-green)]/20"
                >
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <h3 className="text-base font-serif text-[var(--text-primary)] group-hover:text-[var(--accent-green)] transition-colors">
                      {read.title}
                    </h3>
                    <span className="text-xs text-[var(--text-muted)] whitespace-nowrap flex-shrink-0">
                      {getTimeSince(read.readAt)}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-muted)] mb-2">
                    {read.author} · {read.platform}
                  </p>
                  {read.excerpt && (
                    <p className="text-sm text-[var(--text-muted)]/80 line-clamp-2">
                      {read.excerpt}
                    </p>
                  )}
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-[var(--bg-surface)] rounded-xl p-8 text-center">
              <BookOpen className="w-12 h-12 text-[var(--text-muted)]/30 mx-auto mb-3" />
              <p className="text-sm text-[var(--text-muted)]">
                아직 읽은 글이 없어요
              </p>
            </div>
          )}
        </motion.section>

        {/* Recent Highlights */}
        <motion.section
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
        >
          <div className="flex items-center gap-2 mb-4">
            <Highlighter className="w-4 h-4 text-yellow-400" />
            <h2 className="text-sm text-[var(--text-muted)]">
              최근 하이라이트 ({connection.recentHighlights.length})
            </h2>
          </div>

          {connection.recentHighlights.length > 0 ? (
            <div className="space-y-3">
              {connection.recentHighlights.map((highlight, index) => (
                <motion.div
                  key={highlight.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.05 * index }}
                  className="bg-[var(--bg-surface)] rounded-xl p-5 border-l-4"
                  style={{
                    borderColor: highlight.color === 'yellow' ? '#FCD34D' : 
                                 highlight.color === 'green' ? '#4A7C59' : '#60A5FA',
                  }}
                >
                  <div className="flex items-start justify-between gap-4 mb-3">
                    <h4 className="text-xs text-[var(--text-muted)]">
                      {highlight.articleTitle}
                    </h4>
                    <span className="text-xs text-[var(--text-muted)] whitespace-nowrap flex-shrink-0">
                      {getTimeSince(highlight.createdAt)}
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-primary)] italic leading-relaxed">
                    "{highlight.text}"
                  </p>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="bg-[var(--bg-surface)] rounded-xl p-8 text-center">
              <Highlighter className="w-12 h-12 text-[var(--text-muted)]/30 mx-auto mb-3" />
              <p className="text-sm text-[var(--text-muted)]">
                아직 하이라이트가 없어요
              </p>
            </div>
          )}
        </motion.section>
      </main>
    </div>
  );
}
