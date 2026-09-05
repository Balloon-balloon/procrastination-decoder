export type ProcrastinationType =
  | "perfectionist"
  | "dreamer"
  | "worrier"
  | "crisis-maker"
  | "defier"
  | "overdoer";

export interface PersonalityResult {
  type: ProcrastinationType;
  typeName: string;
  description: string;
  traits: string[];
  suggestions: string[];
  scores: Record<ProcrastinationType, number>;
  completedAt: string;
}

export type ResistanceType =
  | "perfectionist"     // 完美主义型：怕做不好所以不开始
  | "ambiguous"          // 模糊型：不知道从哪开始
  | "overwhelming"       // 畏难型：任务看起来太大
  | "aversive"           // 抵触型：对任务本身反感
  | "instant-gratification" // 即时满足型：有更爽的事
  | "low-resistance";    // 低阻力

export interface SubTask {
  id: string;
  taskId: string;         // 父任务ID
  title: string;
  description: string;
  resistanceScore: number;     // 阻力分数 1-10
  resistanceType: ResistanceType;
  resistanceReason: string;    // 阻力原因（AI生成的解释）
  estimatedMinutes: number;
  recommendedOrder: number;    // AI推荐的执行顺序（阻力优先）
  microStep: string;           // 5分钟极小目标
  status: "todo" | "in-progress" | "completed";
  completedAt: string | null;
}

export interface Task {
  id: string;
  title: string;
  description: string;
  priority: "low" | "medium" | "high" | "urgent";
  status: "todo" | "in-progress" | "completed" | "postponed";
  category: string;
  estimatedTime: number;
  actualTime: number;
  createdAt: string;
  completedAt: string | null;
  dueDate: string | null;  // 截止日期（ISO字符串）
  postponedCount: number;
  tags: string[];
  breakdownStatus: "none" | "loading" | "done" | "failed"; // AI拆解状态
  overallStrategy?: string;  // AI给出的整体策略建议
}

export interface FocusSession {
  id: string;
  taskId: string | null;
  subTaskId: string | null;
  taskTitle: string;
  duration: number;
  mode: "pomodoro" | "deep-work" | "short-break";
  completed: boolean;
  startedAt: string;
  endedAt: string | null;
}

export interface MoodEntry {
  id: string;
  mood: "great" | "good" | "okay" | "bad" | "terrible";
  energy: number;
  procrastinationLevel: number;
  note: string;
  createdAt: string;
}

export interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
  unlockedAt: string | null;
  progress: number;
  maxProgress: number;
}

export interface UserProfile {
  name: string;
  personalityResult: PersonalityResult | null;
  createdAt: string;
  totalFocusTime: number;
  totalTasksCompleted: number;
  streak: number;
  lastActiveDate: string;
}

export interface AppData {
  profile: UserProfile;
  tasks: Task[];
  subTasks: SubTask[];
  focusSessions: FocusSession[];
  moodEntries: MoodEntry[];
  achievements: Achievement[];
}

export interface User {
  id: string;
  username: string;
  email: string;
  password: string;
  verified: boolean;
  verificationToken?: string;
  createdAt: string;
  lastLoginAt: string;
  isFirstLogin?: boolean;
}

export interface AuthState {
  currentUserId: string | null;
  users: User[];
}
