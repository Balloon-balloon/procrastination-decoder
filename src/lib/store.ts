import { AppData, Task, SubTask, FocusSession, MoodEntry, UserProfile, Achievement } from "./types";
import { generateId, getTodayKey, isSameDay } from "./utils";
import { buildShrunkAction } from "./rescue";

const STORAGE_KEY = "procrastination-decoder-data";

export const DEFAULT_ACHIEVEMENTS: Achievement[] = [
  {
    id: "first-test",
    title: "认识自己",
    description: "完成第一次拖延人格测试",
    icon: "🧠",
    unlocked: false,
    unlockedAt: null,
    progress: 0,
    maxProgress: 1,
  },
  {
    id: "first-task",
    title: "迈出第一步",
    description: "创建第一个任务",
    icon: "📝",
    unlocked: false,
    unlockedAt: null,
    progress: 0,
    maxProgress: 1,
  },
  {
    id: "first-complete",
    title: "言出必行",
    description: "完成第一个任务",
    icon: "✅",
    unlocked: false,
    unlockedAt: null,
    progress: 0,
    maxProgress: 1,
  },
  {
    id: "first-focus",
    title: "心流初体验",
    description: "完成第一次专注会话",
    icon: "🎯",
    unlocked: false,
    unlockedAt: null,
    progress: 0,
    maxProgress: 1,
  },
  {
    id: "streak-3",
    title: "三日不断",
    description: "连续3天完成至少一个任务",
    icon: "🔥",
    unlocked: false,
    unlockedAt: null,
    progress: 0,
    maxProgress: 3,
  },
  {
    id: "streak-7",
    title: "一周坚持",
    description: "连续7天完成至少一个任务",
    icon: "⚡",
    unlocked: false,
    unlockedAt: null,
    progress: 0,
    maxProgress: 7,
  },
  {
    id: "focus-120",
    title: "深度专注",
    description: "累计专注时间达到120分钟",
    icon: "🧘",
    unlocked: false,
    unlockedAt: null,
    progress: 0,
    maxProgress: 120,
  },
  {
    id: "tasks-10",
    title: "任务终结者",
    description: "累计完成10个任务",
    icon: "🏆",
    unlocked: false,
    unlockedAt: null,
    progress: 0,
    maxProgress: 10,
  },
  {
    id: "mood-7",
    title: "情绪日记",
    description: "记录7次情绪状态",
    icon: "📊",
    unlocked: false,
    unlockedAt: null,
    progress: 0,
    maxProgress: 7,
  },
  {
    id: "no-postpone",
    title: "说到做到",
    description: "完成5个未推迟的任务",
    icon: "💎",
    unlocked: false,
    unlockedAt: null,
    progress: 0,
    maxProgress: 5,
  },
];

export function getDefaultProfile(name?: string): UserProfile {
  return {
    name: name || "",
    personalityResult: null,
    createdAt: new Date().toISOString(),
    totalFocusTime: 0,
    totalTasksCompleted: 0,
    streak: 0,
    lastActiveDate: getTodayKey(),
  };
}

export function getDefaultData(): AppData {
  return {
    profile: getDefaultProfile(),
    tasks: [],
    subTasks: [],
    focusSessions: [],
    moodEntries: [],
    achievements: DEFAULT_ACHIEVEMENTS.map((a) => ({ ...a })),
  };
}

export function loadData(): AppData {
  if (typeof window === "undefined") return getDefaultData();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return getDefaultData();
    const data = JSON.parse(raw) as AppData;
    const defaults = getDefaultData();
    return {
      profile: { ...defaults.profile, ...data.profile },
      tasks: (data.tasks || []).map((task) => ({
        ...task,
        estimatedUnit: task.estimatedUnit || "minute",
      })),
      subTasks: data.subTasks || [],
      focusSessions: data.focusSessions || [],
      moodEntries: data.moodEntries || [],
      achievements: data.achievements || defaults.achievements,
    };
  } catch {
    return getDefaultData();
  }
}

export function saveData(data: AppData): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save data:", e);
  }
}

export function calculateStreak(tasks: Task[]): number {
  const completedDays = new Set(
    tasks
      .filter((t) => t.completedAt)
      .map((t) => new Date(t.completedAt!).toISOString().split("T")[0])
  );
  let streak = 0;
  const today = new Date();
  for (let i = 0; i < 365; i++) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    const key = d.toISOString().split("T")[0];
    if (completedDays.has(key)) {
      streak++;
    } else if (i > 0) {
      break;
    }
  }
  return streak;
}

export function updateAchievements(data: AppData): AppData {
  const achievements = [...data.achievements];
  const now = new Date().toISOString();

  const unlock = (id: string, progress?: number) => {
    const idx = achievements.findIndex((a) => a.id === id);
    if (idx === -1) return;
    const ach = achievements[idx];
    if (progress !== undefined) {
      achievements[idx] = { ...ach, progress: Math.min(progress, ach.maxProgress) };
    }
    if (!ach.unlocked && (progress === undefined || progress >= ach.maxProgress)) {
      achievements[idx] = {
        ...achievements[idx],
        unlocked: true,
        unlockedAt: now,
        progress: ach.maxProgress,
      };
    }
  };

  if (data.profile.personalityResult) unlock("first-test", 1);
  unlock("first-task", Math.min(data.tasks.length, 1));
  const completed = data.tasks.filter((t) => t.status === "completed");
  unlock("first-complete", Math.min(completed.length, 1));
  const validFocus = data.focusSessions.filter((s) => s.completed);
  unlock("first-focus", Math.min(validFocus.length, 1));
  const streak = calculateStreak(data.tasks);
  unlock("streak-3", Math.min(streak, 3));
  unlock("streak-7", Math.min(streak, 7));
  const totalFocusMin = Math.floor(
    validFocus.reduce((sum, s) => sum + s.duration, 0) / 60
  );
  unlock("focus-120", Math.min(totalFocusMin, 120));
  unlock("tasks-10", Math.min(completed.length, 10));
  unlock("mood-7", Math.min(data.moodEntries.length, 7));
  const noPostpone = completed.filter((t) => t.postponedCount === 0);
  unlock("no-postpone", Math.min(noPostpone.length, 5));

  return { ...data, achievements };
}

export function createTask(
  data: AppData,
  task: Omit<Task, "id" | "createdAt" | "completedAt" | "postponedCount" | "actualTime" | "dueDate" | "breakdownStatus" | "overallStrategy"> & { dueDate?: string | null }
): AppData {
  const newTask: Task = {
    ...task,
    id: generateId(),
    createdAt: new Date().toISOString(),
    completedAt: null,
    dueDate: task.dueDate ?? null,
    postponedCount: 0,
    actualTime: 0,
    breakdownStatus: "none",
  };
  const newData = { ...data, tasks: [...data.tasks, newTask] };
  return updateAchievements(newData);
}

export function updateTask(data: AppData, taskId: string, updates: Partial<Task>): AppData {
  const tasks = data.tasks.map((t) => (t.id === taskId ? { ...t, ...updates } : t));
  const newData = { ...data, tasks };
  return updateAchievements(newData);
}

export function completeTask(data: AppData, taskId: string): AppData {
  const tasks = data.tasks.map((t) =>
    t.id === taskId
      ? { ...t, status: "completed" as const, completedAt: new Date().toISOString() }
      : t
  );
  const completedCount = tasks.filter((t) => t.status === "completed").length;
  const newData = {
    ...data,
    tasks,
    profile: { ...data.profile, totalTasksCompleted: completedCount },
  };
  return updateAchievements(newData);
}

export function postponeTask(data: AppData, taskId: string): AppData {
  const tasks = data.tasks.map((t) =>
    t.id === taskId
      ? { ...t, postponedCount: t.postponedCount + 1, status: "postponed" as const }
      : t
  );
  return { ...data, tasks };
}

export function deleteTask(data: AppData, taskId: string): AppData {
  return {
    ...data,
    tasks: data.tasks.filter((t) => t.id !== taskId),
    subTasks: data.subTasks.filter((st) => st.taskId !== taskId),
  };
}

export function addFocusSession(
  data: AppData,
  session: Omit<FocusSession, "id">
): AppData {
  const newSession: FocusSession = { ...session, id: generateId() };
  const focusSessions = [...data.focusSessions, newSession];
  const totalFocus = focusSessions
    .filter((s) => s.completed)
    .reduce((sum, s) => sum + s.duration, 0);
  const newData = {
    ...data,
    focusSessions,
    profile: { ...data.profile, totalFocusTime: totalFocus },
  };
  return updateAchievements(newData);
}

export function addMoodEntry(
  data: AppData,
  entry: Omit<MoodEntry, "id" | "createdAt">
): AppData {
  const newEntry: MoodEntry = {
    ...entry,
    id: generateId(),
    createdAt: new Date().toISOString(),
  };
  const moodEntries = [...data.moodEntries, newEntry];
  const newData = { ...data, moodEntries };
  return updateAchievements(newData);
}

export function setPersonalityResult(
  data: AppData,
  result: AppData["profile"]["personalityResult"]
): AppData {
  const newData = {
    ...data,
    profile: { ...data.profile, personalityResult: result },
  };
  return updateAchievements(newData);
}

// ========== 子任务 & AI拆解 ==========

export function setTaskBreakdownStatus(
  data: AppData,
  taskId: string,
  status: Task["breakdownStatus"],
  overallStrategy?: string,
  extras?: {
    taskUnderstanding?: string;
    painPointResponse?: string;
    executionPlan?: string;
  }
): AppData {
  const tasks = data.tasks.map((t) =>
    t.id === taskId
      ? {
          ...t,
          breakdownStatus: status,
          ...(overallStrategy !== undefined ? { overallStrategy } : {}),
          ...(extras || {}),
        }
      : t
  );
  return { ...data, tasks };
}

export function addSubTasks(
  data: AppData,
  taskId: string,
  subTasks: Omit<SubTask, "id" | "taskId" | "status" | "completedAt">[]
): AppData {
  const newSubTasks: SubTask[] = subTasks.map((st) => ({
    ...st,
    id: generateId(),
    taskId,
    status: "todo",
    completedAt: null,
  }));
  return {
    ...data,
    subTasks: [...data.subTasks.filter((st) => st.taskId !== taskId), ...newSubTasks],
  };
}

export function getSubTasksByTask(data: AppData, taskId: string): SubTask[] {
  return data.subTasks
    .filter((st) => st.taskId === taskId)
    .sort((a, b) => a.recommendedOrder - b.recommendedOrder);
}

export function getSubTaskById(data: AppData, subTaskId: string): SubTask | null {
  return data.subTasks.find((st) => st.id === subTaskId) || null;
}

export function startSubTask(data: AppData, subTaskId: string): AppData {
  const subTasks = data.subTasks.map((st) =>
    st.id === subTaskId ? { ...st, status: "in-progress" as const } : st
  );
  return { ...data, subTasks };
}

export function completeSubTask(data: AppData, subTaskId: string): AppData {
  const subTasks = data.subTasks.map((st) =>
    st.id === subTaskId
      ? { ...st, status: "completed" as const, completedAt: new Date().toISOString() }
      : st
  );

  // 检查父任务是否所有子任务都完成了
  const subTask = subTasks.find((st) => st.id === subTaskId);
  if (subTask) {
    const allSubTasks = subTasks.filter((st) => st.taskId === subTask.taskId);
    const allCompleted = allSubTasks.length > 0 && allSubTasks.every((st) => st.status === "completed");
    if (allCompleted) {
      const tasks = data.tasks.map((t) =>
        t.id === subTask.taskId
          ? { ...t, status: "completed" as const, completedAt: new Date().toISOString() }
          : t
      );
      const completedCount = tasks.filter((t) => t.status === "completed").length;
      const newData = {
        ...data,
        tasks,
        subTasks,
        profile: { ...data.profile, totalTasksCompleted: completedCount },
      };
      return updateAchievements(newData);
    }
  }

  const newData = { ...data, subTasks };
  return updateAchievements(newData);
}

export function deleteSubTask(data: AppData, subTaskId: string): AppData {
  return { ...data, subTasks: data.subTasks.filter((st) => st.id !== subTaskId) };
}

export function insertMicroSubTask(
  data: AppData,
  sourceSubTaskId: string,
  newSubTaskId: string
): AppData {
  const source = data.subTasks.find((subTask) => subTask.id === sourceSubTaskId);
  if (!source) return data;

  const shrunk = buildShrunkAction(source.title, source.microStep);
  const microSubTask: SubTask = {
    id: newSubTaskId,
    taskId: source.taskId,
    title: shrunk.title,
    description: `把“${source.title}”继续切细。现在只要求启动，不要求完成原步骤。`,
    resistanceScore: Math.max(1, source.resistanceScore - 3),
    resistanceType: "low-resistance",
    resistanceReason: "这是更机械、更短的启动动作，用于绕过当前抗拒。",
    estimatedMinutes: Math.max(5, Math.min(15, Math.ceil(source.estimatedMinutes / 3))),
    recommendedOrder: source.recommendedOrder,
    microStep: shrunk.microStep,
    status: "todo",
    completedAt: null,
  };

  const shiftedSubTasks = data.subTasks.map((subTask) =>
    subTask.taskId === source.taskId &&
    subTask.recommendedOrder >= source.recommendedOrder
      ? { ...subTask, recommendedOrder: subTask.recommendedOrder + 1 }
      : subTask
  );

  return {
    ...data,
    subTasks: [...shiftedSubTasks, microSubTask],
  };
}

export function deleteSubTasksByTask(data: AppData, taskId: string): AppData {
  return { ...data, subTasks: data.subTasks.filter((st) => st.taskId !== taskId) };
}
