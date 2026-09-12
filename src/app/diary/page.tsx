"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition } from "@/components/Animations";
import { useToast } from "@/components/Toast";
import { getCurrentUser } from "@/lib/auth";
import { BookOpen, Plus, Trash2 } from "lucide-react";

interface DiaryEntry {
  id: string;
  date: string;
  mood: number;
  procrastinated: string;
  reason: string;
  reflection: string;
  plan: string;
}

const MOOD_OPTIONS = [
  { value: 1, emoji: "🥺", label: "很差" },
  { value: 2, emoji: "😿", label: "不好" },
  { value: 3, emoji: "🐙", label: "一般" },
  { value: 4, emoji: "🐸", label: "还好" },
  { value: 5, emoji: "🦊", label: "很好" },
];

const MOOD_COLORS: Record<number, string> = {
  1: "#E74C3C",
  2: "#F39C12",
  3: "#F4D03F",
  4: "#52BE80",
  5: "#2ECC71",
};

function getStorageKey(userId?: string) {
  return `pd-diary${userId ? `-${userId}` : ""}`;
}

function loadDiary(userId?: string): DiaryEntry[] {
  try {
    const data = localStorage.getItem(getStorageKey(userId));
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveDiary(entries: DiaryEntry[], userId?: string) {
  localStorage.setItem(getStorageKey(userId), JSON.stringify(entries));
}

export default function DiaryPage() {
  const { showToast } = useToast();
  const [entries, setEntries] = useState<DiaryEntry[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [userId, setUserId] = useState<string | undefined>();
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    mood: 3,
    procrastinated: "",
    reason: "",
    reflection: "",
    plan: "",
  });

  useEffect(() => {
    const user = getCurrentUser();
    setUserId(user?.id);
    setEntries(loadDiary(user?.id).sort((a, b) => b.date.localeCompare(a.date)));
  }, []);

  const handleSubmit = () => {
    if (!form.procrastinated.trim()) {
      showToast("请填写今天拖延了什么", "warning");
      return;
    }
    if (editingId) {
      const updated = entries.map((e) =>
        e.id === editingId ? { ...e, ...form } : e
      );
      setEntries(updated);
      saveDiary(updated, userId);
      showToast("日记已更新", "success");
    } else {
      const newEntry: DiaryEntry = {
        id: Date.now().toString(),
        date: new Date().toISOString(),
        ...form,
      };
      const updated = [newEntry, ...entries];
      setEntries(updated);
      saveDiary(updated, userId);
      showToast("日记已保存", "success");
    }
    setForm({ mood: 3, procrastinated: "", reason: "", reflection: "", plan: "" });
    setShowForm(false);
    setEditingId(null);
  };

  const handleDelete = (id: string) => {
    const updated = entries.filter((e) => e.id !== id);
    setEntries(updated);
    saveDiary(updated, userId);
    showToast("已删除", "info");
  };

  const handleEdit = (entry: DiaryEntry) => {
    setForm({
      mood: entry.mood,
      procrastinated: entry.procrastinated,
      reason: entry.reason,
      reflection: entry.reflection,
      plan: entry.plan,
    });
    setEditingId(entry.id);
    setShowForm(true);
  };

  const formatDate = (iso: string) => {
    const d = new Date(iso);
    return `${d.getMonth() + 1}月${d.getDate()}日`;
  };

  const avgMood = entries.length > 0
    ? (entries.reduce((sum, e) => sum + e.mood, 0) / entries.length).toFixed(1)
    : "—";

  const todayEntry = entries.find((e) => {
    const d = new Date(e.date);
    const today = new Date();
    return d.toDateString() === today.toDateString();
  });

  return (
    <PageTransition>
      <div className="space-y-5 max-w-2xl mx-auto">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-sketch text-2xl font-bold" style={{ color: "var(--color-ink)" }}>
              拖延日记
            </h1>
            <p className="font-hand text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              记录每天的拖延事件和心情，看见自己才能改变自己
            </p>
          </div>
          <button
            onClick={() => {
              if (todayEntry) {
                handleEdit(todayEntry);
              } else {
                setEditingId(null);
                setForm({ mood: 3, procrastinated: "", reason: "", reflection: "", plan: "" });
                setShowForm(true);
              }
            }}
            className="btn-neon text-xs font-hand flex items-center gap-1"
          >
            <Plus className="w-3.5 h-3.5" />
            {todayEntry ? "编辑今日" : "写日记"}
          </button>
        </div>

        {/* 统计概览 */}
        <div className="grid grid-cols-3 gap-3">
          <div className="glass-card rounded-xl p-3 text-center">
            <p className="text-2xl font-bold" style={{ color: "var(--color-ink)" }}>{entries.length}</p>
            <p className="text-[10px] font-hand" style={{ color: "var(--text-muted)" }}>总记录</p>
          </div>
          <div className="glass-card rounded-xl p-3 text-center">
            <p className="text-2xl mood-emoji">{avgMood !== "—" ? MOOD_OPTIONS[Math.round(Number(avgMood)) - 1]?.emoji : "📝"}</p>
            <p className="text-[10px] font-hand" style={{ color: "var(--text-muted)" }}>平均心情 {avgMood}</p>
          </div>
          <div className="glass-card rounded-xl p-3 text-center">
            <p className="text-2xl font-bold" style={{ color: "var(--color-neon-orange)" }}>
              {entries.filter((e) => e.procrastinated.trim()).length}
            </p>
            <p className="text-[10px] font-hand" style={{ color: "var(--text-muted)" }}>拖延事件</p>
          </div>
        </div>

        {/* 写日记表单 */}
        <AnimatePresence>
          {showForm && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="glass-card rounded-xl p-4 space-y-4 overflow-hidden"
            >
              <h3 className="font-hand text-sm font-bold" style={{ color: "var(--color-ink)" }}>
                {editingId ? "编辑日记" : "今日拖延日记"}
              </h3>

              {/* 心情选择 */}
              <div>
                <label className="text-xs font-hand mb-2 block" style={{ color: "var(--text-muted)" }}>今天心情如何？</label>
                <div className="flex gap-2">
                  {MOOD_OPTIONS.map((m) => (
                    <button
                      key={m.value}
                      onClick={() => setForm({ ...form, mood: m.value })}
                      className="flex flex-col items-center gap-1 px-3 py-2 rounded-lg transition-all"
                      style={{
                        background: form.mood === m.value ? `${MOOD_COLORS[m.value]}22` : "transparent",
                        border: form.mood === m.value ? `2px solid ${MOOD_COLORS[m.value]}` : "2px solid transparent",
                      }}
                    >
                      <span className={`text-xl mood-emoji mood-emoji-${m.value}${form.mood === m.value ? " mood-emoji-selected" : ""}`}>
                        {m.emoji}
                      </span>
                      <span className="text-[9px] font-hand" style={{ color: "var(--text-muted)" }}>{m.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* 拖延了什么 */}
              <div>
                <label className="text-xs font-hand mb-1 block" style={{ color: "var(--text-muted)" }}>今天拖延了什么？</label>
                <input
                  value={form.procrastinated}
                  onChange={(e) => setForm({ ...form, procrastinated: e.target.value })}
                  placeholder="如：写论文、背单词、运动..."
                  className="w-full px-3 py-2 rounded-lg text-sm font-hand"
                  style={{ background: "rgba(255,252,240,0.8)", border: "1px solid var(--divider)", color: "var(--text-primary)" }}
                />
              </div>

              {/* 原因 */}
              <div>
                <label className="text-xs font-hand mb-1 block" style={{ color: "var(--text-muted)" }}>为什么拖延？</label>
                <textarea
                  value={form.reason}
                  onChange={(e) => setForm({ ...form, reason: e.target.value })}
                  placeholder="如：任务太大了不知道从哪开始、刷手机停不下来..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg text-sm font-hand resize-none"
                  style={{ background: "rgba(255,252,240,0.8)", border: "1px solid var(--divider)", color: "var(--text-primary)" }}
                />
              </div>

              {/* 反思 */}
              <div>
                <label className="text-xs font-hand mb-1 block" style={{ color: "var(--text-muted)" }}>反思与觉察</label>
                <textarea
                  value={form.reflection}
                  onChange={(e) => setForm({ ...form, reflection: e.target.value })}
                  placeholder="我注意到了什么？下次可以怎样识别这个模式？"
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg text-sm font-hand resize-none"
                  style={{ background: "rgba(255,252,240,0.8)", border: "1px solid var(--divider)", color: "var(--text-primary)" }}
                />
              </div>

              {/* 明日计划 */}
              <div>
                <label className="text-xs font-hand mb-1 block" style={{ color: "var(--text-muted)" }}>明天打算怎么做？</label>
                <textarea
                  value={form.plan}
                  onChange={(e) => setForm({ ...form, plan: e.target.value })}
                  placeholder="如：明天先写5分钟开头、把手机放远一点..."
                  rows={2}
                  className="w-full px-3 py-2 rounded-lg text-sm font-hand resize-none"
                  style={{ background: "rgba(255,252,240,0.8)", border: "1px solid var(--divider)", color: "var(--text-primary)" }}
                />
              </div>

              <div className="flex gap-2">
                <button onClick={handleSubmit} className="btn-neon flex-1 text-sm font-hand">
                  {editingId ? "保存修改" : "保存日记"}
                </button>
                <button
                  onClick={() => { setShowForm(false); setEditingId(null); }}
                  className="px-4 py-2 rounded-lg text-sm font-hand"
                  style={{ background: "rgba(43,58,103,0.06)", color: "var(--text-muted)" }}
                >
                  取消
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 日记列表 */}
        {entries.length === 0 ? (
          <div className="glass-card rounded-xl p-8 text-center">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-30" style={{ color: "var(--text-muted)" }} />
            <p className="font-hand text-sm" style={{ color: "var(--text-muted)" }}>
              还没有日记记录。点击「写日记」开始记录你的拖延故事吧！
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {entries.map((entry) => {
              const mood = MOOD_OPTIONS[entry.mood - 1];
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="glass-card rounded-xl p-4"
                  style={{ borderLeft: `3px solid ${MOOD_COLORS[entry.mood] || "var(--divider)"}` }}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <span className={`text-2xl mood-emoji mood-emoji-${entry.mood}`}>{mood?.emoji}</span>
                      <div>
                        <p className="font-hand text-sm font-bold" style={{ color: "var(--color-ink)" }}>
                          {formatDate(entry.date)}
                        </p>
                        <p className="text-[10px] font-hand" style={{ color: "var(--text-muted)" }}>
                          {mood?.label}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button
                        onClick={() => handleEdit(entry)}
                        className="text-[10px] font-hand px-2 py-1 rounded"
                        style={{ background: "rgba(43,58,103,0.06)", color: "var(--text-muted)" }}
                      >
                        编辑
                      </button>
                      <button
                        onClick={() => handleDelete(entry.id)}
                        className="text-[10px] font-hand px-2 py-1 rounded"
                        style={{ background: "rgba(231,76,60,0.1)", color: "#E74C3C" }}
                      >
                        删除
                      </button>
                    </div>
                  </div>

                  {entry.procrastinated && (
                    <p className="text-sm font-hand mb-1" style={{ color: "var(--color-ink)" }}>
                      <span style={{ color: "var(--text-muted)" }}>拖延了：</span>
                      {entry.procrastinated}
                    </p>
                  )}
                  {entry.reason && (
                    <p className="text-xs font-hand mb-1" style={{ color: "var(--text-secondary)" }}>
                      <span style={{ color: "var(--text-muted)" }}>原因：</span>
                      {entry.reason}
                    </p>
                  )}
                  {entry.reflection && (
                    <p className="text-xs font-hand mb-1" style={{ color: "var(--text-secondary)" }}>
                      <span style={{ color: "var(--text-muted)" }}>反思：</span>
                      {entry.reflection}
                    </p>
                  )}
                  {entry.plan && (
                    <p className="text-xs font-hand" style={{ color: "var(--text-secondary)" }}>
                      <span style={{ color: "var(--color-neon-orange)" }}>明日计划：</span>
                      {entry.plan}
                    </p>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </div>
    </PageTransition>
  );
}
