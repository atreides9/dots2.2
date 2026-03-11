import { useState, useMemo, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { BookOpen, TrendingUp, Sparkles, ChevronRight, Trophy } from 'lucide-react';
import { getReadingLevel, getNextLevel, getLevelProgress, getEncouragementMessage } from '../lib/gamification';

interface TopicData {
  topic: string;
  count: number;
}

interface TopicNode {
  id: string;
  topic: string;
  count: number;
  x: number;
  y: number;
  radius: number;
  color: string;
  opacity: number;
  isTop: boolean;
}

interface TopicConnection {
  from: string;
  to: string;
  strength: number;
}

interface ReadingMapProps {
  topics: TopicData[];
  totalArticles: number;
  onTopicClick?: (topic: string | null) => void;
  selectedTopic?: string | null;
}

// Color palette for topic nodes — warm tones matching the app
const TOPIC_COLORS = [
  '#4A7C59', // accent green (primary/top)
  '#5A8C69',
  '#6B9C79',
  '#7DAD8A',
  '#8EBD9A',
  '#6B8A7A',
  '#7A9989',
  '#89A898',
];

/**
 * Reading Map — Interactive knowledge graph visualization
 *
 * UX Laws applied:
 * - Fitts's Law: Larger nodes for top topics (easier to click)
 * - Gestalt Proximity: Related topics positioned near each other
 * - Gestalt Similarity: Same color family, size encodes frequency
 * - Miller's Law: Max 7±2 visible nodes
 * - Von Restorff Effect: #1 topic visually distinct (glow + size)
 * - Hick's Law: Single interaction = tap to filter
 * - Aesthetic-Usability: Smooth animations, ambient glow effects
 * - Zeigarnik Effect: "Next milestone" nudge for continued engagement
 */
export function ReadingMap({ topics, totalArticles, onTopicClick, selectedTopic }: ReadingMapProps) {
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [hasAnimated, setHasAnimated] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const [containerSize, setContainerSize] = useState({ width: 600, height: 400 });

  // Ensure topics is an array
  const safeTopics = topics || [];
  const safeTotalArticles = totalArticles || 0;

  useEffect(() => {
    if (containerRef.current) {
      const rect = containerRef.current.getBoundingClientRect();
      setContainerSize({ width: rect.width, height: rect.height });
    }
    const timer = setTimeout(() => setHasAnimated(true), 1500);
    return () => clearTimeout(timer);
  }, []);

  // Resize observer
  useEffect(() => {
    if (!containerRef.current) return;
    const observer = new ResizeObserver((entries) => {
      for (const entry of entries) {
        setContainerSize({
          width: entry.contentRect.width,
          height: entry.contentRect.height,
        });
      }
    });
    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, []);

  // Build nodes with positions (force-layout-like, pre-computed)
  const nodes = useMemo<TopicNode[]>(() => {
    // Safety check
    if (!safeTopics || safeTopics.length === 0) {
      return [];
    }
    
    const maxCount = Math.max(...safeTopics.map((t) => t.count), 1);
    const minCount = Math.min(...safeTopics.map((t) => t.count), 1);
    const isUniformSize = maxCount === minCount; // All topics have same count
    
    const visibleTopics = safeTopics.slice(0, 8); // Miller's Law: 7±2
    const centerX = containerSize.width / 2;
    const centerY = containerSize.height / 2;
    const baseRadius = Math.min(containerSize.width, containerSize.height) * 0.32;

    return visibleTopics.map((t, i) => {
      const isTop = i === 0;
      
      // If all topics have same count, use uniform sizing
      let nodeRadius;
      if (isUniformSize) {
        // Uniform size for all nodes when counts are equal
        nodeRadius = 24;
      } else {
        const normalized = t.count / maxCount;
        nodeRadius = isTop
          ? Math.max(32, 24 + normalized * 20)
          : Math.max(18, 12 + normalized * 16);
      }

      // Organic force-directed-like positioning (Obsidian style)
      // Use golden angle spiral for natural distribution
      const goldenAngle = Math.PI * (3 - Math.sqrt(5)); // ~137.5°
      const angle = i * goldenAngle;
      
      // Vary distance based on index for organic spread
      const distanceFactor = isTop ? 0.35 : 0.45 + (i % 3) * 0.18;
      const distance = baseRadius * distanceFactor;
      
      // Add slight randomness for organic feel (deterministic based on index)
      const angleOffset = Math.sin(i * 2.3) * 0.3;
      const distanceOffset = Math.cos(i * 1.7) * 0.15;

      return {
        id: t.topic,
        topic: t.topic,
        count: t.count,
        x: centerX + Math.cos(angle + angleOffset) * distance * (1 + distanceOffset),
        y: centerY + Math.sin(angle + angleOffset) * distance * (1 + distanceOffset),
        radius: nodeRadius,
        color: TOPIC_COLORS[i % TOPIC_COLORS.length],
        opacity: isUniformSize ? 0.85 : (isTop ? 1 : 0.5 + (t.count / maxCount) * 0.4),
        isTop,
      };
    });
  }, [safeTopics, containerSize]);

  // Build connections between topics that co-occur
  const connections = useMemo<TopicConnection[]>(() => {
    const conns: TopicConnection[] = [];
    
    // Safety check
    if (!nodes || nodes.length === 0 || !safeTopics || safeTopics.length === 0) {
      return conns;
    }
    
    const maxCount = Math.max(...safeTopics.map((t) => t.count), 1);
    
    // Obsidian-style: Create more organic connections
    // Connect each node to 2-3 nearest neighbors
    for (let i = 0; i < nodes.length; i++) {
      const currentNode = nodes[i];
      
      // Calculate distances to all other nodes
      const distances = nodes
        .map((node, j) => ({
          index: j,
          distance: Math.sqrt(
            Math.pow(currentNode.x - node.x, 2) + 
            Math.pow(currentNode.y - node.y, 2)
          )
        }))
        .filter((d) => d.index !== i)
        .sort((a, b) => a.distance - b.distance);
      
      // Connect to 2-3 nearest neighbors
      const numConnections = i === 0 ? 3 : 2;
      for (let j = 0; j < Math.min(numConnections, distances.length); j++) {
        const targetIndex = distances[j].index;
        const targetNode = nodes[targetIndex];
        
        // Avoid duplicate connections
        const exists = conns.some(
          (c) => (c.from === currentNode.id && c.to === targetNode.id) ||
                 (c.from === targetNode.id && c.to === currentNode.id)
        );
        
        if (!exists) {
          const strength = 0.2 + (currentNode.count / maxCount) * 0.3;
          conns.push({
            from: currentNode.id,
            to: targetNode.id,
            strength,
          });
        }
      }
    }
    
    return conns;
  }, [nodes, safeTopics]);

  const nodeMap = useMemo(() => {
    const map: Record<string, TopicNode> = {};
    nodes.forEach((n) => (map[n.id] = n));
    return map;
  }, [nodes]);

  // Gamification: Current level and progress
  const currentLevel = useMemo(() => getReadingLevel(safeTotalArticles), [safeTotalArticles]);
  const nextLevel = useMemo(() => getNextLevel(currentLevel), [currentLevel]);
  const levelProgress = useMemo(() => getLevelProgress(safeTotalArticles, currentLevel), [safeTotalArticles, currentLevel]);
  const encouragement = useMemo(() => getEncouragementMessage(safeTotalArticles, currentLevel), [safeTotalArticles, currentLevel]);

  function handleNodeClick(topic: string) {
    if (selectedTopic === topic) {
      onTopicClick?.(null);
    } else {
      onTopicClick?.(topic);
    }
  }

  return (
    <div className="bg-[var(--bg-surface)] rounded-2xl overflow-hidden">
      {/* Header Stats Bar */}
      <div className="px-6 pt-6 pb-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[var(--accent-green)]/15 flex items-center justify-center">
            <Sparkles className="w-4 h-4 text-[var(--accent-green)]" />
          </div>
          <div>
            <h3 className="text-sm font-medium text-[var(--text-primary)]">나의 읽기 지도</h3>
            <p className="text-xs text-[var(--text-muted)]">
              {safeTopics.length}개 주제 · {safeTotalArticles}편의 글에서 발견
            </p>
          </div>
        </div>
        {/* Insight chip */}
        {nodes.length > 0 && (
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 1.2 }}
            className="hidden md:flex items-center gap-1.5 px-3 py-1.5 bg-[var(--accent-green)]/10 rounded-full"
          >
            <TrendingUp className="w-3 h-3 text-[var(--accent-green)]" />
            <span className="text-xs text-[var(--accent-green)] font-medium">
              주요 관심사: {nodes[0]?.topic}
            </span>
          </motion.div>
        )}
      </div>

      {/* Graph Canvas */}
      <div
        ref={containerRef}
        className="relative w-full h-[280px] md:h-[340px] lg:h-[380px] cursor-default select-none"
      >
        <svg className="absolute inset-0 w-full h-full pointer-events-none">
          <defs>
            {/* Glow filter for top node */}
            <filter id="nodeGlow" x="-50%" y="-50%" width="200%" height="200%">
              <feGaussianBlur stdDeviation="6" result="blur" />
              <feComposite in="SourceGraphic" in2="blur" operator="over" />
            </filter>
            {/* Subtle radial gradient background */}
            <radialGradient id="mapBg" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="var(--accent-green)" stopOpacity="0.04" />
              <stop offset="100%" stopColor="var(--bg-dark)" stopOpacity="0" />
            </radialGradient>
          </defs>

          {/* Background glow */}
          <rect width="100%" height="100%" fill="url(#mapBg)" />

          {/* Connection lines */}
          {connections.map((conn, i) => {
            const fromNode = nodeMap[conn.from];
            const toNode = nodeMap[conn.to];
            if (!fromNode || !toNode) return null;

            const isHighlighted =
              hoveredNode === conn.from ||
              hoveredNode === conn.to ||
              selectedTopic === conn.from ||
              selectedTopic === conn.to;

            return (
              <motion.line
                key={`conn-${i}`}
                x1={fromNode.x}
                y1={fromNode.y}
                x2={toNode.x}
                y2={toNode.y}
                stroke="var(--accent-green)"
                strokeWidth={isHighlighted ? 1.5 : 0.8}
                strokeOpacity={isHighlighted ? 0.4 : conn.strength * 0.15}
                initial={{ pathLength: 0, opacity: 0 }}
                animate={{ pathLength: 1, opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.3 + i * 0.05 }}
              />
            );
          })}

          {/* Center node (user) */}
          <motion.circle
            cx={containerSize.width / 2}
            cy={containerSize.height / 2}
            r={6}
            fill="var(--accent-green)"
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.1 }}
          />
          <motion.circle
            cx={containerSize.width / 2}
            cy={containerSize.height / 2}
            r={12}
            fill="none"
            stroke="var(--accent-green)"
            strokeWidth={1}
            strokeOpacity={0.2}
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            transition={{ type: 'spring', delay: 0.2 }}
          />

          {/* Connection from center to top node */}
          {nodes[0] && (
            <motion.line
              x1={containerSize.width / 2}
              y1={containerSize.height / 2}
              x2={nodes[0].x}
              y2={nodes[0].y}
              stroke="var(--accent-green)"
              strokeWidth={2}
              strokeOpacity={0.25}
              strokeDasharray="4 4"
              initial={{ pathLength: 0 }}
              animate={{ pathLength: 1 }}
              transition={{ duration: 0.6, delay: 0.4 }}
            />
          )}
        </svg>

        {/* Topic Nodes (DOM for interactivity — Fitts's Law: large clickable targets) */}
        {nodes.map((node, i) => {
          const isHovered = hoveredNode === node.id;
          const isSelected = selectedTopic === node.id;
          const isActive = isHovered || isSelected;
          const dimmed = (hoveredNode || selectedTopic) && !isActive && !node.isTop;

          return (
            <motion.div
              key={node.id}
              className="absolute flex items-center justify-center cursor-pointer group"
              style={{
                left: node.x - node.radius,
                top: node.y - node.radius,
                width: node.radius * 2,
                height: node.radius * 2,
              }}
              initial={{ scale: 0, opacity: 0 }}
              animate={{
                scale: isActive ? 1.15 : dimmed ? 0.9 : 1,
                opacity: dimmed ? 0.4 : 1,
              }}
              transition={{
                type: 'spring',
                stiffness: 300,
                damping: 20,
                delay: hasAnimated ? 0 : 0.4 + i * 0.1,
              }}
              onMouseEnter={() => setHoveredNode(node.id)}
              onMouseLeave={() => setHoveredNode(null)}
              onClick={() => handleNodeClick(node.id)}
            >
              {/* Glow ring for top node — Von Restorff Effect */}
              {node.isTop && (
                <motion.div
                  className="absolute inset-0 rounded-full"
                  style={{
                    background: `radial-gradient(circle, ${node.color}30 0%, transparent 70%)`,
                  }}
                  animate={{
                    scale: [1, 1.3, 1],
                    opacity: [0.5, 0.2, 0.5],
                  }}
                  transition={{
                    duration: 3,
                    repeat: Infinity,
                    ease: 'easeInOut',
                  }}
                />
              )}

              {/* Node circle */}
              <div
                className="absolute inset-0 rounded-full border transition-all duration-200"
                style={{
                  backgroundColor: isActive
                    ? `${node.color}30`
                    : `${node.color}${Math.round(node.opacity * 25).toString(16).padStart(2, '0')}`,
                  borderColor: isActive
                    ? node.color
                    : `${node.color}40`,
                  borderWidth: node.isTop ? 2 : 1,
                  boxShadow: isActive
                    ? `0 0 20px ${node.color}40`
                    : 'none',
                }}
              />

              {/* Label */}
              <div className="relative z-10 text-center px-1">
                <span
                  className="text-[10px] md:text-xs font-medium leading-tight block truncate"
                  style={{
                    color: isActive
                      ? node.color
                      : 'var(--text-primary)',
                    maxWidth: node.radius * 1.8,
                  }}
                >
                  {node.topic.length > 5 ? node.topic.slice(0, 5) : node.topic}
                </span>
                {node.radius > 22 && (
                  <span className="text-[9px] text-[var(--text-muted)] block mt-0.5">
                    {node.count}편
                  </span>
                )}
              </div>

              {/* Tooltip on hover (progressive disclosure — Hick's Law) */}
              <AnimatePresence>
                {isHovered && !isSelected && (
                  <motion.div
                    initial={{ opacity: 0, y: 8, scale: 0.95 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 4, scale: 0.95 }}
                    transition={{ duration: 0.15 }}
                    className="absolute left-1/2 -translate-x-1/2 top-full mt-2 z-30 whitespace-nowrap"
                  >
                    <div className="bg-[#2A251E] border border-[rgba(115,111,114,0.25)] rounded-lg px-3 py-2 shadow-xl">
                      <p className="text-xs text-[var(--text-primary)] font-medium">
                        {node.topic}
                      </p>
                      <p className="text-[10px] text-[var(--text-muted)] mt-0.5">
                        {node.count}편 저장 · 탭하여 필터
                      </p>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          );
        })}

        {/* Selected topic detail card (bottom overlay) */}
        <AnimatePresence>
          {selectedTopic && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 10 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="absolute bottom-3 left-3 right-3 z-20"
            >
              <div className="bg-[#2A251E]/95 backdrop-blur-sm border border-[rgba(115,111,114,0.2)] rounded-xl px-4 py-3 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-[var(--accent-green)]/15 flex items-center justify-center flex-shrink-0">
                    <BookOpen className="w-4 h-4 text-[var(--accent-green)]" />
                  </div>
                  <div>
                    <p className="text-sm text-[var(--text-primary)] font-medium">
                      {selectedTopic}
                    </p>
                    <p className="text-xs text-[var(--text-muted)]">
                      아래에서 이 주제의 글 보기
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => onTopicClick?.(null)}
                  className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)] px-2 py-1 transition-colors"
                >
                  해제
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Bottom: Gamified Progress (Zeigarnik Effect) */}
      <div className="px-6 pb-5 pt-2">
        {/* Level badge */}
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div 
              className="w-10 h-10 rounded-xl flex items-center justify-center text-xl"
              style={{ background: currentLevel.gradient }}
            >
              {currentLevel.emoji}
            </div>
            <div>
              <div className="flex items-center gap-1.5">
                <span className="text-sm font-medium text-[var(--text-primary)]">
                  {currentLevel.name}
                </span>
                <div className="px-2 py-0.5 rounded-full bg-[var(--bg-dark)] text-[10px] text-[var(--text-muted)]">
                  Lv.{currentLevel.level}
                </div>
              </div>
              <p className="text-xs text-[var(--text-muted)] mt-0.5">
                {currentLevel.description}
              </p>
            </div>
          </div>
          
          {nextLevel && (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-right"
            >
              <div className="text-xs text-[var(--text-muted)] mb-1">
                다음 단계
              </div>
              <div className="flex items-center gap-1">
                <span className="text-lg">{nextLevel.emoji}</span>
                <span className="text-xs font-medium text-[var(--text-primary)]">
                  {nextLevel.nameEn}
                </span>
              </div>
            </motion.div>
          )}
        </div>

        {/* Progress bar */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[var(--text-muted)]">{encouragement}</span>
            <span className="text-[var(--text-primary)] font-medium">
              {safeTotalArticles} / {nextLevel ? nextLevel.min : currentLevel.max}
            </span>
          </div>
          <div className="h-2 bg-[var(--bg-dark)] rounded-full overflow-hidden relative">
            {/* Animated progress bar with level color */}
            <motion.div
              className="h-full rounded-full relative overflow-hidden"
              style={{ background: currentLevel.gradient }}
              initial={{ width: 0 }}
              animate={{ width: `${levelProgress * 100}%` }}
              transition={{ duration: 1, delay: 0.5, ease: 'easeOut' }}
            >
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
                animate={{ x: ['-100%', '200%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />
            </motion.div>
            
            {/* Milestone markers */}
            {nextLevel && [0.33, 0.66].map((position, i) => (
              <div
                key={i}
                className="absolute top-0 bottom-0 w-0.5 bg-[var(--text-muted)]/20"
                style={{ left: `${position * 100}%` }}
              />
            ))}
          </div>
          
          {nextLevel && (
            <div className="flex items-center justify-end gap-1 text-[var(--text-muted)]">
              <Trophy className="w-3 h-3" />
              <span className="text-[10px]">
                {nextLevel.min - safeTotalArticles}편 남음
              </span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}