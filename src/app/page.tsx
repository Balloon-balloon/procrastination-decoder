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
import { useMemo } from "react";
import { motion } from "framer-motion";
import { PageTransition, StaggerContainer, FadeInItem, HoverCard, TextReveal } from "@/components/Animations";
import { useRouter } from "next/navigation";

export default function DashboardPage() {
  const { data, update, loaded } = useAppData();

  // 今日是否已记录心情
  const todayMood = useMemo(() => {
    const today = new Date().toDateString();
    return data.moodEntries.find(
      (m) => new Date(m.createdAt).toDateString() === today
    );
  }, [data.moodEntries]);

  const recordMood = (mood: "great" | "good" | "okay" | "bad" | "terrible") => {
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
    great: { emoji: "😄", label: "超棒", color: "from-green-400 to-emerald-500" },
    good: { emoji: "🙂", label: "不错", color: "from-teal-400 to-cyan-500" },
    okay: { emoji: "😐", label: "一般", color: "from-yellow-400 to-orange-400" },
    bad: { emoji: "😔", label: "不好", color: "from-orange-400 to-red-400" },
    terrible: { emoji: "😢", label: "糟糕", color: "from-red-400 to-pink-500" },
  };

  const PRIORITY_COLORS = {
    low: "#10b981",
    medium: "#f59e0b",
    high: "#f97316",
    urgent: "#ef4444",
  };

  const stats = useMemo(() => {
    const completedTasks = data.tasks.filter((t) => t.status === "completed");
    const todayTasks = data.tasks.filter((t) => {
      const created = new Date(t.createdAt);
      const now = new Date();
      return (
        created.getDate() === now.getDate() &&
        created.getMonth() === now.getMonth() &&
        created.getFullYear() === now.getFullYear()
      );
    });
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
    const avgPostpone =
      data.tasks.length > 0
        ? (
            data.tasks.reduce((sum, t) => sum + t.postponedCount, 0) /
            data.tasks.length
          ).toFixed(1)
        : "0";
    return {
      completedTasks: completedTasks.length,
      todayTasks: todayTasks.length,
      focusMin,
      streak,
      completionRate,
      avgPostpone,
      totalTasks: data.tasks.length,
    };
  }, [data]);

  const router = useRouter();

  // 阻力类型标签
  const resistanceLabels: Record<string, string> = {
    perfectionist: "完美主义",
    ambiguous: "模糊型",
    overwhelming: "畏难型",
    aversive: "抵触型",
    "instant-gratification": "即时满足",
    "low-resistance": "低阻力",
  };

  // 今日启动推荐：找阻力最低的未完成子任务
  const recommendedStart = useMemo(() => {
    const pendingSubTasks = data.subTasks.filter((st) => st.status !== "completed");
    if (pendingSubTasks.length === 0) return null;
    // 按阻力从低到高排序，取第一个
    const sorted = [...pendingSubTasks].sort((a, b) => a.resistanceScore - b.resistanceScore);
    const easiest = sorted[0];
    // 找到父任务
    const parentTask = data.tasks.find((t) => t.id === easiest.taskId);
    return { subTask: easiest, parentTask };
  }, [data.subTasks, data.tasks]);

  // 今日待办（未完成的任务，按优先级排序，取前5个）
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
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="animate-pulse text-accent-400 text-lg">加载中...</div>
      </div>
    );
  }

  const personality = data.profile.personalityResult;
  const personalityInfo = personality
    ? PERSONALITY_TYPES[personality.type]
    : null;

  return (
    <PageTransition>
    <div className="space-y-6">
      <div className="text-center md:text-left">
        <h1 className="text-3xl md:text-4xl font-bold mb-3">
          <span style={{ color: "var(--text-primary)" }}>欢迎回来，</span>
          <TextReveal
            text={data.profile.name}
            delay={0.25}
            stagger={0.08}
            gradient="linear-gradient(135deg, #f97316, #ec4899, #8b5cf6, #3b82f6)"
            fontWeight={800}
          />
        </h1>
        <motion.p
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="text-base"
        >
          <span
            style={{
              background: "linear-gradient(135deg, #64748b, #94a3b8, #64748b)",
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            今天也要解码拖延，重启行动 ⚡
          </span>
        </motion.p>
      </div>

      {/* 今日心情打卡 */}
      <div className="glass-card rounded-2xl p-5">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold text-white">今日心情</h3>
          {todayMood && (
            <span className="text-xs text-green-400">✓ 已打卡</span>
          )}
        </div>
        {todayMood ? (
          <div className="flex items-center gap-3 py-2">
            <div className="text-3xl">{MOOD_CONFIG[todayMood.mood].emoji}</div>
            <div>
              <p className="text-sm text-white font-medium">
                {MOOD_CONFIG[todayMood.mood].label}
              </p>
              <p className="text-xs text-dark-400">
                {new Date(todayMood.createdAt).toLocaleTimeString("zh-CN", {
                  hour: "2-digit",
                  minute: "2-digit",
                })} 记录
              </p>
            </div>
          </div>
        ) : (
          <div className="flex justify-between gap-2">
            {(Object.keys(MOOD_CONFIG) as Array<keyof typeof MOOD_CONFIG>).map(
              (mood) => (
                <button
                  key={mood}
                  onClick={() => recordMood(mood)}
                  className="flex-1 flex flex-col items-center gap-1 py-3 rounded-xl hover:bg-dark-800/50 transition-all group"
                >
                  <span className="text-2xl group-hover:scale-110 transition-transform">
                    {MOOD_CONFIG[mood].emoji}
                  </span>
                  <span className="text-xs text-dark-400 group-hover:text-white transition-colors">
                    {MOOD_CONFIG[mood].label}
                  </span>
                </button>
              )
            )}
          </div>
        )}
      </div>

      {personality && personalityInfo ? (
        <div className="glass-card glass-card-hover rounded-2xl p-6 transition-all">
          <div className="flex items-start gap-4">
            <div className="text-5xl">{personalityInfo.emoji}</div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-xl font-bold text-white">
                  {personality.typeName}
                </h2>
                <span className="text-xs px-2 py-0.5 rounded-full bg-accent-500/20 text-accent-300 border border-accent-500/30">
                  已测试
                </span>
              </div>
              <p className="text-sm text-dark-300 line-clamp-2">
                {personality.description}
              </p>
            </div>
            <Link
              href="/test"
              className="text-xs text-dark-400 hover:text-accent-400 flex items-center gap-1 whitespace-nowrap"
            >
              重新测试 <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
        </div>
      ) : (
        <Link href="/test" className="block">
          <div className="glass-card glass-card-hover rounded-2xl p-6 transition-all group cursor-pointer">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-accent-500/30 to-primary-500/20 flex items-center justify-center">
                <Brain className="w-7 h-7 text-accent-400" />
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-white mb-1">
                  第一步：测测你的拖延人格
                </h2>
                <p className="text-sm text-dark-400">
                  8道题，2分钟，发现你的拖延模式
                </p>
              </div>
              <ChevronRight className="w-5 h-5 text-dark-400 group-hover:text-accent-400 group-hover:translate-x-1 transition-all" />
            </div>
          </div>
        </Link>
      )}

      <StaggerContainer className="grid grid-cols-2 md:grid-cols-4 gap-4" delay={0.15}>
        <FadeInItem>
          <HoverCard y={-2}>
            <StatCard
              icon={<Flame className="w-5 h-5" />}
              label="连续天数"
              value={`${stats.streak}`}
              unit="天"
              color="from-orange-500/20 to-red-500/10"
              iconColor="text-orange-400"
            />
          </HoverCard>
        </FadeInItem>
        <FadeInItem>
          <HoverCard y={-2}>
            <StatCard
              icon={<Target className="w-5 h-5" />}
              label="已完成任务"
              value={`${stats.completedTasks}`}
              unit={`/ ${stats.totalTasks}`}
              color="from-green-500/20 to-emerald-500/10"
              iconColor="text-green-400"
            />
          </HoverCard>
        </FadeInItem>
        <FadeInItem>
          <HoverCard y={-2}>
            <StatCard
              icon={<Timer className="w-5 h-5" />}
              label="专注时长"
              value={`${stats.focusMin}`}
              unit="分钟"
              color="from-blue-500/20 to-cyan-500/10"
              iconColor="text-blue-400"
            />
          </HoverCard>
        </FadeInItem>
        <FadeInItem>
          <HoverCard y={-2}>
            <StatCard
              icon={<TrendingUp className="w-5 h-5" />}
              label="完成率"
              value={`${stats.completionRate}`}
              unit="%"
              color="from-purple-500/20 to-pink-500/10"
              iconColor="text-purple-400"
            />
          </HoverCard>
        </FadeInItem>
      </StaggerContainer>

      {/* 今日启动推荐 */}
      {recommendedStart && (
        <div className="glass-card rounded-2xl p-6 border border-accent-500/30 relative overflow-hidden">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-accent-500/20 to-transparent rounded-full -translate-y-1/2 translate-x-1/2" />
          <div className="relative">
            <div className="flex items-center gap-2 mb-3">
              <Rocket className="w-4 h-4 text-accent-400" />
              <span className="text-xs font-bold text-accent-400 uppercase tracking-wider">
                今日启动推荐
              </span>
            </div>
            <h3 className="text-lg font-bold text-white mb-1">
              {recommendedStart.subTask.title}
            </h3>
            <p className="text-xs text-dark-400 mb-3">
              来自：{recommendedStart.parentTask?.title || "未分类任务"}
            </p>
            <div className="flex items-center gap-4 mb-4 text-xs">
              <div className="flex items-center gap-1.5">
                <div
                  className="w-2 h-2 rounded-full"
                  style={{
                    backgroundColor:
                      recommendedStart.subTask.resistanceScore <= 3
                        ? "#4ade80"
                        : recommendedStart.subTask.resistanceScore <= 6
                        ? "#facc15"
                        : "#f87171",
                  }}
                />
                <span className="text-dark-300">
                  阻力 {recommendedStart.subTask.resistanceScore}/10 ·{" "}
                  {resistanceLabels[recommendedStart.subTask.resistanceType] || "未知"}
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-dark-400">
                <Clock className="w-3.5 h-3.5" />
                <span>约{recommendedStart.subTask.estimatedMinutes}分钟</span>
              </div>
            </div>
            <div className="bg-dark-800/50 rounded-xl p-3 mb-4 border border-dark-700/30">
              <div className="text-xs text-dark-400 mb-1">⚡ 5分钟启动目标</div>
              <div className="text-sm text-dark-200">
                {recommendedStart.subTask.microStep}
              </div>
            </div>
            <button
              onClick={() =>
                router.push(
                  `/focus?subTaskId=${recommendedStart.subTask.id}&taskId=${recommendedStart.subTask.taskId}`
                )
              }
              className="w-full py-3 rounded-xl bg-gradient-to-r from-accent-500 to-primary-600 text-white text-sm font-bold hover:opacity-90 transition-all flex items-center justify-center gap-2"
            >
              <Play className="w-4 h-4" />
              现在就开始（{recommendedStart.subTask.estimatedMinutes}分钟）
            </button>
          </div>
        </div>
      )}

      {/* 今日待办快速预览 */}
      {todayTodo.length > 0 && (
        <div className="glass-card rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ListTodo className="w-4 h-4 text-green-400" />
              今日待办
            </h3>
            <Link
              href="/tasks"
              className="text-xs text-dark-400 hover:text-accent-400 flex items-center gap-1"
            >
              查看全部 <ChevronRight className="w-3 h-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {todayTodo.map((task) => (
              <div
                key={task.id}
                className="flex items-center gap-3 py-2 px-3 rounded-xl hover:bg-dark-800/30 transition-colors"
              >
                <div
                  className="w-2.5 h-2.5 rounded-full flex-shrink-0"
                  style={{ backgroundColor: PRIORITY_COLORS[task.priority as keyof typeof PRIORITY_COLORS] || "#94a3b8" }}
                />
                <span className="flex-1 text-sm text-dark-200 truncate">
                  {task.title}
                </span>
                <span className="text-xs text-dark-500 flex-shrink-0">
                  {task.dueDate
                    ? new Date(task.dueDate).toLocaleDateString("zh-CN", { month: "short", day: "numeric" })
                    : ""}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      <StaggerContainer className="grid md:grid-cols-2 gap-4" delay={0.35}>
        <FadeInItem>
          <Link href="/tasks" className="block">
            <HoverCard>
              <FeatureCard
                icon={<ListTodo className="w-6 h-6" />}
                title="任务管理"
                desc="创建、追踪、分析你的任务完成模式"
                color="from-green-500/20 to-emerald-500/5"
                iconColor="text-green-400"
              />
            </HoverCard>
          </Link>
        </FadeInItem>
        <FadeInItem>
          <Link href="/focus" className="block">
            <HoverCard>
              <FeatureCard
                icon={<Zap className="w-6 h-6" />}
                title="专注模式"
                desc="番茄钟 + 深度工作，告别拖延"
                color="from-yellow-500/20 to-orange-500/5"
                iconColor="text-yellow-400"
              />
            </HoverCard>
          </Link>
        </FadeInItem>
        <FadeInItem>
          <Link href="/diagnosis" className="block">
            <HoverCard>
              <FeatureCard
                icon={<TrendingUp className="w-6 h-6" />}
                title="数据诊断"
                desc="可视化你的拖延模式与趋势"
                color="from-blue-500/20 to-cyan-500/5"
                iconColor="text-blue-400"
              />
            </HoverCard>
          </Link>
        </FadeInItem>
        <FadeInItem>
          <Link href="/coach" className="block">
            <HoverCard>
              <FeatureCard
                icon={<Sparkles className="w-6 h-6" />}
                title="AI 教练"
                desc="个性化建议，破解你的拖延循环"
                color="from-purple-500/20 to-pink-500/5"
                iconColor="text-purple-400"
              />
            </HoverCard>
          </Link>
        </FadeInItem>
      </StaggerContainer>

      {personality && (
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent-400" />
            专属建议
          </h3>
          <div className="space-y-2">
            {personality.suggestions.slice(0, 3).map((s, i) => (
              <div
                key={i}
                className="flex items-start gap-3 text-sm text-dark-300"
              >
                <span className="text-accent-400 font-bold mt-0.5">
                  {i + 1}.
                </span>
                <span>{s}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
    </PageTransition>
  );
}

function StatCard({
  icon,
  label,
  value,
  unit,
  color,
  iconColor,
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  unit: string;
  color: string;
  iconColor: string;
}) {
  return (
    <div className={`glass-card rounded-2xl p-4 bg-gradient-to-br ${color}`}>
      <div className={`${iconColor} mb-2`}>{icon}</div>
      <div className="text-2xl font-bold text-white">
        {value}
        <span className="text-sm text-dark-400 ml-1 font-normal">{unit}</span>
      </div>
      <div className="text-xs text-dark-400 mt-1">{label}</div>
    </div>
  );
}

function FeatureCard({
  icon,
  title,
  desc,
  color,
  iconColor,
}: {
  icon: React.ReactNode;
  title: string;
  desc: string;
  color: string;
  iconColor: string;
}) {
  return (
    <div className="glass-card glass-card-hover rounded-2xl p-5 transition-all group">
      <div className="flex items-center gap-4">
        <div
          className={`w-12 h-12 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center ${iconColor}`}
        >
          {icon}
        </div>
        <div className="flex-1">
          <h3 className="font-bold text-white group-hover:text-accent-400 transition-colors">
            {title}
          </h3>
          <p className="text-xs text-dark-400 mt-0.5">{desc}</p>
        </div>
        <ChevronRight className="w-5 h-5 text-dark-500 group-hover:text-accent-400 group-hover:translate-x-1 transition-all" />
      </div>
    </div>
  );
}
