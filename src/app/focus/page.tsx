"use client";
import { useState, useEffect, useRef } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAppData } from "@/hooks/useAppData";
import { addFocusSession, completeSubTask, getSubTaskById } from "@/lib/store";
import { formatTime } from "@/lib/utils";
import { SubTask } from "@/lib/types";
import { PageTransition } from "@/components/Animations";
import {
  Play,
  Pause,
  RotateCcw,
  Coffee,
  Brain,
  Target,
  Check,
  Zap,
  ArrowLeft,
} from "lucide-react";

const MODES = {
  pomodoro: {
    label: "番茄钟",
    duration: 25 * 60,
    icon: Target,
    color: "from-red-500 to-orange-500",
    desc: "25分钟专注 + 5分钟休息",
  },
  "deep-work": {
    label: "深度工作",
    duration: 50 * 60,
    icon: Brain,
    color: "from-blue-500 to-purple-500",
    desc: "50分钟深度专注",
  },
  "short-break": {
    label: "短休息",
    duration: 5 * 60,
    icon: Coffee,
    color: "from-green-500 to-emerald-500",
    desc: "5分钟放松休息",
  },
};

const RESISTANCE_LABELS: Record<string, { label: string; emoji: string; color: string }> = {
  perfectionist: { label: "完美主义", emoji: "🎯", color: "text-red-400" },
  ambiguous: { label: "模糊型", emoji: "🌫️", color: "text-purple-400" },
  overwhelming: { label: "畏难型", emoji: "😱", color: "text-orange-400" },
  aversive: { label: "抵触型", emoji: "😒", color: "text-yellow-400" },
  "instant-gratification": { label: "即时满足", emoji: "📱", color: "text-pink-400" },
  "low-resistance": { label: "低阻力", emoji: "✅", color: "text-green-400" },
};

export default function FocusPage() {
  const { data, update, loaded } = useAppData();
  const searchParams = useSearchParams();
  const router = useRouter();
  const subTaskId = searchParams.get("subTaskId");

  const [mode, setMode] = useState<keyof typeof MODES>("pomodoro");
  const [timeLeft, setTimeLeft] = useState(MODES.pomodoro.duration);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [subTaskCompleted, setSubTaskCompleted] = useState(false);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  // 查找当前子任务
  const currentSubTask: SubTask | null = subTaskId
    ? getSubTaskById(data, subTaskId) || null
    : null;

  const modeConfig = MODES[mode];
  const progress = ((modeConfig.duration - timeLeft) / modeConfig.duration) * 100;
  const circumference = 2 * Math.PI * 120;
  const strokeDashoffset = circumference - (progress / 100) * circumference;

  // 根据子任务预估时间自动选择模式
  useEffect(() => {
    if (currentSubTask && !sessionStarted && !isRunning) {
      const mins = currentSubTask.estimatedMinutes;
      if (mins <= 10) {
        // 短任务用自定义的10分钟？暂时用番茄钟
        setMode("pomodoro");
        setTimeLeft(mins * 60);
      } else if (mins <= 30) {
        setMode("pomodoro");
        setTimeLeft(mins * 60);
      } else {
        setMode("deep-work");
        setTimeLeft(Math.min(mins, 50) * 60);
      }
    }
  }, [currentSubTask?.id]);

  useEffect(() => {
    if (isRunning) {
      intervalRef.current = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            setIsRunning(false);
            setSessionCompleted(true);
            // 完成时记录会话
            if (sessionStarted) {
              update((prev) => {
                return addFocusSession(prev, {
                  taskId: currentSubTask?.taskId || null,
                  subTaskId: currentSubTask?.id || null,
                  taskTitle: currentSubTask?.title || modeConfig.label,
                  duration: modeConfig.duration,
                  mode,
                  completed: true,
                  startedAt: new Date().toISOString(),
                  endedAt: new Date().toISOString(),
                });
              });
            }
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    }
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
      }
    };
  }, [isRunning, mode, modeConfig.duration, sessionStarted, update, currentSubTask]);

  const handleModeChange = (newMode: keyof typeof MODES) => {
    setMode(newMode);
    setTimeLeft(MODES[newMode].duration);
    setIsRunning(false);
    setSessionStarted(false);
    setSessionCompleted(false);
  };

  const handleToggle = () => {
    if (!isRunning && !sessionStarted) {
      setSessionStarted(true);
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    setTimeLeft(modeConfig.duration);
    setIsRunning(false);
    setSessionStarted(false);
    setSessionCompleted(false);
  };

  const totalFocusMin = Math.floor(
    data.focusSessions.filter((s) => s.completed).reduce((sum, s) => sum + s.duration, 0) / 60
  );
  const todaySessions = data.focusSessions.filter((s) => {
    const d = new Date(s.startedAt);
    const now = new Date();
    return d.getDate() === now.getDate() && d.getMonth() === now.getMonth();
  }).length;

  if (!loaded) return <div className="text-center py-20 text-dark-400">加载中...</div>;

  const resistanceInfo = currentSubTask
    ? RESISTANCE_LABELS[currentSubTask.resistanceType] || { label: "未知", emoji: "❓", color: "text-dark-400" }
    : null;

  return (
    <PageTransition>
    <div className="space-y-6 max-w-xl mx-auto">
      <div className="text-center">
        <h1 className="text-2xl font-bold text-white">专注模式</h1>
        <p className="text-sm text-dark-400 mt-1">
          今日完成 {todaySessions} 个专注会话 · 累计 {totalFocusMin} 分钟
        </p>
      </div>

      {/* 当前子任务卡片 */}
      {currentSubTask && (
        <div className="glass-card rounded-2xl p-5 border border-accent-500/20">
          <button
            onClick={() => router.back()}
            className="flex items-center gap-1 text-xs text-dark-400 hover:text-white mb-3 transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            返回任务
          </button>
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500 to-primary-600 flex items-center justify-center flex-shrink-0">
              <Target className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-bold text-white mb-1">{currentSubTask.title}</h3>
              <p className="text-xs text-dark-400 mb-2">{currentSubTask.description}</p>
              <div className="flex items-center gap-3 text-xs">
                {resistanceInfo && (
                  <span className={`${resistanceInfo.color} flex items-center gap-1`}>
                    {resistanceInfo.emoji} {resistanceInfo.label} · 阻力 {currentSubTask.resistanceScore}/10
                  </span>
                )}
                <span className="text-dark-500">⏱ 预估 {currentSubTask.estimatedMinutes} 分钟</span>
              </div>
            </div>
          </div>

          {/* 5分钟极小目标 */}
          <div className="mt-4 p-3 bg-dark-800/50 rounded-xl border border-dark-700/50">
            <div className="flex items-start gap-2">
              <Zap className="w-4 h-4 text-accent-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-xs text-dark-400 mb-0.5">5分钟启动：先做这一件事</p>
                <p className="text-sm text-dark-200">{currentSubTask.microStep}</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 完成提示 */}
      {sessionCompleted && currentSubTask && !subTaskCompleted && (
        <div className="glass-card rounded-2xl p-5 border border-green-500/30 bg-green-500/5 text-center">
          <div className="text-4xl mb-2">🎉</div>
          <h3 className="text-lg font-bold text-white mb-1">专注完成！</h3>
          <p className="text-sm text-dark-300 mb-4">
            你专注了 {modeConfig.duration} 分钟
          </p>
          <div className="flex flex-col gap-2">
            <button
              onClick={() => {
                update((prev) => completeSubTask(prev, currentSubTask.id));
                setSubTaskCompleted(true);
              }}
              className="px-4 py-2.5 rounded-xl bg-gradient-to-r from-green-500 to-emerald-500 text-white text-sm font-medium hover:opacity-90 transition-all"
            >
              ✅ 这个子任务我完成了
            </button>
            <button
              onClick={() => router.push("/tasks")}
              className="px-4 py-2 rounded-xl bg-dark-800/50 text-dark-300 text-sm hover:text-white transition-colors"
            >
              返回任务列表
            </button>
          </div>
        </div>
      )}

      {/* 子任务已完成状态 */}
      {sessionCompleted && currentSubTask && subTaskCompleted && (
        <div className="glass-card rounded-2xl p-5 border border-green-500/30 bg-green-500/5 text-center">
          <div className="text-4xl mb-2">🏆</div>
          <h3 className="text-lg font-bold text-white mb-1">干得漂亮！</h3>
          <p className="text-sm text-dark-300 mb-3">
            你完成了「{currentSubTask.title}」
          </p>
          <button
            onClick={() => router.push("/tasks")}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-accent-500 to-primary-600 text-white text-sm font-medium hover:opacity-90 transition-all"
          >
            返回任务列表
          </button>
        </div>
      )}

      {/* 无关联子任务的完成提示 */}
      {sessionCompleted && !currentSubTask && (
        <div className="glass-card rounded-2xl p-5 border border-green-500/30 bg-green-500/5 text-center">
          <div className="text-4xl mb-2">🎉</div>
          <h3 className="text-lg font-bold text-white mb-1">专注完成！</h3>
          <p className="text-sm text-dark-300 mb-3">
            你专注了 {modeConfig.duration} 分钟
          </p>
          <button
            onClick={() => router.push("/tasks")}
            className="px-4 py-2 rounded-xl bg-gradient-to-r from-accent-500 to-primary-600 text-white text-sm font-medium hover:opacity-90 transition-all"
          >
            返回任务列表
          </button>
        </div>
      )}

      {/* Mode Selector */}
      {!sessionCompleted && (
        <div className="flex gap-2 justify-center">
          {(Object.keys(MODES) as (keyof typeof MODES)[]).map((key) => {
            const m = MODES[key];
            const Icon = m.icon;
            const isActive = mode === key;
            return (
              <button
                key={key}
                onClick={() => handleModeChange(key)}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  isActive
                    ? "bg-gradient-to-r " + m.color + " text-white"
                    : "glass-card text-dark-300 hover:text-white"
                }`}
              >
                <Icon className="w-4 h-4" />
                {m.label}
              </button>
            );
          })}
        </div>
      )}

      {/* Timer Circle */}
      {!sessionCompleted && (
        <div className="relative flex items-center justify-center py-4">
          <svg className="w-64 h-64 transform -rotate-90">
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="#1e293b"
              strokeWidth="8"
              fill="none"
            />
            <circle
              cx="128"
              cy="128"
              r="120"
              stroke="url(#gradient)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              strokeDasharray={circumference}
              strokeDashoffset={strokeDashoffset}
              className="transition-all duration-1000"
            />
            <defs>
              <linearGradient id="gradient" x1="0%" y1="0%" x2="100%" y2="100%">
                <stop offset="0%" stopColor="#f97316" />
                <stop offset="100%" stopColor="#ef4444" />
              </linearGradient>
            </defs>
          </svg>
          <div className="absolute flex flex-col items-center">
            <div className="text-6xl font-bold text-white font-mono">
              {formatTime(timeLeft)}
            </div>
            <p className="text-sm text-dark-400 mt-2">{modeConfig.desc}</p>
            {timeLeft === 0 && (
              <div className="flex items-center gap-2 text-green-400 mt-2 animate-pulse">
                <Check className="w-4 h-4" />
                <span className="text-sm font-medium">完成！</span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Controls */}
      {!sessionCompleted && (
        <div className="flex items-center justify-center gap-4">
          <button
            onClick={handleReset}
            className="w-12 h-12 rounded-full glass-card flex items-center justify-center text-dark-400 hover:text-white transition-colors"
          >
            <RotateCcw className="w-5 h-5" />
          </button>
          <button
            onClick={handleToggle}
            className={`w-16 h-16 rounded-full flex items-center justify-center text-white transition-all shadow-lg ${
              isRunning
                ? "bg-gradient-to-br from-red-500 to-orange-500"
                : "bg-gradient-to-br from-accent-500 to-primary-600 glow"
            }`}
          >
            {isRunning ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6 ml-1" />}
          </button>
          <div className="w-12 h-12" /> {/* spacer for symmetry */}
        </div>
      )}

      {/* Recent Sessions */}
      {data.focusSessions.length > 0 && !sessionCompleted && (
        <div className="glass-card rounded-2xl p-6">
          <h3 className="text-sm font-bold text-white mb-4">最近专注</h3>
          <div className="space-y-2">
            {data.focusSessions
              .filter((s) => s.completed)
              .slice(-5)
              .reverse()
              .map((session) => (
                <div
                  key={session.id}
                  className="flex items-center justify-between py-2 border-b border-dark-700/30 last:border-0"
                >
                  <div className="flex items-center gap-3">
                    <div
                      className={`w-8 h-8 rounded-lg bg-gradient-to-br ${
                        MODES[session.mode as keyof typeof MODES]?.color || "from-accent-500 to-primary-600"
                      } flex items-center justify-center`}
                    >
                      {(() => {
                        const Icon = MODES[session.mode as keyof typeof MODES]?.icon || Target;
                        return <Icon className="w-4 h-4 text-white" />;
                      })()}
                    </div>
                    <div>
                      <p className="text-sm text-white">{session.taskTitle}</p>
                      <p className="text-xs text-dark-500">
                        {new Date(session.startedAt).toLocaleDateString("zh-CN", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </p>
                    </div>
                  </div>
                  <span className="text-sm text-accent-400 font-mono">
                    {Math.floor(session.duration / 60)} 分钟
                  </span>
                </div>
              ))}
          </div>
        </div>
      )}
    </div>
    </PageTransition>
  );
}
