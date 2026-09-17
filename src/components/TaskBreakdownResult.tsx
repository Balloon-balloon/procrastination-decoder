"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SubTask, ResistanceType } from "@/lib/types";
import {
  Check, Play, Clock, Zap, Trash2, ChevronDown, ChevronUp,
  Sparkles, Lightbulb, Calendar, Send, Loader2,
  Layers, AlertCircle, ThumbsUp, RefreshCw, XCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { requestSubBreakdown, MicroSubStep } from "@/lib/sub-breakdown";
import { requestCompletionFeedback, CompletionFeedback } from "@/lib/completion-feedback";

const RESISTANCE_CONFIG: Record<
  ResistanceType,
  { label: string; color: string; bg: string; emoji: string }
> = {
  perfectionist: {
    label: "完美主义",
    color: "text-red-400",
    bg: "bg-red-500/20 border-red-500/30",
    emoji: "🎯",
  },
  ambiguous: {
    label: "模糊型",
    color: "text-purple-400",
    bg: "bg-purple-500/20 border-purple-500/30",
    emoji: "🌫️",
  },
  overwhelming: {
    label: "畏难型",
    color: "text-orange-400",
    bg: "bg-orange-500/20 border-orange-500/30",
    emoji: "😱",
  },
  aversive: {
    label: "抵触型",
    color: "text-yellow-400",
    bg: "bg-yellow-500/20 border-yellow-500/30",
    emoji: "😒",
  },
  "instant-gratification": {
    label: "即时满足",
    color: "text-pink-400",
    bg: "bg-pink-500/20 border-pink-500/30",
    emoji: "📱",
  },
  "low-resistance": {
    label: "低阻力",
    color: "text-green-400",
    bg: "bg-green-500/20 border-green-500/30",
    emoji: "✅",
  },
};

function getResistanceColor(score: number): string {
  if (score <= 3) return "from-green-500 to-emerald-400";
  if (score <= 5) return "from-blue-500 to-cyan-400";
  if (score <= 7) return "from-yellow-500 to-orange-400";
  return "from-red-500 to-pink-500";
}

function getResistanceText(score: number): string {
  if (score <= 3) return "轻松";
  if (score <= 5) return "还行";
  if (score <= 7) return "有点难";
  return "很难";
}

interface Props {
  subTasks: SubTask[];
  overallStrategy?: string;
  taskUnderstanding?: string;
  painPointResponse?: string;
  executionPlan?: string;
  taskTitle?: string;
  onComplete: (subTaskId: string) => void;
  onStart: (subTaskId: string) => void;
  onDelete: (subTaskId: string) => void;
  onRebreakdown?: (subTaskId: string, newSteps: MicroSubStep[]) => void;
  onApplyAdjustment?: (completedSubTaskId: string, feedback: CompletionFeedback, remainingSteps: SubTask[]) => void;
}

export function TaskBreakdownResult({
  subTasks,
  overallStrategy,
  taskUnderstanding,
  painPointResponse,
  executionPlan,
  taskTitle,
  onComplete,
  onStart,
  onDelete,
  onRebreakdown,
  onApplyAdjustment,
}: Props) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [breakingDownId, setBreakingDownId] = useState<string | null>(null);
  const [breakdownFeedback, setBreakdownFeedback] = useState<Record<string, string>>({});
  const [breakdownError, setBreakdownError] = useState<string | null>(null);
  const [completionInput, setCompletionInput] = useState<Record<string, string>>({});
  const [completionLoadingId, setCompletionLoadingId] = useState<string | null>(null);
  const [completionResult, setCompletionResult] = useState<Record<string, CompletionFeedback>>({});

  if (subTasks.length === 0) return null;

  const avgResistance =
    subTasks.reduce((sum, st) => sum + st.resistanceScore, 0) / subTasks.length;

  const completedCount = subTasks.filter((st) => st.status === "completed").length;
  const progress = Math.round((completedCount / subTasks.length) * 100);
  const totalMinutes = subTasks.reduce((sum, st) => sum + st.estimatedMinutes, 0);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleComplete = async (subTask: SubTask) => {
    const feedback = completionInput[subTask.id]?.trim();
    if (!feedback) {
      // 没有输入直接完成
      onComplete(subTask.id);
      return;
    }

    setCompletionLoadingId(subTask.id);
    try {
      const allRemaining = subTasks.filter(s => s.status !== "completed" && s.id !== subTask.id);
      const result = await requestCompletionFeedback({
        stepTitle: subTask.title,
        stepDescription: subTask.description,
        userFeedback: feedback,
        completedCount: completedCount + 1,
        totalCount: subTasks.length,
        remainingSteps: allRemaining,
        taskTitle,
      });
      setCompletionResult(prev => ({ ...prev, [subTask.id]: result }));
    } finally {
      setCompletionLoadingId(null);
    }
  };

  const acceptAdjustmentAndComplete = (subTask: SubTask, feedback: CompletionFeedback) => {
    if (onApplyAdjustment) {
      const allRemaining = subTasks.filter(s => s.status !== "completed" && s.id !== subTask.id);
      onApplyAdjustment(subTask.id, feedback, allRemaining);
    } else {
      onComplete(subTask.id);
    }
    setCompletionResult(prev => {
      const next = { ...prev };
      delete next[subTask.id];
      return next;
    });
  };

  const skipAdjustmentAndComplete = (subTaskId: string) => {
    onComplete(subTaskId);
    setCompletionResult(prev => {
      const next = { ...prev };
      delete next[subTaskId];
      return next;
    });
  };

  const handleRebreakdown = async (subTask: SubTask) => {
    if (!onRebreakdown) return;
    const feedback = breakdownFeedback[subTask.id]?.trim();
    if (!feedback) return;

    setBreakingDownId(subTask.id);
    setBreakdownError(null);
    try {
      const result = await requestSubBreakdown({
        stepTitle: subTask.title,
        stepDescription: subTask.description,
        userFeedback: feedback,
        resistanceScore: subTask.resistanceScore,
        taskTitle,
      });
      if (result.steps && result.steps.length > 0) {
        onRebreakdown(subTask.id, result.steps);
      } else {
        setBreakdownError("拆解失败，请重试");
      }
    } catch (e) {
      setBreakdownError("拆解失败，请重试");
    }
    setBreakingDownId(null);
  };

  return (
    <div className="space-y-4 mt-4 pt-4 border-t" style={{ borderColor: "var(--divider)" }}>
      {/* AI 任务理解 */}
      {taskUnderstanding && (
        <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--card-border)", borderLeft: "4px solid var(--color-neon-orange)" }}>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "var(--color-apricot)" }}>
              <Sparkles className="w-4 h-4" style={{ color: "var(--color-ink)" }} />
            </div>
            <div>
              <h4 className="text-sm font-bold mb-1" style={{ color: "var(--text-primary)" }}>AI 理解了你的任务</h4>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {taskUnderstanding}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 卡点回应 */}
      {painPointResponse && (
        <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--card-border)", borderLeft: "4px solid #E74C3C" }}>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(231,76,60,0.15)" }}>
              <Lightbulb className="w-4 h-4" style={{ color: "#E74C3C" }} />
            </div>
            <div>
              <h4 className="text-sm font-bold mb-1" style={{ color: "var(--text-primary)" }}>针对你的卡点</h4>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {painPointResponse}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 整体策略 */}
      {overallStrategy && (
        <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--card-border)", borderLeft: "4px solid var(--color-neon-green)" }}>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(46, 204, 113, 0.15)" }}>
              <Zap className="w-4 h-4" style={{ color: "var(--color-neon-green)" }} />
            </div>
            <div>
              <h4 className="text-sm font-bold mb-1" style={{ color: "var(--text-primary)" }}>破解策略</h4>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {overallStrategy}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 执行节奏 */}
      {executionPlan && (
        <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--card-border)", borderLeft: "4px solid #9B59B6" }}>
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0" style={{ background: "rgba(155,89,182,0.15)" }}>
              <Calendar className="w-4 h-4" style={{ color: "#9B59B6" }} />
            </div>
            <div>
              <h4 className="text-sm font-bold mb-1" style={{ color: "var(--text-primary)" }}>执行节奏建议</h4>
              <p className="text-sm leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                {executionPlan}
              </p>
              <p className="text-xs mt-2" style={{ color: "var(--text-muted)" }}>
                共 {subTasks.length} 步 · 预计 {totalMinutes} 分钟
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 进度条 */}
      <div className="flex items-center gap-3 text-xs">
        <span style={{ color: "var(--text-muted)" }} className="whitespace-nowrap">
          完成进度 {completedCount}/{subTasks.length}
        </span>
        <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ background: "var(--divider)" }}>
          <div
            className="h-full transition-all duration-500"
            style={{ width: `${progress}%`, background: "var(--color-neon-green)" }}
          />
        </div>
        <span style={{ color: "var(--text-muted)" }} className="whitespace-nowrap">{progress}%</span>
      </div>

      {/* 平均阻力提示 */}
      <div className="text-xs flex items-center gap-2" style={{ color: "var(--text-muted)" }}>
        <span>平均阻力：</span>
        <span
          className={`font-bold bg-gradient-to-r ${getResistanceColor(
            avgResistance
          )} bg-clip-text text-transparent`}
        >
          {avgResistance.toFixed(1)}/10（{getResistanceText(avgResistance)}）
        </span>
        <span style={{ color: "var(--text-muted)", opacity: 0.6 }}>· 按阻力从低到高排列</span>
      </div>

      {/* 子任务列表 */}
      <div className="space-y-2">
        {subTasks.map((subTask, index) => {
          const config = RESISTANCE_CONFIG[subTask.resistanceType];
          const isCompleted = subTask.status === "completed";
          const isInProgress = subTask.status === "in-progress";
          const isExpanded = expandedId === subTask.id;
          const isBreaking = breakingDownId === subTask.id;

          return (
            <div
              key={subTask.id}
              className={cn(
                "rounded-xl transition-all overflow-hidden",
                isCompleted && "opacity-60",
              )}
              style={{
                background: "var(--bg-card)",
                border: `1px solid ${isInProgress ? "var(--color-neon-orange)" : "var(--card-border)"}`,
              }}
            >
              <div className="p-4">
                <div className="flex items-start gap-3">
                  {/* 序号 + 完成状态 */}
                  <button
                    onClick={() => onComplete(subTask.id)}
                    disabled={isCompleted}
                    className={cn(
                      "w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold transition-all",
                      isCompleted
                        ? "text-white"
                        : isInProgress
                        ? "text-white animate-pulse"
                        : "border hover:border-neon-orange"
                    )}
                    style={{
                      background: isCompleted ? "var(--color-neon-green)" : isInProgress ? "var(--color-neon-orange)" : "transparent",
                      borderColor: isCompleted || isInProgress ? "transparent" : "var(--divider)",
                      color: isCompleted || isInProgress ? "#fff" : "var(--text-muted)",
                    }}
                  >
                    {isCompleted ? (
                      <Check className="w-3.5 h-3.5" />
                    ) : (
                      subTask.recommendedOrder
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    {/* 标题 + 阻力分数 */}
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <h4
                        className={cn(
                          "font-medium text-sm",
                          isCompleted
                            ? "line-through"
                            : ""
                        )}
                        style={{ color: isCompleted ? "var(--text-muted)" : "var(--text-primary)" }}
                      >
                        {subTask.title}
                      </h4>

                      {/* 阻力分数徽章 */}
                      <div
                        className={cn(
                          "flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] border",
                          config.bg,
                          config.color
                        )}
                      >
                        <span>{config.emoji}</span>
                        <span className="font-bold">{subTask.resistanceScore}/10</span>
                      </div>

                      {/* 预估时间 */}
                      <span className="flex items-center gap-1 text-[10px]" style={{ color: "var(--text-muted)" }}>
                        <Clock className="w-3 h-3" />
                        {subTask.estimatedMinutes}分钟
                      </span>
                    </div>

                    {/* 简要描述 */}
                    <p className="text-xs mb-2 line-clamp-2" style={{ color: "var(--text-secondary)" }}>
                      {subTask.description}
                    </p>

                    {/* 5分钟极小目标 */}
                    <div className="rounded-lg px-3 py-2" style={{ background: "rgba(255,107,53,0.08)", border: "1px solid rgba(255,107,53,0.15)" }}>
                      <p className="text-[11px] mb-0.5" style={{ color: "var(--text-muted)" }}>
                        🎯 5分钟启动：只做这一件事
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-primary)" }}>{subTask.microStep}</p>
                    </div>
                  </div>

                  {/* 操作按钮 */}
                  <div className="flex-shrink-0 flex items-center gap-1">
                    {!isCompleted && !isInProgress && (
                      <button
                        onClick={() => {
                          onStart(subTask.id);
                          router.push(`/focus?subTaskId=${subTask.id}`);
                        }}
                        className="px-3 h-8 rounded-lg transition-colors flex items-center gap-1.5 text-xs font-medium"
                        style={{ background: "rgba(255,107,53,0.15)", color: "var(--color-neon-orange)" }}
                        title="开始专注这个子任务"
                      >
                        <Play className="w-3.5 h-3.5" />
                        专注
                      </button>
                    )}
                    <button
                      onClick={() => onDelete(subTask.id)}
                      className="p-1.5 h-8 rounded-lg transition-colors"
                      style={{ color: "var(--text-muted)" }}
                      title="删除子任务"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>

                {/* 展开按钮 */}
                <button
                  onClick={() => toggleExpand(subTask.id)}
                  className="w-full mt-2 pt-2 flex items-center justify-center gap-1 text-[11px] transition-colors"
                  style={{ color: "var(--text-muted)", borderTop: "1px solid var(--divider)" }}
                >
                  {isExpanded ? (
                    <><ChevronUp className="w-3 h-3" /> 收起详情</>
                  ) : (
                    <><ChevronDown className="w-3 h-3" /> 查看详情</>
                  )}
                </button>
              </div>

              {/* 展开的详细内容 */}
              {isExpanded && (
                <div className="px-4 pb-4 space-y-3" style={{ borderTop: "1px solid var(--divider)" }}>
                  <div className="pt-3">
                    <p className="text-xs font-bold mb-1" style={{ color: "var(--text-primary)" }}>
                      📖 详细说明
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {subTask.description}
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold mb-1" style={{ color: "var(--text-primary)" }}>
                      ⚡ 为什么这步有阻力？
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      {subTask.resistanceReason}
                    </p>
                    <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>
                      阻力类型：{config.emoji} {config.label}型 · {subTask.resistanceScore}/10 分
                    </p>
                  </div>

                  <div>
                    <p className="text-xs font-bold mb-1" style={{ color: "var(--text-primary)" }}>
                      🎯 怎么开始？
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                      先花 5 分钟做：{subTask.microStep}
                    </p>
                    <p className="text-[11px] mt-1" style={{ color: "var(--text-muted)" }}>
                      预估总耗时：{subTask.estimatedMinutes} 分钟
                    </p>
                  </div>

                  {/* 重新拆解区域 */}
                  {!isCompleted && onRebreakdown && (
                    <div className="pt-2" style={{ borderTop: "1px solid var(--divider)" }}>
                      <div className="flex items-center gap-2 mb-2">
                        <Layers className="w-3.5 h-3.5" style={{ color: "var(--color-neon-orange)" }} />
                        <p className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>
                          这步太难？AI 帮你拆成更细的小步骤
                        </p>
                      </div>
                      <input
                        type="text"
                        value={breakdownFeedback[subTask.id] || ""}
                        onChange={(e) => setBreakdownFeedback(prev => ({ ...prev, [subTask.id]: e.target.value }))}
                        placeholder="说说哪一步卡住了，比如：不知道怎么开始/看不懂某个概念..."
                        className="w-full px-3 py-2 rounded-lg text-xs mb-2"
                        style={{ background: "rgba(0,0,0,0.05)", border: "1px solid var(--divider)", color: "var(--text-primary)" }}
                        onKeyDown={(e) => {
                          if (e.key === "Enter") {
                            handleRebreakdown(subTask);
                          }
                        }}
                      />
                      <button
                        onClick={() => handleRebreakdown(subTask)}
                        disabled={isBreaking || !breakdownFeedback[subTask.id]?.trim()}
                        className="w-full py-2 rounded-lg text-xs font-medium text-white flex items-center justify-center gap-1.5 disabled:opacity-50"
                        style={{ background: "var(--color-neon-orange)" }}
                      >
                        {isBreaking ? (
                          <><Loader2 className="w-3.5 h-3.5 animate-spin" /> AI 拆解中...</>
                        ) : (
                          <><Sparkles className="w-3.5 h-3.5" /> 重新拆解这步</>
                        )}
                      </button>
                      {breakdownError && isBreaking === false && breakingDownId === null && (
                        <div className="mt-2 flex items-center gap-1 text-xs" style={{ color: "#E74C3C" }}>
                          <AlertCircle className="w-3 h-3" />
                          {breakdownError}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 今日完成输入 + AI反馈 */}
                  {!isCompleted && (
                    <div className="pt-2" style={{ borderTop: "1px solid var(--divider)" }}>
                      {!completionResult[subTask.id] && !completionLoadingId && (
                        <>
                          <p className="text-xs font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                            ✅ 今天这步做得怎么样？
                          </p>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={completionInput[subTask.id] || ""}
                              onChange={(e) => setCompletionInput(prev => ({ ...prev, [subTask.id]: e.target.value }))}
                              placeholder="说说今天完成了什么，感觉怎么样..."
                              className="flex-1 px-3 py-2 rounded-lg text-xs"
                              style={{ background: "rgba(0,0,0,0.05)", border: "1px solid var(--divider)", color: "var(--text-primary)" }}
                              onKeyDown={(e) => {
                                if (e.key === "Enter") {
                                  const val = (e.target as HTMLInputElement).value;
                                  if (val.trim()) {
                                    handleComplete(subTask);
                                  }
                                }
                              }}
                            />
                            <button
                              onClick={() => handleComplete(subTask)}
                              disabled={completionLoadingId === subTask.id}
                              className="px-3 py-2 rounded-lg text-xs font-medium text-white flex items-center gap-1 disabled:opacity-50"
                              style={{ background: "var(--color-neon-green)" }}
                            >
                              {completionLoadingId === subTask.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Check className="w-3.5 h-3.5" />
                              )}
                              {completionLoadingId === subTask.id ? "分析中" : "完成"}
                            </button>
                          </div>
                          <p className="text-[10px] mt-1" style={{ color: "var(--text-muted)" }}>
                            💡 写下感受，AI 会给你点评并看看后续计划要不要调整
                          </p>
                        </>
                      )}

                      {completionLoadingId === subTask.id && (
                        <div className="py-3 flex items-center justify-center gap-2">
                          <Loader2 className="w-4 h-4 animate-spin" style={{ color: "var(--color-neon-orange)" }} />
                          <span className="text-xs" style={{ color: "var(--text-muted)" }}>AI 正在回顾你的进展...</span>
                        </div>
                      )}

                      {/* AI 评语结果 */}
                      {completionResult[subTask.id] && (
                        <div className="space-y-2">
                          {/* 评语卡片 */}
                          <div className="p-3 rounded-lg" style={{ background: "rgba(46,204,113,0.08)", border: "1px solid rgba(46,204,113,0.2)" }}>
                            <div className="flex items-center gap-1.5 mb-1.5">
                              <ThumbsUp className="w-3.5 h-3.5" style={{ color: "var(--color-neon-green)" }} />
                              <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>AI 点评</span>
                            </div>
                            <p className="text-xs leading-relaxed" style={{ color: "var(--text-secondary)" }}>
                              {completionResult[subTask.id].praise}
                            </p>
                            <p className="text-xs leading-relaxed mt-1.5" style={{ color: "var(--text-muted)" }}>
                              {completionResult[subTask.id].reflection}
                            </p>
                          </div>

                          {/* 调整建议 */}
                          {completionResult[subTask.id].needsAdjustment && (
                            <div className="p-3 rounded-lg" style={{ background: "rgba(255,107,53,0.08)", border: "1px solid rgba(255,107,53,0.2)" }}>
                              <div className="flex items-center gap-1.5 mb-1.5">
                                <RefreshCw className="w-3.5 h-3.5" style={{ color: "var(--color-neon-orange)" }} />
                                <span className="text-xs font-bold" style={{ color: "var(--text-primary)" }}>建议调整后续计划</span>
                              </div>
                              <p className="text-xs leading-relaxed mb-2" style={{ color: "var(--text-secondary)" }}>
                                {completionResult[subTask.id].adjustmentReason}
                              </p>
                              {completionResult[subTask.id].reorderNote && (
                                <p className="text-xs leading-relaxed mb-2" style={{ color: "var(--text-primary)", fontWeight: 500 }}>
                                  📝 {completionResult[subTask.id].reorderNote}
                                </p>
                              )}
                              {completionResult[subTask.id].newSteps && completionResult[subTask.id].newSteps!.length > 0 && (
                                <div className="mb-2">
                                  <p className="text-xs font-bold mb-1" style={{ color: "var(--text-primary)" }}>拆解后步骤：</p>
                                  <div className="space-y-1">
                                    {completionResult[subTask.id].newSteps!.map((s, i) => (
                                      <div key={i} className="flex items-start gap-2 text-[11px]" style={{ color: "var(--text-secondary)" }}>
                                        <span className="flex-shrink-0 w-4 h-4 rounded-full flex items-center justify-center text-[10px] font-bold" style={{ background: "rgba(255,107,53,0.2)", color: "var(--color-neon-orange)" }}>{i + 1}</span>
                                        <span>{s.title}</span>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              )}
                              <div className="flex gap-2 mt-3">
                                <button
                                  onClick={() => acceptAdjustmentAndComplete(subTask, completionResult[subTask.id]!)}
                                  className="flex-1 py-1.5 rounded-lg text-xs font-medium text-white"
                                  style={{ background: "var(--color-neon-orange)" }}
                                >
                                  接受调整
                                </button>
                                <button
                                  onClick={() => skipAdjustmentAndComplete(subTask.id)}
                                  className="flex-1 py-1.5 rounded-lg text-xs font-medium"
                                  style={{ background: "rgba(0,0,0,0.05)", color: "var(--text-muted)" }}
                                >
                                  不用了
                                </button>
                              </div>
                            </div>
                          )}

                          {/* 不需要调整时的确认按钮 */}
                          {!completionResult[subTask.id].needsAdjustment && (
                            <button
                              onClick={() => skipAdjustmentAndComplete(subTask.id)}
                              className="w-full py-2 rounded-lg text-xs font-medium text-white flex items-center justify-center gap-1.5"
                              style={{ background: "var(--color-neon-green)" }}
                            >
                              <Check className="w-3.5 h-3.5" /> 好的，继续下一步
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 底部提示 */}
      <div className="text-center text-xs pt-2" style={{ color: "var(--text-muted)" }}>
        💡 小贴士：从第一步开始做，阻力最小，建立行动动量
      </div>
    </div>
  );
}
