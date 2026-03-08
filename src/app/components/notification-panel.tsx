import { useEffect, useState, useRef, useCallback } from 'react';
import { Link } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';
import { useUser } from '../context/user-context';
import { api } from '../lib/api';

interface Notification {
  id: string;
  type: string;
  title: string;
  message: string;
  icon: string;
  isRead: boolean;
  createdAt: string;
  actionUrl?: string;
}

interface NotificationPanelProps {
  isOpen: boolean;
  onClose: () => void;
  unreadCount: number;
  onUnreadCountChange: (count: number) => void;
}

export function NotificationPanel({
  isOpen,
  onClose,
  unreadCount,
  onUnreadCountChange,
}: NotificationPanelProps) {
  const { userId } = useUser();
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const panelRef = useRef<HTMLDivElement>(null);

  const loadNotifications = useCallback(async () => {
    try {
      setLoading(true);
      const data = await api.getNotifications(userId);
      setNotifications(data.notifications);
      onUnreadCountChange(data.unreadCount);
    } catch (error) {
      console.error('Failed to load notifications:', error);
    } finally {
      setLoading(false);
    }
  }, [userId, onUnreadCountChange]);

  useEffect(() => {
    if (isOpen) {
      loadNotifications();
    }
  }, [isOpen, loadNotifications]);

  // Close on ESC key
  useEffect(() => {
    function handleEscape(e: KeyboardEvent) {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    }
    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  // Close on click outside (desktop only)
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (
        isOpen &&
        panelRef.current &&
        !panelRef.current.contains(e.target as Node) &&
        window.innerWidth >= 1024
      ) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen, onClose]);

  async function handleMarkRead(notificationId: string, actionUrl?: string) {
    try {
      const data = await api.markNotificationRead(userId, notificationId);
      
      setNotifications((prev) =>
        prev.map((n) => (n.id === notificationId ? { ...n, isRead: true } : n))
      );
      onUnreadCountChange(data.unreadCount);

      if (actionUrl) {
        onClose();
      }
    } catch (error) {
      console.error('Failed to mark notification as read:', error);
    }
  }

  async function handleMarkAllRead() {
    try {
      await api.markAllNotificationsRead(userId);
      setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
      onUnreadCountChange(0);
    } catch (error) {
      console.error('Failed to mark all as read:', error);
    }
  }

  function getTimeAgo(dateString: string) {
    const now = Date.now();
    const past = new Date(dateString).getTime();
    const diffMs = now - past;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return '방금';
    if (diffMins < 60) return `${diffMins}분 전`;
    if (diffHours < 24) return `${diffHours}시간 전`;
    return `${diffDays}일 전`;
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Mobile: Full-screen modal */}
          <div className="lg:hidden">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/60 z-50"
            />

            {/* Modal sliding up from bottom */}
            <motion.div
              ref={panelRef}
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              className="fixed inset-x-0 bottom-0 bg-[var(--bg-surface)] rounded-t-2xl z-50 max-h-[85vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
                <div>
                  <h2 className="text-lg font-serif text-[var(--text-primary)]">
                    알림
                  </h2>
                  {unreadCount > 0 && (
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {unreadCount}개의 새 알림
                    </p>
                  )}
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-[var(--bg-dark)] transition-colors"
                  aria-label="닫기"
                >
                  <X className="w-5 h-5 text-[var(--text-muted)]" />
                </button>
              </div>

              {/* Mark all read button */}
              {unreadCount > 0 && (
                <div className="px-6 py-2 border-b border-[var(--border)]">
                  <button
                    onClick={handleMarkAllRead}
                    className="text-sm text-[var(--accent-green)] hover:underline"
                  >
                    모두 읽음으로 표시
                  </button>
                </div>
              )}

              {/* Notifications list */}
              <div className="flex-1 overflow-y-auto px-6 py-2">
                {loading ? (
                  <div className="space-y-3 py-4">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="bg-[var(--bg-dark)] rounded-xl p-4 animate-pulse"
                      >
                        <div className="h-4 bg-[var(--bg-surface)] rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-[var(--bg-surface)] rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-sm text-[var(--text-muted)]">
                      알림이 없습니다
                    </p>
                  </div>
                ) : (
                  <div className="space-y-2 py-2">
                    {notifications.map((notif) => (
                      <NotificationItem
                        key={notif.id}
                        notification={notif}
                        onMarkRead={handleMarkRead}
                        getTimeAgo={getTimeAgo}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          {/* Desktop: Dropdown panel */}
          <div className="hidden lg:block">
            <motion.div
              ref={panelRef}
              initial={{ opacity: 0, y: -10, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -10, scale: 0.95 }}
              transition={{ duration: 0.15 }}
              className="absolute top-14 right-6 w-96 bg-[var(--bg-surface)] border border-[var(--border)] rounded-xl shadow-2xl z-50 max-h-[600px] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between px-5 py-4 border-b border-[var(--border)]">
                <div>
                  <h2 className="text-base font-serif text-[var(--text-primary)]">
                    알림
                  </h2>
                  {unreadCount > 0 && (
                    <p className="text-xs text-[var(--text-muted)] mt-0.5">
                      {unreadCount}개의 새 알림
                    </p>
                  )}
                </div>
                {unreadCount > 0 && (
                  <button
                    onClick={handleMarkAllRead}
                    className="text-xs text-[var(--accent-green)] hover:underline"
                  >
                    모두 읽음
                  </button>
                )}
              </div>

              {/* Notifications list */}
              <div className="flex-1 overflow-y-auto">
                {loading ? (
                  <div className="space-y-2 p-3">
                    {[1, 2, 3].map((i) => (
                      <div
                        key={i}
                        className="bg-[var(--bg-dark)] rounded-lg p-3 animate-pulse"
                      >
                        <div className="h-4 bg-[var(--bg-surface)] rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-[var(--bg-surface)] rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : notifications.length === 0 ? (
                  <div className="py-12 text-center">
                    <p className="text-sm text-[var(--text-muted)]">
                      알림이 없습니다
                    </p>
                  </div>
                ) : (
                  <div className="p-2">
                    {notifications.map((notif) => (
                      <NotificationItem
                        key={notif.id}
                        notification={notif}
                        onMarkRead={handleMarkRead}
                        getTimeAgo={getTimeAgo}
                      />
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}

// Notification Item Component
function NotificationItem({
  notification,
  onMarkRead,
  getTimeAgo,
}: {
  notification: Notification;
  onMarkRead: (id: string, actionUrl?: string) => void;
  getTimeAgo: (date: string) => string;
}) {
  const content = (
    <div
      className={`p-3 rounded-lg transition-colors cursor-pointer ${
        notification.isRead
          ? 'hover:bg-[var(--bg-dark)]'
          : 'bg-[var(--accent-green)]/5 hover:bg-[var(--accent-green)]/10'
      }`}
      onClick={() => onMarkRead(notification.id, notification.actionUrl)}
    >
      <div className="flex gap-3">
        {/* Icon */}
        <div className="flex-shrink-0 w-10 h-10 rounded-full bg-[var(--bg-dark)] flex items-center justify-center text-lg">
          {notification.icon}
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-1">
            <h3
              className={`text-sm font-medium ${
                notification.isRead
                  ? 'text-[var(--text-primary)]'
                  : 'text-[var(--text-primary)]'
              }`}
            >
              {notification.title}
            </h3>
            {!notification.isRead && (
              <span className="flex-shrink-0 w-2 h-2 bg-[var(--accent-green)] rounded-full mt-1.5" />
            )}
          </div>
          <p className="text-xs text-[var(--text-muted)] mb-1">
            {notification.message}
          </p>
          <p className="text-xs text-[var(--text-muted)]">
            {getTimeAgo(notification.createdAt)}
          </p>
        </div>
      </div>
    </div>
  );

  if (notification.actionUrl) {
    return (
      <Link to={notification.actionUrl} onClick={() => onMarkRead(notification.id)}>
        {content}
      </Link>
    );
  }

  return content;
}
