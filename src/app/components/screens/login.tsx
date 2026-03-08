import { motion } from 'motion/react';
import { useNavigate } from 'react-router';
import { Leaf } from 'lucide-react';
import { useUser } from '../../context/user-context';

const socialProviders = [
  {
    id: 'kakao',
    name: '카카오로 시작하기',
    bgColor: '#FEE500',
    textColor: '#191919',
    icon: '💬',
  },
  {
    id: 'naver',
    name: '네이버로 시작하기',
    bgColor: '#03C75A',
    textColor: '#FFFFFF',
    icon: 'N',
  },
  {
    id: 'google',
    name: 'Google로 시작하기',
    bgColor: '#FFFFFF',
    textColor: '#191919',
    icon: 'G',
  },
  {
    id: 'apple',
    name: 'Apple로 시작하기',
    bgColor: '#000000',
    textColor: '#FFFFFF',
    icon: '',
  },
];

export function Login() {
  const navigate = useNavigate();
  const { setUserId } = useUser();

  function handleSocialLogin(providerId: string) {
    // Set authenticated state
    localStorage.setItem('brainmate-authenticated', 'true');
    
    // Generate user ID based on provider
    const newUserId = `${providerId}-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    setUserId(newUserId);
    
    // Navigate to onboarding after social login
    navigate('/onboarding');
  }

  return (
    <div className="min-h-screen bg-[var(--bg-dark)] flex flex-col items-center justify-between px-6 py-12">
      {/* Logo and tagline - positioned at ~30% from top */}
      <div className="flex-1 flex flex-col items-center justify-center max-w-md w-full" style={{ marginTop: '-10vh' }}>
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6 }}
          className="text-center mb-12"
        >
          {/* Logo with botanical accent */}
          <div className="flex items-center justify-center gap-2 mb-3">
            <h1 className="text-[28px] font-serif text-[var(--text-primary)]">
              dots
            </h1>
            <Leaf className="w-5 h-5 text-[var(--accent-green)]" />
          </div>
          
          {/* Tagline */}
          <p className="text-sm text-[var(--text-muted)]">
            의도적 소비 중심의 리딩
          </p>
        </motion.div>

        {/* Social login buttons */}
        <div className="w-full space-y-3 max-w-sm">
          {socialProviders.map((provider, index) => (
            <motion.button
              key={provider.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2 + index * 0.1 }}
              whileTap={{ scale: 0.97, opacity: 0.85 }}
              onClick={() => handleSocialLogin(provider.id)}
              style={{
                backgroundColor: provider.bgColor,
                color: provider.textColor,
              }}
              className="w-full h-14 rounded-xl flex items-center justify-center gap-3 font-medium text-[15px] transition-all"
            >
              <span className="text-xl">{provider.icon}</span>
              <span>{provider.name}</span>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Legal caption at bottom */}
      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.8 }}
        className="text-[11px] text-[var(--text-muted)] text-center max-w-sm"
      >
        계속 진행하면 dots의{' '}
        <span className="underline">서비스 이용약관</span> 및{' '}
        <span className="underline">개인정보 처리방침</span>에 동의하는 것으로 간주됩니다
      </motion.p>
    </div>
  );
}