export interface RescueContext {
  taskTitle: string;
  microStep: string;
  source?: string;
  taskId?: string;
  subTaskId?: string;
}

export const DEFAULT_RESCUE_CONTEXT: RescueContext = {
  taskTitle: "论文写作",
  microStep: "打开 Word，输入论文标题",
  source: "rescue-page",
};

export function buildRescueLadder(taskTitle: string, microStep: string): string[] {
  const title = taskTitle.trim() || "当前任务";
  const step = microStep.trim() || `打开与${title}有关的文件`;

  return [
    step,
    `关闭其他窗口，只留下完成“${title}”需要的那一个页面`,
    `先做 120 秒：打开文件，写下任意一行内容`,
    `只做一个机械动作：新建文档并保存为“${title}草稿”`,
    `把任务名称复制到搜索框，只查一个关键词`,
  ];
}

export function readRescueContext(search: string): RescueContext {
  const params = new URLSearchParams(search);
  return {
    taskTitle: params.get("task")?.trim() || DEFAULT_RESCUE_CONTEXT.taskTitle,
    microStep: params.get("step")?.trim() || DEFAULT_RESCUE_CONTEXT.microStep,
    source: params.get("source")?.trim() || DEFAULT_RESCUE_CONTEXT.source,
    taskId: params.get("taskId")?.trim() || undefined,
    subTaskId: params.get("subTaskId")?.trim() || undefined,
  };
}

export function formatRemaining(seconds: number): string {
  const safeSeconds = Math.max(0, seconds);
  const minutes = Math.floor(safeSeconds / 60);
  const rest = safeSeconds % 60;
  return `${String(minutes).padStart(2, "0")}:${String(rest).padStart(2, "0")}`;
}

export function elapsedMinutes(startedAt: string | null): number {
  if (!startedAt) return 0;
  return Math.max(1, Math.round((Date.now() - new Date(startedAt).getTime()) / 60000));
}

export function buildShrunkAction(sourceTitle: string, sourceMicroStep: string) {
  const cleanTitle = sourceTitle.replace(/^(先做：|再缩小：)/, "");
  return {
    title: `再缩小：${cleanTitle}`,
    microStep: `只做 2 分钟：${sourceMicroStep}`,
  };
}
