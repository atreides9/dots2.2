import { useRouteError, isRouteErrorResponse, Link, useNavigate } from 'react-router';
import { motion } from 'motion/react';
import { 
  FileQuestion, 
  ShieldAlert, 
  ServerCrash, 
  WifiOff, 
  AlertCircle,
  Home,
  ArrowLeft,
  RefreshCw
} from 'lucide-react';
import { useState } from 'react';

/**
 * Error Page - Contextual error handling with UX best practices
 * 
 * UX Laws applied:
 * - Jakob's Law: Familiar error page patterns (icon + message + actions)
 * - Hick's Law: Limited, clear action choices (1-3 CTAs max)
 * - Aesthetic-Usability Effect: Warm, calm design reduces frustration
 * - Miller's Law: Chunked information (icon, title, description, actions)
 * - Fitts's Law: Large, accessible action buttons
 * - Recognition over Recall: Clear icons represent error types
 * - Progressive Disclosure: Technical details hidden, expandable
 */

interface ErrorContent {
  icon: React.ReactNode;
  iconColor: string;
  iconBg: string;
  title: string;
  description: string;
  suggestion: string;
  actions: Array<{
    label: string;
    onClick: () => void;
    variant: 'primary' | 'secondary';
    icon?: React.ReactNode;
  }>;
  technicalDetails?: string;
}

export function ErrorPage() {
  const error = useRouteError();
  const navigate = useNavigate();
  const [showDetails, setShowDetails] = useState(false);

  // Determine error type and content
  const getErrorContent = (): ErrorContent => {
    // Route error (404, 403, etc.)
    if (isRouteErrorResponse(error)) {
      switch (error.status) {
        case 404:
          return {
            icon: <FileQuestion className="w-12 h-12" />,
            iconColor: 'text-[#7A9989]',
            iconBg: 'bg-[#7A9989]/15',
            title: '페이지를 찾을 수 없어요',
            description: '찾으시는 페이지가 존재하지 않거나, 이동했을 수 있어요.',
            suggestion: '주소를 다시 확인하시거나, 홈으로 돌아가서 원하는 콘텐츠를 찾아보세요.',
            actions: [
              {
                label: '홈으로',
                onClick: () => navigate('/'),
                variant: 'primary',
                icon: <Home className="w-4 h-4" />,
              },
              {
                label: '이전 페이지',
                onClick: () => navigate(-1),
                variant: 'secondary',
                icon: <ArrowLeft className="w-4 h-4" />,
              },
            ],
            technicalDetails: `404: ${error.statusText || 'Not Found'}\n${error.data || ''}`,
          };

        case 403:
          return {
            icon: <ShieldAlert className="w-12 h-12" />,
            iconColor: 'text-[#B8956A]',
            iconBg: 'bg-[#B8956A]/15',
            title: '접근 권한이 없어요',
            description: '이 페이지를 보려면 로그인이 필요하거나, 접근 권한이 없을 수 있어요.',
            suggestion: '로그인 후 다시 시도하거나, 권한이 있는지 확인해주세요.',
            actions: [
              {
                label: '로그인',
                onClick: () => navigate('/login'),
                variant: 'primary',
                icon: <Home className="w-4 h-4" />,
              },
              {
                label: '홈으로',
                onClick: () => navigate('/'),
                variant: 'secondary',
                icon: <Home className="w-4 h-4" />,
              },
            ],
            technicalDetails: `403: ${error.statusText || 'Forbidden'}\n${error.data || ''}`,
          };

        case 500:
        case 502:
        case 503:
          return {
            icon: <ServerCrash className="w-12 h-12" />,
            iconColor: 'text-[#C67B5C]',
            iconBg: 'bg-[#C67B5C]/15',
            title: '서버에 문제가 생겼어요',
            description: '일시적인 서버 오류로 요청을 처리할 수 없어요.',
            suggestion: '잠시 후 다시 시도해주시거나, 문제가 계속되면 고객센터로 문의해주세요.',
            actions: [
              {
                label: '새로고침',
                onClick: () => window.location.reload(),
                variant: 'primary',
                icon: <RefreshCw className="w-4 h-4" />,
              },
              {
                label: '홈으로',
                onClick: () => navigate('/'),
                variant: 'secondary',
                icon: <Home className="w-4 h-4" />,
              },
            ],
            technicalDetails: `${error.status}: ${error.statusText || 'Server Error'}\n${error.data || ''}`,
          };

        default:
          return getDefaultError();
      }
    }

    // Network errors
    if (error instanceof TypeError && error.message.includes('fetch')) {
      return {
        icon: <WifiOff className="w-12 h-12" />,
        iconColor: 'text-[#8A8378]',
        iconBg: 'bg-[#8A8378]/15',
        title: '네트워크 연결을 확인해주세요',
        description: '인터넷 연결이 불안정하거나 끊어진 것 같아요.',
        suggestion: '네트워크 연결 상태를 확인한 후 다시 시도해주세요.',
        actions: [
          {
            label: '새로고침',
            onClick: () => window.location.reload(),
            variant: 'primary',
            icon: <RefreshCw className="w-4 h-4" />,
          },
          {
            label: '홈으로',
            onClick: () => navigate('/'),
            variant: 'secondary',
            icon: <Home className="w-4 h-4" />,
          },
        ],
        technicalDetails: `Network Error: ${error.message}`,
      };
    }

    // Default error
    return getDefaultError();
  };

  const getDefaultError = (): ErrorContent => {
    const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
    return {
      icon: <AlertCircle className="w-12 h-12" />,
      iconColor: 'text-[#C67B5C]',
      iconBg: 'bg-[#C67B5C]/15',
      title: '문제가 발생했어요',
      description: '예상치 못한 오류가 발생했습니다.',
      suggestion: '페이지를 새로고침하거나 잠시 후 다시 시도해주세요.',
      actions: [
        {
          label: '새로고침',
          onClick: () => window.location.reload(),
          variant: 'primary',
          icon: <RefreshCw className="w-4 h-4" />,
        },
        {
          label: '홈으로',
          onClick: () => navigate('/'),
          variant: 'secondary',
          icon: <Home className="w-4 h-4" />,
        },
      ],
      technicalDetails: errorMessage,
    };
  };

  const content = getErrorContent();

  return (
    <div className="min-h-screen bg-[var(--bg-dark)] flex items-center justify-center px-4 py-12">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="max-w-md w-full"
      >
        {/* Error Icon — Recognition over Recall */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          className="flex justify-center mb-6"
        >
          <div className={`${content.iconBg} ${content.iconColor} w-20 h-20 rounded-2xl flex items-center justify-center`}>
            {content.icon}
          </div>
        </motion.div>

        {/* Error Content — Miller's Law: Chunked information */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          className="text-center mb-8"
        >
          {/* Title */}
          <h1 className="text-2xl lg:text-3xl font-serif font-semibold text-[var(--text-primary)] mb-3">
            {content.title}
          </h1>

          {/* Description */}
          <p className="text-[var(--text-secondary)] text-base leading-relaxed mb-2">
            {content.description}
          </p>

          {/* Suggestion */}
          <p className="text-[var(--text-muted)] text-sm leading-relaxed">
            {content.suggestion}
          </p>
        </motion.div>

        {/* Actions — Hick's Law: Limited choices, Fitts's Law: Large targets */}
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
          className="space-y-3 mb-6"
        >
          {content.actions.map((action, index) => (
            <button
              key={index}
              onClick={action.onClick}
              className={`
                w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-xl font-medium transition-all
                ${action.variant === 'primary'
                  ? 'bg-[var(--accent-green)] text-white hover:bg-[var(--accent-green)]/90 shadow-lg shadow-[var(--accent-green)]/25'
                  : 'bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] border border-[var(--border)]'
                }
              `}
            >
              {action.icon}
              {action.label}
            </button>
          ))}
        </motion.div>

        {/* Technical Details — Progressive Disclosure */}
        {content.technicalDetails && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.4 }}
            className="mt-6"
          >
            <button
              onClick={() => setShowDetails(!showDetails)}
              className="w-full text-xs text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors text-center"
            >
              {showDetails ? '기술 정보 숨기기' : '기술 정보 보기'}
            </button>

            {showDetails && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="mt-3 bg-[var(--bg-surface)] border border-[var(--border)] rounded-lg p-4 overflow-hidden"
              >
                <pre className="text-xs text-[var(--text-muted)] font-mono whitespace-pre-wrap break-words">
                  {content.technicalDetails}
                </pre>
              </motion.div>
            )}
          </motion.div>
        )}

        {/* Decorative element — Aesthetic-Usability Effect */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="mt-8 text-center"
        >
          <p className="text-xs text-[var(--text-muted)]">
            문제가 계속되면{' '}
            <Link 
              to="/connections" 
              className="text-[var(--accent-green)] hover:underline"
            >
              고객센터
            </Link>
            로 문의해주세요
          </p>
        </motion.div>
      </motion.div>

      {/* Background ambient glow */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden -z-10">
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.03, 0.05, 0.03],
          }}
          transition={{
            duration: 8,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 rounded-full"
          style={{
            background: `radial-gradient(circle, ${content.iconColor.replace('text-', '')} 0%, transparent 70%)`,
          }}
        />
      </div>
    </div>
  );
}
