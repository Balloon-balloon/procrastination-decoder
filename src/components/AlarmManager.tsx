"use client";
import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sun,
  Moon,
  Bell,
  BellOff,
  Clock,
  X,
  Coffee,
  Bed,
  ChevronRight,
} from "lucide-react";

type AlarmType = "wake" | "sleep";

interface AlarmSettings {
  wakeEnabled: boolean;
  wakeTime: string;
  wakeMessage: string;
  sleepEnabled: boolean;
  sleepTime: string;
  sleepEarlyMinutes: number;
}

const DEFAULT_SETTINGS: AlarmSettings = {
  wakeEnabled: false,
  wakeTime: "07:30",
  wakeMessage: "新的一天开始了，起床解码拖延！",
  sleepEnabled: false,
  sleepTime: "23:00",
  sleepEarlyMinutes: 15,
};

const EARLY_TASKS = [
  "喝一杯水 💧",
  "做5个深蹲 💪",
  "拉伸3分钟 🧘",
  "打开窗户深呼吸 🌿",
  "写下一今日小目标 ✏️",
  "听一首喜欢的歌 🎵",
];

export function AlarmManager() {
  const [settings, setSettings] = useState<AlarmSettings>(DEFAULT_SETTINGS);
  const [showSettings, setShowSettings] = useState(false);
  const [activeAlarm, setActiveAlarm] = useState<AlarmType | null>(null);
  const [earlyAlarm, setEarlyAlarm] = useState(false);
  const [locked, setLocked] = useState(false);
  const [showTaskLock, setShowTaskLock] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("pd-alarm-settings");
    if (saved) {
      setSettings({ ...DEFAULT_SETTINGS, ...JSON.parse(saved) });
    }
  }, []);

  useEffect(() => {
    localStorage.setItem("pd-alarm-settings", JSON.stringify(settings));
  }, [settings]);

  // 检查闹钟触发
  useEffect(() => {
    const check = () => {
      const now = new Date();
      const currentStr = `${String(now.getHours()).padStart(2, "0")}:${String(now.getMinutes()).padStart(2, "0")}`;
      const todayKey = `pd-alarm-triggered-${now.toDateString()}`;

      // 起床闹钟
      if (settings.wakeEnabled && currentStr === settings.wakeTime) {
        const triggered = JSON.parse(localStorage.getItem(todayKey) || "{}");
        if (!triggered.wake) {
          setActiveAlarm("wake");
          sendNotification("起床啦！☀️", settings.wakeMessage);
          triggered.wake = true;
          localStorage.setItem(todayKey, JSON.stringify(triggered));
        }
      }

      // 睡眠提前提醒
      if (settings.sleepEnabled) {
        const [h, m] = settings.sleepTime.split(":").map(Number);
        const sleepDate = new Date();
        sleepDate.setHours(h, m, 0, 0);
        const earlyTime = new Date(sleepDate.getTime() - settings.sleepEarlyMinutes * 60000);
        const earlyStr = `${String(earlyTime.getHours()).padStart(2, "0")}:${String(earlyTime.getMinutes()).padStart(2, "0")}`;

        if (currentStr === earlyStr) {
          const triggered = JSON.parse(localStorage.getItem(todayKey) || "{}");
          if (!triggered.sleepEarly) {
            setEarlyAlarm(true);
            sendNotification("准备睡觉啦 🌙", `还有${settings.sleepEarlyMinutes}分钟，今日未完成任务可一键延期`);
            triggered.sleepEarly = true;
            localStorage.setItem(todayKey, JSON.stringify(triggered));
          }
        }

        // 到点正式提醒
        if (currentStr === settings.sleepTime) {
          const triggered = JSON.parse(localStorage.getItem(todayKey) || "{}");
          if (!triggered.sleep) {
            setActiveAlarm("sleep");
            sendNotification("该睡觉了！🌙", "今日已结束，未完成任务已自动延期");
            triggered.sleep = true;
            localStorage.setItem(todayKey, JSON.stringify(triggered));
          }
        }
      }
    };

    check();
    const interval = setInterval(check, 30000);
    return () => clearInterval(interval);
  }, [settings]);

  const sendNotification = (title: string, body: string) => {
    if ("Notification" in window) {
      if (Notification.permission === "granted") {
        new Notification(title, { body, icon: "/favicon.ico" });
      } else if (Notification.permission !== "denied") {
        Notification.requestPermission().then((perm) => {
          if (perm === "granted") {
            new Notification(title, { body, icon: "/favicon.ico" });
          }
        });
      }
    }
  };

  const requestNotificationPermission = async () => {
    if ("Notification" in window && Notification.permission === "default") {
      await Notification.requestPermission();
    }
  };

  const handleDismissWake = () => {
    setActiveAlarm(null);
    // 推荐早起任务
    const task = EARLY_TASKS[Math.floor(Math.random() * EARLY_TASKS.length)];
    setEarlyAlarm(true);
    setTimeout(() => setEarlyAlarm(false), 5000);
  };

  const handleDismissSleep = () => {
    setActiveAlarm(null);
    setLocked(true);
    setShowTaskLock(true);
    // 自动切换夜间模式
    document.body.classList.add("dark-mode");
    setTimeout(() => setShowTaskLock(false), 4000);
  };

  const update = (key: keyof AlarmSettings, value: any) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
    if (key === "wakeEnabled" || key === "sleepEnabled") {
      if (value) requestNotificationPermission();
    }
  };

  return (
    <>
      {/* 悬浮设置按钮 */}
      <button
        onClick={() => setShowSettings(!showSettings)}
        className="fixed top-4 right-32 z-50 p-2 rounded-lg transition-all hover:scale-110"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--card-border)",
          boxShadow: "var(--card-shadow)",
          backdropFilter: "blur(8px)",
        }}
        title="起床/睡眠提醒"
      >
        <Clock className="w-4 h-4" style={{ color: "var(--color-ink)" }} />
      </button>

      {/* 设置面板 */}
      <AnimatePresence>
        {showSettings && (
          <motion.div
            initial={{ opacity: 0, x: 20, scale: 0.95 }}
            animate={{ opacity: 1, x: 0, scale: 1 }}
            exit={{ opacity: 0, x: 20, scale: 0.95 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="fixed top-12 right-32 z-50 w-72 p-5 rounded-2xl glass-card"
          >
            <h3 className="font-pixel text-[10px] mb-4" style={{ color: "var(--color-ink)" }}>
              ALARM
            </h3>

            {/* 起床提醒 */}
            <div className="mb-5">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Sun className="w-4 h-4" style={{ color: "var(--color-neon-orange)" }} />
                  <span className="font-hand text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                    起床提醒
                  </span>
                </div>
                <button
                  onClick={() => update("wakeEnabled", !settings.wakeEnabled)}
                  className="relative w-10 h-5 rounded-full transition-all"
                  style={{ background: settings.wakeEnabled ? "var(--color-neon-orange)" : "var(--divider)" }}
                >
                  <motion.div
                    layout
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white"
                    style={{ left: settings.wakeEnabled ? "22px" : "2px" }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
              {settings.wakeEnabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-2"
                >
                  <input
                    type="time"
                    value={settings.wakeTime}
                    onChange={(e) => update("wakeTime", e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg text-sm font-hand"
                    style={{ background: "rgba(255,252,240,0.8)", border: "1px solid var(--divider)", color: "var(--text-primary)" }}
                  />
                  <input
                    type="text"
                    value={settings.wakeMessage}
                    onChange={(e) => update("wakeMessage", e.target.value)}
                    placeholder="自定义文案"
                    className="w-full px-3 py-1.5 rounded-lg text-xs font-hand"
                    style={{ background: "rgba(255,252,240,0.8)", border: "1px solid var(--divider)", color: "var(--text-primary)" }}
                  />
                </motion.div>
              )}
            </div>

            {/* 睡眠提醒 */}
            <div className="mb-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4" style={{ color: "var(--color-ink-light)" }} />
                  <span className="font-hand text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                    睡眠提醒
                  </span>
                </div>
                <button
                  onClick={() => update("sleepEnabled", !settings.sleepEnabled)}
                  className="relative w-10 h-5 rounded-full transition-all"
                  style={{ background: settings.sleepEnabled ? "var(--color-ink)" : "var(--divider)" }}
                >
                  <motion.div
                    layout
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white"
                    style={{ left: settings.sleepEnabled ? "22px" : "2px" }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>
              {settings.sleepEnabled && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: "auto" }}
                  className="space-y-2"
                >
                  <input
                    type="time"
                    value={settings.sleepTime}
                    onChange={(e) => update("sleepTime", e.target.value)}
                    className="w-full px-3 py-1.5 rounded-lg text-sm font-hand"
                    style={{ background: "rgba(255,252,240,0.8)", border: "1px solid var(--divider)", color: "var(--text-primary)" }}
                  />
                  <div>
                    <span className="font-hand text-xs" style={{ color: "var(--text-muted)" }}>提前提醒（分钟）</span>
                    <input
                      type="number"
                      min="0"
                      max="60"
                      value={settings.sleepEarlyMinutes}
                      onChange={(e) => update("sleepEarlyMinutes", Number(e.target.value))}
                      className="w-full px-3 py-1.5 rounded-lg text-sm font-hand mt-1"
                      style={{ background: "rgba(255,252,240,0.8)", border: "1px solid var(--divider)", color: "var(--text-primary)" }}
                    />
                  </div>
                </motion.div>
              )}
            </div>

            <p className="text-[10px] font-hand text-center" style={{ color: "var(--text-muted)" }}>
              {Notification.permission === "granted" ? "✅ 浏览器通知已开启" : "💡 建议开启浏览器通知以获得更好体验"}
            </p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 全屏起床闹钟 */}
      <AnimatePresence>
        {activeAlarm === "wake" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center"
            style={{ background: "linear-gradient(180deg, #FF6B35 0%, #FAD6A5 100%)" }}
          >
            <motion.div
              animate={{ rotate: [0, -5, 5, -5, 0] }}
              transition={{ duration: 0.5, repeat: Infinity }}
              className="text-center"
            >
              <Sun className="w-24 h-24 mx-auto mb-6 text-white" />
              <h2 className="font-pixel text-2xl mb-4 text-white">WAKE UP!</h2>
              <p className="font-hand text-lg text-white mb-8">{settings.wakeMessage}</p>
              <button
                onClick={handleDismissWake}
                className="px-8 py-3 rounded-2xl text-white text-lg font-hand font-bold transition-transform hover:scale-105"
                style={{ background: "rgba(255,255,255,0.2)", border: "2px solid white" }}
              >
                <Coffee className="w-5 h-5 inline mr-2" /> 已起床
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 全屏睡眠提醒 */}
      <AnimatePresence>
        {activeAlarm === "sleep" && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[200] flex items-center justify-center"
            style={{ background: "linear-gradient(180deg, #0D1224 0%, #1A2440 50%, #2B3A67 100%)" }}
          >
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="text-center"
            >
              <Moon className="w-24 h-24 mx-auto mb-6" style={{ color: "#FAD6A5" }} />
              <h2 className="font-pixel text-xl mb-4" style={{ color: "#FAD6A5" }}>SLEEP TIME</h2>
              <p className="font-hand text-base mb-8" style={{ color: "rgba(255,255,255,0.7)" }}>
                今日已结束，该休息了 🌙<br />未完成任务已自动延期
              </p>
              <button
                onClick={handleDismissSleep}
                className="px-8 py-3 rounded-2xl text-sm font-hand font-bold transition-transform hover:scale-105"
                style={{ background: "rgba(250,214,165,0.2)", color: "#FAD6A5", border: "2px solid rgba(250,214,165,0.5)" }}
              >
                <Bed className="w-5 h-5 inline mr-2" /> 晚安
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 睡眠提前提醒 Toast */}
      <AnimatePresence>
        {earlyAlarm && !activeAlarm && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[150] px-6 py-3 rounded-2xl"
            style={{ background: "var(--color-ink)", color: "var(--color-apricot)", boxShadow: "0 4px 20px rgba(0,0,0,0.3)" }}
          >
            <div className="flex items-center gap-3 font-hand text-sm">
              <Moon className="w-4 h-4" style={{ color: "var(--color-apricot)" }} />
              <span>准备睡觉啦，今日未完成任务可一键延期</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* 任务锁定提示 */}
      <AnimatePresence>
        {showTaskLock && (
          <motion.div
            initial={{ opacity: 0, y: 50 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 50 }}
            className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-[150] px-6 py-3 rounded-2xl"
            style={{ background: "rgba(43,58,103,0.9)", color: "#FAD6A5" }}
          >
            <div className="flex items-center gap-3 font-hand text-sm">
              <span>🔒 任务编辑已锁定，防止熬夜加任务</span>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
