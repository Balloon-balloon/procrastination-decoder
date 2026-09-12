export type CompanionState =
  | "idle"
  | "observing"
  | "prompted"
  | "focusing"
  | "rescued"
  | "completed";

export type CompanionEvent =
  | "observe"
  | "prompt"
  | "tap"
  | "long-press"
  | "shake"
  | "complete"
  | "reset";

export interface CompanionSnapshot {
  state: CompanionState;
  label: string;
  detail: string;
  accent: string;
}

export const COMPANION_GATT = {
  service: "7b1f0001-6a9b-4d5c-a7e1-3d9b8c5f0001",
  stateCharacteristic: "7b1f0002-6a9b-4d5c-a7e1-3d9b8c5f0001",
  commandCharacteristic: "7b1f0003-6a9b-4d5c-a7e1-3d9b8c5f0001",
  telemetryCharacteristic: "7b1f0004-6a9b-4d5c-a7e1-3d9b8c5f0001",
} as const;

export const COMPANION_STATE_META: Record<
  CompanionState,
  { label: string; detail: string; accent: string }
> = {
  idle: {
    label: "待机",
    detail: "等待专注任务或逃避信号",
    accent: "#8B93A8",
  },
  observing: {
    label: "观察中",
    detail: "检测停留时间，不立即打扰",
    accent: "#F5B942",
  },
  prompted: {
    label: "准备介入",
    detail: "已经生成一个低阻力动作",
    accent: "#FF6B35",
  },
  focusing: {
    label: "专注中",
    detail: "设备已开始计时，请只做当前一步",
    accent: "#4ECDC4",
  },
  rescued: {
    label: "正在救援",
    detail: "目标已经缩小，继续降低启动门槛",
    accent: "#A78BFA",
  },
  completed: {
    label: "已完成",
    detail: "本次微行动已写回任务数据",
    accent: "#34D399",
  },
};

export function transitionCompanion(
  state: CompanionState,
  event: CompanionEvent
): CompanionState {
  switch (event) {
    case "observe":
      return state === "idle" ? "observing" : state;
    case "prompt":
      return state === "observing" || state === "idle" ? "prompted" : state;
    case "tap":
      return state === "focusing" || state === "completed" ? "prompted" : "focusing";
    case "long-press":
      return state === "completed" ? "completed" : "rescued";
    case "shake":
      return state === "completed" ? "completed" : "prompted";
    case "complete":
      return "completed";
    case "reset":
      return "idle";
    default:
      return state;
  }
}

export function getCompanionSnapshot(state: CompanionState): CompanionSnapshot {
  return {
    state,
    ...COMPANION_STATE_META[state],
  };
}
