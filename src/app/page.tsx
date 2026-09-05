"use client";
import Link from "next/link";
import { useAppData } from "@/hooks/useAppData";
import { calculateStreak, addMoodEntry } from "@/lib/store";
import { PERSONALITY_TYPES } from "@/lib/personality";
import { formatTime } from "@/lib/utils";
import {
  Brain,
  Timer,
  ListTodo,
  Sparkles,
  TrendingUp,
  Flame,
  Target,
  Zap,
  ChevronRight,
  Play,
  Rocket,
  Clock,
} from "lucide-react";
import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { PageTransition, StaggerContainer, FadeInItem } from "@/components/Animations";
import { useRouter } from "next/navigation";
import { PenLoader } from "@/components/PenLoader";
import { CompletionMessage } from "@/components/CompletionMessage";
import { playClickSound, playLaunchSound, playCompleteSound } from "@/lib/sound";
import { TypewriterLogo } from "@/components/TypewriterLogo";

const STICKY_COLORS = [
  { bg: "var(--sticky-yellow)", rotate: "-1.5deg" },
  { bg: "var(--sticky-pink)", rotate: "1deg" },
  { bg: "var(--sticky-blue)", rotate: "-0.5deg" },
  { bg: "var(--sticky-green)", rotate: "1.5deg" },
];

export default function DashboardPage() {
  const { data, update, loaded } = useAppData();
  const [showComplete, setShowComplete] = useState(false);
  const router = useRouter();

  const todayMood = useMemo(() => {
    const today = new Date().toDateString();
    return data.moodEntries.find(
      (m) => new Date(m.createdAt).toDateString() === today
    );
  }, [data.moodEntries]);

  const recordMood = (mood: "great" | "good" | "okay" | "bad" | "terrible") => {
    playClickSound();
    update((prev) =>
      addMoodEntry(prev, {
        mood,
        energy: 5,
        procrastinationLevel: 5,
        note: "",
      })
    );
  };

  const MOOD_CONFIG = {
    great: { emoji: "😄", label: "超棒" },
    good: { emoji: "🙂", label: "不错" },
    okay: { emoji: "😐", label: "一般" },
    bad: { emoji: "😔", label: "不好" },
    terrible: { emoji: "😢", label: "糟糕" },
  };

  const PRIORITY_COLORS = {
    low: "#4ECDC4",
    medium: "#FAD6A5",
    high: "#FF6B35",
    urgent: "#E53935",
  };

  const stats = useMemo(() => {
    const completedTasks = data.tasks.filter((t) => t.status === "completed");
    const focusMin = Math.floor(
      data.focusSessions
        .filter((s) => s.completed)
        .reduce((sum, s) => sum + s.duration, 0) / 60
    );
    const streak = calculateStreak(data.tasks);
    const completionRate =
      data.tasks.length > 0
        ? Math.round((completedTasks.length / data.tasks.length) * 100)
        : 0;
    return {
      completedTasks: completedTasks.length,
      focusMin,
      streak,
      completionRate,
      totalTasks: data.tasks.length,
    };
  }, [data]);

  const resistanceLabels: Record<string, string> = {
    perfectionist: "完美主义",
    ambiguous: "模糊型",
    overwhelming: "畏难型",
    aversive: "抵触型",
    "instant-gratification": "即时满足",
    "low-resistance": "低阻力",
  };

  const recommendedStart = useMemo(() => {
    const pendingSubTasks = data.subTasks.filter((st) => st.status !== "completed");
    if (pendingSubTasks.length === 0) return null;
    const sorted = [...pendingSubTasks].sort((a, b) => a.resistanceScore - b.resistanceScore);
    const easiest = sorted[0];
    const parentTask = data.tasks.find((t) => t.id === easiest.taskId);
    return { subTask: easiest, parentTask };
  }, [data.subTasks, data.tasks]);

  const priorityOrder: Record<string, number> = { urgent: 0, high: 1, medium: 2, low: 3 };
  const todayTodo = useMemo(() => {
    const pending = data.tasks.filter((t) => t.status !== "completed");
    return pending
      .sort((a, b) => {
        const pa = priorityOrder[a.priority] ?? 2;
        const pb = priorityOrder[b.priority] ?? 2;
        if (pa !== pb) return pa - pb;
        return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      })
      .slice(0, 5);
  }, [data.tasks]);

  if (!loaded) {
    return <PenLoader text="loading" />;
  }

  const personality = data.profile.personalityResult;
  const personalityInfo = personality ? PERSONALITY_TYPES[personality.type] : null;

  const handleStartFocus = () => {
    playLaunchSound();
    if (recommendedStart) {
      router.push(
        `/focus?subTaskId=${recommendedStart.subTask.id}&taskId=${recommendedStart.subTask.taskId}`
      );
    }
  };

  return (
    <PageTransition>
      <div className="space-y-6">
        {/* whywait 打字机标题 */}
        <div className="text-center md:text-left">
          <div className="flex items-center gap-3 mb-2 justify-center md:justify-start">
            <svg width="40" height="40" viewBox="0 0 32 32" fill="none" className="flex-shrink-0">
              <circle cx="16" cy="16" r="14" stroke="var(--color-ink)" strokeWidth="2.5" fill="var(--color-apricot)" />
              <line x1="16" y1="4" x2="16" y2="6" stroke="var(--color-ink)" strokeWidth="2" strokeLinecap="round" />
              <line x1="16" y1="26" x2="16" y2="28" stroke="var(--color-ink)" strokeWidth="2" strokeLinecap="round" />
              <line x1="4" y1="16" x2="6" y2="16" stroke="var(--color-ink)" strokeWidth="2" strokeLinecap="round" />
              <line x1="26" y1="16" x2="28" y2="16" stroke="var(--color-ink)" strokeWidth="2" strokeLinecap="round" />
              <line x1="16" y1="16" x2="10" y2="11" stroke="var(--color-neon-orange)" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="16" y1="16" x2="22" y2="12" stroke="var(--color-ink)" strokeWidth="2" strokeLinecap="round" />
              <circle cx="16" cy="16" r="2" fill="var(--color-neon-orange)" />
            </svg>
            <TypewriterLogo
              text="whywait"
              className="text-4xl md:text-5xl"
              speed={180}
              pauseDuration={2500}
            />
          </div>
          <motion.p
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3, duration: 0.5 }}
            className="font-handwritten text-lg"
            style={{ color: "var(--text-secondary)" }}
          >
            {data.profile.name}，Why Wait? ⚡
          </motion.p>
        </div>

        {/* 今日心情打卡 - 便签纸样式 */}
        <div
          className="sticky-note p-5"
          style={{ background: STICKY_COLORS[0].bg, transform: `rotate(${STICKY_COLORS[0].rotate})` }}
        >
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-bold" style={{ color: "var(--color-ink)" }}>
              今日心情
            </h3>
            {todayMood && (
              <span className="text-xs font-bold" style={{ color: "var(--color-neon-green)" }}>
                ✓ 已打卡
              </span>
            )}
          </div>
          {todayMood ? (
            <div className="flex items-center gap-3 py-2">
              <div className="text-3xl">{MOOD_CONFIG[todayMood.mood as keyof typeof MOOD_CONFIG].emoji}</div>
              <div>
                <p className="text-sm font-bold" style={{ color: "var(--color-ink)" }}>
                  {MOOD_CONFIG[todayMood.mood as keyof typeof MOOD_CONFIG].label}
                </p>
                <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                  {new Date(todayMood.createdAt).toLocaleTimeString("zh-CN", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })}{" "}
                  记录
                </p>
              </div>
            </div>
          ) : (
            <div className="flex justify-between gap-2">
              {(Object.keys(MOOD_CONFIG) as Array<keyof typeof MOOD_CONFIG>).map((mood) => (
                <button
                  key={mood}
                  onClick={() => recordMood(mood)}
                  className="flex-1 flex flex-col items-center gap-1 py-3 rounded-lg transition-all group hover:scale-105"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">
                    {MOOD_CONFIG[mood].emoji}
                  </span>
                  <span className="text-xs font-medium" style={{ color: "var(--text-secondary)" }}>
                    {MOOD_CONFIG[mood].label}
                  </span>
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 人格测试 / 人格卡片 - 便签纸 */}
        {personality && personalityInfo ? (
          <div
            className="sticky-note p-5"
            style={{ background: STICKY_COLORS[2].bg, transform: `rotate(${STICKY_COLORS[2].rotate})` }}
          >
            <div className="flex items-start gap-4">
              <div className="text-4xl">{personalityInfo.emoji}</div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h2 className="text-lg font-bold" style={{ color: "var(--color-ink)" }}>
                    {personality.typeName}
                  </h2>
                  <span
                    className="text-xs px-2 py-0.5 rounded-full font-bold"
                    style={{
                      background: "var(--color-neon-orange)",
                      color: "#fff",
                    }}
                  >
                    已测试
                  </span>
                </div>
                <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                  {personality.description}
                </p>
              </div>
              <Link
                href="/test"
                className="text-xs flex items-center gap-1 whitespace-nowrap"
                style={{ color: "var(--color-neon-orange)" }}
              >
                重测 <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
          </div>
        ) : (
          <Link href="/test" className="block">
            <div
              className="sticky-note p-5 cursor-pointer"
              style={{ background: STICKY_COLORS[1].bg, transform: `rotate(${STICKY_COLORS[1].rotate})` }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-12 h-12 rounded-xl flex items-center justify-center"
                  style={{ background: "var(--color-apricot)" }}
                >
                  <Brain className="w-6 h-6" style={{ color: "var(--color-ink)" }} />
                </div>
                <div className="flex-1">
                  <h2 className="font-pixel text-xs mb-1" style={{ color: "var(--color-ink)" }}>
                    STEP 1: TEST
                  </h2>
                  <p className="text-sm" style={{ color: "var(--text-secondary)" }}>
                    8道题，2分钟，发现你的拖延模式
                  </p>
                </div>
                <ChevronRight className="w-5 h-5" style={{ color: "var(--color-ink)" }} />
              </div>
            </div>
          </Link>
        )}

        {/* 统计卡片 - 便签纸错落 */}
        <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4" delay={0.15}>
          {[
            { icon: <Flame className="w-5 h-5" />, label: "连续天数", value: `${stats.streak}`, unit: "天", color: 0 },
            { icon: <Target className="w-5 h-5" />, label: "已完成", value: `${stats.completedTasks}`, unit: `/${stats.totalTasks}`, color: 3 },
            { icon: <Timer className="w-5 h-5" />, label: "专注时长", value: `${stats.focusMin}`, unit: "分", color: 2 },
            { icon: <TrendingUp className="w-5 h-5" />, label: "完成率", value: `${stats.completionRate}`, unit: "%", color: 1 },
          ].map((stat, i) => (
            <FadeInItem key={i}>
              <div
                className="sticky-note p-4"
                style={{
                  background: STICKY_COLORS[stat.color].bg,
                  transform: `rotate(${STICKY_COLORS[stat.color].rotate})`,
                }}
              >
                <div className="mb-2" style={{ color: "var(--color-ink)" }}>
                  {stat.icon}
                </div>
                <div className="text-2xl font-bold" style={{ color: "var(--color-ink)" }}>
                  {stat.value}
                  <span className="text-sm font-normal ml-1" style={{ color: "var(--text-muted)" }}>
                    {stat.unit}
                  </span>
                </div>
                <div className="text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                  {stat.label}
                </div>
              </div>
            </FadeInItem>
          ))}
        </StaggerContainer>

        {/* 今日启动推荐 - 追光照亮 */}
        {recommendedStart && (
          <div className="sticky-note spotlight-card p-6" style={{ background: "var(--sticky-orange)", transform: "rotate(-0.8deg)" }}>
            <div className="relative">
              <div className="flex items-center gap-2 mb-3">
                <Rocket className="w-4 h-4" style={{ color: "var(--color-neon-orange)" }} />
                <span className="font-pixel text-[10px]" style={{ color: "var(--color-neon-orange)" }}>
                  START NOW
                </span>
              </div>
              <h3 className="text-lg font-bold mb-1" style={{ color: "var(--color-ink)" }}>
                {recommendedStart.subTask.title}
              </h3>
              <p className="text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                来自：{recommendedStart.parentTask?.title || "未分类任务"}
              </p>
              <div className="flex items-center gap-4 mb-4 text-xs">
                <div className="flex items-center gap-1.5">
                  <div
                    className="w-2 h-2 rounded-full"
                    style={{
                      backgroundColor:
                        recommendedStart.subTask.resistanceScore <= 3
                          ? "#4ECDC4"
                          : recommendedStart.subTask.resistanceScore <= 6
                          ? "#FAD6A5"
                          : "#FF6B35",
                    }}
                  />
                  <span style={{ color: "var(--text-secondary)" }}>
                    阻力 {recommendedStart.subTask.resistanceScore}/10 ·{" "}
                    {resistanceLabels[recommendedStart.subTask.resistanceType] || "未知"}
                  </span>
                </div>
                <div className="flex items-center gap-1.5" style={{ color: "var(--text-muted)" }}>
                  <Clock className="w-3.5 h-3.5" />
                  <span>约{recommendedStart.subTask.estimatedMinutes}分钟</span>
                </div>
              </div>
              <div
                className="rounded-lg p-3 mb-4"
                style={{ background: "rgba(43, 58, 103, 0.06)" }}
              >
                <div className="text-xs mb-1" style={{ color: "var(--text-muted)" }}>
                  ⚡ 5分钟启动目标
                </div>
                <div className="text-sm" style={{ color: "var(--color-ink)" }}>
                  {recommendedStart.subTask.microStep}
                </div>
              </div>
              <button onClick={handleStartFocus} className="btn-neon w-full flex items-center justify-center gap-2 text-sm">
                <Play className="w-4 h-4" />
                现在就开始（{recommendedStart.subTask.estimatedMinutes}分钟）
              </button>
            </div>
          </div>
        )}

        {/* 今日待办 - 便签纸 */}
        {todayTodo.length > 0 && (
          <div
            className="sticky-note p-5"
            style={{ background: STICKY_COLORS[3].bg, transform: "rotate(0.5deg)" }}
          >
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold flex items-center gap-2" style={{ color: "var(--color-ink)" }}>
                <ListTodo className="w-4 h-4" style={{ color: "var(--color-neon-green)" }} />
                今日待办
              </h3>
              <Link
                href="/tasks"
                className="text-xs flex items-center gap-1"
                style={{ color: "var(--color-neon-orange)" }}
              >
                查看全部 <ChevronRight className="w-3 h-3" />
              </Link>
            </div>
            <div className="space-y-2">
              {todayTodo.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center gap-3 py-2 px-3 rounded-lg transition-colors"
                  style={{ background: "rgba(43, 58, 103, 0.04)" }}
                >
                  <div
                    className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                    style={{
                      backgroundColor:
                        PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS] || "#94a3b8",
                    }}
                  />
                  <span className="flex-1 text-sm truncate" style={{ color: "var(--color-ink)" }}>
                    {task.title}
                  </span>
                  <span className="text-xs flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                    {task.dueDate
                      ? new Date(task.dueDate).toLocaleDateString("zh-CN", {
                          month: "short",
                          day: "numeric",
                        })
                      : ""}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* 功能入口 - 便签纸卡片 */}
        <StaggerContainer className="grid md:grid-cols-2 gap-4" delay={0.35}>
          {[
            { href: "/tasks", icon: <ListTodo className="w-6 h-6" />, title: "任务管理", desc: "创建、追踪、分析你的任务完成模式", color: 3 },
            { href: "/focus", icon: <Zap className="w-6 h-6" />, title: "专注模式", desc: "番茄钟 + 深度工作，告别拖延", color: 0 },
            { href: "/diagnosis", icon: <TrendingUp className="w-6 h-6" />, title: "数据诊断", desc: "可视化你的拖延模式与趋势", color: 2 },
            { href: "/coach", icon: <Sparkles className="w-6 h-6" />, title: "AI 教练", desc: "个性化建议，破解你的拖延循环", color: 1 },
          ].map((card, i) => (
            <FadeInItem key={i}>
              <Link href={card.href} className="block">
                <div
                  className="sticky-note p-5 cursor-pointer"
                  style={{
                    background: STICKY_COLORS[card.color].bg,
                    transform: `rotate(${STICKY_COLORS[card.color].rotate})`,
                  }}
                >
                  <div className="flex items-center gap-4">
                    <div
                      className="w-12 h-12 rounded-xl flex items-center justify-center"
                      style={{ background: "rgba(43, 58, 103, 0.08)" }}
                    >
                      <span style={{ color: "var(--color-ink)" }}>{card.icon}</span>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-bold" style={{ color: "var(--color-ink)" }}>
                        {card.title}
                      </h3>
                      <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {card.desc}
                      </p>
                    </div>
                    <ChevronRight className="w-5 h-5" style={{ color: "var(--color-ink)" }} />
                  </div>
                </div>
              </Link>
            </FadeInItem>
          ))}
        </StaggerContainer>

        {/* 专属建议 - 墨蓝便签 */}
        {personality && (
          <div
            className="rounded-xl p-6"
            style={{
              background: "var(--color-ink)",
              color: "var(--color-apricot)",
            }}
          >
            <h3 className="font-pixel text-xs mb-4" style={{ color: "var(--color-neon-orange)" }}>
              SUGGESTIONS
            </h3>
            <div className="space-y-2">
              {personality.suggestions.slice(0, 3).map((s, i) => (
                <div key={i} className="flex items-start gap-3 text-sm">
                  <span className="font-bold mt-0.5" style={{ color: "var(--color-neon-orange)" }}>
                    {i + 1}.
                  </span>
                  <span style={{ color: "var(--color-apricot)" }}>{s}</span>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <CompletionMessage show={showComplete} onClose={() => setShowComplete(false)} />
    </PageTransition>
  );
}
