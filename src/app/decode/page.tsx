"use client";
import Link from "next/link";
import { useAppData } from "@/hooks/useAppData";
import { PageTransition, StaggerContainer, FadeInItem } from "@/components/Animations";
import { PenLoader } from "@/components/PenLoader";
import { useToast } from "@/components/Toast";
import { TaskBreakdownResult } from "@/components/TaskBreakdownResult";
import {
  createTask,
  setTaskBreakdownStatus,
  addSubTasks,
  getSubTasksByTask,
  completeSubTask,
  startSubTask,
  deleteSubTask,
} from "@/lib/store";
import { motion } from "framer-motion";
import {
  Sparkles,
  ChevronRight,
  Zap,
  Target,
  Lightbulb,
  ArrowRight,
  Upload,
  X,
  FileText,
  Image as ImageIcon,
  Loader2,
  ListTodo,
  Search,
} from "lucide-react";
import { useState, useRef } from "react";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { playClickSound, playErrorSound } from "@/lib/sound";
import { IS_STATIC_DEPLOYMENT } from "@/lib/deployment";

const STICKY_COLORS = [
  { bg: "var(--sticky-yellow)", rotate: "-1.5deg" },
  { bg: "var(--sticky-pink)", rotate: "1deg" },
  { bg: "var(--sticky-blue)", rotate: "-0.5deg" },
  { bg: "var(--sticky-green)", rotate: "1.5deg" },
  { bg: "var(--sticky-orange)", rotate: "-0.8deg" },
];

export default function DecodePage() {
  const { data, update, loaded } = useAppData();
  const { showToast } = useToast();
  const [inputText, setInputText] = useState("");
  const [uploadedFiles, setUploadedFiles] = useState<{ name: string; type: string; size: number; content?: string }[]>([]);
  const [decoding, setDecoding] = useState(false);
  const [activeTab, setActiveTab] = useState<"new" | "existing">("new");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (IS_STATIC_DEPLOYMENT) router.replace("/");
  }, [router]);

  if (!loaded || IS_STATIC_DEPLOYMENT) {
    return <PenLoader text="loading" />;
  }

  const pendingTasks = data.tasks.filter((t) => t.status !== "completed");
  const breakdownTasks = data.tasks.filter((t) => t.breakdownStatus === "done");

  const filteredTasks = pendingTasks
    .filter((t) => t.breakdownStatus !== "done")
    .filter((t) => !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase()));

  const selectedTask = data.tasks.find((t) => t.id === selectedTaskId);
  const selectedSubTasks = selectedTaskId ? getSubTasksByTask(data, selectedTaskId) : [];

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    const newFiles = await Promise.all(
      Array.from(files).map(async (f) => {
        const fileObj: { name: string; type: string; size: number; content?: string } = {
          name: f.name,
          type: f.type,
          size: f.size,
        };
        if (f.type.startsWith("text/") || f.name.match(/\.(txt|md|markdown)$/i)) {
          const text = await f.text();
          fileObj.content = text.slice(0, 5000);
        }
        return fileObj;
      })
    );
    setUploadedFiles((prev) => [...prev, ...newFiles]);
    e.target.value = "";
  };

  const runBreakdown = async (taskId: string, taskTitle: string, taskDescription: string, attachments?: { name: string; type: string; content?: string }[]) => {
    setDecoding(true);
    update((prev) => setTaskBreakdownStatus(prev, taskId, "loading"));
    try {
      const personality = data.profile.personalityResult;
      const fileSummary = attachments
        ?.filter((a) => a.content)
        .map((a) => `【${a.name}】${a.content}`)
        .join("\n") || undefined;

      const res = await fetch("/api/breakdown", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          taskTitle,
          taskDescription,
          personalityType: personality?.type,
          personalityName: personality?.typeName,
          fileSummary,
        }),
      });
      const result = await res.json();
      if (result.subTasks) {
        update((prev) => {
          let newData = addSubTasks(prev, taskId, result.subTasks);
          newData = setTaskBreakdownStatus(newData, taskId, "done", result.overallStrategy, {
            taskUnderstanding: result.taskUnderstanding,
            painPointResponse: result.painPointResponse,
            executionPlan: result.executionPlan,
          });
          return newData;
        });
        showToast("AI 拆解完成！", "success");
      } else {
        update((prev) => setTaskBreakdownStatus(prev, taskId, "failed"));
        showToast("拆解失败，请重试", "warning");
        playErrorSound();
      }
    } catch (e) {
      console.error("Breakdown error:", e);
      update((prev) => setTaskBreakdownStatus(prev, taskId, "failed"));
      showToast("网络错误，请稍后重试", "warning");
      playErrorSound();
    } finally {
      setDecoding(false);
    }
  };

  const handleNewTaskDecode = async () => {
    if (!inputText.trim()) {
      showToast("请输入任务描述", "warning");
      return;
    }
    playClickSound();

    // 创建任务并获取生成的 id
    let createdTaskId: string | null = null;
    update((prev) => {
      const newData = createTask(prev, {
        title: inputText.slice(0, 50),
        description: inputText,
        status: "todo",
        priority: "auto",
        category: "学习",
        estimatedTime: 30,
        estimatedUnit: "minute",
        tags: [],
        attachments: uploadedFiles.length > 0 ? uploadedFiles.map((f) => ({ name: f.name, type: f.type, content: f.content })) : undefined,
      });
      createdTaskId = newData.tasks[newData.tasks.length - 1].id;
      return newData;
    });

    const taskTitle = inputText.slice(0, 50);
    const files = [...uploadedFiles];
    setInputText("");
    setUploadedFiles([]);

    if (createdTaskId) {
      setSelectedTaskId(createdTaskId);
      await runBreakdown(createdTaskId, taskTitle, inputText, files);
    }
  };

  const handleExistingTaskDecode = async () => {
    if (!selectedTaskId || !selectedTask) return;
    playClickSound();
    await runBreakdown(selectedTaskId, selectedTask.title, selectedTask.description, selectedTask.attachments);
  };

  return (
    <PageTransition>
      <div className="space-y-6 max-w-3xl mx-auto">
        {/* 标题 */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-2"
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "var(--color-neon-orange)" }}
            >
              <Sparkles className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="font-sketch text-3xl font-bold" style={{ color: "var(--color-ink)" }}>
                灵感拆解
              </h1>
              <p className="font-handwritten text-sm" style={{ color: "var(--text-muted)" }}>
                把"我不想做"变成"我已经做了一半" ✨
              </p>
            </div>
          </motion.div>
        </div>

        {/* Tab 切换 */}
        <div className="flex rounded-xl p-1" style={{ background: "rgba(43,58,103,0.06)" }}>
          <button
            onClick={() => setActiveTab("new")}
            className="flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1.5"
            style={activeTab === "new" ? { background: "var(--color-neon-orange)", color: "#fff" } : { color: "var(--text-muted)" }}
          >
            <Zap className="w-4 h-4" /> 新任务拆解
          </button>
          <button
            onClick={() => setActiveTab("existing")}
            className="flex-1 py-2 rounded-lg text-sm font-bold transition-all flex items-center justify-center gap-1.5"
            style={activeTab === "existing" ? { background: "var(--color-neon-orange)", color: "#fff" } : { color: "var(--text-muted)" }}
          >
            <ListTodo className="w-4 h-4" /> 选择已有任务
          </button>
        </div>

        {/* 新任务拆解 */}
        {activeTab === "new" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="sticky-note p-6"
            style={{ background: STICKY_COLORS[4].bg, transform: `rotate(${STICKY_COLORS[4].rotate})` }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Zap className="w-4 h-4" style={{ color: "var(--color-neon-orange)" }} />
              <span className="font-pixel text-[10px]" style={{ color: "var(--color-neon-orange)" }}>
                QUICK DECODE
              </span>
            </div>
            <p className="text-sm font-bold mb-3" style={{ color: "var(--color-ink)" }}>
              告诉我你想做什么，AI 帮你拆成可执行的小步骤
            </p>
            <textarea
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
              placeholder="比如：写一篇关于拖延症的论文，需要查阅文献、列大纲、写初稿..."
              rows={4}
              className="w-full px-4 py-3 rounded-xl text-sm resize-none mb-3"
              style={{
                background: "rgba(255,252,240,0.8)",
                border: "2px solid var(--divider)",
                color: "var(--text-primary)",
              }}
            />

            {/* 文件上传区 */}
            <div className="mb-4">
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,.pdf,.txt,.doc,.docx,.md"
                className="hidden"
                onChange={handleFileUpload}
              />
              {!uploadedFiles.length ? (
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-3 rounded-xl border-2 border-dashed transition-all hover:opacity-70"
                  style={{ borderColor: "var(--divider)", background: "rgba(255,252,240,0.5)" }}
                >
                  <Upload className="w-5 h-5 mx-auto mb-1" style={{ color: "var(--text-muted)" }} />
                  <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                    点击上传文件或图片，AI 会读取内容辅助拆解
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: "var(--text-muted)", opacity: 0.6 }}>
                    支持 PDF、Word、TXT、图片等
                  </p>
                </button>
              ) : (
                <div className="space-y-1">
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-bold" style={{ color: "var(--color-ink)" }}>
                      已上传 {uploadedFiles.length} 个文件
                    </span>
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="text-xs flex items-center gap-1"
                      style={{ color: "var(--color-neon-orange)" }}
                    >
                      <Upload className="w-3 h-3" /> 添加更多
                    </button>
                  </div>
                  {uploadedFiles.map((file, i) => (
                    <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs" style={{ background: "rgba(43,58,103,0.06)" }}>
                      {file.type.startsWith("image/") ? (
                        <ImageIcon className="w-4 h-4 flex-shrink-0" style={{ color: "var(--color-neon-orange)" }} />
                      ) : (
                        <FileText className="w-4 h-4 flex-shrink-0" style={{ color: "var(--color-neon-blue)" }} />
                      )}
                      <span className="flex-1 truncate" style={{ color: "var(--text-primary)" }}>{file.name}</span>
                      <span className="text-[10px] flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                        {(file.size / 1024).toFixed(0)}KB
                      </span>
                      <button
                        onClick={() => setUploadedFiles(prev => prev.filter((_, idx) => idx !== i))}
                        className="p-1 rounded flex-shrink-0"
                      >
                        <X className="w-3 h-3" style={{ color: "var(--text-muted)" }} />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <button
              onClick={handleNewTaskDecode}
              disabled={decoding || !inputText.trim()}
              className="btn-neon w-full flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {decoding ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  AI 正在拆解...
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  开始拆解
                </>
              )}
            </button>
          </motion.div>
        )}

        {/* 选择已有任务 */}
        {activeTab === "existing" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="space-y-3"
          >
            {/* 搜索框 */}
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-subtle)" }} />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="搜索任务..."
                className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm focus:outline-none"
                style={{ background: "rgba(255,252,240,0.8)", border: "2px solid var(--divider)", color: "var(--text-primary)" }}
              />
            </div>

            {/* 任务列表 */}
            {filteredTasks.length > 0 ? (
              <StaggerContainer className="space-y-2">
                {filteredTasks.map((task, i) => (
                  <FadeInItem key={task.id}>
                    <button
                      onClick={() => setSelectedTaskId(task.id === selectedTaskId ? null : task.id)}
                      className="w-full text-left"
                    >
                      <div
                        className="sticky-note p-4 cursor-pointer"
                        style={{
                          background: selectedTaskId === task.id ? "var(--color-apricot)" : STICKY_COLORS[i % STICKY_COLORS.length].bg,
                          transform: `rotate(${selectedTaskId === task.id ? "0deg" : STICKY_COLORS[i % STICKY_COLORS.length].rotate})`,
                          border: selectedTaskId === task.id ? "2px solid var(--color-neon-orange)" : "none",
                        }}
                      >
                        <div className="flex items-center gap-3">
                          <div
                            className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                            style={{ background: "rgba(43,58,103,0.08)" }}
                          >
                            <ListTodo className="w-5 h-5" style={{ color: "var(--color-ink)" }} />
                          </div>
                          <div className="flex-1 min-w-0">
                            <h3 className="text-sm font-bold truncate" style={{ color: "var(--color-ink)" }}>
                              {task.title}
                            </h3>
                            <p className="text-xs mt-0.5 truncate" style={{ color: "var(--text-muted)" }}>
                              {task.description || "无描述"}
                            </p>
                          </div>
                          {task.attachments && task.attachments.length > 0 && (
                            <div className="flex items-center gap-1 text-[10px] flex-shrink-0" style={{ color: "var(--text-muted)" }}>
                              <FileText className="w-3 h-3" />
                              {task.attachments.length}
                            </div>
                          )}
                        </div>
                      </div>
                    </button>
                  </FadeInItem>
                ))}
              </StaggerContainer>
            ) : (
              <div className="sticky-note p-6 text-center" style={{ background: STICKY_COLORS[0].bg }}>
                <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                  {pendingTasks.length === 0 ? "暂无待办任务" : "未找到匹配的任务"}
                </p>
              </div>
            )}

            {/* 选中任务后显示拆解按钮 */}
            {selectedTask && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="sticky-note p-4"
                style={{ background: STICKY_COLORS[3].bg, transform: "rotate(-0.5deg)" }}
              >
                <div className="flex items-center gap-2 mb-3">
                  <Target className="w-4 h-4" style={{ color: "var(--color-neon-green)" }} />
                  <span className="text-sm font-bold" style={{ color: "var(--color-ink)" }}>
                    已选中：{selectedTask.title}
                  </span>
                </div>
                {selectedTask.attachments && selectedTask.attachments.length > 0 && (
                  <div className="mb-3 space-y-1">
                    {selectedTask.attachments.map((file, i) => (
                      <div key={i} className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs" style={{ background: "rgba(43,58,103,0.06)" }}>
                        <FileText className="w-3.5 h-3.5 flex-shrink-0" style={{ color: "var(--text-muted)" }} />
                        <span className="flex-1 truncate" style={{ color: "var(--text-primary)" }}>{file.name}</span>
                      </div>
                    ))}
                  </div>
                )}
                <button
                  onClick={handleExistingTaskDecode}
                  disabled={decoding}
                  className="btn-neon w-full flex items-center justify-center gap-2 text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {decoding ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      AI 正在拆解...
                    </>
                  ) : (
                    <>
                      <Sparkles className="w-4 h-4" />
                      开始拆解
                    </>
                  )}
                </button>
              </motion.div>
            )}

            {/* 拆解结果 */}
            {selectedTask && (selectedTask.breakdownStatus === "done" || selectedTask.breakdownStatus === "loading" || selectedTask.breakdownStatus === "failed") && (
              <div className="rounded-xl p-4" style={{ background: "var(--bg-card)", border: "1px solid var(--card-border)" }}>
                {selectedTask.breakdownStatus === "loading" && (
                  <div className="flex items-center justify-center gap-2 py-8">
                    <Loader2 className="w-5 h-5 animate-spin" style={{ color: "var(--color-neon-orange)" }} />
                    <span className="text-sm" style={{ color: "var(--text-muted)" }}>AI 正在分析并拆解任务...</span>
                  </div>
                )}
                {selectedTask.breakdownStatus === "done" && (
                  <TaskBreakdownResult
                    subTasks={selectedSubTasks}
                    overallStrategy={selectedTask.overallStrategy}
                    taskUnderstanding={selectedTask.taskUnderstanding}
                    painPointResponse={selectedTask.painPointResponse}
                    executionPlan={selectedTask.executionPlan}
                    taskTitle={selectedTask.title}
                    onComplete={(subTaskId) => update((prev) => completeSubTask(prev, subTaskId))}
                    onStart={(subTaskId) => update((prev) => startSubTask(prev, subTaskId))}
                    onDelete={(subTaskId) => update((prev) => deleteSubTask(prev, subTaskId))}
                  />
                )}
                {selectedTask.breakdownStatus === "failed" && (
                  <div className="text-center py-6">
                    <p className="text-sm mb-3" style={{ color: "var(--text-muted)" }}>拆解失败，请重试</p>
                    <button
                      onClick={handleExistingTaskDecode}
                      className="btn-neon px-6 py-2 text-sm"
                    >
                      重新拆解
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        )}

        {/* 新任务拆解结果 */}
        {activeTab === "new" && selectedTaskId && selectedTask && selectedTask.breakdownStatus === "done" && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-xl p-4"
            style={{ background: "var(--bg-card)", border: "1px solid var(--card-border)" }}
          >
            <div className="flex items-center gap-2 mb-3">
              <Lightbulb className="w-4 h-4" style={{ color: "var(--color-neon-orange)" }} />
              <span className="text-sm font-bold" style={{ color: "var(--color-ink)" }}>
                拆解结果
              </span>
            </div>
            <TaskBreakdownResult
              subTasks={selectedSubTasks.length > 0 ? selectedSubTasks : getSubTasksByTask(data, selectedTaskId)}
              overallStrategy={selectedTask.overallStrategy}
              taskUnderstanding={selectedTask.taskUnderstanding}
              painPointResponse={selectedTask.painPointResponse}
              executionPlan={selectedTask.executionPlan}
              taskTitle={selectedTask.title}
              onComplete={(subTaskId) => update((prev) => completeSubTask(prev, subTaskId))}
              onStart={(subTaskId) => update((prev) => startSubTask(prev, subTaskId))}
              onDelete={(subTaskId) => update((prev) => deleteSubTask(prev, subTaskId))}
            />
          </motion.div>
        )}

        {/* 已拆解的任务 */}
        {breakdownTasks.length > 0 && (
          <div>
            <h2 className="text-sm font-bold mb-3 flex items-center gap-2" style={{ color: "var(--color-ink)" }}>
              <Target className="w-4 h-4" style={{ color: "var(--color-neon-green)" }} />
              已拆解的任务
            </h2>
            <StaggerContainer className="space-y-3">
              {breakdownTasks.map((task, i) => (
                <FadeInItem key={task.id}>
                  <Link href={`/tasks?focus=${task.id}`}>
                    <div
                      className="sticky-note p-4 cursor-pointer"
                      style={{
                        background: STICKY_COLORS[i % STICKY_COLORS.length].bg,
                        transform: `rotate(${STICKY_COLORS[i % STICKY_COLORS.length].rotate})`,
                      }}
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                          style={{ background: "rgba(43,58,103,0.08)" }}
                        >
                          <Lightbulb className="w-5 h-5" style={{ color: "var(--color-ink)" }} />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-sm font-bold truncate" style={{ color: "var(--color-ink)" }}>
                            {task.title}
                          </h3>
                          <p className="text-xs mt-0.5" style={{ color: "var(--text-muted)" }}>
                            {data.subTasks.filter((st) => st.taskId === task.id).length} 个步骤
                          </p>
                        </div>
                        <ChevronRight className="w-5 h-5 flex-shrink-0" style={{ color: "var(--color-ink)" }} />
                      </div>
                    </div>
                  </Link>
                </FadeInItem>
              ))}
            </StaggerContainer>
          </div>
        )}
      </div>
    </PageTransition>
  );
}
