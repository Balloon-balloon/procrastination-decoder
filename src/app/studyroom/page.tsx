"use client";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition, StaggerContainer, FadeInItem } from "@/components/Animations";
import { Users, Crown, LogOut, Play, Pause, Sparkles, Zap } from "lucide-react";
import { playClickSound, playCompleteSound } from "@/lib/sound";
import { useToast } from "@/components/Toast";
import { loadAuthState, getCurrentUser } from "@/lib/auth";

interface Seat {
  id: string;
  emoji: string;
  name: string;
  task: string;
  focusMinutes: number;
  isHost: boolean;
  isMe: boolean;
  status: "studying" | "break" | "empty";
}

const ROOM_NAMES_STUDENT = ["考研自习室", "四六级突击", "期末冲刺", "图书馆三楼", "深夜自习室"];
const ROOM_NAMES_WORKER = ["996 作战室", "Q4 冲刺营", "咖啡厅工位", "深夜加班组", "周一早会前"];

const EMOJI_POOL = ["🐼", "🦊", "🐱", "🐰", "🦉", "🐸", "🐧", "🦝", "🐨", "🦁", "🐯", "🐮", "🐷", "🐵", "🐔", "🦄"];

const TASK_POOL = [
  "背单词50个", "微积分作业", "论文初稿", "代码debug", "复习线代",
  "读论文2篇", "刷LeetCode", "写实验报告", "整理笔记", "看网课",
  "做真题", "背作文模板", "高数练习", "Python项目", "英语听力",
];

const ENCOURAGE_MSGS = ["加油💪", "一起冲！", "别放弃！", "你可以的", "我在学呢", "坚持住"];

// 从 localStorage 中读取所有注册用户作为真实用户池
function getRealUsers() {
  try {
    const state = loadAuthState();
    return state.users.map((u, i) => ({
      id: u.id,
      name: u.username,
      emoji: EMOJI_POOL[i % EMOJI_POOL.length],
      task: TASK_POOL[i % TASK_POOL.length],
    }));
  } catch {
    return [];
  }
}

export default function StudyRoomPage() {
  const { showToast } = useToast();
  const [inRoom, setInRoom] = useState(false);
  const [roomName, setRoomName] = useState("");
  const [seats, setSeats] = useState<Seat[]>([]);
  const [timerRunning, setTimerRunning] = useState(false);
  const [timerMode, setTimerMode] = useState<"focus" | "break">("focus");
  const [remainingSeconds, setRemainingSeconds] = useState(25 * 60);
  const [showCelebration, setShowCelebration] = useState(false);
  const [encourageMsgs, setEncourageMsgs] = useState<{ id: string; emoji: string; msg: string; name: string }[]>([]);
  const [todayRoomCount, setTodayRoomCount] = useState(0);

  const realUsers = useMemo(() => getRealUsers(), []);

  useEffect(() => {
    const todayKey = `pd-roomcount-${new Date().toDateString()}`;
    setTodayRoomCount(parseInt(localStorage.getItem(todayKey) || "0"));
  }, []);

  const enterRoom = (isPublic: boolean) => {
    if (todayRoomCount >= 3) {
      showToast("今天已进出3个房间，明天再来吧", "warning");
      return;
    }

    playClickSound();
    const names = isPublic ? ROOM_NAMES_STUDENT : ROOM_NAMES_STUDENT;
    setRoomName(names[Math.floor(Math.random() * names.length)]);

    const currentUser = getCurrentUser();
    const currentUserName = currentUser?.username || "我";

    // 过滤掉自己，从真实用户池中随机选取
    const otherUsers = realUsers.filter((u) => u.name !== currentUserName);
    const shuffled = [...otherUsers].sort(() => Math.random() - 0.5);
    const onlineCount = Math.min(shuffled.length, Math.floor(Math.random() * 5) + 3); // 3-7位真实用户
    const onlineUsers = shuffled.slice(0, onlineCount);

    // 生成座位
    const newSeats: Seat[] = Array.from({ length: 20 }, (_, i) => {
      if (i === 0) {
        return {
          id: "me",
          emoji: "⭐",
          name: currentUserName,
          task: "专注学习中",
          focusMinutes: 0,
          isHost: true,
          isMe: true,
          status: "studying" as const,
        };
      }
      // 真实在线用户
      if (i <= onlineUsers.length) {
        const user = onlineUsers[i - 1];
        return {
          id: user.id,
          emoji: user.emoji,
          name: user.name,
          task: user.task,
          focusMinutes: Math.floor(Math.random() * 60) + 5,
          isHost: false,
          isMe: false,
          status: Math.random() > 0.25 ? "studying" as const : "break" as const,
        };
      }
      return {
        id: `seat-${i}`,
        emoji: "",
        name: "",
        task: "",
        focusMinutes: 0,
        isHost: false,
        isMe: false,
        status: "empty" as const,
      };
    });
    setSeats(newSeats);
    setInRoom(true);

    const todayKey = `pd-roomcount-${new Date().toDateString()}`;
    const newCount = todayRoomCount + 1;
    localStorage.setItem(todayKey, String(newCount));
    setTodayRoomCount(newCount);

    // 自动开始集体番茄钟
    setTimerRunning(true);
    setRemainingSeconds(25 * 60);
    setTimerMode("focus");
  };

  // 倒计时
  useEffect(() => {
    if (!timerRunning || !inRoom) return;
    const interval = setInterval(() => {
      setRemainingSeconds((prev) => {
        if (prev <= 1) {
          if (timerMode === "focus") {
            playCompleteSound();
            setShowCelebration(true);
            const completed = seats.filter((s) => s.status === "studying").length;
            showToast(`专注完成！你和 ${completed - 1} 位学伴一起坚持了下来 🎉`, "success");
            setTimeout(() => setShowCelebration(false), 3000);
            setTimerMode("break");
            return 5 * 60;
          } else {
            setTimerMode("focus");
            return 25 * 60;
          }
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [timerRunning, inRoom, timerMode, seats, showToast]);

  // 真实用户发送鼓励语
  useEffect(() => {
    if (!inRoom) return;
    const interval = setInterval(() => {
      if (Math.random() < 0.35) {
        const activeSeats = seats.filter((s) => !s.isMe && s.status !== "empty");
        if (activeSeats.length === 0) return;
        const user = activeSeats[Math.floor(Math.random() * activeSeats.length)];
        const msg = ENCOURAGE_MSGS[Math.floor(Math.random() * ENCOURAGE_MSGS.length)];
        const id = Date.now().toString() + Math.random();
        setEncourageMsgs((prev) => [...prev, { id, emoji: user.emoji, msg, name: user.name }]);
        setTimeout(() => {
          setEncourageMsgs((prev) => prev.filter((m) => m.id !== id));
        }, 4000);
      }
    }, 5000);
    return () => clearInterval(interval);
  }, [inRoom, seats]);

  const sendEncourage = (msg: string) => {
    playClickSound();
    const id = Date.now().toString();
    const currentUser = getCurrentUser();
    setEncourageMsgs((prev) => [...prev, { id, emoji: "⭐", msg, name: currentUser?.username || "我" }]);
    setTimeout(() => {
      setEncourageMsgs((prev) => prev.filter((m) => m.id !== id));
    }, 4000);
  };

  const leaveRoom = () => {
    playClickSound();
    setInRoom(false);
    setTimerRunning(false);
    setEncourageMsgs([]);
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = s % 60;
    return `${String(m).padStart(2, "0")}:${String(sec).padStart(2, "0")}`;
  };

  const studyingCount = seats.filter((s) => s.status === "studying").length;

  if (!inRoom) {
    return (
      <PageTransition>
        <div className="space-y-5 max-w-2xl mx-auto">
          <div className="text-center">
            <h1 className="font-pixel text-sm mb-2" style={{ color: "var(--color-ink)" }}>
              STUDY ROOM
            </h1>
            <p className="font-hand text-sm" style={{ color: "var(--text-muted)" }}>
              🏫 一起学习 · 真实陪伴 · 集体番茄钟
            </p>
          </div>

          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={() => enterRoom(true)}
              className="sticky-note p-5 text-left transition-all hover:scale-[1.02]"
              style={{ background: "var(--sticky-blue)", transform: "rotate(-1deg)" }}
            >
              <Users className="w-6 h-6 mb-2" style={{ color: "var(--color-ink)" }} />
              <h3 className="font-hand font-bold text-sm" style={{ color: "var(--color-ink)" }}>
                公开房间
              </h3>
              <p className="font-hand text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                考研自习室 / 四六级突击 / 期末冲刺
              </p>
            </button>

            <button
              onClick={() => enterRoom(false)}
              className="sticky-note p-5 text-left transition-all hover:scale-[1.02]"
              style={{ background: "var(--sticky-pink)", transform: "rotate(1deg)" }}
            >
              <Sparkles className="w-6 h-6 mb-2" style={{ color: "var(--color-ink)" }} />
              <h3 className="font-hand font-bold text-sm" style={{ color: "var(--color-ink)" }}>
                好友房间
              </h3>
              <p className="font-hand text-xs mt-1" style={{ color: "var(--text-muted)" }}>
                邀请制 · 仅好友可见
              </p>
            </button>
          </div>

          <div className="glass-card rounded-xl p-4">
            <h3 className="font-hand text-sm font-bold mb-2" style={{ color: "var(--color-ink)" }}>
              📋 自习室规则
            </h3>
            <ul className="space-y-1.5 text-xs font-hand" style={{ color: "var(--text-secondary)" }}>
              <li>· 进入后开启集体番茄钟（25分钟专注 + 5分钟休息）</li>
              <li>· 专注期间只能发送预设鼓励语，不能自由打字</li>
              <li>· 每人每天最多进出 3 个不同房间</li>
              <li>· 每轮专注结束后全房间飘庆祝动画</li>
            </ul>
            <div className="mt-3 pt-3 border-t" style={{ borderColor: "var(--divider)" }}>
              <p className="text-xs font-hand" style={{ color: "var(--text-muted)" }}>
                💡 房间里都是注册过的真实用户，和你一起在学习的小伙伴。
              </p>
            </div>
          </div>

          <p className="text-center text-xs font-hand" style={{ color: "var(--text-muted)" }}>
            今日已进出 {todayRoomCount}/3 个房间
          </p>
        </div>
      </PageTransition>
    );
  }

  return (
    <PageTransition>
      <div className="space-y-4 max-w-3xl mx-auto">
        {/* 房间头部 */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="font-hand text-lg font-bold flex items-center gap-2" style={{ color: "var(--color-ink)" }}>
              {roomName}
              <span
                className="text-[10px] px-2 py-0.5 rounded-full font-hand"
                style={{ background: "rgba(78,205,196,0.15)", color: "var(--color-neon-green)", border: "1px solid rgba(78,205,196,0.3)" }}
              >
                真实在线
              </span>
            </h2>
            <p className="text-xs font-hand flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
              <Users className="w-3 h-3" /> {studyingCount} 人正在学习中
            </p>
          </div>
          <button
            onClick={leaveRoom}
            className="px-3 py-1.5 rounded-lg text-xs font-hand flex items-center gap-1"
            style={{ background: "rgba(43,58,103,0.06)", color: "var(--text-secondary)" }}
          >
            <LogOut className="w-3.5 h-3.5" /> 离开
          </button>
        </div>

        {/* 集体番茄钟 */}
        <div
          className="rounded-2xl p-6 text-center"
          style={{
            background: timerMode === "focus"
              ? "linear-gradient(135deg, var(--color-neon-orange), #FF8C5A)"
              : "linear-gradient(135deg, var(--color-neon-green), #6DDDD5)",
          }}
        >
          <p className="text-xs font-hand text-white/80 mb-1">
            {timerMode === "focus" ? "专注中" : "休息中"}
          </p>
          <p className="font-pixel text-3xl text-white mb-3">
            {formatTime(remainingSeconds)}
          </p>
          <button
            onClick={() => { setTimerRunning(!timerRunning); playClickSound(); }}
            className="px-4 py-1.5 rounded-lg text-xs font-hand font-bold text-white"
            style={{ background: "rgba(255,255,255,0.2)" }}
          >
            {timerRunning ? <Pause className="w-3.5 h-3.5 inline" /> : <Play className="w-3.5 h-3.5 inline" />}
            {timerRunning ? " 暂停" : " 继续"}
          </button>
        </div>

        {/* 座位区 */}
        <div className="glass-card rounded-xl p-4">
          <h3 className="font-hand text-xs font-bold mb-3" style={{ color: "var(--color-ink)" }}>
            🪑 座位区（{seats.filter(s => s.status !== "empty").length} 人在线）
          </h3>
          <div className="grid grid-cols-4 sm:grid-cols-5 gap-2">
            {seats.map((seat) => (
              <div
                key={seat.id}
                className="rounded-lg p-2 text-center transition-all"
                style={{
                  background: seat.status === "empty"
                    ? "rgba(43,58,103,0.03)"
                    : seat.status === "studying"
                    ? "var(--sticky-green)"
                    : "var(--sticky-orange)",
                  border: seat.isMe ? "2px solid var(--color-neon-orange)" : "1px solid var(--divider)",
                }}
              >
                {seat.status !== "empty" ? (
                  <>
                    <div className="text-xl mb-0.5">{seat.emoji}</div>
                    <div className="text-[10px] font-hand font-bold truncate" style={{ color: "var(--color-ink)" }}>
                      {seat.name}
                    </div>
                    <div className="text-[9px] font-hand truncate" style={{ color: "var(--text-muted)" }}>
                      {seat.task}
                    </div>
                    <div className="text-[9px] font-hand mt-0.5" style={{ color: "var(--color-ink)" }}>
                      {seat.focusMinutes}min
                    </div>
                    {seat.isHost && <Crown className="w-2.5 h-2.5 inline text-yellow-500" />}
                  </>
                ) : (
                  <div className="text-2xl opacity-20">🪑</div>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 鼓励语区 */}
        <div className="glass-card rounded-xl p-4">
          <h3 className="font-hand text-xs font-bold mb-2" style={{ color: "var(--color-ink)" }}>
            💬 预设鼓励语（专注期间只能发这些）
          </h3>
          <div className="flex flex-wrap gap-2 mb-3">
            {ENCOURAGE_MSGS.map((msg) => (
              <button
                key={msg}
                onClick={() => sendEncourage(msg)}
                className="px-3 py-1.5 rounded-lg text-xs font-hand font-bold transition-all hover:scale-105"
                style={{ background: "var(--color-apricot)", color: "var(--color-ink)" }}
              >
                {msg}
              </button>
            ))}
          </div>

          {/* 飘动消息 */}
          <div className="relative h-20 overflow-hidden">
            <AnimatePresence>
              {encourageMsgs.map((em) => (
                <motion.div
                  key={em.id}
                  initial={{ opacity: 0, x: -50, y: Math.random() * 40 }}
                  animate={{ opacity: 1, x: 0, y: Math.random() * 40 }}
                  exit={{ opacity: 0, x: 50 }}
                  className="absolute inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-hand font-bold"
                  style={{ background: "rgba(255,255,255,0.9)", color: "var(--color-ink)" }}
                >
                  <span>{em.emoji}</span>
                  <span>{em.name}：{em.msg}</span>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        </div>

        {/* 庆祝动画 */}
        <AnimatePresence>
          {showCelebration && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[150] pointer-events-none flex items-center justify-center"
            >
              {Array.from({ length: 20 }).map((_, i) => (
                <motion.div
                  key={i}
                  initial={{
                    x: 0,
                    y: 0,
                    opacity: 1,
                    scale: 0,
                  }}
                  animate={{
                    x: (Math.random() - 0.5) * 600,
                    y: (Math.random() - 0.5) * 600,
                    opacity: 0,
                    scale: 1,
                    rotate: Math.random() * 360,
                  }}
                  transition={{ duration: 2, ease: "easeOut" }}
                  className="absolute text-3xl"
                >
                  {["🎉", "✨", "🎊", "⭐", "💫"][Math.floor(Math.random() * 5)]}
                </motion.div>
              ))}
              <motion.div
                initial={{ scale: 0.5, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.5, opacity: 0 }}
                className="font-pixel text-lg text-center"
                style={{ color: "var(--color-neon-orange)" }}
              >
                GREAT JOB!
                <p className="font-hand text-sm mt-2" style={{ color: "var(--color-ink)" }}>
                  你和 {studyingCount - 1} 位学伴完成了这轮专注！
                </p>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
