"use client";
import { useState } from "react";
import { useAppData } from "@/hooks/useAppData";
import { calculateStreak } from "@/lib/store";
import { getWeekDates } from "@/lib/utils";
import { PageTransition } from "@/components/Animations";
import { PERSONALITY_TYPES } from "@/lib/personality";
import { ProcrastinationType, ResistanceType } from "@/lib/types";
import { IS_STATIC_DEPLOYMENT } from "@/lib/deployment";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  LineChart,
  Line,
} from "recharts";
import {
  TrendingUp,
  Brain,
  Target,
  Flame,
  Clock,
  Zap,
  ShieldAlert,
  BarChart3,
  Sparkles,
  Loader2,
  RefreshCw,
  Download,
  Upload,
  Trash2,
  AlertTriangle,
} from "lucide-react";

const PRIORITY_COLORS = {
  low: "#10b981",
  medium: "#f59e0b",
  high: "#f97316",
  urgent: "#ef4444",
};

const RESISTANCE_CONFIG: Record<ResistanceType, { label: string; color: string }> = {
  perfectionist: { label: "完美主义", color: "#f87171" },
  ambiguous: { label: "模糊型", color: "#c084fc" },
  overwhelming: { label: "畏难型", color: "#fb923c" },
  aversive: { label: "抵触型", color: "#facc15" },
  "instant-gratification": { label: "即时满足", color: "#f472b6" },
  "low-resistance": { label: "低阻力", color: "#4ade80" },
};

export default function DiagnosisPage() {
  const { data, update, loaded } = useAppData();
  const [showConfirmClear, setShowConfirmClear] = useState(false);
  const [importStatus, setImportStatus] = useState<"idle" | "success" | "error">("idle");

  // 导出数据
  const handleExport = () => {
    const jsonData = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonData], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `procrastination-decoder-${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  // 导入数据
  const handleImport = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const imported = JSON.parse(event.target?.result as string);
        // 简单校验
        if (!imported.tasks || !imported.profile) {
          setImportStatus("error");
          return;
        }
        // 用导入的数据替换当前数据
        update(() => imported);
        setImportStatus("success");
        setTimeout(() => setImportStatus("idle"), 3000);
      } catch {
        setImportStatus("error");
        setTimeout(() => setImportStatus("idle"), 3000);
      }
    };
    reader.readAsText(file);
    e.target.value = "";
  };

  // 清空数据
  const handleClearData = () => {
    update(() => ({
      tasks: [],
      subTasks: [],
      focusSessions: [],
      moodEntries: [],
      achievements: [
        { id: "first-step", title: "迈出第一步", description: "完成你的第一个任务", icon: "🚀", unlocked: false, unlockedAt: null, progress: 0, maxProgress: 1 },
        { id: "streak-3", title: "三日不断", description: "连续3天有完成任务", icon: "🔥", unlocked: false, unlockedAt: null, progress: 0, maxProgress: 3 },
        { id: "streak-7", title: "一周坚持", description: "连续7天有完成任务", icon: "💪", unlocked: false, unlockedAt: null, progress: 0, maxProgress: 7 },
        { id: "task-10", title: "任务终结者", description: "累计完成10个任务", icon: "⚡", unlocked: false, unlockedAt: null, progress: 0, maxProgress: 10 },
        { id: "focus-100", title: "深度专注", description: "累计专注100分钟", icon: "🎯", unlocked: false, unlockedAt: null, progress: 0, maxProgress: 100 },
        { id: "personality", title: "认识自己", description: "完成拖延人格测试", icon: "🧠", unlocked: false, unlockedAt: null, progress: 0, maxProgress: 1 },
        { id: "mood-7", title: "情绪日记", description: "连续7天记录心情", icon: "🌈", unlocked: false, unlockedAt: null, progress: 0, maxProgress: 7 },
        { id: "promise", title: "说到做到", description: "当天创建的任务当天完成", icon: "✅", unlocked: false, unlockedAt: null, progress: 0, maxProgress: 1 },
      ],
      profile: {
        name: data.profile.name,
        personalityResult: null,
        createdAt: data.profile.createdAt,
        totalFocusTime: 0,
        totalTasksCompleted: 0,
        streak: 0,
        lastActiveDate: data.profile.lastActiveDate,
      },
    }));
    setShowConfirmClear(false);
  };
  const [insight, setInsight] = useState<any>(null);
  const [insightLoading, setInsightLoading] = useState(false);

  const generateInsight = async () => {
    setInsightLoading(true);
    try {
      // 计算 topResistanceType
      const typeCounts: Record<string, number> = {};
      data.subTasks.forEach((st) => {
        typeCounts[st.resistanceType] = (typeCounts[st.resistanceType] || 0) + 1;
      });
      const topType = Object.entries(typeCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
      const topTypeLabel = topType ? RESISTANCE_CONFIG[topType as ResistanceType]?.label : "";

      // 高低阻力完成率
      const lowSt = data.subTasks.filter((st) => st.resistanceScore <= 3);
      const highSt = data.subTasks.filter((st) => st.resistanceScore >= 7);
      const lowRate = lowSt.length > 0 ? Math.round((lowSt.filter(s => s.status === "completed").length / lowSt.length) * 100) : 0;
      const highRate = highSt.length > 0 ? Math.round((highSt.filter(s => s.status === "completed").length / highSt.length) * 100) : 0;

      const res = await fetch("/api/insight", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          totalTasks: data.tasks.length,
          completedTasks: data.tasks.filter((t) => t.status === "completed").length,
          completionRate,
          totalPostpone,
          avgPostpone: parseFloat(avgPostpone as string),
          streak,
          focusMin,
          personalityType: personality?.type,
          personalityName: personality?.typeName,
          topResistanceType: topTypeLabel,
          avgResistance: parseFloat(avgResistance as string),
          highResistanceCompletionRate: highRate,
          lowResistanceCompletionRate: lowRate,
          recentTaskExamples: data.tasks.slice(-3).map((t) => t.title),
        }),
      });
      const result = await res.json();
      setInsight(result);
    } catch (e) {
      console.error("Generate insight error:", e);
    } finally {
      setInsightLoading(false);
    }
  };

  if (!loaded) return <div className="text-center py-20 text-dark-400">加载中...</div>;

  const completedTasks = data.tasks.filter((t) => t.status === "completed");
  const completionRate =
    data.tasks.length > 0
      ? Math.round((completedTasks.length / data.tasks.length) * 100)
      : 0;
  const totalPostpone = data.tasks.reduce((sum, t) => sum + t.postponedCount, 0);
  const avgPostpone =
    data.tasks.length > 0 ? (totalPostpone / data.tasks.length).toFixed(1) : "0";
  const streak = calculateStreak(data.tasks);
  const focusMin = Math.floor(
    data.focusSessions.filter((s) => s.completed).reduce((sum, s) => sum + s.duration, 0) / 60
  );

  // Weekly task trend
  const weekDates = getWeekDates();
  const weeklyData = weekDates.map((date) => {
    const dayKey = date.toISOString().split("T")[0];
    const created = data.tasks.filter((t) => t.createdAt.split("T")[0] === dayKey).length;
    const completed = data.tasks.filter(
      (t) => t.completedAt && t.completedAt.split("T")[0] === dayKey
    ).length;
    return {
      date: date.toLocaleDateString("zh-CN", { month: "short", day: "numeric" }),
      创建: created,
      完成: completed,
    };
  });

  // Priority distribution
  const priorityData = (["urgent", "high", "medium", "low"] as const).map((p) => ({
    name: { urgent: "紧急", high: "高", medium: "中", low: "低" }[p],
    value: data.tasks.filter((t) => t.priority === p).length,
    color: PRIORITY_COLORS[p],
  }));

  // Mood trend
  const moodData = data.moodEntries.slice(-7).map((entry) => ({
    date: new Date(entry.createdAt).toLocaleDateString("zh-CN", {
      month: "short",
      day: "numeric",
    }),
    能量: entry.energy,
    拖延程度: entry.procrastinationLevel,
  }));

  // Personality radar
  const personality = data.profile.personalityResult;
  const radarData = personality
    ? (Object.keys(personality.scores) as ProcrastinationType[]).map((key) => ({
        type: PERSONALITY_TYPES[key].name,
        得分: personality.scores[key],
      }))
    : [];

  // 阻力类型分布
  const allSubTasks = data.subTasks;
  const resistanceCount: Record<string, number> = {};
  allSubTasks.forEach((st) => {
    resistanceCount[st.resistanceType] = (resistanceCount[st.resistanceType] || 0) + 1;
  });
  const resistanceData = (Object.keys(RESISTANCE_CONFIG) as ResistanceType[])
    .filter((type) => resistanceCount[type] && resistanceCount[type] > 0)
    .map((type) => ({
      name: RESISTANCE_CONFIG[type].label,
      value: resistanceCount[type],
      color: RESISTANCE_CONFIG[type].color,
    }));

  // 阻力与完成率分析
  const resistanceGroups = [
    { range: "1-3分", label: "低阻力", min: 1, max: 3, total: 0, completed: 0 },
    { range: "4-6分", label: "中阻力", min: 4, max: 6, total: 0, completed: 0 },
    { range: "7-10分", label: "高阻力", min: 7, max: 10, total: 0, completed: 0 },
  ];
  allSubTasks.forEach((st) => {
    const group = resistanceGroups.find(
      (g) => st.resistanceScore >= g.min && st.resistanceScore <= g.max
    );
    if (group) {
      group.total++;
      if (st.status === "completed") group.completed++;
    }
  });
  const resistanceCompletionData = resistanceGroups
    .filter((g) => g.total > 0)
    .map((g) => ({
      难度: g.label,
      完成率: g.total > 0 ? Math.round((g.completed / g.total) * 100) : 0,
      数量: g.total,
    }));

  // 平均阻力分数
  const avgResistance =
    allSubTasks.length > 0
      ? (allSubTasks.reduce((sum, st) => sum + st.resistanceScore, 0) / allSubTasks.length).toFixed(1)
      : "0";

  // Overall rating
  const getRating = () => {
    if (data.tasks.length === 0) return { grade: "-", label: "暂无数据", color: "text-dark-400" };
    let score = 0;
    if (completionRate >= 80) score += 25;
    else if (completionRate >= 60) score += 15;
    else if (completionRate >= 40) score += 8;
    if (streak >= 7) score += 25;
    else if (streak >= 3) score += 15;
    else if (streak >= 1) score += 8;
    if (focusMin >= 300) score += 25;
    else if (focusMin >= 100) score += 15;
    else if (focusMin >= 30) score += 8;
    if (parseFloat(avgPostpone) <= 0.5) score += 25;
    else if (parseFloat(avgPostpone) <= 1) score += 15;
    else if (parseFloat(avgPostpone) <= 2) score += 8;

    if (score >= 80) return { grade: "A", label: "行动高手", color: "text-green-400" };
    if (score >= 60) return { grade: "B", label: "稳步前进", color: "text-blue-400" };
    if (score >= 40) return { grade: "C", label: "需要加油", color: "text-yellow-400" };
    return { grade: "D", label: "拖延预警", color: "text-red-400" };
  };

  const rating = getRating();

  return (
    <PageTransition>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">数据诊断</h1>
        <p className="text-sm text-dark-400 mt-1">用数据看清你的拖延模式</p>
      </div>

      {/* Overall Rating */}
      <div className="glass-card rounded-2xl p-6 text-center">
        <div className="text-6xl font-bold text-gradient mb-2">{rating.grade}</div>
        <div className={`text-lg font-medium ${rating.color}`}>{rating.label}</div>
        <div className="grid grid-cols-4 gap-4 mt-6">
          <div>
            <div className="text-2xl font-bold text-white">{completionRate}%</div>
            <div className="text-xs text-dark-400 mt-1">完成率</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{streak}</div>
            <div className="text-xs text-dark-400 mt-1">连续天数</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{focusMin}</div>
            <div className="text-xs text-dark-400 mt-1">专注分钟</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-white">{avgPostpone}</div>
            <div className="text-xs text-dark-400 mt-1">平均推迟</div>
          </div>
        </div>
      </div>

      {/* AI 深度洞察 */}
      {!IS_STATIC_DEPLOYMENT && (
      <div className="glass-card rounded-2xl p-6 border border-gradient-to-r from-accent-500/20 to-purple-500/20" style={{ borderColor: "rgba(168, 85, 247, 0.3)", background: "linear-gradient(135deg, rgba(249, 115, 22, 0.05), rgba(168, 85, 247, 0.05))" }}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-accent-400" />
            AI 深度洞察
          </h3>
          <button
            onClick={generateInsight}
            disabled={insightLoading}
            className="text-xs px-3 py-1.5 rounded-lg bg-accent-500/20 text-accent-400 hover:bg-accent-500/30 transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            {insightLoading ? (
              <>
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                分析中...
              </>
            ) : insight ? (
              <>
                <RefreshCw className="w-3.5 h-3.5" />
                重新分析
              </>
            ) : (
              <>
                <Sparkles className="w-3.5 h-3.5" />
                生成洞察
              </>
            )}
          </button>
        </div>

        {insightLoading && (
          <div className="py-8 text-center">
            <Loader2 className="w-8 h-8 text-accent-400 animate-spin mx-auto mb-3" />
            <p className="text-sm text-dark-300">AI 正在分析你的数据...</p>
          </div>
        )}

        {!insightLoading && !insight && data.tasks.length === 0 && (
          <div className="py-8 text-center">
            <div className="text-3xl mb-2">🔍</div>
            <p className="text-sm text-dark-400">先创建一些任务，再来分析你的拖延模式</p>
          </div>
        )}

        {!insightLoading && !insight && data.tasks.length > 0 && (
          <div className="py-6 text-center">
            <div className="text-3xl mb-2">💡</div>
            <p className="text-sm text-dark-300 mb-3">点击「生成洞察」，让 AI 分析你的拖延模式</p>
            <p className="text-xs text-dark-500">基于完成率、阻力分布、专注数据等多维度分析</p>
          </div>
        )}

        {!insightLoading && insight && (
          <div className="space-y-4">
            {/* 一句话总结 */}
            <div className="text-center py-3 px-4 rounded-xl bg-dark-800/50 border border-dark-700/50">
              <p className="text-base font-bold text-gradient">{insight.summary}</p>
            </div>

            {/* 做得好的地方 */}
            {insight.strengths?.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-green-400 mb-2 flex items-center gap-1.5">
                  <span>✅</span> 做得好的地方
                </h4>
                <ul className="space-y-1.5">
                  {insight.strengths.map((s: string, i: number) => (
                    <li key={i} className="text-xs text-dark-200 flex gap-2">
                      <span className="text-green-400 flex-shrink-0">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 需要改进 */}
            {insight.issues?.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-yellow-400 mb-2 flex items-center gap-1.5">
                  <span>⚠️</span> 需要注意
                </h4>
                <ul className="space-y-1.5">
                  {insight.issues.map((s: string, i: number) => (
                    <li key={i} className="text-xs text-dark-200 flex gap-2">
                      <span className="text-yellow-400 flex-shrink-0">•</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 改进建议 */}
            {insight.suggestions?.length > 0 && (
              <div>
                <h4 className="text-xs font-bold text-accent-400 mb-2 flex items-center gap-1.5">
                  <span>💡</span> 改进建议
                </h4>
                <ul className="space-y-1.5">
                  {insight.suggestions.map((s: string, i: number) => (
                    <li key={i} className="text-xs text-dark-200 flex gap-2">
                      <span className="text-accent-400 font-bold flex-shrink-0">{i + 1}.</span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* 鼓励 */}
            {insight.encouragement && (
              <div className="text-center pt-2 border-t border-dark-700/30">
                <p className="text-sm text-dark-300">{insight.encouragement}</p>
              </div>
            )}
          </div>
        )}
      </div>
      )}

      {/* Weekly Trend */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-accent-400" />
          本周任务趋势
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart data={weeklyData}>
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "8px",
              }}
            />
            <Bar dataKey="创建" fill="#f97316" radius={[4, 4, 0, 0]} />
            <Bar dataKey="完成" fill="#10b981" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Priority Pie */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Target className="w-4 h-4 text-accent-400" />
            优先级分布
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={priorityData}
                cx="50%"
                cy="50%"
                innerRadius={50}
                outerRadius={80}
                dataKey="value"
                paddingAngle={2}
              >
                {priorityData.map((entry, index) => (
                  <Cell key={index} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                }}
              />
            </PieChart>
          </ResponsiveContainer>
          <div className="flex flex-wrap justify-center gap-4 mt-2">
            {priorityData.map((item) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-xs text-dark-300">
                  {item.name} ({item.value})
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Personality Radar */}
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Brain className="w-4 h-4 text-accent-400" />
            拖延人格分布
          </h3>
          {personality ? (
            <ResponsiveContainer width="100%" height={220}>
              <RadarChart data={radarData}>
                <PolarGrid stroke="#334155" />
                <PolarAngleAxis
                  dataKey="type"
                  tick={{ fill: "#94a3b8", fontSize: 10 }}
                />
                <PolarRadiusAxis domain={[0, 16]} tick={false} axisLine={false} />
                <Radar
                  dataKey="得分"
                  stroke="#f97316"
                  fill="#f97316"
                  fillOpacity={0.4}
                />
              </RadarChart>
            </ResponsiveContainer>
          ) : (
            <div className="h-52 flex items-center justify-center text-dark-400 text-sm">
              先完成人格测试
            </div>
          )}
        </div>
      </div>

      {/* 阻力分析区块 */}
      {allSubTasks.length > 0 && (
        <>
          <div className="glass-card rounded-2xl p-6 border border-purple-500/20">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <ShieldAlert className="w-4 h-4 text-purple-400" />
                阻力类型分布
              </h3>
              <span className="text-xs text-dark-400">
                平均阻力 <span className="text-purple-400 font-bold">{avgResistance}/10</span>
              </span>
            </div>
            {resistanceData.length > 0 ? (
              <div className="flex items-center">
                <div className="w-1/2">
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={resistanceData}
                        cx="50%"
                        cy="50%"
                        innerRadius={45}
                        outerRadius={75}
                        dataKey="value"
                        paddingAngle={3}
                      >
                        {resistanceData.map((entry, index) => (
                          <Cell key={index} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "#1e293b",
                          border: "1px solid #334155",
                          borderRadius: "8px",
                        }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
                <div className="w-1/2 space-y-2">
                  {resistanceData.map((item) => (
                    <div key={item.name} className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className="w-3 h-3 rounded-full"
                          style={{ backgroundColor: item.color }}
                        />
                        <span className="text-xs text-dark-300">{item.name}</span>
                      </div>
                      <span className="text-xs text-white font-medium">{item.value}个</span>
                    </div>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-48 flex items-center justify-center text-dark-400 text-sm">
                暂无阻力数据
              </div>
            )}
          </div>

          {/* 阻力与完成率 */}
          {resistanceCompletionData.length > 0 && (
            <div className="glass-card rounded-2xl p-6">
              <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
                <BarChart3 className="w-4 h-4 text-accent-400" />
                阻力 vs 完成率
              </h3>
              <ResponsiveContainer width="100%" height={180}>
                <BarChart data={resistanceCompletionData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
                  <XAxis dataKey="难度" tick={{ fill: "#94a3b8", fontSize: 11 }} />
                  <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} domain={[0, 100]} unit="%" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1e293b",
                      border: "1px solid #334155",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => [`${value}%`, "完成率"]}
                  />
                  <Bar dataKey="完成率" fill="url(#resistanceGradient)" radius={[4, 4, 0, 0]} />
                  <defs>
                    <linearGradient id="resistanceGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor="#a855f7" />
                      <stop offset="100%" stopColor="#6366f1" />
                    </linearGradient>
                  </defs>
                </BarChart>
              </ResponsiveContainer>
              <p className="text-xs text-dark-500 text-center mt-3">
                高阻力任务的完成率越低，说明你在困难任务面前越容易拖延
              </p>
            </div>
          )}
        </>
      )}

      {/* Focus Trend */}
      <div className="glass-card rounded-2xl p-6">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <Clock className="w-4 h-4 text-accent-400" />
          专注时长趋势
        </h3>
        <ResponsiveContainer width="100%" height={200}>
          <BarChart
            data={weekDates.map((date, i) => {
              const dayKey = date.toISOString().split("T")[0];
              const minutes = Math.floor(
                data.focusSessions
                  .filter(
                    (s) =>
                      s.completed && s.startedAt.split("T")[0] === dayKey
                  )
                  .reduce((sum, s) => sum + s.duration, 0) / 60
              );
              return {
                date: date.toLocaleDateString("zh-CN", {
                  month: "short",
                  day: "numeric",
                }),
                分钟: minutes,
              };
            })}
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
            <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} />
            <Tooltip
              contentStyle={{
                backgroundColor: "#1e293b",
                border: "1px solid #334155",
                borderRadius: "8px",
              }}
            />
            <Bar
              dataKey="分钟"
              fill="url(#focusGradient)"
              radius={[4, 4, 0, 0]}
            />
            <defs>
              <linearGradient id="focusGradient" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#38bdf8" />
                <stop offset="100%" stopColor="#818cf8" />
              </linearGradient>
            </defs>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Mood Trend */}
      {moodData.length >= 2 && (
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
            <Zap className="w-4 h-4 text-accent-400" />
            情绪与拖延趋势
          </h3>
          <ResponsiveContainer width="100%" height={200}>
            <LineChart data={moodData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" />
              <XAxis dataKey="date" tick={{ fill: "#94a3b8", fontSize: 11 }} />
              <YAxis tick={{ fill: "#94a3b8", fontSize: 11 }} domain={[0, 10]} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "#1e293b",
                  border: "1px solid #334155",
                  borderRadius: "8px",
                }}
              />
              <Line
                type="monotone"
                dataKey="能量"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: "#10b981" }}
              />
              <Line
                type="monotone"
                dataKey="拖延程度"
                stroke="#ef4444"
                strokeWidth={2}
                dot={{ fill: "#ef4444" }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      )}

      {/* 数据管理 */}
      <div className="glass-card rounded-2xl p-6 border border-dark-700/30">
        <h3 className="text-sm font-bold text-white mb-4 flex items-center gap-2">
          <TrendingUp className="w-4 h-4 text-dark-400" />
          数据管理
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <button
            onClick={handleExport}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-dark-800/30 hover:bg-dark-800/50 border border-dark-700/30 hover:border-dark-600/50 transition-all group"
          >
            <Download className="w-5 h-5 text-dark-400 group-hover:text-green-400 transition-colors" />
            <span className="text-xs text-dark-300 group-hover:text-white transition-colors">
              导出数据
            </span>
          </button>
          <label className="flex flex-col items-center gap-2 p-4 rounded-xl bg-dark-800/30 hover:bg-dark-800/50 border border-dark-700/30 hover:border-dark-600/50 transition-all group cursor-pointer">
            <Upload className="w-5 h-5 text-dark-400 group-hover:text-blue-400 transition-colors" />
            <span className="text-xs text-dark-300 group-hover:text-white transition-colors">
              导入数据
            </span>
            <input
              type="file"
              accept=".json"
              onChange={handleImport}
              className="hidden"
            />
          </label>
          <button
            onClick={() => setShowConfirmClear(true)}
            className="flex flex-col items-center gap-2 p-4 rounded-xl bg-dark-800/30 hover:bg-red-500/10 border border-dark-700/30 hover:border-red-500/30 transition-all group"
          >
            <Trash2 className="w-5 h-5 text-dark-400 group-hover:text-red-400 transition-colors" />
            <span className="text-xs text-dark-300 group-hover:text-red-400 transition-colors">
              清空数据
            </span>
          </button>
        </div>
        {importStatus === "success" && (
          <p className="text-xs text-green-400 text-center mt-3">✓ 数据导入成功</p>
        )}
        {importStatus === "error" && (
          <p className="text-xs text-red-400 text-center mt-3">✗ 导入失败，文件格式不对</p>
        )}
      </div>

      {/* 清空确认弹窗 */}
      {showConfirmClear && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-2xl p-6 w-full max-w-sm animate-slide-up">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-400" />
              </div>
              <div>
                <h3 className="text-base font-bold text-white">确定要清空吗？</h3>
                <p className="text-xs text-dark-400">此操作无法撤销</p>
              </div>
            </div>
            <p className="text-sm text-dark-300 mb-5">
              所有任务、子任务、专注记录、心情日记、成就进度都将被删除。
              <br />
              <span className="text-dark-400">建议先导出备份。</span>
            </p>
            <div className="flex gap-3">
              <button
                onClick={() => setShowConfirmClear(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-dark-800/50 text-dark-300 text-sm hover:text-white transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleClearData}
                className="flex-1 px-4 py-2.5 rounded-xl bg-red-500/20 text-red-400 text-sm font-medium hover:bg-red-500/30 transition-colors border border-red-500/30"
              >
                确定清空
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
    </PageTransition>
  );
}
