import { EstimatedTimeUnit, Task } from "./types";

export const ESTIMATED_TIME_UNIT_LABELS: Record<EstimatedTimeUnit, string> = {
  minute: "分钟",
  day: "天",
  week: "周",
};

export function getEstimatedUnit(task: Pick<Task, "estimatedUnit"> | { estimatedUnit?: EstimatedTimeUnit }): EstimatedTimeUnit {
  return task.estimatedUnit || "minute";
}

export function formatEstimatedTime(
  value: number,
  unit: EstimatedTimeUnit | undefined = "minute"
): string {
  const safeValue = Number.isFinite(value) ? value : 0;
  return `${safeValue} ${ESTIMATED_TIME_UNIT_LABELS[unit || "minute"]}`;
}

export function estimatedTimeToMinutes(
  value: number,
  unit: EstimatedTimeUnit | undefined = "minute"
): number {
  if (unit === "week") return value * 7 * 24 * 60;
  if (unit === "day") return value * 24 * 60;
  return value;
}
