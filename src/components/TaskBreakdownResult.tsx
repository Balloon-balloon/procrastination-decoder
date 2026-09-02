"use client";
import { useRouter } from "next/navigation";
import { SubTask, ResistanceType } from "@/lib/types";
import { Check, Play, Clock, Zap, Trash2 } from "lucide-react";
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
  onComplete: (subTaskId: string) => void;
  onStart: (subTaskId: string) => void;
  onDelete: (subTaskId: string) => void;
}

export function TaskBreakdownResult({
  subTasks,
  overallStrategy,
  onComplete,
  onStart,
  onDelete,
}: Props) {
  const router = useRouter();
  if (subTasks.length === 0) return null;

  const avgResistance =
    subTasks.reduce((sum, st) => sum + st.resistanceScore, 0) / subTasks.length;

  const completedCount = subTasks.filter((st) => st.status === "completed").length;
  const progress = Math.round((completedCount / subTasks.length) * 100);

  return (
    <div className="space-y-4 mt-4 pt-4 border-t border-dark-700/50">
      {/* 整体策略 */}
      {overallStrategy && (
        <div className="glass-card rounded-xl p-4 border-l-4 border-accent-500">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 rounded-lg bg-accent-500/20 flex items-center justify-center flex-shrink-0">
              <Zap className="w-4 h-4 text-accent-400" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white mb-1">破解策略</h4>
              <p className="text-sm text-dark-300 leading-relaxed">
                {overallStrategy}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* 进度条 */}
      <div className="flex items-center gap-3 text-xs">
        <span className="text-dark-400 whitespace-nowrap">
          完成进度 {completedCount}/{subTasks.length}
        </span>
        <div className="flex-1 h-2 bg-dark-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-green-500 to-emerald-400 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
        <span className="text-dark-400 whitespace-nowrap">{progress}%</span>
      </div>

      {/* 平均阻力提示 */}
      <div className="text-xs text-dark-400 flex items-center gap-2">
        <span>平均阻力：</span>
        <span
          className={`font-bold bg-gradient-to-r ${getResistanceColor(
            avgResistance
          )} bg-clip-text text-transparent`}
        >
          {avgResistance.toFixed(1)}/10（{getResistanceText(avgResistance)}）
        </span>
        <span className="text-dark-500">· 按阻力从低到高排列，先做简单的建立动量</span>
      </div>

      {/* 子任务列表 */}
      <div className="space-y-2">
        {subTasks.map((subTask, index) => {
          const config = RESISTANCE_CONFIG[subTask.resistanceType];
          const isCompleted = subTask.status === "completed";
          const isInProgress = subTask.status === "in-progress";

          return (
            <div
              key={subTask.id}
              className={cn(
                "glass-card rounded-xl p-4 transition-all",
                isCompleted && "opacity-60",
                isInProgress && "border-accent-500/50 glow"
              )}
            >
              <div className="flex items-start gap-3">
                {/* 序号 + 完成状态 */}
                <button
                  onClick={() => onComplete(subTask.id)}
                  disabled={isCompleted}
                  className={cn(
                    "w-7 h-7 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-bold transition-all",
                    isCompleted
                      ? "bg-green-500 text-white"
                      : isInProgress
                      ? "bg-accent-500 text-white animate-pulse"
                      : "bg-dark-800 text-dark-400 border border-dark-600 hover:border-accent-500 hover:text-accent-400"
                  )}
                >
                  {isCompleted ? (
                    <Check className="w-3.5 h-3.5" />
                  ) : (
                    subTask.recommendedOrder
                  )}
                </button>

                <div className="flex-1 min-w-0">
                  {/* 标题 + 阻力分数 */}
                  <div className="flex items-center gap-2 mb-1">
                    <h4
                      className={cn(
                        "font-medium text-sm",
                        isCompleted
                          ? "text-dark-500 line-through"
                          : "text-white"
                      )}
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
                      <span>{config.label}</span>
                    </div>

                    {/* 预估时间 */}
                    <span className="flex items-center gap-1 text-[10px] text-dark-500">
                      <Clock className="w-3 h-3" />
                      {subTask.estimatedMinutes}分钟
                    </span>
                  </div>

                  {/* 阻力原因 */}
                  <p className="text-xs text-dark-400 mb-2">{subTask.description}</p>

                  {/* 5分钟极小目标 */}
                  <div className="bg-dark-800/50 rounded-lg px-3 py-2 border border-dark-700/30">
                    <p className="text-[11px] text-dark-400 mb-0.5">
                      🎯 5分钟启动：只做这一件事
                    </p>
                    <p className="text-xs text-dark-200">{subTask.microStep}</p>
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
                      className="px-3 h-8 rounded-lg bg-accent-500/20 text-accent-400 hover:bg-accent-500/30 transition-colors flex items-center gap-1.5 text-xs font-medium"
                      title="开始专注这个子任务"
                    >
                      <Play className="w-3.5 h-3.5" />
                      专注
                    </button>
                  )}
                  <button
                    onClick={() => onDelete(subTask.id)}
                    className="p-1.5 h-8 rounded-lg text-dark-500 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                    title="删除子任务"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* 底部提示 */}
      <div className="text-center text-xs text-dark-500 pt-2">
        💡 小贴士：按顺序从第一个开始做，阻力最小的先完成，建立行动动量
      </div>
    </div>
  );
}
