import { Home, BookMarked, Users, User, BookOpen } from 'lucide-react';
import { Link, useLocation, Outlet } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { useScrap } from '../context/scrap-context';
import { useState, useEffect } from 'react';

const navItems = [
  { path: '/', icon: Home, label: '홈', key: 'home' },
  { path: '/library', icon: BookMarked, label: '내 서재', key: 'library' },
  { path: '/connections', icon: Users, label: '연결', key: 'connections' },
  { path: '/profile', icon: User, label: '프로필', key: 'profile' },
];

const readingQuotes = [
  '이 시간은 낭비가 아니다',
  '천천히, 깊게 읽는다',
  '좋은 책은 여러 번 읽힌다',
  '읽는 것은 생각하는 것이다',
  '오늘도 한 페이지',
];

export function AppLayout() {
  const location = useLocation();
  const { newSaveCount, clearNewSaves } = useScrap();
  const [quote, setQuote] = useState('');

  // Check if current page should hide navigation
  const hideNav = location.pathname === '/login' || location.pathname === '/onboarding';

  useEffect(() => {
    const randomQuote = readingQuotes[Math.floor(Math.random() * readingQuotes.length)];
    setQuote(randomQuote);
  }, []);

  function handleNavClick(key: string) {
    if (key === 'library') {
      clearNewSaves();
    }
  }

  // If navigation should be hidden, just render the outlet
  if (hideNav) {
    return <Outlet />;
  }

  return (
    <div className="min-h-screen bg-[var(--bg-dark)] lg:flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:flex lg:flex-col lg:w-64 xl:w-72 lg:fixed lg:inset-y-0 lg:left-0 bg-[var(--bg-surface)] border-r border-[var(--border)]">
        {/* Logo */}
        <div className="flex items-center gap-3 px-6 py-8">
          <div className="w-9 h-9 rounded-lg bg-[var(--accent-green)] flex items-center justify-center">
            <BookOpen className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-serif text-[var(--text-primary)]">
            dots
          </span>
        </div>

        {/* Nav Links */}
        <nav className="flex-1 px-4 space-y-1">
          {navItems.map((item) => {
            const isActive =
              location.pathname === item.path ||
              (item.path !== '/' && location.pathname.startsWith(item.path));
            const Icon = item.icon;
            const showBadge = item.key === 'library' && newSaveCount > 0 && !isActive;

            return (
              <Link
                key={item.path}
                to={item.path}
                onClick={() => handleNavClick(item.key)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl transition-colors ${
                  isActive
                    ? 'bg-[var(--accent-green)]/10 text-[var(--accent-green)]'
                    : 'text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]'
                }`}
              >
                <div className="relative">
                  <Icon className="w-5 h-5" strokeWidth={isActive ? 2.5 : 2} />
                  <AnimatePresence>
                    {showBadge && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        className="absolute -top-1.5 -right-1.5 min-w-[16px] h-4 px-1 flex items-center justify-center bg-[var(--accent-green)] text-white text-[10px] font-bold rounded-full"
                      >
                        {newSaveCount > 9 ? '9+' : newSaveCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <span className="text-sm font-medium">{item.label}</span>
                {showBadge && (
                  <span className="ml-auto text-[10px] text-[var(--accent-green)] font-medium">
                    +{newSaveCount} new
                  </span>
                )}
              </Link>
            );
          })}
        </nav>

        {/* Bottom info */}
        <div className="px-6 py-6 border-t border-[var(--border)]">
          <p className="text-xs text-[var(--text-muted)]">
            {quote}
          </p>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 lg:ml-64 xl:ml-72">
        <Outlet />
      </main>

      {/* Mobile Bottom Tab Bar */}
      <nav className="lg:hidden fixed bottom-0 left-0 right-0 bg-[var(--bg-surface)] border-t border-[var(--border)] safe-area-inset-bottom z-50">
        <div className="flex items-center justify-around max-w-md mx-auto px-6 py-3">
          {navItems.map((tab) => {
            const isActive =
              location.pathname === tab.path ||
              (tab.path !== '/' && location.pathname.startsWith(tab.path));
            const Icon = tab.icon;
            const showBadge = tab.key === 'library' && newSaveCount > 0 && !isActive;

            return (
              <Link
                key={tab.path}
                to={tab.path}
                onClick={() => handleNavClick(tab.key)}
                className="flex flex-col items-center gap-1 min-w-0 relative"
              >
                <div className="relative">
                  <Icon
                    className={`w-5 h-5 transition-colors ${
                      isActive
                        ? 'text-[var(--accent-green)]'
                        : 'text-[var(--text-muted)]'
                    }`}
                    strokeWidth={isActive ? 2.5 : 2}
                  />
                  <AnimatePresence>
                    {showBadge && (
                      <motion.span
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        exit={{ scale: 0 }}
                        transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                        className="absolute -top-1 -right-2.5 min-w-[14px] h-3.5 px-0.5 flex items-center justify-center bg-[var(--accent-green)] text-white text-[9px] font-bold rounded-full"
                      >
                        {newSaveCount > 9 ? '9+' : newSaveCount}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </div>
                <span
                  className={`text-[10px] transition-colors ${
                    isActive
                      ? 'text-[var(--accent-green)]'
                      : 'text-[var(--text-muted)]'
                  }`}
                >
                  {tab.label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}