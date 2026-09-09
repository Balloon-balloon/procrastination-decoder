"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { SubTask, ResistanceType } from "@/lib/types";
import {
  Check, Play, Clock, Zap, Trash2, ChevronDown, ChevronUp,
  Sparkles, Lightbulb, Calendar, Send, Loader2,
} from "lucide-react";
import { cn } from "@/lib/utils";

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
  onAdjustPlan?: (progressText: string) => Promise<string>;
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
  onAdjustPlan,
}: Props) {
  const router = useRouter();
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [progressInput, setProgressInput] = useState("");
  const [adjusting, setAdjusting] = useState(false);
  const [adjustResult, setAdjustResult] = useState<string | null>(null);

  if (subTasks.length === 0) return null;

  const avgResistance =
    subTasks.reduce((sum, st) => sum + st.resistanceScore, 0) / subTasks.length;

  const completedCount = subTasks.filter((st) => st.status === "completed").length;
  const progress = Math.round((completedCount / subTasks.length) * 100);
  const totalMinutes = subTasks.reduce((sum, st) => sum + st.estimatedMinutes, 0);

  const toggleExpand = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  const handleAdjust = async () => {
    if (!progressInput.trim() || !onAdjustPlan) return;
    setAdjusting(true);
    try {
      const result = await onAdjustPlan(progressInput);
      setAdjustResult(result);
    } catch (e) {
      setAdjustResult("调整失败，请稍后再试～");
    }
    setAdjusting(false);
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

                  {/* 今日完成输入 */}
                  {!isCompleted && (
                    <div className="pt-2" style={{ borderTop: "1px solid var(--divider)" }}>
                      <p className="text-xs font-bold mb-2" style={{ color: "var(--text-primary)" }}>
                        ✅ 今天这步做得怎么样？
                      </p>
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="说说今天完成了什么..."
                          className="flex-1 px-3 py-2 rounded-lg text-xs"
                          style={{ background: "rgba(0,0,0,0.05)", border: "1px solid var(--divider)", color: "var(--text-primary)" }}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              const val = (e.target as HTMLInputElement).value;
                              if (val.trim()) {
                                onComplete(subTask.id);
                                (e.target as HTMLInputElement).value = "";
                              }
                            }
                          }}
                        />
                        <button
                          onClick={() => onComplete(subTask.id)}
                          className="px-3 py-2 rounded-lg text-xs font-medium text-white"
                          style={{ background: "var(--color-neon-green)" }}
                        >
                          完成
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* 动态调整计划 */}
      {onAdjustPlan && (
        <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--card-border)" }}>
          <h4 className="text-sm font-bold mb-2 flex items-center gap-2" style={{ color: "var(--text-primary)" }}>
            <Sparkles className="w-4 h-4" style={{ color: "var(--color-neon-orange)" }} />
            调整后续计划
          </h4>
          <p className="text-xs mb-2" style={{ color: "var(--text-muted)" }}>
            告诉我你今天完成了什么，AI 帮你调整接下来的节奏
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={progressInput}
              onChange={(e) => setProgressInput(e.target.value)}
              placeholder="比如：我已经做完了前两步，但是第三步有点卡住了..."
              className="flex-1 px-3 py-2 rounded-lg text-xs"
              style={{ background: "rgba(0,0,0,0.05)", border: "1px solid var(--divider)", color: "var(--text-primary)" }}
            />
            <button
              onClick={handleAdjust}
              disabled={adjusting || !progressInput.trim()}
              className="px-3 py-2 rounded-lg text-xs font-medium text-white flex items-center gap-1 disabled:opacity-50"
              style={{ background: "var(--color-neon-orange)" }}
            >
              {adjusting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              {adjusting ? "分析中" : "调整"}
            </button>
          </div>
          {adjustResult && (
            <div className="mt-3 p-3 rounded-lg text-xs leading-relaxed" style={{ background: "rgba(255,107,53,0.08)", border: "1px solid rgba(255,107,53,0.15)", color: "var(--text-secondary)" }}>
              {adjustResult}
            </div>
          )}
        </div>
      )}

      {/* 底部提示 */}
      <div className="text-center text-xs pt-2" style={{ color: "var(--text-muted)" }}>
        💡 小贴士：从第一步开始做，阻力最小，建立行动动量
      </div>
    </div>
  );
}
