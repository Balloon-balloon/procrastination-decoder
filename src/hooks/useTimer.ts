"use client";
import { useState, useEffect, useRef, useCallback } from "react";

export interface TimerState {
  remainingSeconds: number;
  isRunning: boolean;
  isPaused: boolean;
  mode: "focus" | "break";
  cycleCount: number;
}

export interface TimerSettings {
  gracePeriod: number; // 熄屏宽容时间（秒）
  autoContinue: boolean; // 熄屏后自动继续
}

export function useTimer() {
  const [state, setState] = useState<TimerState>({
    remainingSeconds: 25 * 60,
    isRunning: false,
    isPaused: false,
    mode: "focus",
    cycleCount: 0,
  });

  const [settings, setSettings] = useState<TimerSettings>({
    gracePeriod: 60,
    autoContinue: false,
  });

  const workerRef = useRef<Worker | null>(null);
  const leaveTimestampRef = useRef<number | null>(null);
  const lastRemainingRef = useRef<number>(0);
  const [showReturnDialog, setShowReturnDialog] = useState(false);
  const [leaveDuration, setLeaveDuration] = useState(0);
  const [returnMessage, setReturnMessage] = useState("");

  // 初始化 Worker
  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      workerRef.current = new Worker("/timer.worker.js");
      workerRef.current.onmessage = (e) => {
        const { type, remainingSeconds, corrected, cycleCount, mode } = e.data;
        switch (type) {
          case "tick":
            setState((prev) => ({
              ...prev,
              remainingSeconds,
              isRunning: true,
            }));
            lastRemainingRef.current = remainingSeconds;
            if (corrected) {
              setReturnMessage("⏰ 计时已自动修正");
              setTimeout(() => setReturnMessage(""), 3000);
            }
            break;
          case "complete":
            setState((prev) => ({
              ...prev,
              remainingSeconds: 0,
              isRunning: false,
              cycleCount: cycleCount || prev.cycleCount + 1,
              mode: mode === "focus" ? "break" : "focus",
            }));
            break;
          case "paused":
            setState((prev) => ({ ...prev, isPaused: true, isRunning: false }));
            break;
          case "stopped":
            setState((prev) => ({
              ...prev,
              isRunning: false,
              isPaused: false,
              remainingSeconds: 25 * 60,
            }));
            break;
        }
      };
    } catch (err) {
      console.error("Worker init failed, falling back to setInterval:", err);
    }

    // 加载设置
    const savedSettings = localStorage.getItem("pd-timer-settings");
    if (savedSettings) {
      setSettings(JSON.parse(savedSettings));
    }

    return () => {
      workerRef.current?.terminate();
    };
  }, []);

  // 保存设置
  useEffect(() => {
    localStorage.setItem("pd-timer-settings", JSON.stringify(settings));
  }, [settings]);

  // Page Visibility API
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        // 页面切到后台
        leaveTimestampRef.current = Date.now();
        // 存储 startTimestamp 到 localStorage 作为兜底
        localStorage.setItem("pd-timer-leave", String(Date.now()));
        localStorage.setItem("pd-timer-remaining", String(lastRemainingRef.current));
      } else {
        // 页面重新激活
        if (leaveTimestampRef.current && state.isRunning) {
          const leaveTime = Date.now() - leaveTimestampRef.current;
          const leaveSeconds = Math.floor(leaveTime / 1000);

          // 通知 Worker 同步（时间戳差值法）
          workerRef.current?.postMessage({ type: "sync" });

          if (leaveSeconds > settings.gracePeriod) {
            if (settings.autoContinue) {
              // 自动继续
              setReturnMessage("欢迎回来，继续加油 💪");
              setTimeout(() => setReturnMessage(""), 3000);
            } else {
              // 弹窗让用户选择
              setLeaveDuration(leaveSeconds);
              setShowReturnDialog(true);
            }
          } else {
            setReturnMessage("欢迎回来，继续加油 💪");
            setTimeout(() => setReturnMessage(""), 3000);
          }
        }
        leaveTimestampRef.current = null;
        localStorage.removeItem("pd-timer-leave");
      }
    };

    document.addEventListener("visibilitychange", handleVisibilityChange);
    return () => document.removeEventListener("visibilitychange", handleVisibilityChange);
  }, [state.isRunning, settings]);

  const start = useCallback(
    (seconds?: number, mode: "focus" | "break" = "focus") => {
      const dur = seconds || mode === "focus" ? 25 * 60 : 5 * 60;
      setState((prev) => ({
        ...prev,
        isRunning: true,
        isPaused: false,
        mode,
        remainingSeconds: seconds || 25 * 60,
      }));
      workerRef.current?.postMessage({
        type: "start",
        payload: { seconds: seconds || 25 * 60, mode },
      });
      localStorage.setItem("pd-timer-start", String(Date.now()));
    },
    []
  );

  const pause = useCallback(() => {
    workerRef.current?.postMessage({ type: "pause" });
  }, []);

  const resume = useCallback(() => {
    workerRef.current?.postMessage({ type: "resume" });
    setState((prev) => ({ ...prev, isPaused: false, isRunning: true }));
  }, []);

  const stop = useCallback(() => {
    workerRef.current?.postMessage({ type: "stop" });
    localStorage.removeItem("pd-timer-start");
    localStorage.removeItem("pd-timer-leave");
    localStorage.removeItem("pd-timer-remaining");
  }, []);

  const continueAfterLeave = useCallback(() => {
    setShowReturnDialog(false);
    setReturnMessage("欢迎回来，继续加油 💪");
    setTimeout(() => setReturnMessage(""), 3000);
    workerRef.current?.postMessage({ type: "resume" });
  }, []);

  const abandonAfterLeave = useCallback(() => {
    setShowReturnDialog(false);
    stop();
    setReturnMessage("没关系，休息一下再开始");
    setTimeout(() => setReturnMessage(""), 3000);
  }, [stop]);

  return {
    state,
    settings,
    setSettings,
    start,
    pause,
    resume,
    stop,
    showReturnDialog,
    leaveDuration,
    returnMessage,
    continueAfterLeave,
    abandonAfterLeave,
  };
}
