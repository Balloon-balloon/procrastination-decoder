"use client";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition, StaggerContainer, FadeInItem } from "@/components/Animations";
import { useToast } from "@/components/Toast";
import { useAppData } from "@/hooks/useAppData";
import { getCurrentUser } from "@/lib/auth";
import {
  Camera, Edit3, Flame, Timer, CheckCircle2, Trash2,
  Trophy, MessageCircle, Zap, ChevronLeft, Award,
} from "lucide-react";

interface TimelineItem {
  id: string;
  type: "task" | "focus" | "treehole" | "milestone";
  content: string;
  timestamp: number;
  icon: string;
  color: string;
}

const PIXEL_AVATARS = ["🐱", "🦊", "🐼", "🐰", "🦉", "🐸", "🐧", "🦝", "🐙", "🦄"];

export default function ProfilePage() {
  const { showToast } = useToast();
  const { data, loaded, currentUser } = useAppData();
  const [avatar, setAvatar] = useState("🐱");
  const [bgGradient, setBgGradient] = useState("linear-gradient(135deg, #FAD6A5, #FF6B35)");
  const [bio, setBio] = useState("别等了，开始吧 ⚡");
  const [tags, setTags] = useState<string[]>(["考研", "夜猫子"]);
  const [city, setCity] = useState("杭州");
  const [showEdit, setShowEdit] = useState(false);
  const [editBio, setEditBio] = useState(bio);
  const [editTags, setEditTags] = useState(tags.join(" "));
  const [editCity, setEditCity] = useState(city);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      const savedAvatar = localStorage.getItem(`pd-avatar-${user.id}`);
      if (savedAvatar) setAvatar(savedAvatar);
      else {
        const random = PIXEL_AVATARS[Math.floor(Math.random() * PIXEL_AVATARS.length)];
        setAvatar(random);
        localStorage.setItem(`pd-avatar-${user.id}`, random);
      }
    }

    const savedBio = localStorage.getItem("pd-profile-bio");
    if (savedBio) setBio(savedBio);
    const savedTags = localStorage.getItem("pd-profile-tags");
    if (savedTags) setTags(JSON.parse(savedTags));
    const savedCity = localStorage.getItem("pd-profile-city");
    if (savedCity) setCity(savedCity);

    // 生成模拟动态时间线
    const mockTimeline: TimelineItem[] = [
      { id: "1", type: "task", content: "完成了「背单词50个」", timestamp: Date.now() - 3600000, icon: "✅", color: "var(--color-neon-green)" },
      { id: "2", type: "focus", content: "专注学习 25 分钟", timestamp: Date.now() - 7200000, icon: "⏱️", color: "var(--color-neon-orange)" },
      { id: "3", type: "treehole", content: "在树洞分享了一条成功帖 🎉", timestamp: Date.now() - 86400000, icon: "🌳", color: "var(--sticky-green)" },
      { id: "4", type: "milestone", content: "连续打卡 3 天！获得「坚持之星」徽章", timestamp: Date.now() - 172800000, icon: "🏆", color: "#FFD700" },
      { id: "5", type: "task", content: "完成了「微积分作业第三章」", timestamp: Date.now() - 259200000, icon: "✅", color: "var(--color-neon-green)" },
      { id: "6", type: "focus", content: "专注学习 50 分钟（两轮番茄钟）", timestamp: Date.now() - 345600000, icon: "⏱️", color: "var(--color-neon-orange)" },
    ];
    setTimeline(mockTimeline);
  }, []);

  const handleSaveEdit = () => {
    setBio(editBio);
    setTags(editTags.split(/\s+/).filter(Boolean));
    setCity(editCity);
    localStorage.setItem("pd-profile-bio", editBio);
    localStorage.setItem("pd-profile-tags", JSON.stringify(editTags.split(/\s+/).filter(Boolean)));
    localStorage.setItem("pd-profile-city", editCity);
    setShowEdit(false);
    showToast("资料已更新", "success");
  };

  const handleAvatarChange = () => {
    const random = PIXEL_AVATARS[Math.floor(Math.random() * PIXEL_AVATARS.length)];
    setAvatar(random);
    const user = getCurrentUser();
    if (user) localStorage.setItem(`pd-avatar-${user.id}`, random);
    showToast("头像已更换", "success");
  };

  const handleDeleteTimeline = (id: string) => {
    setTimeline(timeline.filter((t) => t.id !== id));
    showToast("动态已删除", "info");
  };

  const formatTime = (ts: number) => {
    const diff = Date.now() - ts;
    const h = Math.floor(diff / 3600000);
    const d = Math.floor(diff / 86400000);
    if (d > 0) return `${d}天前`;
    if (h > 0) return `${h}小时前`;
    const m = Math.floor(diff / 60000);
    return `${m}分钟前`;
  };

  const completedTasks = data.tasks.filter((t) => t.status === "completed").length;
  const totalFocusMin = data.focusSessions.reduce((sum, s) => sum + (s.duration || 0), 0);
  const streak = data.profile.streak || 0;

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto">
        {/* 顶部背景区 */}
        <div
          className="relative h-40 rounded-2xl overflow-hidden"
          style={{ background: bgGradient }}
        >
          <button
            onClick={() => showToast("背景图更换功能开发中", "info")}
            className="absolute top-3 right-3 p-2 rounded-full"
            style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }}
          >
            <Camera className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* 头像区 */}
        <div className="relative -mt-12 px-4">
          <div className="flex items-end gap-4">
            <button
              onClick={handleAvatarChange}
              className="w-24 h-24 rounded-full flex items-center justify-center text-5xl border-4 transition-transform hover:scale-105"
              style={{
                background: "var(--bg-primary)",
                borderColor: "var(--color-apricot)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            >
              {avatar}
            </button>
            <div className="flex-1 pb-2">
              <div className="flex items-center gap-2">
                <h2 className="font-sketch text-2xl font-bold" style={{ color: "var(--color-ink)" }}>
                  {data.profile.name || currentUser?.username || "用户"}
                </h2>
                <button
                  onClick={() => { setShowEdit(true); setEditBio(bio); setEditTags(tags.join(" ")); setEditCity(city); }}
                  className="p-1 rounded-lg transition-colors hover:bg-black/5"
                >
                  <Edit3 className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
                </button>
              </div>
              <p className="font-handwritten text-sm mt-0.5" style={{ color: "var(--text-secondary)" }}>
                {bio}
              </p>
              <div className="flex flex-wrap gap-1.5 mt-1.5">
                {tags.map((tag) => (
                  <span key={tag} className="px-2 py-0.5 rounded-full text-[10px] font-hand font-bold" style={{ background: "var(--color-apricot)", color: "var(--color-ink)" }}>
                    {tag}
                  </span>
                ))}
                <span className="px-2 py-0.5 rounded-full text-[10px] font-hand" style={{ background: "rgba(43,58,103,0.06)", color: "var(--text-muted)" }}>
                  📍 {city}
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* 统计卡片 */}
        <div className="grid grid-cols-3 gap-3 mt-5">
          <StatBox icon={<CheckCircle2 className="w-4 h-4" />} label="累计完成" value={completedTasks} unit="个" color="var(--color-neon-green)" />
          <StatBox icon={<Timer className="w-4 h-4" />} label="累计专注" value={totalFocusMin} unit="分钟" color="var(--color-neon-orange)" />
          <StatBox icon={<Flame className="w-4 h-4" />} label="连续打卡" value={streak} unit="天" color="#FF6B35" />
        </div>

        {/* 我的成就 */}
        <div className="mt-6">
          <h3 className="font-hand text-sm font-bold mb-3 flex items-center gap-2" style={{ color: "var(--color-ink)" }}>
            <Award className="w-4 h-4" /> 我的成就
            <span className="text-xs font-normal ml-auto" style={{ color: "var(--text-muted)" }}>
              {data.achievements.filter(a => a.unlocked).length} / {data.achievements.length} 已解锁
            </span>
          </h3>
          <div className="grid grid-cols-2 gap-2">
            {data.achievements.map((ach) => (
              <div
                key={ach.id}
                className="p-3 rounded-xl flex items-center gap-2 transition-all"
                style={{
                  background: "var(--bg-card)",
                  border: `1px solid ${ach.unlocked ? "var(--color-neon-orange)" : "var(--card-border)"}`,
                  opacity: ach.unlocked ? 1 : 0.6,
                }}
              >
                <div className="text-2xl flex-shrink-0">
                  {ach.unlocked ? ach.icon : "🔒"}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-bold truncate" style={{ color: "var(--text-primary)" }}>
                    {ach.title}
                  </p>
                  <p className="text-[10px] truncate" style={{ color: "var(--text-muted)" }}>
                    {ach.description}
                  </p>
                  <div className="mt-1 h-1 rounded-full overflow-hidden" style={{ background: "var(--divider)" }}>
                    <div
                      className="h-full rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, (ach.progress / ach.maxProgress) * 100)}%`,
                        background: ach.unlocked ? "var(--color-neon-green)" : "var(--color-neon-orange)",
                      }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* 动态时间线 */}
        <div className="mt-6">
          <h3 className="font-hand text-sm font-bold mb-3 flex items-center gap-2" style={{ color: "var(--color-ink)" }}>
            <MessageCircle className="w-4 h-4" /> 我的动态
          </h3>
          <StaggerContainer className="space-y-3">
            {timeline.length === 0 ? (
              <div className="text-center py-8">
                <p className="font-hand text-sm" style={{ color: "var(--text-muted)" }}>
                  还没有动态，去完成任务吧 💪
                </p>
              </div>
            ) : (
              timeline.map((item) => (
                <FadeInItem key={item.id}>
                  <div className="flex items-start gap-3 p-3 rounded-xl" style={{ background: "var(--bg-card)", border: "1px solid var(--card-border)" }}>
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-lg flex-shrink-0" style={{ background: `${item.color}20` }}>
                      {item.icon}
                    </div>
                    <div className="flex-1">
                      <p className="font-hand text-sm" style={{ color: "var(--text-primary)" }}>
                        {item.content}
                      </p>
                      <p className="text-[10px] font-hand mt-0.5" style={{ color: "var(--text-muted)" }}>
                        {formatTime(item.timestamp)}
                      </p>
                    </div>
                    <button onClick={() => handleDeleteTimeline(item.id)} className="p-1 rounded hover:bg-black/5">
                      <Trash2 className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
                    </button>
                  </div>
                </FadeInItem>
              ))
            )}
          </StaggerContainer>
        </div>

        {/* 编辑个人信息弹窗 */}
        <AnimatePresence>
          {showEdit && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[150] flex items-center justify-center p-4"
              style={{ background: "rgba(0,0,0,0.4)" }}
              onClick={() => setShowEdit(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-sm rounded-2xl p-5"
                style={{ background: "var(--bg-primary)" }}
                onClick={(e) => e.stopPropagation()}
              >
                <h3 className="font-hand text-base font-bold mb-4" style={{ color: "var(--color-ink)" }}>
                  编辑个人信息
                </h3>

                <div className="mb-3">
                  <label className="text-xs font-hand mb-1 block" style={{ color: "var(--text-muted)" }}>
                    个人简介（限30字）
                  </label>
                  <input
                    type="text"
                    value={editBio}
                    onChange={(e) => setEditBio(e.target.value.slice(0, 30))}
                    className="w-full px-3 py-2 rounded-lg text-sm font-hand"
                    style={{ background: "rgba(255,252,240,0.8)", border: "1px solid var(--divider)", color: "var(--text-primary)" }}
                  />
                </div>

                <div className="mb-3">
                  <label className="text-xs font-hand mb-1 block" style={{ color: "var(--text-muted)" }}>
                    个性标签（空格分隔）
                  </label>
                  <input
                    type="text"
                    value={editTags}
                    onChange={(e) => setEditTags(e.target.value)}
                    placeholder="考研 夜猫子 编程"
                    className="w-full px-3 py-2 rounded-lg text-sm font-hand"
                    style={{ background: "rgba(255,252,240,0.8)", border: "1px solid var(--divider)", color: "var(--text-primary)" }}
                  />
                </div>

                <div className="mb-4">
                  <label className="text-xs font-hand mb-1 block" style={{ color: "var(--text-muted)" }}>
                    所在城市
                  </label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    className="w-full px-3 py-2 rounded-lg text-sm font-hand"
                    style={{ background: "rgba(255,252,240,0.8)", border: "1px solid var(--divider)", color: "var(--text-primary)" }}
                  />
                </div>

                <div className="flex gap-2">
                  <button onClick={() => setShowEdit(false)} className="flex-1 py-2 rounded-lg text-sm font-hand" style={{ background: "rgba(43,58,103,0.06)", color: "var(--text-secondary)" }}>
                    取消
                  </button>
                  <button onClick={handleSaveEdit} className="btn-neon flex-1 text-sm font-hand">
                    保存
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}

function StatBox({ icon, label, value, unit, color }: { icon: React.ReactNode; label: string; value: number; unit: string; color: string }) {
  return (
    <div className="glass-card rounded-xl p-3 text-center">
      <div className="flex justify-center mb-1" style={{ color }}>{icon}</div>
      <p className="font-pixel text-base" style={{ color: "var(--color-ink)" }}>{value}</p>
      <p className="text-[10px] font-hand" style={{ color: "var(--text-muted)" }}>{label}</p>
      <p className="text-[9px] font-hand" style={{ color: "var(--text-muted)" }}>{unit}</p>
    </div>
  );
}
