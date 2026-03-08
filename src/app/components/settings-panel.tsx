import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  X, 
  Bell, 
  Tag, 
  Lock, 
  FileText, 
  LogOut, 
  Sun, 
  Moon,
  Info,
  ChevronRight,
  Check
} from 'lucide-react';
import { useNavigate } from 'react-router';
import { toast } from 'sonner';
import { useUser } from '../context/user-context';

interface SettingsPanelProps {
  isOpen: boolean;
  onClose: () => void;
  userEmail?: string;
}

export function SettingsPanel({ isOpen, onClose, userEmail }: SettingsPanelProps) {
  const navigate = useNavigate();
  const { logout } = useUser();
  
  // Notification settings
  const [pushNotifications, setPushNotifications] = useState(true);
  const [readingReminders, setReadingReminders] = useState(true);
  const [socialNotifications, setSocialNotifications] = useState(false);
  
  // Theme setting
  const [theme, setTheme] = useState<'dark' | 'light'>('dark');
  
  // Confirmation dialogs
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  
  // Nested panels
  const [activePanel, setActivePanel] = useState<
    'main' | 'notifications' | 'interests' | 'accounts' | 'terms' | 'theme' | 'about'
  >('main');

  function handleLogout() {
    // Use logout from UserContext to properly clear all data
    logout();
    onClose();
    toast.success('로그아웃되었습니다');
    navigate('/login');
  }

  function handleInterestsChange() {
    toast.success('관심사가 업데이트되었습니다');
    setActivePanel('main');
  }

  const connectedAccounts = [
    { provider: 'kakao', name: '카카오', connected: true },
    { provider: 'google', name: 'Google', connected: false },
    { provider: 'naver', name: '네이버', connected: false },
    { provider: 'apple', name: 'Apple', connected: false },
  ];

  const interests = [
    '철학', '심리학', '기술', '디자인', '문학', '역사',
    '과학', '예술', '경제', '사회', '환경', '건강'
  ];
  
  const [selectedInterests, setSelectedInterests] = useState(['철학', '심리학', '기술']);

  function toggleInterest(interest: string) {
    if (selectedInterests.includes(interest)) {
      if (selectedInterests.length > 3) {
        setSelectedInterests(selectedInterests.filter(i => i !== interest));
      } else {
        toast.error('최소 3개 이상 선택해주세요');
      }
    } else {
      setSelectedInterests([...selectedInterests, interest]);
    }
  }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 z-50 backdrop-blur-sm"
          />

          {/* Settings Panel */}
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 bottom-0 w-full md:w-[480px] bg-[var(--bg-dark)] z-50 overflow-y-auto"
          >
            {/* Header */}
            <div className="sticky top-0 bg-[var(--bg-dark)] border-b border-[var(--border)] px-6 py-4 flex items-center justify-between">
              <h2 className="text-xl font-serif text-[var(--text-primary)]">
                {activePanel === 'main' && '설정'}
                {activePanel === 'notifications' && '알림 설정'}
                {activePanel === 'interests' && '관심사 변경'}
                {activePanel === 'accounts' && '로그인 설정'}
                {activePanel === 'terms' && '약관 및 정책'}
                {activePanel === 'theme' && '테마 설정'}
                {activePanel === 'about' && '앱 정보'}
              </h2>
              <button
                onClick={activePanel === 'main' ? onClose : () => setActivePanel('main')}
                className="p-2 text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors"
                aria-label={activePanel === 'main' ? '닫기' : '뒤로'}
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Main Settings */}
            {activePanel === 'main' && (
              <div className="p-6 space-y-6">
                {/* Account Info */}
                {userEmail && (
                  <div className="pb-6 border-b border-[var(--border)]">
                    <p className="text-sm text-[var(--text-muted)] mb-1">로그인 계정</p>
                    <p className="text-base text-[var(--text-primary)]">{userEmail}</p>
                  </div>
                )}

                {/* Settings Groups - Fitts' Law: Minimum 44px touch target */}
                <div className="space-y-2">
                  <SettingItem
                    icon={<Bell className="w-5 h-5" />}
                    label="알림 설정"
                    onClick={() => setActivePanel('notifications')}
                  />
                  <SettingItem
                    icon={<Tag className="w-5 h-5" />}
                    label="관심사 변경"
                    onClick={() => setActivePanel('interests')}
                  />
                  <SettingItem
                    icon={<Lock className="w-5 h-5" />}
                    label="로그인 설정"
                    description="연결된 계정 관리"
                    onClick={() => setActivePanel('accounts')}
                  />
                  <SettingItem
                    icon={theme === 'dark' ? <Moon className="w-5 h-5" /> : <Sun className="w-5 h-5" />}
                    label="테마 설정"
                    onClick={() => setActivePanel('theme')}
                  />
                </div>

                {/* Information Group */}
                <div className="space-y-2 pt-4 border-t border-[var(--border)]">
                  <SettingItem
                    icon={<FileText className="w-5 h-5" />}
                    label="약관 및 정책"
                    onClick={() => setActivePanel('terms')}
                  />
                  <SettingItem
                    icon={<Info className="w-5 h-5" />}
                    label="앱 정보"
                    description="버전 1.0.0"
                    onClick={() => setActivePanel('about')}
                  />
                </div>

                {/* Danger Zone - Visual hierarchy: separated and colored */}
                <div className="pt-6 border-t border-[var(--border)]">
                  <button
                    onClick={() => setShowLogoutConfirm(true)}
                    className="w-full flex items-center justify-between p-4 rounded-xl bg-red-500/10 hover:bg-red-500/20 transition-colors min-h-[44px]"
                  >
                    <div className="flex items-center gap-3">
                      <LogOut className="w-5 h-5 text-red-400" />
                      <span className="text-red-400 font-medium">로그아웃</span>
                    </div>
                  </button>
                </div>
              </div>
            )}

            {/* Notification Settings Panel */}
            {activePanel === 'notifications' && (
              <div className="p-6 space-y-4">
                <p className="text-sm text-[var(--text-muted)] mb-6">
                  원하는 알림만 받아보세요
                </p>
                
                <ToggleItem
                  label="푸시 알림"
                  description="새로운 추천 글과 업데이트 알림"
                  checked={pushNotifications}
                  onChange={setPushNotifications}
                />
                <ToggleItem
                  label="읽기 리마인더"
                  description="매일 오전 9시 읽기 시간 알림"
                  checked={readingReminders}
                  onChange={setReadingReminders}
                />
                <ToggleItem
                  label="소셜 알림"
                  description="다른 독자의 반응과 활동 알림"
                  checked={socialNotifications}
                  onChange={setSocialNotifications}
                />
              </div>
            )}

            {/* Interests Panel */}
            {activePanel === 'interests' && (
              <div className="p-6">
                <p className="text-sm text-[var(--text-muted)] mb-6">
                  최소 3개 이상 선택해주세요
                </p>
                
                <div className="grid grid-cols-2 gap-3 mb-6">
                  {interests.map((interest) => {
                    const isSelected = selectedInterests.includes(interest);
                    return (
                      <button
                        key={interest}
                        onClick={() => toggleInterest(interest)}
                        className={`p-4 rounded-xl border-2 transition-all min-h-[56px] ${
                          isSelected
                            ? 'border-[var(--accent-green)] bg-[var(--accent-green)]/10'
                            : 'border-[var(--border)] hover:border-[var(--text-muted)]'
                        }`}
                      >
                        <span className={`font-medium ${
                          isSelected ? 'text-[var(--accent-green)]' : 'text-[var(--text-primary)]'
                        }`}>
                          {interest}
                        </span>
                      </button>
                    );
                  })}
                </div>

                <button
                  onClick={handleInterestsChange}
                  disabled={selectedInterests.length < 3}
                  className="w-full py-4 rounded-xl bg-[var(--accent-green)] text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed hover:bg-[var(--accent-green)]/90 transition-colors"
                >
                  저장하기
                </button>
              </div>
            )}

            {/* Login Settings Panel */}
            {activePanel === 'accounts' && (
              <div className="p-6 space-y-4">
                <p className="text-sm text-[var(--text-muted)] mb-6">
                  여러 계정을 연결하여 안전하게 로그인하세요
                </p>

                {connectedAccounts.map((account) => (
                  <div
                    key={account.provider}
                    className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-surface)] min-h-[60px]"
                  >
                    <div>
                      <p className="text-base text-[var(--text-primary)] font-medium mb-1">
                        {account.name}
                      </p>
                      <p className="text-xs text-[var(--text-muted)]">
                        {account.connected ? '연결됨' : '연결 안 됨'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (account.connected) {
                          toast('메인 계정은 연결 해제할 수 없습니다');
                        } else {
                          toast.success(`${account.name} 계정이 연결되었습니다`);
                        }
                      }}
                      className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                        account.connected
                          ? 'bg-[var(--accent-green)]/10 text-[var(--accent-green)] cursor-not-allowed'
                          : 'bg-[var(--bg-dark)] text-[var(--text-muted)] hover:text-[var(--text-primary)]'
                      }`}
                    >
                      {account.connected ? '연결됨' : '연결'}
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Terms Panel */}
            {activePanel === 'terms' && (
              <div className="p-6 space-y-2">
                <SettingItem
                  label="서비스 이용약관"
                  onClick={() => {
                    toast('준비 중입니다');
                  }}
                />
                <SettingItem
                  label="개인정보 처리방침"
                  onClick={() => {
                    toast('준비 중입니다');
                  }}
                />
                <SettingItem
                  label="오픈소스 라이선스"
                  onClick={() => {
                    toast('준비 중입니다');
                  }}
                />
              </div>
            )}

            {/* Theme Panel */}
            {activePanel === 'theme' && (
              <div className="p-6 space-y-3">
                <p className="text-sm text-[var(--text-muted)] mb-6">
                  편안한 읽기 환경을 선택하세요
                </p>

                <button
                  onClick={() => {
                    setTheme('dark');
                    toast.success('다크 테마로 변경되었습니다');
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all min-h-[60px] ${
                    theme === 'dark'
                      ? 'border-[var(--accent-green)] bg-[var(--accent-green)]/10'
                      : 'border-[var(--border)] hover:border-[var(--text-muted)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Moon className="w-5 h-5" />
                    <div className="text-left">
                      <p className="font-medium text-[var(--text-primary)]">다크 모드</p>
                      <p className="text-xs text-[var(--text-muted)]">눈의 피로를 줄여줍니다</p>
                    </div>
                  </div>
                  {theme === 'dark' && (
                    <Check className="w-5 h-5 text-[var(--accent-green)]" />
                  )}
                </button>

                <button
                  onClick={() => {
                    setTheme('light');
                    toast('라이트 테마는 곧 추가될 예정입니다');
                  }}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border-2 transition-all min-h-[60px] ${
                    theme === 'light'
                      ? 'border-[var(--accent-green)] bg-[var(--accent-green)]/10'
                      : 'border-[var(--border)] hover:border-[var(--text-muted)]'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Sun className="w-5 h-5" />
                    <div className="text-left">
                      <p className="font-medium text-[var(--text-muted)]">라이트 모드</p>
                      <p className="text-xs text-[var(--text-muted)]">곧 추가될 예정입니다</p>
                    </div>
                  </div>
                  {theme === 'light' && (
                    <Check className="w-5 h-5 text-[var(--accent-green)]" />
                  )}
                </button>
              </div>
            )}

            {/* About Panel */}
            {activePanel === 'about' && (
              <div className="p-6">
                <div className="text-center mb-8">
                  <div className="w-20 h-20 mx-auto mb-4 rounded-2xl bg-[var(--accent-green)]/10 flex items-center justify-center">
                    <span className="text-4xl font-serif text-[var(--accent-green)]">dots</span>
                  </div>
                  <h3 className="text-lg font-serif text-[var(--text-primary)] mb-2">
                    dots
                  </h3>
                  <p className="text-sm text-[var(--text-muted)]">
                    의도적 소비 중심의 리딩
                  </p>
                </div>

                <div className="space-y-4 text-sm">
                  <div className="flex justify-between py-3 border-b border-[var(--border)]">
                    <span className="text-[var(--text-muted)]">버전</span>
                    <span className="text-[var(--text-primary)]">1.0.0</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-[var(--border)]">
                    <span className="text-[var(--text-muted)]">최근 업데이트</span>
                    <span className="text-[var(--text-primary)]">2026.02.20</span>
                  </div>
                  <div className="flex justify-between py-3 border-b border-[var(--border)]">
                    <span className="text-[var(--text-muted)]">개발</span>
                    <span className="text-[var(--text-primary)]">dots Team</span>
                  </div>
                </div>

                <div className="mt-8 p-4 rounded-xl bg-[var(--bg-surface)]">
                  <p className="text-xs text-[var(--text-muted)] text-center leading-relaxed">
                    이 시간은 낭비가 아니다.<br />
                    의도적인 읽기가 만드는 변화를 경험하세요.
                  </p>
                </div>
              </div>
            )}
          </motion.div>

          {/* Logout Confirmation Dialog */}
          <AnimatePresence>
            {showLogoutConfirm && (
              <>
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  className="fixed inset-0 bg-black/80 z-[60] flex items-center justify-center p-6"
                  onClick={() => setShowLogoutConfirm(false)}
                >
                  <motion.div
                    initial={{ scale: 0.9, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.9, opacity: 0 }}
                    onClick={(e) => e.stopPropagation()}
                    className="bg-[var(--bg-surface)] rounded-2xl p-6 max-w-sm w-full"
                  >
                    <h3 className="text-xl font-serif text-[var(--text-primary)] mb-2">
                      로그아웃하시겠어요?
                    </h3>
                    <p className="text-sm text-[var(--text-muted)] mb-6">
                      언제든 다시 돌아올 수 있어요
                    </p>
                    
                    <div className="flex gap-3">
                      <button
                        onClick={() => setShowLogoutConfirm(false)}
                        className="flex-1 py-3 rounded-xl bg-[var(--bg-dark)] text-[var(--text-primary)] font-medium hover:bg-[var(--bg-dark)]/80 transition-colors"
                      >
                        취소
                      </button>
                      <button
                        onClick={handleLogout}
                        className="flex-1 py-3 rounded-xl bg-red-500 text-white font-medium hover:bg-red-600 transition-colors"
                      >
                        로그아웃
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              </>
            )}
          </AnimatePresence>
        </>
      )}
    </AnimatePresence>
  );
}

// Reusable Setting Item Component - Fitts' Law: 44px minimum height
function SettingItem({
  icon,
  label,
  description,
  onClick,
}: {
  icon?: React.ReactNode;
  label: string;
  description?: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center justify-between p-4 rounded-xl bg-[var(--bg-surface)] hover:bg-[var(--bg-surface-hover)] transition-colors min-h-[60px]"
    >
      <div className="flex items-center gap-3 flex-1 text-left">
        {icon && <div className="text-[var(--text-muted)]">{icon}</div>}
        <div>
          <p className="text-base text-[var(--text-primary)] font-medium">{label}</p>
          {description && (
            <p className="text-xs text-[var(--text-muted)] mt-0.5">{description}</p>
          )}
        </div>
      </div>
      <ChevronRight className="w-5 h-5 text-[var(--text-muted)]" />
    </button>
  );
}

// Toggle Switch Component with clear visual feedback
function ToggleItem({
  label,
  description,
  checked,
  onChange,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
}) {
  return (
    <div className="flex items-center justify-between p-4 rounded-xl bg-[var(--bg-surface)] min-h-[72px]">
      <div className="flex-1 pr-4">
        <p className="text-base text-[var(--text-primary)] font-medium mb-1">{label}</p>
        <p className="text-xs text-[var(--text-muted)]">{description}</p>
      </div>
      <button
        onClick={() => {
          onChange(!checked);
          toast.success(checked ? '알림이 해제되었습니다' : '알림이 활성화되었습니다');
        }}
        className={`relative w-12 h-7 rounded-full transition-colors flex-shrink-0 ${
          checked ? 'bg-[var(--accent-green)]' : 'bg-[var(--bg-dark)]'
        }`}
        role="switch"
        aria-checked={checked}
      >
        <motion.div
          animate={{ x: checked ? 22 : 2 }}
          transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          className="absolute top-1 w-5 h-5 bg-white rounded-full shadow-lg"
        />
      </button>
    </div>
  );
}