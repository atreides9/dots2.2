import { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X, Sparkles, Trophy, ChevronRight } from 'lucide-react';
import type { ReadingLevel } from '../lib/gamification';

interface LevelUpModalProps {
  level: ReadingLevel;
  onClose: () => void;
}

/**
 * Level Up Celebration Modal
 * 
 * Peak-End Rule: Create memorable moment at achievement
 * Variable Rewards: Unexpected delight with animations
 * Aesthetic-Usability: Beautiful = more engaging
 */
export function LevelUpModal({ level, onClose }: LevelUpModalProps) {
  const [showContent, setShowContent] = useState(false);
  const [particles, setParticles] = useState<{ id: number; x: number; y: number; delay: number }[]>([]);

  useEffect(() => {
    // Generate random particles
    const newParticles = Array.from({ length: 30 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      y: Math.random() * 100,
      delay: Math.random() * 0.5,
    }));
    setParticles(newParticles);

    // Delayed content reveal
    const timer = setTimeout(() => setShowContent(true), 400);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4"
      >
        {/* Backdrop with blur */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
          className="absolute inset-0 bg-black/60 backdrop-blur-md"
        />

        {/* Modal Card */}
        <motion.div
          initial={{ scale: 0.8, opacity: 0, y: 50 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.9, opacity: 0, y: 20 }}
          transition={{ type: 'spring', damping: 25, stiffness: 300 }}
          className="relative z-10 w-full max-w-md overflow-hidden rounded-3xl"
          style={{
            background: level.gradient,
          }}
        >
          {/* Animated background pattern */}
          <div 
            className="absolute inset-0 opacity-30"
            style={{ background: level.bgPattern }}
          />

          {/* Floating particles */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            {particles.map((particle) => (
              <motion.div
                key={particle.id}
                className="absolute w-1.5 h-1.5 rounded-full"
                style={{
                  left: `${particle.x}%`,
                  top: `${particle.y}%`,
                  backgroundColor: level.particleColor,
                }}
                initial={{ scale: 0, opacity: 0 }}
                animate={{
                  scale: [0, 1, 0],
                  opacity: [0, 0.6, 0],
                  y: [0, -100],
                }}
                transition={{
                  duration: 2,
                  delay: particle.delay,
                  repeat: Infinity,
                  repeatDelay: 1,
                }}
              />
            ))}
          </div>

          {/* Close button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 z-20 p-2 rounded-full bg-white/10 hover:bg-white/20 transition-colors backdrop-blur-sm"
          >
            <X className="w-5 h-5 text-white" />
          </button>

          {/* Content */}
          <div className="relative z-10 p-8 text-center text-white">
            {/* Icon with bounce animation */}
            <motion.div
              initial={{ scale: 0, rotate: -180 }}
              animate={{ scale: 1, rotate: 0 }}
              transition={{
                type: 'spring',
                damping: 10,
                stiffness: 200,
                delay: 0.2,
              }}
              className="inline-block mb-6"
            >
              <div className="relative">
                {/* Glow effect */}
                <motion.div
                  className="absolute inset-0 rounded-full blur-2xl"
                  style={{ backgroundColor: level.particleColor }}
                  animate={{
                    scale: [1, 1.2, 1],
                    opacity: [0.3, 0.6, 0.3],
                  }}
                  transition={{
                    duration: 2,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
                
                {/* Icon */}
                <div className="relative text-8xl">{level.icon}</div>
              </div>
            </motion.div>

            {/* Level badge */}
            <AnimatePresence>
              {showContent && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.3 }}
                  className="mb-4"
                >
                  <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full">
                    <Trophy className="w-4 h-4" />
                    <span className="text-sm font-medium">Level {level.level}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Title */}
            <AnimatePresence>
              {showContent && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.4 }}
                >
                  <h2 className="text-3xl lg:text-4xl font-serif font-bold mb-2">
                    {level.name}
                  </h2>
                  <p className="text-lg opacity-90 mb-6">{level.message}</p>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Stats */}
            <AnimatePresence>
              {showContent && (
                <motion.div
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.5 }}
                  className="mb-6"
                >
                  <div className="inline-flex items-center gap-3 px-6 py-3 bg-white/15 backdrop-blur-sm rounded-2xl">
                    <div className="text-center">
                      <div className="text-2xl font-bold">{level.min}</div>
                      <div className="text-xs opacity-75">편 달성</div>
                    </div>
                    <div className="w-px h-10 bg-white/30" />
                    <div className="text-center">
                      <div className="text-2xl font-bold">{level.max}</div>
                      <div className="text-xs opacity-75">목표</div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Unlock message */}
            <AnimatePresence>
              {showContent && level.unlock && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: 0.6, type: 'spring' }}
                  className="mb-6 p-4 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20"
                >
                  <div className="flex items-center justify-center gap-2 text-sm">
                    <Sparkles className="w-4 h-4" />
                    <span className="font-medium">새로운 기능 해제:</span>
                    <span className="opacity-90">{level.unlock}</span>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Continue button */}
            <AnimatePresence>
              {showContent && (
                <motion.button
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: 0.7 }}
                  onClick={onClose}
                  className="group w-full px-6 py-4 bg-white text-gray-900 rounded-xl font-medium text-base hover:bg-white/90 transition-all flex items-center justify-center gap-2"
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.98 }}
                >
                  계속 읽기
                  <ChevronRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                </motion.button>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom decoration */}
          <div className="absolute bottom-0 left-0 right-0 h-1 bg-gradient-to-r from-transparent via-white/50 to-transparent" />
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
