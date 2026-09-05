"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Brain, ListTodo, Timer, BarChart3, ChevronRight, X, Sparkles } from "lucide-react";

const STEPS = [
  {
    selector: '[data-guide="dashboard"]',
    title: "仪表盘",
    desc: "这里是你的每日总览，记录心情、查看统计、获取 AI 推荐的启动任务",
    icon: Sparkles,
  },
  {
    selector: '[data-guide="test"]',
    title: "人格测试",
    desc: "8道题测出你的拖延人格类型，获得个性化建议",
    icon: Brain,
  },
  {
    selector: '[data-guide="tasks"]',
    title: "任务管理",
    desc: "创建任务后，AI 会自动拆解为子任务并评估阻力，帮你找到最低阻力的启动点",
    icon: ListTodo,
  },
  {
    selector: '[data-guide="focus"]',
    title: "专注模式",
    desc: "番茄钟+深度工作，选一个子任务开始专注，完成后有惊喜",
    icon: Timer,
  },
  {
    selector: '[data-guide="diagnosis"]',
    title: "数据诊断",
    desc: "可视化你的拖延模式和趋势，了解自己才能改变自己",
    icon: BarChart3,
  },
  {
    selector: '[data-guide="dog"]',
    title: "像素小狗",
    desc: "右下角的小狗会在你拖延时提醒你，点击它可以互动哦！",
    icon: Sparkles,
  },
];

export function OnboardingGuide() {
  const [show, setShow] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [targetRect, setTargetRect] = useState<DOMRect | null>(null);
  const observerRef = useRef<MutationObserver | null>(null);

  useEffect(() => {
    const shouldShow = localStorage.getItem("pd-onboarding-done");
    if (shouldShow) return;

    const checkReady = () => {
      const user = localStorage.getItem("procrastination-decoder-auth");
      if (!user) return;
      const parsed = JSON.parse(user);
      const currentUser = parsed.users?.find((u: any) => u.id === parsed.currentUserId);
      if (currentUser?.isFirstLogin) {
        setTimeout(() => setShow(true), 1000);
      }
    };

    checkReady();
    const interval = setInterval(checkReady, 2000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (!show) return;
    updateTargetRect();
    window.addEventListener("resize", updateTargetRect);
    window.addEventListener("scroll", updateTargetRect, true);
    return () => {
      window.removeEventListener("resize", updateTargetRect);
      window.removeEventListener("scroll", updateTargetRect, true);
    };
  }, [show, stepIndex]);

  const updateTargetRect = () => {
    const step = STEPS[stepIndex];
    if (!step) return;
    const el = document.querySelector(step.selector) as HTMLElement;
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center", inline: "center" });
      setTimeout(() => {
        setTargetRect(el.getBoundingClientRect());
      }, 300);
    } else {
      setTargetRect(null);
    }
  };

  const handleNext = () => {
    if (stepIndex < STEPS.length - 1) {
      setStepIndex(stepIndex + 1);
    } else {
      handleFinish();
    }
  };

  const handleFinish = () => {
    localStorage.setItem("pd-onboarding-done", "true");
    // 标记首次登录完成
    const raw = localStorage.getItem("procrastination-decoder-auth");
    if (raw) {
      const state = JSON.parse(raw);
      if (state.currentUserId) {
        state.users = state.users.map((u: any) =>
          u.id === state.currentUserId ? { ...u, isFirstLogin: false } : u
        );
        localStorage.setItem("procrastination-decoder-auth", JSON.stringify(state));
      }
    }
    setShow(false);
  };

  if (!show) return null;

  const currentStep = STEPS[stepIndex];
  const Icon = currentStep.icon;

  // 计算气泡位置
  const getBubbleStyle = (): React.CSSProperties => {
    if (!targetRect) return { top: "50%", left: "50%", transform: "translate(-50%, -50%)" };
    const rect = targetRect;
    const space = 320;
    const bubbleWidth = 300;
    const bubbleHeight = 180;
    let top = rect.bottom + 12;
    let left = rect.left + rect.width / 2 - bubbleWidth / 2;
    if (top + bubbleHeight > window.innerHeight - 20) {
      top = rect.top - bubbleHeight - 12;
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
          {/* 遮罩 */}
          <div
            className="absolute inset-0"
            style={{
              background: "rgba(0,0,0,0.6)",
              backdropFilter: "blur(2px)",
              clipPath: targetRect
                ? `polygon(0 0, 0 ${targetRect.top - 6}px, ${targetRect.left - 6}px ${targetRect.top - 6}px, ${targetRect.left - 6}px ${targetRect.bottom + 6}px, 0 ${targetRect.bottom + 6}px, 0 100%, 100% 100%, 100% ${targetRect.bottom + 6}px, ${targetRect.right + 6}px ${targetRect.bottom + 6}px, ${targetRect.right + 6}px ${targetRect.top - 6}px, 100% ${targetRect.top - 6}px, 100% 0)`
                : "none",
              transition: "clip-path 0.3s ease",
            }}
          />

          {/* 高亮框 */}
          {targetRect && (
            <div
              className="absolute rounded-lg pointer-events-none"
              style={{
                top: targetRect.top - 4,
                left: targetRect.left - 4,
                width: targetRect.width + 8,
                height: targetRect.height + 8,
                boxShadow: "0 0 0 4px var(--color-neon-orange), 0 0 20px rgba(255,107,53,0.4)",
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
              boxShadow: "0 8px 32px rgba(0,0,0,0.2)",
              border: "1px solid var(--divider)",
            }}
          >
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-lg flex items-center justify-center" style={{ background: "var(--color-neon-orange)" }}>
                <Icon className="w-4 h-4 text-white" />
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
