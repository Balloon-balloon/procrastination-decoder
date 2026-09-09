import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatTime(seconds: number): string {
  const mins = Math.floor(seconds / 60);
  const secs = seconds % 60;
  return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
}

export function formatDate(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("zh-CN", {
    month: "short",
    day: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatDateShort(date: string | Date): string {
  const d = typeof date === "string" ? new Date(date) : date;
  return d.toLocaleDateString("zh-CN", { month: "short", day: "numeric" });
}

export function getDaysBetween(start: string | Date, end: string | Date): number {
  const s = typeof start === "string" ? new Date(start) : start;
  const e = typeof end === "string" ? new Date(end) : end;
  return Math.floor((e.getTime() - s.getTime()) / (1000 * 60 * 60 * 24));
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

export function getTodayKey(): string {
  return new Date().toISOString().split("T")[0];
}

export function isSameDay(date1: string | Date, date2: string | Date): boolean {
  const d1 = typeof date1 === "string" ? new Date(date1) : date1;
  const d2 = typeof date2 === "string" ? new Date(date2) : date2;
  return (
    d1.getFullYear() === d2.getFullYear() &&
    d1.getMonth() === d2.getMonth() &&
    d1.getDate() === d2.getDate()
  );
}

export function getWeekDates(): Date[] {
  const dates: Date[] = [];
  const today = new Date();
  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(d.getDate() - i);
    dates.push(d);
  }
  return dates;
}

export function clamp(value: number, min: number, max: number): number {
  return Math.min(Math.max(value, min), max);
}

// 根据截止日期自动计算紧急程度
export function calculateAutoPriority(dueDate: string | null | undefined): "low" | "medium" | "high" | "urgent" {
  if (!dueDate) return "medium";

  const due = new Date(dueDate);
  const now = new Date();
  const diffMs = due.getTime() - now.getTime();
  const diffDays = diffMs / (1000 * 60 * 60 * 24);

  if (diffDays <= 0) return "urgent";      // 已过期或今天截止
  if (diffDays <= 1) return "urgent";      // 1天内
  if (diffDays <= 3) return "high";        // 3天内
  if (diffDays <= 7) return "medium";      // 7天内
  return "low";                            // 7天以上
}

// 获取实际优先级（如果是 auto 则自动计算）
export function getEffectivePriority(
  priority: string,
  dueDate: string | null | undefined
): "low" | "medium" | "high" | "urgent" {
  if (priority === "auto") {
    return calculateAutoPriority(dueDate);
  }
  return priority as "low" | "medium" | "high" | "urgent";
}
