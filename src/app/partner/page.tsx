"use client";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition, StaggerContainer, FadeInItem } from "@/components/Animations";
import { UserX, UserCheck, Bell, CheckCircle2, ChevronRight, Zap, Target, Clock } from "lucide-react";
import { playClickSound, playCompleteSound } from "@/lib/sound";
import { useToast } from "@/components/Toast";
import { useAppData } from "@/hooks/useAppData";

interface Partner {
  emoji: string;
  name: string;
  goal: string;
  tags: string[];
  completedTasks: number;
  totalTasks: number;
  activeTime: string;
}

const MOCK_PARTNERS: Partner[] = [
  { emoji: "🦊", name: "狐狸同学", goal: "考研上岸", tags: ["考研", "数学", "英语"], completedTasks: 7, totalTasks: 10, activeTime: "晚上" },
  { emoji: "🐼", name: "熊猫同学", goal: "期末全A", tags: ["期末", "论文", "编程"], completedTasks: 5, totalTasks: 8, activeTime: "上午" },
  { emoji: "🦉", name: "猫头鹰同学", goal: "四六级500+", tags: ["四六级", "听力"], completedTasks: 9, totalTasks: 10, activeTime: "晚上" },
  { emoji: "🐰", name: "兔子同学", goal: "学会React", tags: ["编程", "前端"], completedTasks: 3, totalTasks: 6, activeTime: "下午" },
];

const TAGS_STUDENT = ["考研", "高考", "四六级", "期末论文", "编程学习", "数学", "英语", "专业课"];
const TAGS_WORKER = ["项目冲刺", "技能提升", "副业", "健康作息", "考证", "PPT"];

export default function PartnerPage() {
  const { showToast } = useToast();
  const { data } = useAppData();
  const [matched, setMatched] = useState<Partner | null>(null);
  const [matching, setMatching] = useState(false);
  const [myTags, setMyTags] = useState<string[]>([]);
  const [myGoal, setMyGoal] = useState("");
  const [paused, setPaused] = useState(false);
  const [showSetup, setShowSetup] = useState(false);
  const [highFives, setHighFives] = useState(0);
  const [notifications, setNotifications] = useState<string[]>([]);

  const todayKey = `pd-partner-${new Date().toDateString()}`;

  useEffect(() => {
    const saved = localStorage.getItem(todayKey);
    if (saved) {
      const data = JSON.parse(saved);
      setMatched(data.partner);
      setMyTags(data.tags || []);
      setMyGoal(data.goal || "");
      setPaused(data.paused || false);
    } else {
      setShowSetup(true);
    }
  }, [todayKey]);

  const saveState = (partner: Partner | null, tags: string[], goal: string, isPaused: boolean) => {
    localStorage.setItem(todayKey, JSON.stringify({ partner, tags, goal, paused: isPaused }));
  };

  const handleMatch = () => {
    if (paused) {
      showToast("今日已暂停匹配", "warning");
      return;
    }
    if (myTags.length === 0) {
      showToast("请先选择偏好标签", "warning");
      return;
    }

    playClickSound();
    setMatching(true);
    setShowSetup(false);

    // 模拟匹配延迟
    setTimeout(() => {
      // 找标签最相似的
      const scored = MOCK_PARTNERS.map((p) => ({
        partner: p,
        score: p.tags.filter((t) => myTags.includes(t)).length,
      }));
      scored.sort((a, b) => b.score - a.score);
      const best = scored[0].partner;

      setMatched(best);
      saveState(best, myTags, myGoal, paused);
      setMatching(false);
      playCompleteSound();
      showToast("匹配成功！你的今日学伴是 " + best.name, "success");
    }, 2000);
  };

  const toggleTag = (tag: string) => {
    playClickSound();
    setMyTags((prev) =>
      prev.includes(tag) ? prev.filter((t) => t !== tag) : [...prev, tag]
    );
  };

  const handleHighFive = () => {
    playClickSound();
    setHighFives((h) => h + 1);
    showToast("击掌成功！对方会收到的 👏", "success");
    // 模拟对方也击掌
    setTimeout(() => {
      setNotifications((prev) => [
        ...prev,
        `${matched?.name} 给你击了个掌！👏`,
      ]);
    }, 2000);
  };

  const handlePause = () => {
    const newPaused = !paused;
    setPaused(newPaused);
    saveState(matched, myTags, myGoal, newPaused);
    showToast(newPaused ? "今日匹配已暂停" : "今日匹配已恢复", "info");
  };

  // 模拟对方完成任务的进度更新
  useEffect(() => {
    if (!matched) return;
    const interval = setInterval(() => {
      if (Math.random() < 0.15 && matched.completedTasks < matched.totalTasks) {
        const newCompleted = matched.completedTasks + 1;
        const taskNames = ["背单词50个", "微积分作业", "论文段落", "代码review", "英语阅读"];
        const taskName = taskNames[Math.floor(Math.random() * taskNames.length)];
        setMatched({ ...matched, completedTasks: newCompleted });
        setNotifications((prev) => [
          ...prev,
          `你的学伴刚完成了【${taskName}】👏`,
        ]);
      }
    }, 8000);
    return () => clearInterval(interval);
  }, [matched]);

  const myCompletedTasks = data.tasks.filter((t) => t.status === "completed").length;
  const myTotalTasks = data.tasks.length;
  const myProgress = myTotalTasks > 0 ? Math.round((myCompletedTasks / myTotalTasks) * 100) : 0;

  return (
    <PageTransition>
      <div className="space-y-5 max-w-2xl mx-auto">
        {/* 标题 */}
        <div className="text-center">
          <h1 className="font-pixel text-sm mb-2" style={{ color: "var(--color-ink)" }}>
            STUDY PARTNER
          </h1>
          <p className="font-hand text-sm" style={{ color: "var(--text-muted)" }}>
            🤝 每日学伴 · 社交责任驱动 · 次日重新匹配
          </p>
        </div>

        {/* 匹配设置弹窗 */}
        <AnimatePresence>
          {showSetup && !matched && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[150] flex items-center justify-center p-4"
              style={{ background: "rgba(0,0,0,0.4)" }}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-md rounded-2xl p-5"
                style={{ background: "var(--bg-primary)" }}
              >
                <h3 className="font-hand text-base font-bold mb-3" style={{ color: "var(--color-ink)" }}>
                  设置你的匹配偏好
                </h3>

                <div className="mb-4">
                  <label className="text-xs font-hand mb-1.5 block" style={{ color: "var(--text-muted)" }}>
                    今日目标
                  </label>
                  <input
                    type="text"
                    value={myGoal}
                    onChange={(e) => setMyGoal(e.target.value)}
                    placeholder="如：考研复习 / 完成项目PPT"
                    className="w-full px-3 py-2 rounded-lg text-sm font-hand focus:outline-none"
                    style={{ background: "rgba(255,252,240,0.8)", border: "1px solid var(--divider)", color: "var(--text-primary)" }}
                  />
                </div>

                <div className="mb-4">
                  <label className="text-xs font-hand mb-1.5 block" style={{ color: "var(--text-muted)" }}>
                    偏好标签（选2-3个）
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {TAGS_STUDENT.map((tag) => (
                      <button
                        key={tag}
                        onClick={() => toggleTag(tag)}
                        className="px-3 py-1.5 rounded-lg text-xs font-hand font-bold transition-all"
                        style={
                          myTags.includes(tag)
                            ? { background: "var(--color-neon-orange)", color: "#fff" }
                            : { background: "rgba(43,58,103,0.06)", color: "var(--text-muted)" }
                        }
                      >
                        {tag}
                      </button>
                    ))}
                  </div>
                </div>

                <button
                  onClick={handleMatch}
                  disabled={myTags.length === 0}
                  className="btn-neon w-full text-sm font-hand disabled:opacity-50"
                >
                  开始匹配
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 匹配中动画 */}
        <AnimatePresence>
          {matching && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[150] flex items-center justify-center"
              style={{ background: "rgba(13,18,36,0.8)" }}
            >
              <div className="text-center">
                <motion.div
                  animate={{ rotate: 360 }}
                  transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
                  className="w-16 h-16 mx-auto mb-4 rounded-full border-4 border-transparent"
                  style={{ borderTopColor: "var(--color-neon-orange)", borderRightColor: "var(--color-neon-green)" }}
                />
                <p className="font-hand text-sm" style={{ color: "var(--color-apricot)" }}>
                  正在为你匹配今日学伴...
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 未匹配状态 */}
        {!matched && !matching && !showSetup && (
          <div className="glass-card rounded-xl p-8 text-center">
            <UserX className="w-12 h-12 mx-auto mb-3" style={{ color: "var(--text-muted)" }} />
            <p className="font-hand text-sm mb-4" style={{ color: "var(--text-secondary)" }}>
              今天还没有学伴
            </p>
            <button
              onClick={() => setShowSetup(true)}
              className="btn-neon text-sm font-hand"
            >
              开始匹配
            </button>
          </div>
        )}

        {/* 已匹配状态 */}
        {matched && (
          <>
            {/* 学伴卡片 */}
            <div
              className="sticky-note p-5 text-center"
              style={{ background: "var(--sticky-blue)", transform: "rotate(-0.5deg)" }}
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", stiffness: 300, damping: 20 }}
                className="text-5xl mb-2"
              >
                {matched.emoji}
              </motion.div>
              <h2 className="font-hand text-lg font-bold" style={{ color: "var(--color-ink)" }}>
                {matched.name}
              </h2>
              <p className="font-hand text-xs mb-3" style={{ color: "var(--text-muted)" }}>
                目标：{matched.goal}
              </p>
              <div className="flex flex-wrap gap-1.5 justify-center mb-3">
                {matched.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-0.5 rounded-full text-[10px] font-hand font-bold"
                    style={{ background: "rgba(43,58,103,0.1)", color: "var(--color-ink)" }}
                  >
                    {tag}
                  </span>
                ))}
              </div>

              {/* 进度对比 */}
              <div className="grid grid-cols-2 gap-3 mt-4">
                <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.5)" }}>
                  <p className="text-[10px] font-hand mb-1" style={{ color: "var(--text-muted)" }}>
                    学伴进度
                  </p>
                  <p className="font-pixel text-sm" style={{ color: "var(--color-ink)" }}>
                    {matched.completedTasks}/{matched.totalTasks}
                  </p>
                  <div className="w-full h-1.5 rounded-full mt-1" style={{ background: "rgba(43,58,103,0.1)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${(matched.completedTasks / matched.totalTasks) * 100}%`,
                        background: "var(--color-neon-green)",
                      }}
                    />
                  </div>
                </div>
                <div className="rounded-lg p-3" style={{ background: "rgba(255,255,255,0.5)" }}>
                  <p className="text-[10px] font-hand mb-1" style={{ color: "var(--text-muted)" }}>
                    我的进度
                  </p>
                  <p className="font-pixel text-sm" style={{ color: "var(--color-ink)" }}>
                    {myCompletedTasks}/{myTotalTasks || 0}
                  </p>
                  <div className="w-full h-1.5 rounded-full mt-1" style={{ background: "rgba(43,58,103,0.1)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${myProgress}%`,
                        background: "var(--color-neon-orange)",
                      }}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* 击掌按钮 */}
            <button
              onClick={handleHighFive}
              className="btn-mint w-full text-sm font-hand flex items-center justify-center gap-2"
            >
              <Bell className="w-4 h-4" />
              击掌加油 {highFives > 0 && `(${highFives})`}
            </button>

            {/* 通知区 */}
            {notifications.length > 0 && (
              <div className="glass-card rounded-xl p-4">
                <h3 className="font-hand text-xs font-bold mb-2" style={{ color: "var(--color-ink)" }}>
                  📬 学伴通知
                </h3>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  <AnimatePresence>
                    {notifications.slice(-5).reverse().map((msg, i) => (
                      <motion.div
                        key={i}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        exit={{ opacity: 0 }}
                        className="text-xs font-hand p-2 rounded-lg"
                        style={{ background: "rgba(78,205,196,0.1)", color: "var(--text-secondary)" }}
                      >
                        {msg}
                      </motion.div>
                    ))}
                  </AnimatePresence>
                </div>
              </div>
            )}

            {/* 责任机制说明 */}
            <div className="glass-card rounded-xl p-4">
              <h3 className="font-hand text-xs font-bold mb-2" style={{ color: "var(--color-ink)" }}>
                📋 责任驱动机制
              </h3>
              <ul className="space-y-1 text-[11px] font-hand" style={{ color: "var(--text-secondary)" }}>
                <li>· 双方完成 80% 以上 → 次日优先匹配高完成度学伴</li>
                <li>· 连续 3 天完成率低于 30% → 暂停匹配 3 天</li>
                <li>· 匹配仅限当日，24:00 后自动解除</li>
                <li>· 无聊天功能，仅有"击掌"互动</li>
              </ul>
            </div>

            {/* 暂停匹配 */}
            <button
              onClick={handlePause}
              className="w-full py-2 rounded-lg text-xs font-hand transition-colors"
              style={{ background: "rgba(43,58,103,0.06)", color: paused ? "var(--color-neon-orange)" : "var(--text-muted)" }}
            >
              {paused ? "✅ 今日匹配已暂停（点击恢复）" : "今日不想匹配"}
            </button>
          </>
        )}

        {/* 狗狗联动提示 */}
        {matched && matched.completedTasks > myCompletedTasks && (
          <div
            className="rounded-xl p-3 text-center text-xs font-hand"
            style={{ background: "var(--color-neon-orange)", color: "#fff" }}
          >
            🐶 你的学伴都在学，你还好意思摸鱼？
          </div>
        )}
      </div>
    </PageTransition>
  );
}
