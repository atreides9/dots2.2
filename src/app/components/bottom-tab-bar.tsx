import { Home, BookMarked, Users, User } from 'lucide-react';
import { Link, useLocation } from 'react-router';

export function BottomTabBar() {
  const location = useLocation();
  
  const tabs = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/library', icon: BookMarked, label: 'My Library' },
    { path: '/connections', icon: Users, label: 'Connections' },
    { path: '/profile', icon: User, label: 'Profile' },
  ];

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-[var(--bg-surface)] border-t border-[var(--border)] safe-area-inset-bottom">
      <div className="flex items-center justify-around max-w-md mx-auto px-6 py-3">
        {tabs.map((tab) => {
          const isActive = location.pathname === tab.path || 
            (tab.path !== '/' && location.pathname.startsWith(tab.path));
          const Icon = tab.icon;
          
          return (
            <Link
              key={tab.path}
              to={tab.path}
              className="flex flex-col items-center gap-1 min-w-0"
            >
              <Icon 
                className={`w-5 h-5 transition-colors ${
                  isActive ? 'text-[var(--accent-green)]' : 'text-[var(--text-muted)]'
                }`}
                strokeWidth={isActive ? 2.5 : 2}
              />
              <span 
                className={`text-[10px] transition-colors ${
                  isActive ? 'text-[var(--accent-green)]' : 'text-[var(--text-muted)]'
                }`}
              >
                {tab.label}
              </span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
