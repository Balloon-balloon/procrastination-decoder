"use client";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/Animations";
import { useToast } from "@/components/Toast";
import { useAppData } from "@/hooks/useAppData";
import { isMuted, setMuted } from "@/lib/sound";
import {
  Palette, Volume2, Timer, Bell, User, HelpCircle,
  Camera, Sun, Moon, ChevronRight, Trash2, LogOut, Edit3,
  Send, Info, BookOpen,
} from "lucide-react";
import { useRouter } from "next/navigation";
import { logoutUser } from "@/lib/auth";
import Link from "next/link";

const THEMMES = [
  { name: "暖杏", color: "#FAD6A5", ink: "#2B3A67" },
  { name: "墨蓝", color: "#2B3A67", ink: "#FAD6A5" },
  { name: "薄荷", color: "#4ECDC4", ink: "#2B3A67" },
  { name: "樱花粉", color: "#FFB7C5", ink: "#2B3A67" },
  { name: "薰衣草", color: "#B19CD9", ink: "#2B3A67" },
  { name: "日落橙", color: "#FF6B35", ink: "#FDF6E3" },
  { name: "深海蓝", color: "#0D6E8E", ink: "#FDF6E3" },
  { name: "森林绿", color: "#2D5F3F", ink: "#FDF6E3" },
  { name: "暗夜黑", color: "#1A1A2E", ink: "#FAD6A5" },
  { name: "极简白", color: "#FFFFFF", ink: "#2B3A67" },
];

const FONT_SIZES = [
  { label: "小", value: "13px" },
  { label: "中", value: "15px" },
  { label: "大", value: "17px" },
  { label: "特大", value: "20px" },
];

export default function SettingsPage() {
  const { showToast } = useToast();
  const { data, update, loaded } = useAppData();
  const router = useRouter();

  const [theme, setTheme] = useState(0);
  const [fontSize, setFontSize] = useState("15px");
  const [darkMode, setDarkMode] = useState(false);
  const [soundOn, setSoundOn] = useState(!isMuted());
  const [gracePeriod, setGracePeriod] = useState(60);
  const [autoContinue, setAutoContinue] = useState(false);
  const [focusDuration, setFocusDuration] = useState(25);
  const [breakDuration, setBreakDuration] = useState(5);
  const [wakeEnabled, setWakeEnabled] = useState(false);
  const [wakeTime, setWakeTime] = useState("07:30");
  const [sleepEnabled, setSleepEnabled] = useState(false);
  const [sleepTime, setSleepTime] = useState("23:00");
  const [alarmSettingsLoaded, setAlarmSettingsLoaded] = useState(false);
  const [showEditPassword, setShowEditPassword] = useState(false);
  const [showFeedback, setShowFeedback] = useState(false);

  useEffect(() => {
    const saved = localStorage.getItem("pd-timer-settings");
    if (saved) {
      const s = JSON.parse(saved);
      setGracePeriod(s.gracePeriod || 60);
      setAutoContinue(s.autoContinue || false);
    }
    const savedTheme = localStorage.getItem("pd-theme");
    if (savedTheme) setTheme(parseInt(savedTheme));
    const savedFont = localStorage.getItem("pd-font-size");
    if (savedFont) {
      setFontSize(savedFont);
      document.documentElement.style.setProperty("--font-size-base", savedFont);
      document.documentElement.style.fontSize = savedFont;
    }
    const savedAlarm = localStorage.getItem("pd-alarm-settings");
    if (savedAlarm) {
      try {
        const alarm = JSON.parse(savedAlarm);
        setWakeEnabled(Boolean(alarm.wakeEnabled));
        setWakeTime(alarm.wakeTime || "07:30");
        setSleepEnabled(Boolean(alarm.sleepEnabled));
        setSleepTime(alarm.sleepTime || "23:00");
      } catch {
        // 无效的旧配置保持默认值，下一次修改时会自动修复。
      }
    }
    setAlarmSettingsLoaded(true);
  }, []);

  useEffect(() => {
    if (!alarmSettingsLoaded) return;

    let previous: Record<string, unknown> = {};
    try {
      previous = JSON.parse(localStorage.getItem("pd-alarm-settings") || "{}");
    } catch {
      previous = {};
    }

    localStorage.setItem("pd-alarm-settings", JSON.stringify({
      ...previous,
      wakeEnabled,
      wakeTime,
      sleepEnabled,
      sleepTime,
      sleepEarlyMinutes: previous.sleepEarlyMinutes ?? 15,
      wakeMessage: previous.wakeMessage ?? "新的一天开始了，起床解码拖延！",
    }));
  }, [alarmSettingsLoaded, wakeEnabled, wakeTime, sleepEnabled, sleepTime]);

  useEffect(() => {
    if (!alarmSettingsLoaded || (!wakeEnabled && !sleepEnabled)) return;
    if ("Notification" in window && Notification.permission === "default") {
      void Notification.requestPermission();
    }
  }, [alarmSettingsLoaded, wakeEnabled, sleepEnabled]);

  const updateTimerSettings = (key: string, value: any) => {
    const saved = localStorage.getItem("pd-timer-settings");
    const current = saved ? JSON.parse(saved) : {};
    current[key] = value;
    localStorage.setItem("pd-timer-settings", JSON.stringify(current));
  };

  const handleThemeChange = (i: number) => {
    setTheme(i);
    localStorage.setItem("pd-theme", String(i));
    const t = THEMMES[i];
    document.documentElement.style.setProperty("--color-apricot", t.color);
    document.documentElement.style.setProperty("--color-ink", t.ink);
    showToast(`主题已切换为${t.name}`, "success");
  };

  const handleFontSize = (size: string) => {
    setFontSize(size);
    localStorage.setItem("pd-font-size", size);
    document.documentElement.style.setProperty("--font-size-base", size);
    document.documentElement.style.fontSize = size;
    showToast("字体大小已更新", "success");
  };

  const handleLogout = () => {
    logoutUser();
    showToast("已退出登录", "info");
    setTimeout(() => router.push("/login"), 500);
  };

  const handleDeleteAccount = () => {
    if (confirm("确定注销账号？所有数据将永久删除，不可恢复。")) {
      localStorage.clear();
      showToast("账号已注销", "info");
      setTimeout(() => router.push("/login"), 500);
    }
  };

  return (
    <PageTransition>
      <div className="space-y-4 max-w-2xl mx-auto">
        <h1 className="font-sketch text-3xl font-bold" style={{ color: "var(--color-ink)" }}>
          设置
        </h1>

        {/* 外观设置 */}
        <SectionCard icon={<Palette className="w-4 h-4" />} title="外观设置">
          <div className="mb-4">
            <p className="text-xs font-hand mb-2" style={{ color: "var(--text-muted)" }}>主题色</p>
            <div className="grid grid-cols-5 gap-2">
              {THEMMES.map((t, i) => (
                <button
                  key={t.name}
                  onClick={() => handleThemeChange(i)}
                  className="flex flex-col items-center gap-1 p-1.5 rounded-lg transition-all"
                  style={{
                    border: theme === i ? "2px solid var(--color-neon-orange)" : "2px solid transparent",
                  }}
                >
                  <div className="w-8 h-8 rounded-full" style={{ background: t.color, border: "1px solid rgba(0,0,0,0.1)" }} />
                  <span className="text-[9px] font-hand" style={{ color: "var(--text-muted)" }}>{t.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="mb-4">
            <p className="text-xs font-hand mb-2" style={{ color: "var(--text-muted)" }}>字体大小</p>
            <div className="flex gap-2">
              {FONT_SIZES.map((f) => (
                <button
                  key={f.value}
                  onClick={() => handleFontSize(f.value)}
                  className="flex-1 py-2 rounded-lg text-xs font-hand font-bold transition-all"
                  style={
                    fontSize === f.value
                      ? { background: "var(--color-neon-orange)", color: "#fff" }
                      : { background: "rgba(43,58,103,0.06)", color: "var(--text-muted)" }
                  }
                >
                  {f.label}
                </button>
              ))}
            </div>
          </div>

          <ToggleRow
            icon={<Moon className="w-4 h-4" />}
            label="夜间模式"
            value={darkMode}
            onChange={(v) => {
              setDarkMode(v);
              document.documentElement.classList.toggle("dark-mode", v);
            }}
          />
        </SectionCard>

        {/* 音效与音乐 */}
        <SectionCard icon={<Volume2 className="w-4 h-4" />} title="音效与音乐">
          <ToggleRow
            icon={<Volume2 className="w-4 h-4" />}
            label="音效"
            value={soundOn}
            onChange={(v) => { setSoundOn(v); setMuted(!v); }}
          />
          <p className="text-[10px] font-hand mt-2" style={{ color: "var(--text-muted)" }}>
            💡 背景音乐控制请在左下角面板
          </p>
        </SectionCard>

        {/* 专注设置 */}
        <SectionCard icon={<Timer className="w-4 h-4" />} title="专注设置">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-hand" style={{ color: "var(--text-muted)" }}>熄屏宽容时间</span>
              <span className="text-xs font-bold font-hand" style={{ color: "var(--color-ink)" }}>{gracePeriod}秒</span>
            </div>
            <input
              type="range" min="10" max="300" step="10" value={gracePeriod}
              onChange={(e) => { setGracePeriod(Number(e.target.value)); updateTimerSettings("gracePeriod", Number(e.target.value)); }}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={{ background: `linear-gradient(to right, var(--color-neon-orange) ${(gracePeriod - 10) / 290 * 100}%, var(--divider) ${(gracePeriod - 10) / 290 * 100}%)` }}
            />
          </div>
          <ToggleRow
            icon={<Timer className="w-4 h-4" />}
            label="熄屏后自动继续"
            value={autoContinue}
            onChange={(v) => { setAutoContinue(v); updateTimerSettings("autoContinue", v); }}
          />
          <div className="grid grid-cols-2 gap-3 mt-3">
            <div>
              <label className="text-xs font-hand" style={{ color: "var(--text-muted)" }}>默认专注时长</label>
              <select
                value={focusDuration}
                onChange={(e) => setFocusDuration(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 rounded-lg text-xs font-hand"
                style={{ background: "rgba(255,252,240,0.8)", border: "1px solid var(--divider)", color: "var(--text-primary)" }}
              >
                {[15, 20, 25, 30, 45, 60].map((m) => <option key={m} value={m}>{m} 分钟</option>)}
              </select>
            </div>
            <div>
              <label className="text-xs font-hand" style={{ color: "var(--text-muted)" }}>默认休息时长</label>
              <select
                value={breakDuration}
                onChange={(e) => setBreakDuration(Number(e.target.value))}
                className="w-full mt-1 px-3 py-2 rounded-lg text-xs font-hand"
                style={{ background: "rgba(255,252,240,0.8)", border: "1px solid var(--divider)", color: "var(--text-primary)" }}
              >
                {[3, 5, 10, 15].map((m) => <option key={m} value={m}>{m} 分钟</option>)}
              </select>
            </div>
          </div>
        </SectionCard>

        {/* 提醒设置 */}
        <SectionCard icon={<Bell className="w-4 h-4" />} title="提醒设置">
          <ToggleRow
            icon={<Sun className="w-4 h-4" />}
            label="起床提醒"
            value={wakeEnabled}
            onChange={setWakeEnabled}
          />
          {wakeEnabled && (
            <input type="time" value={wakeTime} onChange={(e) => setWakeTime(e.target.value)}
              className="mt-2 px-3 py-1.5 rounded-lg text-xs font-hand"
              style={{ background: "rgba(255,252,240,0.8)", border: "1px solid var(--divider)", color: "var(--text-primary)" }}
            />
          )}
          <div className="my-3" style={{ borderTop: "1px solid var(--divider)" }} />
          <ToggleRow
            icon={<Moon className="w-4 h-4" />}
            label="睡眠提醒"
            value={sleepEnabled}
            onChange={setSleepEnabled}
          />
          {sleepEnabled && (
            <input type="time" value={sleepTime} onChange={(e) => setSleepTime(e.target.value)}
              className="mt-2 px-3 py-1.5 rounded-lg text-xs font-hand"
              style={{ background: "rgba(255,252,240,0.8)", border: "1px solid var(--divider)", color: "var(--text-primary)" }}
            />
          )}
        </SectionCard>

        {/* 账号与安全 */}
        <SectionCard icon={<User className="w-4 h-4" />} title="账号与安全">
          <ActionRow icon={<Edit3 className="w-4 h-4" />} label="修改密码" onClick={() => setShowEditPassword(true)} />
          <ActionRow icon={<LogOut className="w-4 h-4" />} label="退出登录" onClick={handleLogout} />
          <ActionRow icon={<Trash2 className="w-4 h-4" />} label="注销账号" onClick={handleDeleteAccount} danger />
        </SectionCard>

        {/* 帮助与反馈 */}
        <SectionCard icon={<HelpCircle className="w-4 h-4" />} title="帮助与反馈">
          <Link href="/guide" className="block">
            <ActionRow icon={<BookOpen className="w-4 h-4" />} label="使用指南" onClick={() => {}} />
          </Link>
          <ActionRow icon={<Send className="w-4 h-4" />} label="意见反馈" onClick={() => setShowFeedback(true)} />
          <ActionRow icon={<Info className="w-4 h-4" />} label="关于 WhyWait" onClick={() => showToast("WhyWait v1.0 · 别等了，开始吧 ⚡", "info")} />
        </SectionCard>

        {/* 修改密码弹窗 */}
        {showEditPassword && (
          <Modal title="修改密码" onClose={() => setShowEditPassword(false)}>
            <input type="password" placeholder="当前密码" className="w-full mb-2 px-3 py-2 rounded-lg text-sm font-hand" style={{ background: "rgba(255,252,240,0.8)", border: "1px solid var(--divider)", color: "var(--text-primary)" }} />
            <input type="password" placeholder="新密码" className="w-full mb-2 px-3 py-2 rounded-lg text-sm font-hand" style={{ background: "rgba(255,252,240,0.8)", border: "1px solid var(--divider)", color: "var(--text-primary)" }} />
            <input type="password" placeholder="确认新密码" className="w-full mb-3 px-3 py-2 rounded-lg text-sm font-hand" style={{ background: "rgba(255,252,240,0.8)", border: "1px solid var(--divider)", color: "var(--text-primary)" }} />
            <button onClick={() => { setShowEditPassword(false); showToast("密码已修改", "success"); }} className="btn-neon w-full text-sm font-hand">确认修改</button>
          </Modal>
        )}

        {/* 意见反馈弹窗 */}
        {showFeedback && (
          <Modal title="意见反馈" onClose={() => setShowFeedback(false)}>
            <textarea placeholder="说说你的建议或问题..." rows={4} className="w-full mb-3 px-3 py-2 rounded-lg text-sm font-hand resize-none" style={{ background: "rgba(255,252,240,0.8)", border: "1px solid var(--divider)", color: "var(--text-primary)" }} />
            <button onClick={() => { setShowFeedback(false); showToast("感谢反馈！我们会认真对待 📬", "success"); }} className="btn-neon w-full text-sm font-hand">提交反馈</button>
          </Modal>
        )}
      </div>
    </PageTransition>
  );
}

function SectionCard({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="glass-card rounded-xl p-4">
      <div className="flex items-center gap-2 mb-3">
        <span style={{ color: "var(--color-ink)" }}>{icon}</span>
        <h3 className="font-hand text-sm font-bold" style={{ color: "var(--color-ink)" }}>{title}</h3>
      </div>
      {children}
    </div>
  );
}

function ToggleRow({ icon, label, value, onChange }: { icon: React.ReactNode; label: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-center justify-between py-2">
      <div className="flex items-center gap-2">
        <span style={{ color: "var(--text-muted)" }}>{icon}</span>
        <span className="text-sm font-hand font-bold" style={{ color: "var(--text-primary)" }}>{label}</span>
      </div>
      <button
        onClick={() => onChange(!value)}
        className="relative w-10 h-5 rounded-full transition-all"
        style={{ background: value ? "var(--color-neon-green)" : "var(--divider)" }}
      >
        <motion.div
          layout
          className="absolute top-0.5 w-4 h-4 rounded-full bg-white shadow-sm"
          style={{ left: value ? "22px" : "2px" }}
          transition={{ type: "spring", stiffness: 500, damping: 30 }}
        />
      </button>
    </div>
  );
}

function ActionRow({ icon, label, onClick, danger }: { icon: React.ReactNode; label: string; onClick: () => void; danger?: boolean }) {
  return (
    <button onClick={onClick} className="flex items-center justify-between w-full py-2.5 group">
      <div className="flex items-center gap-2">
        <span style={{ color: danger ? "#E74C3C" : "var(--text-muted)" }}>{icon}</span>
        <span className="text-sm font-hand font-bold" style={{ color: danger ? "#E74C3C" : "var(--text-primary)" }}>{label}</span>
      </div>
      <ChevronRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" style={{ color: "var(--text-muted)" }} />
    </button>
  );
}

function Modal({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) {
  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center p-4" style={{ background: "rgba(0,0,0,0.4)" }} onClick={onClose}>
      <motion.div
        initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }}
        className="w-full max-w-sm rounded-2xl p-5"
        style={{ background: "var(--bg-primary)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <h3 className="font-hand text-base font-bold mb-3" style={{ color: "var(--color-ink)" }}>{title}</h3>
        {children}
      </motion.div>
    </div>
  );
}
