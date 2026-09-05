"use client";
import { useState, useEffect } from "react";
import { useToast } from "@/components/Toast";
import { useAppData } from "@/hooks/useAppData";
import {
  createTask,
  completeTask,
  postponeTask,
  deleteTask,
  updateTask,
  setTaskBreakdownStatus,
  addSubTasks,
  getSubTasksByTask,
  completeSubTask,
  startSubTask,
  deleteSubTask,
} from "@/lib/store";
import { Task, SubTask } from "@/lib/types";
import { formatDate } from "@/lib/utils";
import { TaskBreakdownResult } from "@/components/TaskBreakdownResult";
import { PageTransition, StaggerContainer, FadeInItem, HoverCard } from "@/components/Animations";
import {
  Plus,
  Check,
  Clock,
  Trash2,
  Calendar,
  Tag,
  ChevronDown,
  ChevronUp,
  Sparkles,
  Loader2,
  Pencil,
  X,
} from "lucide-react";

const PRIORITY_CONFIG = {
  low: { label: "低", color: "text-green-400", bg: "bg-green-500/20" },
  medium: { label: "中", color: "text-yellow-400", bg: "bg-yellow-500/20" },
  high: { label: "高", color: "text-orange-400", bg: "bg-orange-500/20" },
  urgent: { label: "紧急", color: "text-red-400", bg: "bg-red-500/20" },
};

const STATUS_CONFIG = {
  todo: { label: "待开始", color: "text-dark-400" },
  "in-progress": { label: "进行中", color: "text-blue-400" },
  completed: { label: "已完成", color: "text-green-400" },
  postponed: { label: "已推迟", color: "text-orange-400" },
};

export default function TasksPage() {
  const { data, update, loaded } = useAppData();
  const { showToast } = useToast();
  const [showForm, setShowForm] = useState(false);
  const [newTask, setNewTask] = useState({
    title: "",
    description: "",
    priority: "medium" as Task["priority"],
    category: "学习",
    estimatedTime: 30,
    tags: [] as string[],
    dueDate: "",
  });
  const [filter, setFilter] = useState<"all" | "todo" | "in-progress" | "completed" | "postponed">("all");
  const [sortBy, setSortBy] = useState<"priority" | "created" | "postponed">("created");
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [editForm, setEditForm] = useState({
    title: "",
    description: "",
    priority: "medium" as Task["priority"],
    category: "学习",
    estimatedTime: 30,
    dueDate: "" as string,
    tags: [] as string[],
  });

  const startEdit = (task: Task) => {
    setEditingTask(task);
    setEditForm({
      title: task.title,
      description: task.description,
      priority: task.priority,
      category: task.category,
      estimatedTime: task.estimatedTime,
      dueDate: task.dueDate || "",
      tags: task.tags || [],
    });
  };

  const handleSaveEdit = () => {
    if (!editingTask || !editForm.title.trim()) return;
    update((prev) =>
      updateTask(prev, editingTask.id, {
        title: editForm.title,
        description: editForm.description,
        priority: editForm.priority,
        category: editForm.category,
        estimatedTime: editForm.estimatedTime,
        dueDate: editForm.dueDate || null,
        tags: editForm.tags,
      })
    );
    setEditingTask(null);
    showToast("任务已更新", "success");
  };

  if (!loaded) return <div className="text-center py-20 text-dark-400">加载中...</div>;

  const filteredTasks = data.tasks
    .filter((t) => (filter === "all" ? true : t.status === filter))
    .sort((a, b) => {
      if (sortBy === "priority") {
        const order = { urgent: 0, high: 1, medium: 2, low: 3 };
        return order[a.priority] - order[b.priority];
      }
      if (sortBy === "postponed") {
        return b.postponedCount - a.postponedCount;
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const handleCreate = () => {
    if (!newTask.title.trim()) return;
    update((prev) =>
      createTask(prev, {
        title: newTask.title,
        description: newTask.description,
        priority: newTask.priority,
        status: "todo",
        category: newTask.category,
        estimatedTime: newTask.estimatedTime,
        tags: newTask.tags,
        dueDate: newTask.dueDate || null,
      })
    );
    showToast("任务创建成功", "success");
    setNewTask({
      title: "",
      description: "",
      priority: "medium",
      category: "学习",
      estimatedTime: 30,
      tags: [],
      dueDate: "",
    });
    setShowForm(false);
  };

  const todoCount = data.tasks.filter((t) => t.status === "todo").length;
  const inProgressCount = data.tasks.filter((t) => t.status === "in-progress").length;
  const completedCount = data.tasks.filter((t) => t.status === "completed").length;
  const postponedCount = data.tasks.filter((t) => t.status === "postponed").length;

  return (
    <PageTransition>
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-white">任务管理</h1>
          <p className="text-sm text-dark-400 mt-1">
            共 {data.tasks.length} 个任务 · 已完成 {completedCount} 个
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 px-4 py-2 rounded-xl bg-gradient-to-r from-accent-500 to-primary-600 text-white text-sm font-medium hover:opacity-90 transition-all"
        >
          <Plus className="w-4 h-4" /> 新建任务
        </button>
      </div>

      {showForm && (
        <div className="glass-card rounded-2xl p-6 animate-slide-up">
          <h3 className="text-sm font-bold text-white mb-4">新建任务</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs text-dark-400 mb-1 block">任务标题</label>
              <input
                type="text"
                value={newTask.title}
                onChange={(e) => setNewTask({ ...newTask, title: e.target.value })}
                placeholder="比如：完成毕业论文引言"
                className="w-full px-4 py-2.5 rounded-xl bg-dark-800/50 border border-dark-700/50 text-white text-sm focus:outline-none focus:border-accent-500/50 transition-colors"
              />
            </div>
            <div>
              <label className="text-xs text-dark-400 mb-1 block">描述（可选）</label>
              <textarea
                value={newTask.description}
                onChange={(e) => setNewTask({ ...newTask, description: e.target.value })}
                placeholder="补充一些细节..."
                rows={2}
                className="w-full px-4 py-2.5 rounded-xl bg-dark-800/50 border border-dark-700/50 text-white text-sm focus:outline-none focus:border-accent-500/50 transition-colors resize-none"
              />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-dark-400 mb-1 block">优先级</label>
                <select
                  value={newTask.priority}
                  onChange={(e) =>
                    setNewTask({ ...newTask, priority: e.target.value as Task["priority"] })
                  }
                  className="w-full px-3 py-2.5 rounded-xl bg-dark-800/50 border border-dark-700/50 text-white text-sm focus:outline-none focus:border-accent-500/50"
                >
                  <option value="low">低</option>
                  <option value="medium">中</option>
                  <option value="high">高</option>
                  <option value="urgent">紧急</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-dark-400 mb-1 block">分类</label>
                <select
                  value={newTask.category}
                  onChange={(e) => setNewTask({ ...newTask, category: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-dark-800/50 border border-dark-700/50 text-white text-sm focus:outline-none focus:border-accent-500/50"
                >
                  <option value="学习">学习</option>
                  <option value="工作">工作</option>
                  <option value="生活">生活</option>
                  <option value="运动">运动</option>
                  <option value="其他">其他</option>
                </select>
              </div>
              <div>
                <label className="text-xs text-dark-400 mb-1 block">预估时间（分钟）</label>
                <input
                  type="number"
                  value={newTask.estimatedTime}
                  onChange={(e) =>
                    setNewTask({ ...newTask, estimatedTime: parseInt(e.target.value) || 0 })
                  }
                  className="w-full px-3 py-2.5 rounded-xl bg-dark-800/50 border border-dark-700/50 text-white text-sm focus:outline-none focus:border-accent-500/50"
                />
              </div>
              <div>
                <label className="text-xs text-dark-400 mb-1 block">截止日期</label>
                <input
                  type="date"
                  value={newTask.dueDate}
                  onChange={(e) => setNewTask({ ...newTask, dueDate: e.target.value })}
                  className="w-full px-3 py-2.5 rounded-xl bg-dark-800/50 border border-dark-700/50 text-white text-sm focus:outline-none focus:border-accent-500/50"
                />
              </div>
            </div>
            <div>
              <label className="text-xs text-dark-400 mb-1 block">
                标签 <span className="text-dark-500">（回车添加）</span>
              </label>
              <div className="flex flex-wrap gap-2 mb-2">
                {newTask.tags.map((tag, i) => (
                  <span
                    key={i}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent-500/15 text-accent-300 text-xs border border-accent-500/20"
                  >
                    #{tag}
                    <button
                      onClick={() =>
                        setNewTask({
                          ...newTask,
                          tags: newTask.tags.filter((_, idx) => idx !== i),
                        })
                      }
                      className="hover:text-accent-400"
                    >
                      ×
                    </button>
                  </span>
                ))}
              </div>
              <input
                type="text"
                placeholder="输入标签后按回车添加"
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    const val = (e.target as HTMLInputElement).value.trim();
                    if (val && !newTask.tags.includes(val)) {
                      setNewTask({ ...newTask, tags: [...newTask.tags, val] });
                      (e.target as HTMLInputElement).value = "";
                    }
                  }
                }}
                className="w-full px-3 py-2 rounded-xl bg-dark-800/50 border border-dark-700/50 text-white text-sm focus:outline-none focus:border-accent-500/50"
              />
              <div className="flex flex-wrap gap-1.5 mt-2">
                {["重要", "紧急", "考试", "作业", "项目", "阅读"].map((preset) =>
                  newTask.tags.includes(preset) ? null : (
                    <button
                      key={preset}
                      onClick={() =>
                        setNewTask({ ...newTask, tags: [...newTask.tags, preset] })
                      }
                      className="px-2 py-0.5 rounded-full text-xs text-dark-400 hover:text-dark-200 bg-dark-800/30 border border-dark-700/30 hover:border-dark-600/50 transition-colors"
                    >
                      + {preset}
                    </button>
                  )
                )}
              </div>
            </div>
            <div className="flex gap-3 pt-2">
              <button
                onClick={() => setShowForm(false)}
                className="flex-1 px-4 py-2.5 rounded-xl bg-dark-800/50 text-dark-300 text-sm hover:text-white transition-colors"
              >
                取消
              </button>
              <button
                onClick={handleCreate}
                className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-accent-500 to-primary-600 text-white text-sm font-medium hover:opacity-90 transition-all"
              >
                创建
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 编辑任务弹窗 */}
      {editingTask && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-2xl p-6 w-full max-w-lg animate-slide-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-base font-bold text-white">编辑任务</h3>
              <button
                onClick={() => setEditingTask(null)}
                className="p-1.5 rounded-lg hover:bg-dark-800/50 text-dark-400 hover:text-white transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="text-xs text-dark-400 mb-1 block">任务标题</label>
                <input
                  type="text"
                  value={editForm.title}
                  onChange={(e) => setEditForm({ ...editForm, title: e.target.value })}
                  className="w-full px-4 py-2.5 rounded-xl bg-dark-800/50 border border-dark-700/50 text-white text-sm focus:outline-none focus:border-accent-500/50 transition-colors"
                />
              </div>
              <div>
                <label className="text-xs text-dark-400 mb-1 block">描述（可选）</label>
                <textarea
                  value={editForm.description}
                  onChange={(e) => setEditForm({ ...editForm, description: e.target.value })}
                  rows={3}
                  className="w-full px-4 py-2.5 rounded-xl bg-dark-800/50 border border-dark-700/50 text-white text-sm focus:outline-none focus:border-accent-500/50 transition-colors resize-none"
                />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-dark-400 mb-1 block">优先级</label>
                  <select
                    value={editForm.priority}
                    onChange={(e) =>
                      setEditForm({ ...editForm, priority: e.target.value as Task["priority"] })
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-dark-800/50 border border-dark-700/50 text-white text-sm focus:outline-none focus:border-accent-500/50"
                  >
                    <option value="low">低</option>
                    <option value="medium">中</option>
                    <option value="high">高</option>
                    <option value="urgent">紧急</option>
                  </select>
                </div>
                <div>
                  <label className="text-xs text-dark-400 mb-1 block">分类</label>
                  <select
                    value={editForm.category}
                    onChange={(e) => setEditForm({ ...editForm, category: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-dark-800/50 border border-dark-700/50 text-white text-sm focus:outline-none focus:border-accent-500/50"
                  >
                    <option value="学习">学习</option>
                    <option value="工作">工作</option>
                    <option value="生活">生活</option>
                    <option value="运动">运动</option>
                    <option value="其他">其他</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-xs text-dark-400 mb-1 block">预估时间（分钟）</label>
                  <input
                    type="number"
                    value={editForm.estimatedTime}
                    onChange={(e) =>
                      setEditForm({ ...editForm, estimatedTime: parseInt(e.target.value) || 0 })
                    }
                    className="w-full px-3 py-2.5 rounded-xl bg-dark-800/50 border border-dark-700/50 text-white text-sm focus:outline-none focus:border-accent-500/50"
                  />
                </div>
                <div>
                  <label className="text-xs text-dark-400 mb-1 block">截止日期</label>
                  <input
                    type="date"
                    value={editForm.dueDate ? editForm.dueDate.slice(0, 10) : ""}
                    onChange={(e) => setEditForm({ ...editForm, dueDate: e.target.value })}
                    className="w-full px-3 py-2.5 rounded-xl bg-dark-800/50 border border-dark-700/50 text-white text-sm focus:outline-none focus:border-accent-500/50"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-dark-400 mb-1 block">
                  标签 <span className="text-dark-500">（回车添加）</span>
                </label>
                <div className="flex flex-wrap gap-2 mb-2">
                  {editForm.tags.map((tag, i) => (
                    <span
                      key={i}
                      className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-accent-500/15 text-accent-300 text-xs border border-accent-500/20"
                    >
                      #{tag}
                      <button
                        onClick={() =>
                          setEditForm({
                            ...editForm,
                            tags: editForm.tags.filter((_, idx) => idx !== i),
                          })
                        }
                        className="hover:text-accent-400"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="输入标签后按回车添加"
                  onKeyDown={(e) => {
                    if (e.key === "Enter") {
                      e.preventDefault();
                      const val = (e.target as HTMLInputElement).value.trim();
                      if (val && !editForm.tags.includes(val)) {
                        setEditForm({ ...editForm, tags: [...editForm.tags, val] });
                        (e.target as HTMLInputElement).value = "";
                      }
                    }
                  }}
                  className="w-full px-3 py-2 rounded-xl bg-dark-800/50 border border-dark-700/50 text-white text-sm focus:outline-none focus:border-accent-500/50"
                />
                <div className="flex flex-wrap gap-1.5 mt-2">
                  {["重要", "紧急", "考试", "作业", "项目", "阅读"].map((preset) =>
                    editForm.tags.includes(preset) ? null : (
                      <button
                        key={preset}
                        onClick={() =>
                          setEditForm({ ...editForm, tags: [...editForm.tags, preset] })
                        }
                        className="px-2 py-0.5 rounded-full text-xs text-dark-400 hover:text-dark-200 bg-dark-800/30 border border-dark-700/30 hover:border-dark-600/50 transition-colors"
                      >
                        + {preset}
                      </button>
                    )
                  )}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={() => setEditingTask(null)}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-dark-800/50 text-dark-300 text-sm hover:text-white transition-colors"
                >
                  取消
                </button>
                <button
                  onClick={handleSaveEdit}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-gradient-to-r from-accent-500 to-primary-600 text-white text-sm font-medium hover:opacity-90 transition-all"
                >
                  保存
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-2">
        {([
          { key: "all", label: "全部", count: data.tasks.length },
          { key: "todo", label: "待开始", count: todoCount },
          { key: "in-progress", label: "进行中", count: inProgressCount },
          { key: "completed", label: "已完成", count: completedCount },
          { key: "postponed", label: "已推迟", count: postponedCount },
        ] as const).map((f) => (
          <button
            key={f.key}
            onClick={() => setFilter(f.key)}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              filter === f.key
                ? "bg-accent-500/20 text-accent-400 border border-accent-500/30"
                : "bg-dark-800/50 text-dark-400 border border-transparent hover:text-white"
            }`}
          >
            {f.label} ({f.count})
          </button>
        ))}
        <div className="flex-1" />
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value as typeof sortBy)}
          className="px-3 py-1.5 rounded-lg bg-dark-800/50 text-dark-300 text-xs border border-dark-700/50 focus:outline-none"
        >
          <option value="created">按创建时间</option>
          <option value="priority">按优先级</option>
          <option value="postponed">按推迟次数</option>
        </select>
      </div>

      <StaggerContainer className="space-y-3" delay={0.15}>
        {filteredTasks.length === 0 ? (
          <div className="glass-card rounded-2xl p-12 text-center">
            <div className="text-5xl mb-4">📝</div>
            <p className="text-dark-400 text-sm">还没有任务，创建一个试试</p>
          </div>
        ) : (
          filteredTasks.map((task) => {
            const subTasks = getSubTasksByTask(data, task.id);
            return (
              <FadeInItem key={task.id}>
                <HoverCard y={-2} scale={1.005}>
                  <TaskCard
                task={task}
                subTasks={subTasks}
                onComplete={() => {
                  update((prev) => completeTask(prev, task.id));
                  showToast("太棒了！任务完成 🎉", "success");
                }}
                onPostpone={() => {
                  update((prev) => postponeTask(prev, task.id));
                  showToast("已推迟，别拖太久哦", "warning");
                }}
                onDelete={() => {
                  update((prev) => deleteTask(prev, task.id));
                  showToast("任务已删除", "info");
                }}
                onEdit={() => startEdit(task)}
                onDeleteSubTask={(subTaskId) => {
                  update((prev) => deleteSubTask(prev, subTaskId));
                  showToast("子任务已删除", "info");
                }}
                onStart={() =>
                  update((prev) => updateTask(prev, task.id, { status: "in-progress" }))
                }
                onBreakdown={async () => {
                  // 设置loading状态
                  update((prev) => setTaskBreakdownStatus(prev, task.id, "loading"));
                  try {
                    const personality = data.profile.personalityResult;
                    const res = await fetch("/api/breakdown", {
                      method: "POST",
                      headers: { "Content-Type": "application/json" },
                      body: JSON.stringify({
                        taskTitle: task.title,
                        taskDescription: task.description,
                        personalityType: personality?.type,
                        personalityName: personality?.typeName,
                      }),
                    });
                    const result = await res.json();
                    if (result.subTasks) {
                      update((prev) => {
                        let newData = addSubTasks(prev, task.id, result.subTasks);
                        newData = setTaskBreakdownStatus(
                          newData,
                          task.id,
                          "done",
                          result.overallStrategy
                        );
                        return newData;
                      });
                    } else {
                      update((prev) => setTaskBreakdownStatus(prev, task.id, "failed"));
                    }
                  } catch (e) {
                    console.error("Breakdown error:", e);
                    update((prev) => setTaskBreakdownStatus(prev, task.id, "failed"));
                  }
                }}
                onCompleteSubTask={(subTaskId) =>
                  update((prev) => completeSubTask(prev, subTaskId))
                }
                onStartSubTask={(subTaskId) =>
                  update((prev) => startSubTask(prev, subTaskId))
                }
              />
                </HoverCard>
              </FadeInItem>
            );
          })
        )}
      </StaggerContainer>
    </div>
    </PageTransition>
  );
}

function TaskCard({
  task,
  subTasks,
  onComplete,
  onPostpone,
  onDelete,
  onStart,
  onBreakdown,
  onCompleteSubTask,
  onStartSubTask,
  onEdit,
  onDeleteSubTask,
}: {
  task: Task;
  subTasks: SubTask[];
  onComplete: () => void;
  onPostpone: () => void;
  onDelete: () => void;
  onStart: () => void;
  onBreakdown: () => void;
  onCompleteSubTask: (subTaskId: string) => void;
  onStartSubTask: (subTaskId: string) => void;
  onEdit: () => void;
  onDeleteSubTask: (subTaskId: string) => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const priority = PRIORITY_CONFIG[task.priority];
  const status = STATUS_CONFIG[task.status];
  const hasBreakdown = task.breakdownStatus === "done" && subTasks.length > 0;

  // 拆解状态变化时自动展开
  useEffect(() => {
    if (task.breakdownStatus === "loading" || task.breakdownStatus === "done") {
      setExpanded(true);
    }
  }, [task.breakdownStatus]);

  return (
    <div className="glass-card glass-card-hover rounded-2xl p-4 transition-all">
      <div className="flex items-start gap-3">
        <button
          onClick={onComplete}
          disabled={task.status === "completed"}
          className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center transition-all ${
            task.status === "completed"
              ? "bg-green-500 border-green-500"
              : "border-dark-500 hover:border-accent-500"
          }`}
        >
          {task.status === "completed" && <Check className="w-3 h-3 text-white" />}
        </button>
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <h3
              className={`font-medium text-sm ${
                task.status === "completed"
                  ? "text-dark-500 line-through"
                  : "text-white"
              }`}
            >
              {task.title}
            </h3>
            <span className={`text-[10px] px-1.5 py-0.5 rounded ${priority.bg} ${priority.color}`}>
              {priority.label}
            </span>
            <span className={`text-[10px] ${status.color}`}>{status.label}</span>
            {hasBreakdown && (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-400 border border-purple-500/30">
                已拆解
              </span>
            )}
          </div>
          <div className="flex items-center gap-3 text-xs text-dark-500">
            <span className="flex items-center gap-1">
              <Calendar className="w-3 h-3" /> {formatDate(task.createdAt)}
            </span>
            <span className="flex items-center gap-1">
              <Clock className="w-3 h-3" /> {task.estimatedTime} 分钟
            </span>
            <span className="flex items-center gap-1">
              <Tag className="w-3 h-3" /> {task.category}
            </span>
            {task.postponedCount > 0 && (
              <span className="text-orange-400">推迟 {task.postponedCount} 次</span>
            )}
          </div>

          {/* 标签 */}
          {task.tags && task.tags.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-2">
              {task.tags.map((tag, i) => (
                <span
                  key={i}
                  className="px-2 py-0.5 rounded-full bg-dark-800/50 text-dark-300 text-xs border border-dark-700/30"
                >
                  #{tag}
                </span>
              ))}
            </div>
          )}

          {expanded && task.description && (
            <p className="mt-3 text-sm text-dark-300 leading-relaxed">{task.description}</p>
          )}

          {/* AI拆解结果 */}
          {expanded && hasBreakdown && (
            <TaskBreakdownResult
              subTasks={subTasks}
              overallStrategy={task.overallStrategy}
              onComplete={onCompleteSubTask}
              onStart={onStartSubTask}
              onDelete={onDeleteSubTask}
            />
          )}

          {/* 拆解中状态 */}
          {expanded && task.breakdownStatus === "loading" && (
            <div className="mt-4 p-4 glass-card rounded-xl flex items-center justify-center gap-3">
              <Loader2 className="w-5 h-5 text-accent-400 animate-spin" />
              <span className="text-sm text-dark-300">AI正在分析任务阻力...</span>
            </div>
          )}

          {/* 拆解失败状态 */}
          {expanded && task.breakdownStatus === "failed" && (
            <div className="mt-4 p-4 glass-card rounded-xl text-center">
              <p className="text-sm text-red-400 mb-2">拆解失败了</p>
              <button
                onClick={onBreakdown}
                className="text-xs px-3 py-1.5 rounded-lg bg-accent-500/20 text-accent-400 hover:bg-accent-500/30 transition-colors"
              >
                重新拆解
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 mt-3 flex-wrap">
            {task.status === "todo" && (
              <button
                onClick={onStart}
                className="text-xs px-3 py-1.5 rounded-lg bg-accent-500/20 text-accent-400 hover:bg-accent-500/30 transition-colors"
              >
                开始
              </button>
            )}
            {task.status !== "completed" && (
              <button
                onClick={onBreakdown}
                disabled={task.breakdownStatus === "loading"}
                className="text-xs px-3 py-1.5 rounded-lg bg-purple-500/20 text-purple-400 hover:bg-purple-500/30 transition-colors flex items-center gap-1 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {task.breakdownStatus === "done" ? (
                  <>
                    <Sparkles className="w-3 h-3" /> 重新拆解
                  </>
                ) : task.breakdownStatus === "loading" ? (
                  <>
                    <Loader2 className="w-3 h-3 animate-spin" /> 拆解中...
                  </>
                ) : (
                  <>
                    <Sparkles className="w-3 h-3" /> AI拆解
                  </>
                )}
              </button>
            )}
            {task.status !== "completed" && (
              <button
                onClick={onPostpone}
                className="text-xs px-3 py-1.5 rounded-lg bg-dark-800/50 text-dark-300 hover:text-orange-400 transition-colors"
              >
                推迟
              </button>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="text-xs px-3 py-1.5 rounded-lg bg-dark-800/50 text-dark-400 hover:text-white transition-colors flex items-center gap-1"
            >
              {expanded ? "收起" : "详情"}
              {expanded ? (
                <ChevronUp className="w-3 h-3" />
              ) : (
                <ChevronDown className="w-3 h-3" />
              )}
            </button>
            <div className="flex-1" />
            <button
              onClick={onEdit}
              className="text-xs p-1.5 rounded-lg text-dark-500 hover:text-accent-400 transition-colors"
              title="编辑"
            >
              <Pencil className="w-4 h-4" />
            </button>
            <button
              onClick={onDelete}
              className="text-xs p-1.5 rounded-lg text-dark-500 hover:text-red-400 transition-colors"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
