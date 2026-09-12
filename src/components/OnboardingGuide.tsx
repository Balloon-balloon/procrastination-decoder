"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, ListTodo, Timer, Sparkles, MessageCircle, ChevronRight, Users, Cat, BookOpen } from "lucide-react";
import { getCurrentUser, markFirstLoginDone } from "@/lib/auth";

const STEPS = [
  {
    selector: '[data-guide="dashboard"]',
    title: "仪表盘",
    desc: "你的每日总览，记录心情、查看统计、获取今日推荐启动任务",
    icon: Sparkles,
  },
  {
    selector: '[data-guide="decode"]',
    title: "灵感拆解",
    desc: "我们的核心功能！输入任务后 AI 会帮你拆解成小步骤，消除启动恐惧",
    icon: Brain,
  },
  {
    selector: '[data-guide="tasks"]',
    title: "任务管理",
    desc: "管理所有任务，查看拆解结果，标记完成进度，紧急度自动计算",
    icon: ListTodo,
  },
  {
    selector: '[data-guide="focus"]',
    title: "专注模式",
    desc: "番茄钟+深度工作，选一个子任务开始专注，完成后有惊喜",
    icon: Timer,
  },
  {
    selector: '[data-guide="studyroom"]',
    title: "陪伴社区",
    desc: "自习室、树洞、学伴——有人陪你一起学，不再孤单",
    icon: Users,
  },
  {
    selector: '[data-guide="test"]',
    title: "人格测试",
    desc: "8道题测出你的拖延人格类型，获得个性化建议",
    icon: BookOpen,
  },
  {
    selector: '[data-guide="dog"]',
    title: "像素小狗",
    desc: "右下角的小狗会在你拖延时提醒你，点击它可以互动哦！",
    icon: Cat,
  },
];

export function OnboardingGuide() {
  const [show, setShow] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  useEffect(() => {
    const user = getCurrentUser();
    if (user?.isFirstLogin && !localStorage.getItem(`pd-onboarding-done-${user.id}`)) {
      const timer = setTimeout(() => setShow(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  useEffect(() => {
    if (!show) return;
    focusTarget();
    window.addEventListener("resize", measureTarget);
    window.addEventListener("scroll", measureTarget, true);
    return () => {
      window.removeEventListener("resize", measureTarget);
      window.removeEventListener("scroll", measureTarget, true);
    };
  }, [show, stepIndex]);

  const measureTarget = () => {
    const step = STEPS[stepIndex];
    if (!step) return;
    const el = document.querySelector(step.selector) as HTMLElement;
    setTargetRect(el ? el.getBoundingClientRect() : null);
  };

  const focusTarget = () => {
    setTargetRect(null);
    const step = STEPS[stepIndex];
    const el = step ? document.querySelector(step.selector) as HTMLElement | null : null;
    if (!el) return;
    el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
    setTimeout(measureTarget, 300);
  };

  const handleNext = () => {
    if (stepIndex < STEPS.length - 1) {
      setTargetRect(null);
      setStepIndex(stepIndex + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    const currentUser = getCurrentUser();
    if (currentUser) {
      localStorage.setItem(`pd-onboarding-done-${currentUser.id}`, "true");
      markFirstLoginDone(currentUser.id);
    }
    setShow(false);
  };

  if (!show) return null;

  const currentStep = STEPS[stepIndex];
  const Icon = currentStep.icon;
  const hasTarget = targetRect !== null;

  const getBubbleStyle = (): React.CSSProperties => {
    if (!hasTarget || !targetRect) {
      return {
        top: "50%",
        left: "50%",
        transform: "translate(-50%, -50%)",
        width: 300,
      };
    }
    const rect = targetRect;
    const bubbleWidth = 320;
    const bubbleHeight = 180;
    let top = rect.bottom + 16;
    let left = rect.left + rect.width / 2 - bubbleWidth / 2;
    if (top + bubbleHeight > window.innerHeight - 20) {
      top = rect.top - bubbleHeight - 16;
    }
    if (left < 20) left = 20;
    if (left + bubbleWidth > window.innerWidth - 20) left = window.innerWidth - bubbleWidth - 20;
    return { top, left, width: bubbleWidth };
  };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[300]"
        >
          {/* 使用 SVG mask 精确挖出目标区域，让框内内容变清晰 */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none" aria-hidden="true">
            <defs>
              <mask id="onboarding-spotlight-mask" maskUnits="userSpaceOnUse" x="0" y="0" width="100%" height="100%">
                <rect width="100%" height="100%" fill="white" />
                {hasTarget && targetRect && (
                  <rect
                    x={Math.max(0, targetRect.left - 8)}
                    y={Math.max(0, targetRect.top - 8)}
                    width={targetRect.width + 16}
                    height={targetRect.height + 16}
                    rx="12"
                    fill="black"
                  />
                )}
              </mask>
            </defs>
            <rect
              width="100%"
              height="100%"
              fill="rgba(0,0,0,0.72)"
              mask="url(#onboarding-spotlight-mask)"
            />
          </svg>

          {/* 高亮框 - 只有找到目标时显示 */}
          {hasTarget && targetRect && (
            <div
              className="absolute rounded-xl pointer-events-none"
              style={{
                top: targetRect.top - 6,
                left: targetRect.left - 6,
                width: targetRect.width + 12,
                height: targetRect.height + 12,
                boxShadow: "0 0 0 3px var(--color-neon-orange), 0 0 24px rgba(255,107,53,0.5)",
                transition: "all 0.3s ease",
              }}
            />
          )}

          {/* 气泡提示 */}
          <motion.div
            key={stepIndex}
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="absolute rounded-2xl p-5"
            style={{
              ...getBubbleStyle(),
              background: "var(--bg-primary)",
              boxShadow: "0 8px 32px rgba(0,0,0,0.25)",
              border: "1px solid var(--divider)",
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center" style={{ background: "var(--color-neon-orange)" }}>
                <Icon className="w-4.5 h-4.5 text-white" />
              </div>
              <h3 className="font-hand text-base font-bold" style={{ color: "var(--color-ink)" }}>
                {currentStep.title}
              </h3>
            </div>
            <p className="font-hand text-sm leading-relaxed mb-4" style={{ color: "var(--text-secondary)" }}>
              {currentStep.desc}
            </p>

            {/* 步骤指示器 */}
            <div className="flex items-center justify-between">
              <div className="flex gap-1.5">
                {STEPS.map((_, i) => (
                  <div
                    key={i}
                    className="h-1.5 rounded-full transition-all"
                    style={{
                      width: i === stepIndex ? "20px" : "8px",
                      background: i === stepIndex ? "var(--color-neon-orange)" : "var(--divider)",
                    }}
                  />
                ))}
              </div>
              <div className="flex gap-2">
                <button
                  onClick={handleFinish}
                  className="px-3 py-1.5 rounded-lg text-xs font-hand"
                  style={{ color: "var(--text-muted)" }}
                >
                  跳过
                </button>
                <button
                  onClick={handleNext}
                  className="btn-neon text-xs font-hand flex items-center gap-1"
                >
                  {stepIndex === STEPS.length - 1 ? "开始使用！" : "下一步"}
                  <ChevronRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
