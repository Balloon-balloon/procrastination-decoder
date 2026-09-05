"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Settings, Volume2, VolumeX, Bell, BellOff, Moon, Clock } from "lucide-react";
import { isMuted, setMuted } from "@/lib/sound";

export function SettingsPanel() {
  const [show, setShow] = useState(false);
  const [soundEnabled, setSoundEnabled] = useState(!isMuted());
  const [notifications, setNotifications] = useState(true);
  const [gracePeriod, setGracePeriod] = useState(60);
  const [autoContinue, setAutoContinue] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("pd-timer-settings");
    if (saved) {
      const s = JSON.parse(saved);
      setGracePeriod(s.gracePeriod || 60);
      setAutoContinue(s.autoContinue || false);
    }
  }, []);

  const updateTimerSettings = (key: string, value: any) => {
    const saved = localStorage.getItem("pd-timer-settings");
    const current = saved ? JSON.parse(saved) : { gracePeriod: 60, autoContinue: false };
    current[key] = value;
    localStorage.setItem("pd-timer-settings", JSON.stringify(current));
    if (key === "gracePeriod") setGracePeriod(value);
    if (key === "autoContinue") setAutoContinue(value);
  };

  const handleSoundToggle = () => {
    const newMuted = soundEnabled;
    setMuted(newMuted);
    setSoundEnabled(!newMuted);
  };

  return (
    <>
      {/* 悬浮设置按钮 */}
      <button
        onClick={() => setShow(!show)}
        className="fixed top-4 right-16 z-50 p-2 rounded-lg transition-all hover:scale-110"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--card-border)",
          boxShadow: "var(--card-shadow)",
          backdropFilter: "blur(8px)",
        }}
        title="设置"
      >
        <Settings className="w-4 h-4" style={{ color: "var(--color-ink)" }} />
      </button>

      <AnimatePresence>
        {show && (
          <>
            {/* 遮罩 */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShow(false)}
              className="fixed inset-0 z-40"
              style={{ background: "rgba(0,0,0,0.1)" }}
            />
            {/* 面板 */}
            <motion.div
              initial={{ opacity: 0, x: 20, scale: 0.95 }}
              animate={{ opacity: 1, x: 0, scale: 1 }}
              exit={{ opacity: 0, x: 20, scale: 0.95 }}
              transition={{ type: "spring", stiffness: 400, damping: 25 }}
              className="fixed top-12 right-16 z-50 w-64 p-5 rounded-2xl glass-card"
            >
              <h3 className="font-pixel text-[10px] mb-4" style={{ color: "var(--color-ink)" }}>
                SETTINGS
              </h3>

              {/* 音效开关 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {soundEnabled ? (
                    <Volume2 className="w-4 h-4" style={{ color: "var(--color-ink)" }} />
                  ) : (
                    <VolumeX className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                  )}
                  <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                    点击音效
                  </span>
                </div>
                <button
                  onClick={handleSoundToggle}
                  className="relative w-10 h-5 rounded-full transition-all"
                  style={{
                    background: soundEnabled ? "var(--color-neon-green)" : "var(--divider)",
                  }}
                >
                  <motion.div
                    layout
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
                    style={{ left: soundEnabled ? "22px" : "2px" }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              {/* 通知开关 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  {notifications ? (
                    <Bell className="w-4 h-4" style={{ color: "var(--color-ink)" }} />
                  ) : (
                    <BellOff className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                  )}
                  <span className="text-sm font-bold" style={{ color: "var(--text-primary)" }}>
                    拖延提醒
                  </span>
                </div>
                <button
                  onClick={() => setNotifications(!notifications)}
                  className="relative w-10 h-5 rounded-full transition-all"
                  style={{
                    background: notifications ? "var(--color-neon-green)" : "var(--divider)",
                  }}
                >
                  <motion.div
                    layout
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
                    style={{ left: notifications ? "22px" : "2px" }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              {/* 分割线 */}
              <div style={{ borderTop: "1px solid var(--divider)" }} className="my-3" />

              {/* 熄屏宽容时间 */}
              <div className="mb-4">
                <div className="flex items-center gap-2 mb-2">
                  <Clock className="w-4 h-4" style={{ color: "var(--color-ink)" }} />
                  <span className="text-sm font-bold font-hand" style={{ color: "var(--text-primary)" }}>
                    熄屏宽容时间
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="range"
                    min="10"
                    max="300"
                    step="10"
                    value={gracePeriod}
                    onChange={(e) => updateTimerSettings("gracePeriod", Number(e.target.value))}
                    className="flex-1 h-2 rounded-full appearance-none cursor-pointer"
                    style={{
                      background: `linear-gradient(to right, var(--color-neon-orange) ${(gracePeriod - 10) / 290 * 100}%, var(--divider) ${(gracePeriod - 10) / 290 * 100}%)`,
                    }}
                  />
                  <span className="text-xs font-bold font-hand w-12 text-right" style={{ color: "var(--color-ink)" }}>
                    {gracePeriod}秒
                  </span>
                </div>
              </div>

              {/* 熄屏自动继续 */}
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Moon className="w-4 h-4" style={{ color: "var(--color-ink)" }} />
                  <span className="text-sm font-bold font-hand" style={{ color: "var(--text-primary)" }}>
                    熄屏后自动继续
                  </span>
                </div>
                <button
                  onClick={() => updateTimerSettings("autoContinue", !autoContinue)}
                  className="relative w-10 h-5 rounded-full transition-all"
                  style={{ background: autoContinue ? "var(--color-neon-green)" : "var(--divider)" }}
                >
                  <motion.div
                    layout
                    className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
                    style={{ left: autoContinue ? "22px" : "2px" }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                </button>
              </div>

              {/* 分割线 */}
              <div style={{ borderTop: "1px solid var(--divider)" }} className="my-3" />

              {/* 提示 */}
              <p className="text-[10px] text-center font-hand" style={{ color: "var(--text-muted)" }}>
                💡 音乐控制请在左下角面板
              </p>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
