"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition, StaggerContainer, FadeInItem } from "@/components/Animations";
import { useToast } from "@/components/Toast";
import { useAppData } from "@/hooks/useAppData";
import { getCurrentUser } from "@/lib/auth";
import {
  Camera, Edit3, Flame, Timer, CheckCircle2, Trash2,
  Trophy, MessageCircle, Zap, ChevronLeft, Award,
  ImagePlus, X, Check, Sun, Moon, Palette,
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

const BG_GRADIENTS = [
  "linear-gradient(135deg, #FAD6A5, #FF6B35)",
  "linear-gradient(135deg, #A5D6BC, #2B5A50)",
  "linear-gradient(135deg, #FFCDD2, #6B2D3C)",
  "linear-gradient(135deg, #D4C5E8, #3D2B5A)",
  "linear-gradient(135deg, #FFCC80, #4A2C14)",
  "linear-gradient(135deg, #C5D5B5, #2B4A1A)",
  "linear-gradient(135deg, #48CAE4, #0D1B2A)",
  "linear-gradient(135deg, #FFB7C5, #B19CD9)",
];

export default function ProfilePage() {
  const { showToast } = useToast();
  const { data, loaded, currentUser } = useAppData();
  const [avatar, setAvatar] = useState("🐱");
  const [avatarImg, setAvatarImg] = useState<string | null>(null);
  const [bgGradient, setBgGradient] = useState(BG_GRADIENTS[0]);
  const [bgImg, setBgImg] = useState<string | null>(null);
  const [bio, setBio] = useState("别等了，开始吧 ⚡");
  const [tags, setTags] = useState<string[]>(["考研", "夜猫子"]);
  const [city, setCity] = useState("杭州");
  const [showEdit, setShowEdit] = useState(false);
  const [editBio, setEditBio] = useState(bio);
  const [editTags, setEditTags] = useState(tags.join(" "));
  const [editCity, setEditCity] = useState(city);
  const [timeline, setTimeline] = useState<TimelineItem[]>([]);

  // 头像编辑弹窗
  const [showAvatarEdit, setShowAvatarEdit] = useState(false);
  const [avatarMode, setAvatarMode] = useState<"emoji" | "album" | "camera">("emoji");
  const [avatarCameraOn, setAvatarCameraOn] = useState<MediaStream | null>(null);
  const avatarVideoRef = useRef<HTMLVideoElement>(null);
  const avatarCanvasRef = useRef<HTMLCanvasElement>(null);

  // 背景编辑弹窗
  const [showBgEdit, setShowBgEdit] = useState(false);
  const [bgMode, setBgMode] = useState<"gradient" | "album" | "camera">("gradient");
  const [bgCameraOn, setBgCameraOn] = useState<MediaStream | null>(null);
  const bgVideoRef = useRef<HTMLVideoElement>(null);
  const bgCanvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      const savedAvatarImg = localStorage.getItem(`pd-avatar-img-${user.id}`);
      if (savedAvatarImg) {
        setAvatarImg(savedAvatarImg);
      } else {
        const savedAvatar = localStorage.getItem(`pd-avatar-${user.id}`);
        if (savedAvatar) setAvatar(savedAvatar);
        else {
          const random = PIXEL_AVATARS[Math.floor(Math.random() * PIXEL_AVATARS.length)];
          setAvatar(random);
          localStorage.setItem(`pd-avatar-${user.id}`, random);
        }
      }
      const savedBg = localStorage.getItem(`pd-profile-bg-${user.id}`);
      if (savedBg) setBgImg(savedBg);
      const savedGradient = localStorage.getItem(`pd-profile-gradient-${user.id}`);
      if (savedGradient) setBgGradient(savedGradient);
    }

    const savedBio = localStorage.getItem("pd-profile-bio");
    if (savedBio) setBio(savedBio);
    const savedTags = localStorage.getItem("pd-profile-tags");
    if (savedTags) setTags(JSON.parse(savedTags));
    const savedCity = localStorage.getItem("pd-profile-city");
    if (savedCity) setCity(savedCity);

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

  useEffect(() => {
    return () => {
      avatarCameraOn?.getTracks().forEach((t) => t.stop());
      bgCameraOn?.getTracks().forEach((t) => t.stop());
    };
  }, [avatarCameraOn, bgCameraOn]);

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

  const handleEmojiAvatar = (emoji: string) => {
    setAvatar(emoji);
    setAvatarImg(null);
    const user = getCurrentUser();
    if (user) {
      localStorage.setItem(`pd-avatar-${user.id}`, emoji);
      localStorage.removeItem(`pd-avatar-img-${user.id}`);
    }
    showToast("头像已更换", "success");
    setShowAvatarEdit(false);
  };

  const handleAvatarUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setAvatarImg(result);
      const user = getCurrentUser();
      if (user) localStorage.setItem(`pd-avatar-img-${user.id}`, result);
      showToast("头像已更新", "success");
      setShowAvatarEdit(false);
    };
    reader.readAsDataURL(file);
  };

  const startAvatarCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setAvatarCameraOn(stream);
      if (avatarVideoRef.current) {
        avatarVideoRef.current.srcObject = stream;
        avatarVideoRef.current.play();
      }
    } catch {
      showToast("无法访问摄像头，请确认已授予权限", "warning");
    }
  };

  const captureAvatar = () => {
    if (!avatarVideoRef.current || !avatarCanvasRef.current) return;
    const video = avatarVideoRef.current;
    const canvas = avatarCanvasRef.current;
    const size = Math.min(video.videoWidth, video.videoHeight);
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const sx = (video.videoWidth - size) / 2;
    const sy = (video.videoHeight - size) / 2;
    ctx.drawImage(video, sx, sy, size, size, 0, 0, size, size);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setAvatarImg(dataUrl);
    const user = getCurrentUser();
    if (user) localStorage.setItem(`pd-avatar-img-${user.id}`, dataUrl);
    avatarCameraOn?.getTracks().forEach((t) => t.stop());
    setAvatarCameraOn(null);
    showToast("头像已拍摄", "success");
    setShowAvatarEdit(false);
  };

  const handleBgGradient = (gradient: string) => {
    setBgGradient(gradient);
    setBgImg(null);
    const user = getCurrentUser();
    if (user) {
      localStorage.setItem(`pd-profile-gradient-${user.id}`, gradient);
      localStorage.removeItem(`pd-profile-bg-${user.id}`);
    }
    showToast("背景已更换", "success");
    setShowBgEdit(false);
  };

  const handleBgUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setBgImg(result);
      const user = getCurrentUser();
      if (user) localStorage.setItem(`pd-profile-bg-${user.id}`, result);
      showToast("背景已更新", "success");
      setShowBgEdit(false);
    };
    reader.readAsDataURL(file);
  };

  const startBgCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setBgCameraOn(stream);
      if (bgVideoRef.current) {
        bgVideoRef.current.srcObject = stream;
        bgVideoRef.current.play();
      }
    } catch {
      showToast("无法访问摄像头，请确认已授予权限", "warning");
    }
  };

  const captureBg = () => {
    if (!bgVideoRef.current || !bgCanvasRef.current) return;
    const video = bgVideoRef.current;
    const canvas = bgCanvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.85);
    setBgImg(dataUrl);
    const user = getCurrentUser();
    if (user) localStorage.setItem(`pd-profile-bg-${user.id}`, dataUrl);
    bgCameraOn?.getTracks().forEach((t) => t.stop());
    setBgCameraOn(null);
    showToast("背景已拍摄", "success");
    setShowBgEdit(false);
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

  const renderAvatarContent = () => {
    if (avatarImg) {
      return <img src={avatarImg} alt="头像" className="w-full h-full rounded-full object-cover" />;
    }
    return <span className="text-5xl">{avatar}</span>;
  };

  const renderBgStyle = (): React.CSSProperties => {
    if (bgImg) {
      return { backgroundImage: `url(${bgImg})`, backgroundSize: "cover", backgroundPosition: "center" };
    }
    return { background: bgGradient };
  };

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto">
        {/* 顶部背景区 */}
        <div
          className="relative h-40 rounded-2xl overflow-hidden"
          style={renderBgStyle()}
        >
          <button
            onClick={() => setShowBgEdit(true)}
            className="absolute top-3 right-3 p-2 rounded-full transition-transform hover:scale-110"
            style={{ background: "rgba(0,0,0,0.3)", backdropFilter: "blur(4px)" }}
          >
            <Camera className="w-4 h-4 text-white" />
          </button>
        </div>

        {/* 头像区 */}
        <div className="relative -mt-12 px-4">
          <div className="flex items-end gap-4">
            <button
              onClick={() => setShowAvatarEdit(true)}
              className="w-24 h-24 rounded-full flex items-center justify-center border-4 transition-transform hover:scale-105 relative overflow-hidden"
              style={{
                background: "var(--bg-primary)",
                borderColor: "var(--color-apricot)",
                boxShadow: "0 4px 12px rgba(0,0,0,0.1)",
              }}
            >
              {renderAvatarContent()}
              <span className="absolute bottom-0 right-0 w-6 h-6 rounded-full flex items-center justify-center" style={{ background: "var(--color-neon-orange)" }}>
                <Camera className="w-3 h-3 text-white" />
              </span>
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

        {/* 头像编辑弹窗 */}
        <AnimatePresence>
          {showAvatarEdit && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex items-center justify-center p-4"
              style={{ background: "rgba(0,0,0,0.5)" }}
              onClick={() => { setShowAvatarEdit(false); avatarCameraOn?.getTracks().forEach((t) => t.stop()); setAvatarCameraOn(null); }}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-sm rounded-2xl overflow-hidden"
                style={{ background: "var(--bg-primary)" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid var(--divider)" }}>
                  <h3 className="font-hand text-base font-bold" style={{ color: "var(--color-ink)" }}>修改头像</h3>
                  <button onClick={() => { setShowAvatarEdit(false); avatarCameraOn?.getTracks().forEach((t) => t.stop()); setAvatarCameraOn(null); }} className="p-1 rounded-lg hover:scale-110 transition-transform">
                    <X className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                  </button>
                </div>

                <div className="flex p-3 gap-2" style={{ borderBottom: "1px solid var(--divider)" }}>
                  {[
                    { id: "emoji", label: "表情", icon: Award },
                    { id: "album", label: "相册", icon: ImagePlus },
                    { id: "camera", label: "拍照", icon: Camera },
                  ].map((s) => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.id}
                        onClick={() => { setAvatarMode(s.id as any); avatarCameraOn?.getTracks().forEach((t) => t.stop()); setAvatarCameraOn(null); }}
                        className="flex-1 py-2 rounded-lg text-xs font-hand font-bold transition-all flex items-center justify-center gap-1.5"
                        style={avatarMode === s.id ? { background: "var(--color-neon-orange)", color: "#fff" } : { background: "rgba(43,58,103,0.06)", color: "var(--text-muted)" }}
                      >
                        <Icon className="w-3.5 h-3.5" /> {s.label}
                      </button>
                    );
                  })}
                </div>

                <div className="p-4">
                  {avatarMode === "emoji" && (
                    <div className="grid grid-cols-5 gap-2">
                      {PIXEL_AVATARS.map((emoji) => (
                        <button
                          key={emoji}
                          onClick={() => handleEmojiAvatar(emoji)}
                          className="aspect-square rounded-xl text-3xl flex items-center justify-center transition-all hover:scale-110"
                          style={{
                            background: avatar === emoji && !avatarImg ? "var(--color-apricot)" : "rgba(43,58,103,0.04)",
                            border: avatar === emoji && !avatarImg ? "2px solid var(--color-neon-orange)" : "2px solid transparent",
                          }}
                        >
                          {emoji}
                        </button>
                      ))}
                    </div>
                  )}

                  {avatarMode === "album" && (
                    <div>
                      <label className="block w-full p-6 rounded-xl border-2 border-dashed cursor-pointer transition-colors hover:opacity-80" style={{ borderColor: "var(--divider)", background: "rgba(43,58,103,0.03)" }}>
                        <input type="file" accept="image/*" onChange={handleAvatarUpload} className="hidden" />
                        <div className="text-center">
                          <ImagePlus className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
                          <p className="font-hand text-sm" style={{ color: "var(--text-secondary)" }}>点击选择照片</p>
                          <p className="text-[10px] font-hand mt-1" style={{ color: "var(--text-muted)" }}>建议正方形图片</p>
                        </div>
                      </label>
                    </div>
                  )}

                  {avatarMode === "camera" && (
                    <div>
                      {!avatarCameraOn ? (
                        <button onClick={startAvatarCamera} className="btn-neon w-full text-sm font-hand flex items-center justify-center gap-2">
                          <Camera className="w-4 h-4" /> 开启摄像头
                        </button>
                      ) : (
                        <div>
                          <video ref={avatarVideoRef} autoPlay playsInline className="w-full rounded-xl mb-3" style={{ maxHeight: "240px", objectFit: "cover" }} />
                          <div className="flex gap-2">
                            <button onClick={captureAvatar} className="btn-neon flex-1 text-sm font-hand flex items-center justify-center gap-2">
                              <Camera className="w-4 h-4" /> 拍照
                            </button>
                            <button
                              onClick={() => { avatarCameraOn?.getTracks().forEach((t) => t.stop()); setAvatarCameraOn(null); }}
                              className="flex-1 py-2.5 rounded-lg text-sm font-hand"
                              style={{ background: "rgba(43,58,103,0.06)", color: "var(--text-secondary)" }}
                            >
                              取消
                            </button>
                          </div>
                        </div>
                      )}
                      <canvas ref={avatarCanvasRef} className="hidden" />
                    </div>
                  )}
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 背景编辑弹窗 */}
        <AnimatePresence>
          {showBgEdit && (
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-[200] flex items-center justify-center p-4"
              style={{ background: "rgba(0,0,0,0.5)" }}
              onClick={() => { setShowBgEdit(false); bgCameraOn?.getTracks().forEach((t) => t.stop()); setBgCameraOn(null); }}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.9, y: 20 }}
                className="w-full max-w-sm rounded-2xl overflow-hidden"
                style={{ background: "var(--bg-primary)" }}
                onClick={(e) => e.stopPropagation()}
              >
                <div className="flex items-center justify-between p-4" style={{ borderBottom: "1px solid var(--divider)" }}>
                  <h3 className="font-hand text-base font-bold" style={{ color: "var(--color-ink)" }}>修改背景</h3>
                  <button onClick={() => { setShowBgEdit(false); bgCameraOn?.getTracks().forEach((t) => t.stop()); setBgCameraOn(null); }} className="p-1 rounded-lg hover:scale-110 transition-transform">
                    <X className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                  </button>
                </div>

                <div className="flex p-3 gap-2" style={{ borderBottom: "1px solid var(--divider)" }}>
                  {[
                    { id: "gradient", label: "渐变", icon: Palette },
                    { id: "album", label: "相册", icon: ImagePlus },
                    { id: "camera", label: "拍照", icon: Camera },
                  ].map((s) => {
                    const Icon = s.icon;
                    return (
                      <button
                        key={s.id}
                        onClick={() => { setBgMode(s.id as any); bgCameraOn?.getTracks().forEach((t) => t.stop()); setBgCameraOn(null); }}
                        className="flex-1 py-2 rounded-lg text-xs font-hand font-bold transition-all flex items-center justify-center gap-1.5"
                        style={bgMode === s.id ? { background: "var(--color-neon-orange)", color: "#fff" } : { background: "rgba(43,58,103,0.06)", color: "var(--text-muted)" }}
                      >
                        <Icon className="w-3.5 h-3.5" /> {s.label}
                      </button>
                    );
                  })}
                </div>

                <div className="p-4">
                  {bgMode === "gradient" && (
                    <div className="grid grid-cols-4 gap-2">
                      {BG_GRADIENTS.map((g, i) => (
                        <button
                          key={i}
                          onClick={() => handleBgGradient(g)}
                          className="aspect-video rounded-xl transition-all hover:scale-105 relative"
                          style={{
                            background: g,
                            border: bgGradient === g && !bgImg ? "2px solid var(--color-neon-orange)" : "2px solid transparent",
                          }}
                        >
                          {bgGradient === g && !bgImg && (
                            <Check className="w-4 h-4 text-white absolute top-1 right-1" />
                          )}
                        </button>
                      ))}
                    </div>
                  )}

                  {bgMode === "album" && (
                    <div>
                      <label className="block w-full p-6 rounded-xl border-2 border-dashed cursor-pointer transition-colors hover:opacity-80" style={{ borderColor: "var(--divider)", background: "rgba(43,58,103,0.03)" }}>
                        <input type="file" accept="image/*" onChange={handleBgUpload} className="hidden" />
                        <div className="text-center">
                          <ImagePlus className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
                          <p className="font-hand text-sm" style={{ color: "var(--text-secondary)" }}>点击选择照片</p>
                        </div>
                      </label>
                    </div>
                  )}

                  {bgMode === "camera" && (
                    <div>
                      {!bgCameraOn ? (
                        <button onClick={startBgCamera} className="btn-neon w-full text-sm font-hand flex items-center justify-center gap-2">
                          <Camera className="w-4 h-4" /> 开启摄像头
                        </button>
                      ) : (
                        <div>
                          <video ref={bgVideoRef} autoPlay playsInline className="w-full rounded-xl mb-3" style={{ maxHeight: "240px", objectFit: "cover" }} />
                          <div className="flex gap-2">
                            <button onClick={captureBg} className="btn-neon flex-1 text-sm font-hand flex items-center justify-center gap-2">
                              <Camera className="w-4 h-4" /> 拍照
                            </button>
                            <button
                              onClick={() => { bgCameraOn?.getTracks().forEach((t) => t.stop()); setBgCameraOn(null); }}
                              className="flex-1 py-2.5 rounded-lg text-sm font-hand"
                              style={{ background: "rgba(43,58,103,0.06)", color: "var(--text-secondary)" }}
                            >
                              取消
                            </button>
                          </div>
                        </div>
                      )}
                      <canvas ref={bgCanvasRef} className="hidden" />
                    </div>
                  )}
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
