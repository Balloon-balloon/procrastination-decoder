"use client";
import { useState, useEffect, useRef, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { useAppData } from "@/hooks/useAppData";
import { useToast } from "@/components/Toast";
import { addFocusSession, completeSubTask, getSubTaskById, updateTask } from "@/lib/store";
import { formatTime } from "@/lib/utils";
import { SubTask, Task } from "@/lib/types";
import { PageTransition } from "@/components/Animations";
import { useTimer } from "@/hooks/useTimer";
import { motion, AnimatePresence } from "framer-motion";
import { playCompleteSound } from "@/lib/sound";
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
  ChevronDown,
  Link2,
  Unlink,
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

function FocusPageContent() {
  const { data, update, loaded } = useAppData();
  const { showToast } = useToast();
  const searchParams = useSearchParams();
  const router = useRouter();
  const subTaskId = searchParams.get("subTaskId");
  const taskIdParam = searchParams.get("taskId");
  const timer = useTimer();

  const [mode, setMode] = useState<keyof typeof MODES>("pomodoro");
  const [timeLeft, setTimeLeft] = useState(MODES.pomodoro.duration);
  const [isRunning, setIsRunning] = useState(false);
  const [sessionStarted, setSessionStarted] = useState(false);
  const [sessionCompleted, setSessionCompleted] = useState(false);
  const [subTaskCompleted, setSubTaskCompleted] = useState(false);
  const [showReturnMessage, setShowReturnMessage] = useState(false);
  const [showTaskPicker, setShowTaskPicker] = useState(false);
  const [boundTaskId, setBoundTaskId] = useState<string | null>(taskIdParam || null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);
  const leaveTimestampRef = useRef<number | null>(null);
  const lastTimeLeftRef = useRef<number>(MODES.pomodoro.duration);
  const elapsedSecondsRef = useRef<number>(0);

  // 查找当前子任务
  const currentSubTask: SubTask | null = subTaskId
    ? getSubTaskById(data, subTaskId) || null
    : null;

  // 查找绑定的任务
  const boundTask: Task | null = boundTaskId
    ? data.tasks.find((t) => t.id === boundTaskId) || null
    : null;

  // 可绑定的任务列表（未完成的任务）
  const bindableTasks = data.tasks.filter(
    (t) => t.status !== "completed"
  );

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
              const elapsedSec = elapsedSecondsRef.current + 1;
              update((prevData) => {
                const newData = addFocusSession(prevData, {
                  taskId: currentSubTask?.taskId || boundTaskId || null,
                  subTaskId: currentSubTask?.id || null,
                  taskTitle: currentSubTask?.title || boundTask?.title || modeConfig.label,
                  duration: Math.floor(elapsedSec / 60),
                  mode,
                  completed: true,
                  startedAt: new Date().toISOString(),
                  endedAt: new Date().toISOString(),
                });
                // 如果绑定了任务，更新任务的实际投入时间
                if (boundTaskId) {
                  return updateTask(newData, boundTaskId, {
                    actualTime: (boundTask?.actualTime || 0) + Math.floor(elapsedSec / 60),
                  });
                }
                return newData;
              });
            }
            return 0;
          }
          elapsedSecondsRef.current += 1;
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
  }, [isRunning, mode, modeConfig.duration, sessionStarted, update, currentSubTask, boundTaskId, boundTask]);

  // 记录最后剩余时间
  useEffect(() => {
    lastTimeLeftRef.current = timeLeft;
  }, [timeLeft]);

  // Page Visibility API: 熄屏兜底
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        leaveTimestampRef.current = Date.now();
        localStorage.setItem("pd-focus-leave", String(Date.now()));
        localStorage.setItem("pd-focus-remaining", String(lastTimeLeftRef.current));
      } else {
        if (leaveTimestampRef.current && isRunning) {
          const leaveMs = Date.now() - leaveTimestampRef.current;
          const leaveSec = Math.floor(leaveMs / 1000);
          const gracePeriod = timer.settings.gracePeriod;

          // 时间戳差值法修正
          const savedRemaining = parseInt(localStorage.getItem("pd-focus-remaining") || "0");
          if (savedRemaining > 0) {
            const corrected = Math.max(0, savedRemaining - leaveSec);
            if (corrected !== timeLeft) {
              setTimeLeft(corrected);
            }
          }

          if (leaveSec > gracePeriod) {
            if (timer.settings.autoContinue) {
              setShowReturnMessage(true);
              setTimeout(() => setShowReturnMessage(false), 3000);
            } else {
              setShowReturnMessage(true);
              setTimeout(() => setShowReturnMessage(false), 3000);
            }
          } else {
            setShowReturnMessage(true);
            setTimeout(() => setShowReturnMessage(false), 3000);
          }
        }
        leaveTimestampRef.current = null;
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [isRunning, timeLeft, timer]);

  const handleModeChange = (newMode: keyof typeof MODES) => {
    // 如果正在运行，先记录已用时间
    if (sessionStarted && isRunning && elapsedSecondsRef.current > 0) {
      const elapsedMin = Math.max(1, Math.floor(elapsedSecondsRef.current / 60));
      update((prevData) => {
        const newData = addFocusSession(prevData, {
          taskId: currentSubTask?.taskId || boundTaskId || null,
          subTaskId: currentSubTask?.id || null,
          taskTitle: currentSubTask?.title || boundTask?.title || modeConfig.label,
          duration: elapsedMin,
          mode,
          completed: false,
          startedAt: new Date().toISOString(),
          endedAt: new Date().toISOString(),
        });
        if (boundTaskId) {
          return updateTask(newData, boundTaskId, {
            actualTime: (boundTask?.actualTime || 0) + elapsedMin,
          });
        }
        return newData;
      });
    }
    setMode(newMode);
    setTimeLeft(MODES[newMode].duration);
    setIsRunning(false);
    setSessionStarted(false);
    setSessionCompleted(false);
    elapsedSecondsRef.current = 0;
  };

  const handleToggle = () => {
    if (!isRunning && !sessionStarted) {
      setSessionStarted(true);
      elapsedSecondsRef.current = 0;
    }
    // 暂停时记录部分时间
    if (isRunning && sessionStarted && elapsedSecondsRef.current >= 60) {
      const elapsedMin = Math.floor(elapsedSecondsRef.current / 60);
      if (elapsedMin > 0) {
        update((prevData) => {
          const newData = addFocusSession(prevData, {
            taskId: currentSubTask?.taskId || boundTaskId || null,
            subTaskId: currentSubTask?.id || null,
            taskTitle: currentSubTask?.title || boundTask?.title || modeConfig.label,
            duration: elapsedMin,
            mode,
            completed: false,
            startedAt: new Date().toISOString(),
            endedAt: new Date().toISOString(),
          });
          if (boundTaskId) {
            return updateTask(newData, boundTaskId, {
              actualTime: (boundTask?.actualTime || 0) + elapsedMin,
            });
          }
          return newData;
        });
        showToast(`已记录 ${elapsedMin} 分钟专注时间`);
      }
    }
    setIsRunning(!isRunning);
  };

  const handleReset = () => {
    // 如果正在运行且有有效时间，记录
    if (sessionStarted && isRunning && elapsedSecondsRef.current >= 60) {
      const elapsedMin = Math.floor(elapsedSecondsRef.current / 60);
      if (elapsedMin > 0) {
        update((prevData) => {
          const newData = addFocusSession(prevData, {
            taskId: currentSubTask?.taskId || boundTaskId || null,
            subTaskId: currentSubTask?.id || null,
            taskTitle: currentSubTask?.title || boundTask?.title || modeConfig.label,
            duration: elapsedMin,
            mode,
            completed: false,
            startedAt: new Date().toISOString(),
            endedAt: new Date().toISOString(),
          });
          if (boundTaskId) {
            return updateTask(newData, boundTaskId, {
              actualTime: (boundTask?.actualTime || 0) + elapsedMin,
            });
          }
          return newData;
        });
      }
    }
    setTimeLeft(modeConfig.duration);
    setIsRunning(false);
    setSessionStarted(false);
    setSessionCompleted(false);
    elapsedSecondsRef.current = 0;
  };

  const handleBindTask = (taskId: string | null) => {
    setBoundTaskId(taskId);
    setShowTaskPicker(false);
    if (taskId) {
      const task = data.tasks.find((t) => t.id === taskId);
      if (task) showToast(`已绑定任务：${task.title}`);
    } else {
      showToast("已取消任务绑定");
    }
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
    <>
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

      {/* 任务绑定区（无子任务时显示） */}
      {!currentSubTask && !sessionCompleted && (
        <div className="glass-card rounded-2xl p-4">
          {boundTask ? (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-9 h-9 rounded-lg bg-gradient-to-br from-accent-500/30 to-primary-600/30 flex items-center justify-center flex-shrink-0">
                  <Link2 className="w-4 h-4 text-accent-400" />
                </div>
                <div className="min-w-0">
                  <p className="text-xs text-dark-400">正在专注</p>
                  <p className="text-sm font-medium text-white truncate">{boundTask.title}</p>
                  <p className="text-[10px] text-dark-500 mt-0.5">
                    已投入 {boundTask.actualTime} 分钟 · 预估 {boundTask.estimatedTime} 分钟
                  </p>
                </div>
              </div>
              <button
                onClick={() => handleBindTask(null)}
                className="p-2 rounded-lg hover:bg-dark-800/50 text-dark-400 hover:text-red-400 transition-colors flex-shrink-0"
                title="取消绑定"
              >
                <Unlink className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={() => setShowTaskPicker(!showTaskPicker)}
              className="w-full flex items-center gap-3 text-left transition-colors"
            >
              <div className="w-9 h-9 rounded-lg bg-dark-800/50 flex items-center justify-center flex-shrink-0">
                <Link2 className="w-4 h-4 text-dark-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm text-dark-300">绑定任务（可选）</p>
                <p className="text-[10px] text-dark-500">专注时间会记录到任务</p>
              </div>
              <ChevronDown className={`w-4 h-4 text-dark-400 transition-transform ${showTaskPicker ? "rotate-180" : ""}`} />
            </button>
          )}

          {/* 任务选择列表 */}
          {showTaskPicker && !boundTask && (
            <div className="mt-3 space-y-1 max-h-48 overflow-y-auto">
              {bindableTasks.length === 0 ? (
                <p className="text-xs text-dark-500 text-center py-4">暂无可绑定的任务</p>
              ) : (
                bindableTasks.map((task) => (
                  <button
                    key={task.id}
                    onClick={() => handleBindTask(task.id)}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-dark-800/50 transition-colors text-left"
                  >
                    <Target className="w-3.5 h-3.5 text-dark-400 flex-shrink-0" />
                    <span className="text-sm text-dark-200 truncate flex-1">{task.title}</span>
                    <span className="text-[10px] text-dark-500 flex-shrink-0">{task.estimatedTime}min</span>
                  </button>
                ))
              )}
            </div>
          )}
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

    {/* 熄屏返回弹窗 */}
    <AnimatePresence>
      {timer.showReturnDialog && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            className="w-full max-w-sm rounded-2xl p-6 text-center"
            style={{ background: "var(--bg-primary)" }}
          >
            <div className="text-4xl mb-3">⏰</div>
            <h3 className="font-hand text-lg font-bold mb-2" style={{ color: "var(--color-ink)" }}>
              你离开了 {timer.leaveDuration} 秒
            </h3>
            <p className="font-hand text-sm mb-5" style={{ color: "var(--text-muted)" }}>
              要继续专注吗？
            </p>
            <div className="flex gap-3">
              <button
                onClick={timer.continueAfterLeave}
                className="btn-mint flex-1 text-sm font-hand"
              >
                继续
              </button>
              <button
                onClick={timer.abandonAfterLeave}
                className="flex-1 py-2.5 rounded-lg text-sm font-hand"
                style={{ background: "rgba(43,58,103,0.06)", color: "var(--text-secondary)" }}
              >
                放弃
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>

    {/* 返回消息提示 */}
    <AnimatePresence>
      {(showReturnMessage || timer.returnMessage) && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="fixed top-20 left-1/2 -translate-x-1/2 z-[150] px-5 py-2.5 rounded-xl text-sm font-hand font-bold"
          style={{ background: "var(--color-neon-green)", color: "#fff", boxShadow: "0 4px 12px rgba(78,205,196,0.3)" }}
        >
          {timer.returnMessage || "欢迎回来，继续加油 💪"}
        </motion.div>
      )}
    </AnimatePresence>
    </>
  );
}

export default function FocusPage() {
  return (
    <Suspense fallback={<div className="flex items-center justify-center min-h-[60vh]"><div className="animate-pulse font-hand text-lg" style={{ color: "var(--color-ink)" }}>加载中...</div></div>}>
      <FocusPageContent />
    </Suspense>
  );
}
