import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { useNavigate } from 'react-router';
import { Sprout, ChevronLeft } from 'lucide-react';

const TOPICS = [
  '기술', '디자인', '비즈니스', '철학',
  '과학', '예술', '심리학', '역사',
  '문학', '경제',
];

const READING_GOALS = [
  { id: 'light', label: '가볍게', duration: '15분' },
  { id: 'moderate', label: '적당히', duration: '30분' },
  { id: 'deep', label: '깊이있게', duration: '60분' },
];

const CONTENT_LENGTHS = [
  { id: 'short', label: '간단하게 읽을 수 있는 짧은 글', duration: '5분 이내' },
  { id: 'long', label: '집중해서 읽는 긴 글', duration: '10분 이상' },
];

export function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1); // 1 for forward, -1 for backward

  // Step 0: Topics
  const [selectedTopics, setSelectedTopics] = useState<string[]>([]);

  // Step 1: Reading Goal
  const [readingGoal, setReadingGoal] = useState<string>('');

  // Step 2: Content Lengths
  const [contentLengths, setContentLengths] = useState<string[]>([]);

  function handleSkip() {
    navigate('/');
  }

  function handleBack() {
    if (step > 0) {
      setDirection(-1);
      setStep(step - 1);
    }
  }

  function handleNext() {
    if (step < 3) {
      setDirection(1);
      setStep(step + 1);
    } else {
      // Complete onboarding - save preferences and navigate to home
      savePreferences();
      navigate('/');
    }
  }

  function savePreferences() {
    // Store onboarding preferences in localStorage for now
    localStorage.setItem('dots-onboarding-complete', 'true');
    localStorage.setItem('dots-preferences', JSON.stringify({
      topics: selectedTopics,
      readingGoal,
      contentLengths,
    }));
  }

  function toggleTopic(topic: string) {
    setSelectedTopics((prev) =>
      prev.includes(topic) ? prev.filter((t) => t !== topic) : [...prev, topic]
    );
  }

  function toggleContentLength(length: string) {
    setContentLengths((prev) =>
      prev.includes(length) ? prev.filter((l) => l !== length) : [...prev, length]
    );
  }

  const canProceedStep0 = selectedTopics.length >= 3;
  const canProceedStep1 = readingGoal !== '';
  const canProceedStep2 = contentLengths.length > 0;

  const canProceed = step === 0 ? canProceedStep0 
    : step === 1 ? canProceedStep1 
    : step === 2 ? canProceedStep2 
    : true;

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (direction: number) => ({
      x: direction > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  return (
    <div className="min-h-screen bg-[var(--bg-dark)] flex flex-col px-6 py-8">
      {/* Header: Skip button + Progress indicator */}
      <div className="flex items-center justify-between mb-8">
        {step < 3 ? (
          <button
            onClick={handleSkip}
            className="text-sm text-[var(--text-muted)] hover:text-[var(--text-primary)] transition-colors min-w-[60px] h-[44px] flex items-center justify-center"
          >
            건너뛰기
          </button>
        ) : (
          <div className="min-w-[60px]"></div>
        )}

        {/* Progress indicator with step numbers */}
        <div className="flex flex-col items-center gap-2">
          <div className="text-xs text-[var(--text-muted)] font-medium">
            {step + 1} / 4
          </div>
          <div className="flex items-center gap-2">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className={`rounded-full transition-all duration-300 ${
                  i === step
                    ? 'w-8 h-2 bg-[var(--accent-green)]'
                    : i < step
                    ? 'w-2 h-2 bg-[var(--accent-green)]/50'
                    : 'w-2 h-2 bg-[var(--bg-surface)]'
                }`}
              />
            ))}
          </div>
        </div>

        <div className="min-w-[60px]"></div>
      </div>

      {/* Content area with swipe animation */}
      <div className="flex-1 flex flex-col justify-between max-w-md mx-auto w-full">
        <AnimatePresence mode="wait" custom={direction}>
          <motion.div
            key={step}
            custom={direction}
            variants={slideVariants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{ duration: 0.3, ease: 'easeInOut' }}
            className="flex-1 flex flex-col"
          >
            {/* Step 0: Topics */}
            {step === 0 && (
              <div className="flex flex-col h-full">
                <div className="mb-8">
                  <h2 className="text-[24px] font-serif text-[var(--text-primary)] mb-2">
                    어떤 주제에 관심이 있나요?
                  </h2>
                  <p className="text-sm text-[var(--text-muted)]">
                    최소 3개 이상 선택해 주세요 ({selectedTopics.length}/10)
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                  {TOPICS.map((topic) => {
                    const isSelected = selectedTopics.includes(topic);
                    return (
                      <motion.button
                        key={topic}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => toggleTopic(topic)}
                        className={`h-12 rounded-xl text-sm font-medium transition-all ${
                          isSelected
                            ? 'bg-[var(--accent-green)] text-[var(--bg-dark)] shadow-lg shadow-[var(--accent-green)]/20'
                            : 'bg-[var(--bg-surface)] text-[var(--text-muted)] hover:bg-[var(--bg-surface-hover)] hover:text-[var(--text-primary)]'
                        }`}
                      >
                        {topic}
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 1: Reading Goal */}
            {step === 1 && (
              <div className="flex flex-col h-full">
                <div className="mb-8">
                  <h2 className="text-[24px] font-serif text-[var(--text-primary)] mb-2">
                    하루에 얼마나 읽고 싶나요?
                  </h2>
                  <p className="text-sm text-[var(--text-muted)]">
                    목표 독서 시간을 선택해 주세요
                  </p>
                </div>

                <div className="space-y-3">
                  {READING_GOALS.map((goal) => {
                    const isSelected = readingGoal === goal.id;
                    return (
                      <motion.button
                        key={goal.id}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => setReadingGoal(goal.id)}
                        className={`w-full rounded-xl p-5 text-left transition-all ${
                          isSelected
                            ? 'bg-[var(--accent-green)]/10 border-2 border-[var(--accent-green)]'
                            : 'bg-[var(--bg-surface)] border-2 border-transparent hover:bg-[var(--bg-surface-hover)]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-base font-semibold text-[var(--text-primary)] mb-1">
                              {goal.label}
                            </div>
                            <div className="text-sm text-[var(--text-muted)]">
                              {goal.duration}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="w-6 h-6 rounded-full bg-[var(--accent-green)] flex items-center justify-center">
                              <svg className="w-4 h-4 text-[var(--bg-dark)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 2: Content Length */}
            {step === 2 && (
              <div className="flex flex-col h-full">
                <div className="mb-8">
                  <h2 className="text-[24px] font-serif text-[var(--text-primary)] mb-2">
                    선호하는 콘텐츠 길이는?
                  </h2>
                  <p className="text-sm text-[var(--text-muted)]">
                    복수 선택 가능합니다
                  </p>
                </div>

                <div className="space-y-3">
                  {CONTENT_LENGTHS.map((length) => {
                    const isSelected = contentLengths.includes(length.id);
                    return (
                      <motion.button
                        key={length.id}
                        whileTap={{ scale: 0.97 }}
                        onClick={() => toggleContentLength(length.id)}
                        className={`w-full rounded-xl p-5 text-left transition-all ${
                          isSelected
                            ? 'bg-[var(--accent-green)]/10 border-2 border-[var(--accent-green)]'
                            : 'bg-[var(--bg-surface)] border-2 border-transparent hover:bg-[var(--bg-surface-hover)]'
                        }`}
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="text-base font-semibold text-[var(--text-primary)] mb-1">
                              {length.label}
                            </div>
                            <div className="text-sm text-[var(--text-muted)]">
                              {length.duration}
                            </div>
                          </div>
                          {isSelected && (
                            <div className="w-6 h-6 rounded-full bg-[var(--accent-green)] flex items-center justify-center">
                              <svg className="w-4 h-4 text-[var(--bg-dark)]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                              </svg>
                            </div>
                          )}
                        </div>
                      </motion.button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Step 3: Complete */}
            {step === 3 && (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5, type: 'spring' }}
                  className="mb-8"
                >
                  <div className="w-32 h-32 rounded-full bg-[var(--accent-green)]/10 flex items-center justify-center mb-6">
                    <Sprout className="w-16 h-16 text-[var(--accent-green)]" />
                  </div>
                </motion.div>

                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h2 className="text-[26px] font-serif text-[var(--text-primary)] mb-3">
                    당신의 지적 정원이<br />시작됩니다
                  </h2>
                  <p className="text-sm text-[var(--text-muted)] leading-relaxed">
                    매일 5편의 큐레이션된 글이 기다립니다<br />
                    천천히, 깊게 읽어보세요
                  </p>
                </motion.div>
              </div>
            )}
          </motion.div>
        </AnimatePresence>

        {/* Bottom Navigation Buttons */}
        <div className="space-y-3 mt-8">
          {/* Primary CTA: Next / Start */}
          <motion.button
            whileTap={{ scale: 0.98 }}
            onClick={handleNext}
            disabled={!canProceed}
            className={`w-full h-[56px] rounded-xl font-semibold text-[15px] transition-all ${
              canProceed
                ? 'bg-[var(--accent-green)] text-[var(--bg-dark)] shadow-lg shadow-[var(--accent-green)]/20 hover:shadow-xl'
                : 'bg-[var(--bg-surface)] text-[var(--text-muted)] opacity-50 cursor-not-allowed'
            }`}
          >
            {step === 3 ? '시작하기' : '다음'}
          </motion.button>

          {/* Secondary CTA: Back button (only shown after first step) */}
          {step > 0 && step < 3 && (
            <motion.button
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              whileTap={{ scale: 0.98 }}
              onClick={handleBack}
              className="w-full h-[56px] rounded-xl font-medium text-[15px] transition-all bg-[var(--bg-surface)] text-[var(--text-primary)] hover:bg-[var(--bg-surface-hover)] flex items-center justify-center gap-2"
            >
              <ChevronLeft className="w-5 h-5" />
              이전
            </motion.button>
          )}
        </div>
      </div>
    </div>
  );
}