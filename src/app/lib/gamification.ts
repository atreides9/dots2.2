/**
 * Gamification System for Reading Progress
 * 
 * UX Laws Applied:
 * - Zeigarnik Effect: Incomplete goals drive continued engagement
 * - Peak-End Rule: Memorable moments at level-up
 * - Variable Rewards: Unexpected celebrations and unlocks
 * - Goal Gradient Effect: Motivation increases near milestones
 * - Endowed Progress Effect: Starting with partial progress
 */

export interface ReadingLevel {
  level: number;
  name: string;
  nameEn: string;
  min: number;
  max: number;
  color: string;
  gradient: string;
  icon: string;
  emoji: string;
  description: string;
  message: string;
  bgPattern: string;
  particleColor: string;
  unlock?: string;
}

export const READING_LEVELS: ReadingLevel[] = [
  {
    level: 1,
    name: '씨앗 단계',
    nameEn: 'Seed',
    min: 0,
    max: 5,
    color: '#8B7355',
    gradient: 'linear-gradient(135deg, #8B7355 0%, #A0826D 100%)',
    icon: '🌱',
    emoji: '🌱',
    description: '지식의 씨앗을 심는 중',
    message: '첫 글을 저장하며 여정이 시작됩니다',
    bgPattern: 'radial-gradient(circle at 20% 50%, rgba(139, 115, 85, 0.1) 0%, transparent 50%)',
    particleColor: '#8B7355',
  },
  {
    level: 2,
    name: '새싹 단계',
    nameEn: 'Sprout',
    min: 6,
    max: 20,
    color: '#6B8A7A',
    gradient: 'linear-gradient(135deg, #6B8A7A 0%, #7DAD8A 100%)',
    icon: '🌿',
    emoji: '🌿',
    description: '호기심이 자라나는 시기',
    message: '꾸준한 읽기로 새싹이 돋아났습니다',
    bgPattern: 'radial-gradient(circle at 30% 40%, rgba(107, 138, 122, 0.12) 0%, transparent 50%)',
    particleColor: '#6B8A7A',
    unlock: '주제 필터 활성화',
  },
  {
    level: 3,
    name: '성장 단계',
    nameEn: 'Growth',
    min: 21,
    max: 40,
    color: '#4A7C59',
    gradient: 'linear-gradient(135deg, #4A7C59 0%, #5A9C6B 100%)',
    icon: '🪴',
    emoji: '🪴',
    description: '지식이 뿌리를 내리는 중',
    message: '사고의 깊이가 더해지고 있습니다',
    bgPattern: 'radial-gradient(circle at 40% 60%, rgba(74, 124, 89, 0.15) 0%, transparent 50%)',
    particleColor: '#4A7C59',
    unlock: 'Reading Map 확장',
  },
  {
    level: 4,
    name: '개화 단계',
    nameEn: 'Blossom',
    min: 41,
    max: 60,
    color: '#5A8C69',
    gradient: 'linear-gradient(135deg, #5A8C69 0%, #6DAD85 100%)',
    icon: '🌸',
    emoji: '🌸',
    description: '통찰이 피어나는 순간',
    message: '깊은 사고의 꽃이 피어났습니다',
    bgPattern: 'radial-gradient(circle at 60% 30%, rgba(90, 140, 105, 0.18) 0%, transparent 50%)',
    particleColor: '#5A8C69',
    unlock: '연결 추천 고급화',
  },
  {
    level: 5,
    name: '열매 단계',
    nameEn: 'Fruit',
    min: 61,
    max: 80,
    color: '#7DAD8A',
    gradient: 'linear-gradient(135deg, #7DAD8A 0%, #8EBD9A 100%)',
    icon: '🍃',
    emoji: '🍃',
    description: '지혜의 열매를 맺는 중',
    message: '의도적 읽기가 결실을 맺고 있습니다',
    bgPattern: 'radial-gradient(circle at 50% 50%, rgba(125, 173, 138, 0.2) 0%, transparent 50%)',
    particleColor: '#7DAD8A',
    unlock: '프리미엄 인사이트',
  },
  {
    level: 6,
    name: '숲 단계',
    nameEn: 'Forest',
    min: 81,
    max: 100,
    color: '#3D6B4A',
    gradient: 'linear-gradient(135deg, #3D6B4A 0%, #4A7C59 50%, #5A9C6B 100%)',
    icon: '🌳',
    emoji: '🌳',
    description: '풍요로운 지식의 숲',
    message: '당신만의 사색의 숲을 가꾸었습니다',
    bgPattern: 'radial-gradient(circle at 50% 50%, rgba(61, 107, 74, 0.25) 0%, transparent 60%)',
    particleColor: '#3D6B4A',
    unlock: '마스터 뱃지 획득',
  },
];

/**
 * Get current reading level based on article count
 */
export function getReadingLevel(count: number): ReadingLevel {
  for (let i = READING_LEVELS.length - 1; i >= 0; i--) {
    if (count >= READING_LEVELS[i].min) {
      return READING_LEVELS[i];
    }
  }
  return READING_LEVELS[0];
}

/**
 * Get next reading level
 */
export function getNextLevel(currentLevel: ReadingLevel): ReadingLevel | null {
  const currentIndex = READING_LEVELS.findIndex(l => l.level === currentLevel.level);
  if (currentIndex < READING_LEVELS.length - 1) {
    return READING_LEVELS[currentIndex + 1];
  }
  return null;
}

/**
 * Calculate progress within current level (0-1)
 */
export function getLevelProgress(count: number, level: ReadingLevel): number {
  const range = level.max - level.min + 1;
  const current = count - level.min;
  return Math.min(Math.max(current / range, 0), 1);
}

/**
 * Check if user just leveled up
 */
export function checkLevelUp(previousCount: number, newCount: number): ReadingLevel | null {
  const previousLevel = getReadingLevel(previousCount);
  const newLevel = getReadingLevel(newCount);
  
  if (newLevel.level > previousLevel.level) {
    return newLevel;
  }
  
  return null;
}

/**
 * Get milestone achievements for a level
 */
export function getMilestones(level: ReadingLevel): number[] {
  const milestones: number[] = [];
  const range = level.max - level.min + 1;
  
  // Create 3-4 milestones per level
  if (range > 10) {
    milestones.push(level.min + Math.floor(range * 0.33));
    milestones.push(level.min + Math.floor(range * 0.66));
  } else if (range > 5) {
    milestones.push(level.min + Math.floor(range * 0.5));
  }
  
  milestones.push(level.max);
  
  return milestones;
}

/**
 * Get encouragement message based on progress
 */
export function getEncouragementMessage(count: number, level: ReadingLevel): string {
  const progress = getLevelProgress(count, level);
  const nextLevel = getNextLevel(level);
  const remaining = nextLevel ? nextLevel.min - count : 0;
  
  if (!nextLevel) {
    return '최고 레벨 달성! 계속해서 지식의 숲을 가꾸어가세요 🌳';
  }
  
  if (progress < 0.25) {
    return `${level.name}의 시작, 좋은 출발입니다`;
  } else if (progress < 0.5) {
    return `순조롭게 성장하고 있어요`;
  } else if (progress < 0.75) {
    return `곧 ${nextLevel.name}에 도달합니다`;
  } else {
    return `${nextLevel.name}까지 ${remaining}편 남았어요!`;
  }
}
