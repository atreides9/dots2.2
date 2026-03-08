import { useState } from 'react';
import { Link2, Loader2, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'motion/react';
import { toast } from 'sonner';
import { useUser } from '../context/user-context';
import { api } from '../lib/api';

interface URLArticleInputProps {
  onArticleAdded?: () => void;
}

export function URLArticleInput({ onArticleAdded }: URLArticleInputProps) {
  const { userId } = useUser();
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    
    if (!url.trim()) {
      toast.error('URL을 입력해주세요');
      return;
    }

    // Basic URL validation
    try {
      new URL(url);
    } catch {
      toast.error('올바른 URL을 입력해주세요');
      return;
    }

    setLoading(true);

    try {
      const result = await api.parseArticleFromURL(url, userId);
      
      toast.success('글이 추가되었습니다', {
        description: result.article.title,
      });

      setUrl('');
      setIsExpanded(false);
      
      if (onArticleAdded) {
        onArticleAdded();
      }
    } catch (error: any) {
      console.error('Failed to parse article:', error);
      
      // Extract detailed error message
      let errorMessage = '글을 가져오는데 실패했습니다';
      let errorDescription = '다시 시도해주세요';
      
      if (error.message) {
        // Check if it's already a formatted error message from server
        if (error.message.includes('Failed to fetch URL')) {
          errorMessage = '글을 가져올 수 없습니다';
          errorDescription = 'URL을 확인하거나 다른 글을 시도해주세요';
        } else if (error.message.includes('timeout') || error.message.includes('시간')) {
          errorMessage = '응답 시간 초과';
          errorDescription = '페이지가 응답하지 않습니다. 다른 URL을 시도해주세요';
        } else if (error.message.includes('Invalid URL')) {
          errorMessage = '잘못된 URL';
          errorDescription = 'https:// 로 시작하는 전체 URL을 입력해주세요';
        } else if (error.message.includes('network') || error.message.includes('네트워크')) {
          errorMessage = '네트워크 오류';
          errorDescription = '인터넷 연결을 확인하고 다시 시도해주세요';
        } else {
          errorDescription = error.message;
        }
      }
      
      // Don't show error toast in console as it's redundant with user-facing toast
      toast.error(errorMessage, {
        description: errorDescription,
        duration: 5000,
      });
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="mb-6">
      <AnimatePresence mode="wait">
        {!isExpanded ? (
          <motion.button
            key="collapsed"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsExpanded(true)}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 rounded-xl border-2 border-dashed border-[var(--border)] hover:border-[var(--accent-green)] bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] text-[var(--text-muted)] hover:text-[var(--accent-green)] transition-all"
          >
            <Plus className="w-4 h-4" />
            <span className="text-sm font-medium">URL로 글 추가하기</span>
          </motion.button>
        ) : (
          <motion.form
            key="expanded"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            onSubmit={handleSubmit}
            className="bg-[var(--bg-surface)] rounded-xl p-4 border border-[var(--border)]"
          >
            <div className="flex items-center gap-2 mb-3">
              <Link2 className="w-4 h-4 text-[var(--accent-green)]" />
              <h3 className="text-sm font-medium text-[var(--text-primary)]">
                URL로 글 추가하기
              </h3>
            </div>
            
            <p className="text-xs text-[var(--text-muted)] mb-3">
              Brunch, Medium, Substack 등의 글 URL을 입력하세요
            </p>

            <div className="flex gap-2">
              <input
                type="url"
                value={url}
                onChange={(e) => setUrl(e.target.value)}
                placeholder="https://..."
                disabled={loading}
                className="flex-1 px-3 py-2 bg-[var(--bg-dark)] border border-[var(--border)] rounded-lg text-sm text-[var(--text-primary)] placeholder:text-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-green)] focus:border-transparent disabled:opacity-50"
                autoFocus
              />
              
              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="px-4 py-2 bg-[var(--accent-green)] hover:bg-[var(--accent-green-hover)] text-white rounded-lg text-sm font-medium transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>파싱 중...</span>
                  </>
                ) : (
                  <span>추가</span>
                )}
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsExpanded(false);
                  setUrl('');
                }}
                disabled={loading}
                className="px-3 py-2 bg-[var(--bg-dark)] hover:bg-[var(--bg-dark)]/80 text-[var(--text-muted)] rounded-lg text-sm transition-colors disabled:opacity-50"
              >
                취소
              </button>
            </div>

            <div className="mt-3 pt-3 border-t border-[var(--border)]">
              <p className="text-xs text-[var(--text-muted)]">
                💡 지원되는 사이트: Brunch, Medium, Substack, 개인 블로그 등<br />
                글의 제목, 저자, 내용을 자동으로 추출합니다.
              </p>
            </div>
          </motion.form>
        )}
      </AnimatePresence>
    </div>
  );
}