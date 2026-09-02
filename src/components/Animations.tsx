"use client";
import { motion, HTMLMotionProps } from "framer-motion";
import { ReactNode } from "react";

// 页面入场容器：从下方淡入滑入
export function PageTransition({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -10 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// 错峰入场容器：子元素依次出现
export function StaggerContainer({
  children,
  className = "",
  delay = 0.08,
  staggerChildren = 0.08,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
  staggerChildren?: number;
}) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{
        hidden: {},
        visible: {
          transition: {
            delay,
            staggerChildren,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// 单个错峰子项
export function FadeInItem({
  children,
  className = "",
  y = 12,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  y?: number;
  delay?: number;
}) {
  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y },
        visible: {
          opacity: 1,
          y: 0,
          transition: {
            duration: 0.4,
            ease: [0.4, 0, 0.2, 1],
            delay,
          },
        },
      }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

// 悬停上浮卡片
export function HoverCard({
  children,
  className = "",
  y = -3,
  scale = 1.01,
  ...props
}: {
  children: ReactNode;
  className?: string;
  y?: number;
  scale?: number;
} & HTMLMotionProps<"div">) {
  return (
    <motion.div
      whileHover={{ y, scale, transition: { duration: 0.2, ease: "easeOut" } }}
      whileTap={{ scale: 0.99 }}
      className={className}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// 数字计数动画
export function CountUp({
  value,
  className = "",
  duration = 0.8,
  suffix = "",
  prefix = "",
}: {
  value: number;
  className?: string;
  duration?: number;
  suffix?: string;
  prefix?: string;
}) {
  return (
    <motion.span
      initial={{ opacity: 0 }}
      key={value}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.2 }}
      className={className}
    >
      {prefix}
      <motion.span
        key={value}
        initial={{ y: 10, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration, ease: "easeOut" }}
      >
        {value}
      </motion.span>
      {suffix}
    </motion.span>
  );
}

// 呼吸光晕效果（用于成就/亮点）
export function GlowPulse({
  children,
  className = "",
  color = "rgba(168, 85, 247, 0.3)",
}: {
  children: ReactNode;
  className?: string;
  color?: string;
}) {
  return (
    <motion.div
      className={className}
      animate={{
        boxShadow: [
          `0 0 0 0 ${color}`,
          `0 0 20px 4px ${color}`,
          `0 0 0 0 ${color}`,
        ],
      }}
      transition={{
        duration: 2.5,
        repeat: Infinity,
        ease: "easeInOut",
      }}
    >
      {children}
    </motion.div>
  );
}

// 逐字弹入动画 + 渐变艺术字
export function TextReveal({
  text,
  className = "",
  delay = 0.1,
  stagger = 0.06,
  gradient = "linear-gradient(135deg, #f97316, #ec4899, #8b5cf6)",
  fontSize = "inherit",
  fontWeight = 700,
}: {
  text: string;
  className?: string;
  delay?: number;
  stagger?: number;
  gradient?: string;
  fontSize?: string;
  fontWeight?: number;
}) {
  const characters = Array.from(text);

  return (
    <span
      className={className}
      style={{
        display: "inline-block",
        fontSize,
        fontWeight,
        lineHeight: 1.2,
      }}
    >
      {characters.map((char, index) => (
        <motion.span
          key={`${char}-${index}`}
          initial={{ opacity: 0, y: 20, filter: "blur(8px)", scale: 0.8 }}
          animate={{ opacity: 1, y: 0, filter: "blur(0px)", scale: 1 }}
          transition={{
            delay: delay + index * stagger,
            duration: 0.5,
            ease: [0.4, 0, 0.2, 1],
          }}
          style={{
            display: "inline-block",
            background: gradient,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
            textShadow: "none",
          }}
        >
          {char === " " ? "\u00A0" : char}
        </motion.span>
      ))}
    </span>
  );
}
