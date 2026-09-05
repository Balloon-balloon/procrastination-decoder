"use client";
import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { playDogBarkSound } from "@/lib/sound";

type DogState = "alert" | "idle" | "sleeping";

const QUOTES_SNARKY = [
  "哟，又来摸鱼了？本汪盯着你呢 🐶",
  "拖延指数正在上升...需要本汪推你一把吗？",
  "汪汪！你已经在发呆了...该回去干活了！",
  "打盹是被允许的，但只限本狗。你，去干活！",
  "检测到拖延信号！8-bit 警报：你该启动了！",
  "本汪都醒了，你还在拖延？快点动起来！",
  "你的任务列表在哭泣，听到了吗？😤",
];

const QUOTES_WARM = [
  "每一步都算数，你做得很好 💚",
  "慢慢来，比较快。你找到了自己的节奏 🌿",
  "本汪相信你！你比昨天更强了 💪",
  "休息也是前进的一部分，别太苛责自己 🌟",
  "完成了就摸摸本汪的头吧！🐶",
  "你正在变成更好的自己，继续加油 ✨",
];

export function PixelDog() {
  const [dogState, setDogState] = useState<DogState>("alert");
  const [showQuote, setShowQuote] = useState(false);
  const [quote, setQuote] = useState("");
  const [isWagging, setIsWagging] = useState(false);
  const [petCount, setPetCount] = useState(0);
  const lastInteractionRef = useRef<number>(Date.now());
  const idleTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const updateInteraction = useCallback(() => {
    lastInteractionRef.current = Date.now();
    setDogState("alert");
  }, []);

  useEffect(() => {
    window.addEventListener("click", updateInteraction);
    window.addEventListener("keydown", updateInteraction);
    window.addEventListener("mousemove", updateInteraction);

    idleTimerRef.current = setInterval(() => {
      const idleTime = Date.now() - lastInteractionRef.current;
      if (idleTime > 180000) {
        setDogState("sleeping");
        if (Math.random() < 0.3) {
          setQuote("本汪打了个哈欠...你还在吗？💤");
          setShowQuote(true);
          setTimeout(() => setShowQuote(false), 4000);
        }
      } else if (idleTime > 60000) {
        setDogState("idle");
      }
    }, 10000);

    return () => {
      window.removeEventListener("click", updateInteraction);
      window.removeEventListener("keydown", updateInteraction);
      window.removeEventListener("mousemove", updateInteraction);
      if (idleTimerRef.current) clearInterval(idleTimerRef.current);
    };
  }, [updateInteraction]);

  const handlePet = () => {
    updateInteraction();
    playDogBarkSound();
    setIsWagging(true);
    setPetCount((c) => c + 1);
    setTimeout(() => setIsWagging(false), 1500);

    const isSnarky = Math.random() > 0.4;
    const pool = isSnarky ? QUOTES_SNARKY : QUOTES_WARM;
    setQuote(pool[Math.floor(Math.random() * pool.length)]);
    setShowQuote(true);
    setTimeout(() => setShowQuote(false), 4000);
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 z-50 flex flex-col items-end gap-2">
      <AnimatePresence>
        {showQuote && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.8 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.8 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="px-4 py-2.5 rounded-2xl text-xs font-bold max-w-[220px] text-right"
            style={{
              background: "var(--color-neon-orange)",
              color: "#fff",
              boxShadow: "0 4px 12px rgba(255, 107, 53, 0.3)",
            }}
          >
            {quote}
            <div
              className="absolute bottom-0 right-8 w-3 h-3 rotate-45 translate-y-1"
              style={{ background: "var(--color-neon-orange)" }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={handlePet}
        data-guide="dog"
        className="relative cursor-pointer group"
        title="点我互动！"
        aria-label="像素小狗助手"
      >
        <div
          className="absolute inset-0 rounded-full blur-md group-hover:blur-lg transition-all"
          style={{
            background: "radial-gradient(circle, rgba(255,107,53,0.25) 0%, transparent 70%)",
            animation: "spotlight 3s ease-in-out infinite",
          }}
        />
        <div
          className="absolute -inset-1 rounded-full"
          style={{
            background: "radial-gradient(circle, rgba(250,214,165,0.2) 0%, transparent 70%)",
            animation: "dogSnore 2s ease-in-out infinite",
          }}
        />
        <svg
          width="64"
          height="64"
          viewBox="0 0 16 16"
          shapeRendering="crispEdges"
          className="relative z-10 transition-transform group-hover:scale-110"
          style={{
            filter: "drop-shadow(2px 2px 0 rgba(43,58,103,0.15))",
          }}
        >
          {dogState === "sleeping" ? (
            <>
              {/* 趴下睡觉 */}
              <rect x="2" y="10" width="12" height="3" fill="#C49A6C" />
              <rect x="2" y="9" width="4" height="3" fill="#D4A574" />
              <rect x="3" y="8" width="3" height="2" fill="#C49A6C" />
              <rect x="3" y="8" width="1" height="1" fill="#2B3A67" />
              <rect x="12" y="9" width="2" height="1" fill="#8B5E3C" />
              {/* ZZZ */}
              <rect x="6" y="4" width="1" height="1" fill="#5A6480" className="star-twinkle" />
              <rect x="8" y="2" width="1" height="1" fill="#8B93A8" />
              <rect x="10" y="0" width="1" height="1" fill="#5A6480" className="star-twinkle" />
              {/* 气泡 */}
              <rect x="5" y="6" width="3" height="1" fill="rgba(250,214,165,0.4)" />
            </>
          ) : dogState === "idle" ? (
            <>
              {/* 闲置趴着 */}
              <rect x="2" y="8" width="12" height="4" fill="#C49A6C" />
              <rect x="2" y="7" width="5" height="3" fill="#D4A574" />
              <rect x="3" y="7" width="2" height="2" fill="#8B5E3C" />
              <rect x="4" y="8" width="1" height="1" fill="#2B3A67" />
              <rect x="6" y="8" width="1" height="1" fill="#2B3A67" />
              <rect x="4" y="10" width="2" height="1" fill="#8B5E3C" />
              {/* 尾巴微动 */}
              <rect x="13" y="7" width="1" height="2" fill="#C49A6C" style={{ transform: isWagging ? "rotate(20deg)" : "rotate(0deg)", transformOrigin: "13px 8px", transition: "transform 0.2s" }} />
              {/* 哈欠气泡 */}
              <rect x="6" y="4" width="2" height="1" fill="rgba(250,214,165,0.4)" />
              <rect x="5" y="5" width="4" height="1" fill="rgba(250,214,165,0.3)" />
            </>
          ) : (
            <>
              {/* 竖耳端坐 */}
              <rect x="3" y="1" width="2" height="2" fill="#8B5E3C" />
              <rect x="11" y="1" width="2" height="2" fill="#8B5E3C" />
              <rect x="3" y="2" width="10" height="6" fill="#C49A6C" />
              <rect x="4" y="2" width="8" height="1" fill="#D4A574" />
              {/* 眼睛 */}
              <rect x="5" y="4" width="1" height="1" fill="#2B3A67" />
              <rect x="10" y="4" width="1" height="1" fill="#2B3A67" />
              {/* 鼻子 */}
              <rect x="7" y="6" width="2" height="1" fill="#2B3A67" />
              {/* 身体 */}
              <rect x="3" y="8" width="10" height="4" fill="#C49A6C" />
              {/* 腿 */}
              <rect x="3" y="12" width="2" height="2" fill="#8B5E3C" />
              <rect x="11" y="12" width="2" height="2" fill="#8B5E3C" />
              {/* 尾巴摇 */}
              <g style={{ transformOrigin: "13px 8px", animation: isWagging ? "pixelBounce 0.2s ease-in-out 5" : "none" }}>
                <rect x="13" y="7" width="1" height="2" fill="#C49A6C" />
                <rect x="14" y="6" width="1" height="1" fill="#C49A6C" />
              </g>
              {/* 围巾 */}
              <rect x="3" y="7" width="10" height="1" fill="#FF6B35" />
            </>
          )}
        </svg>
        {/* 底座 */}
        <div
          className="absolute -bottom-1 left-1/2 -translate-x-1/2 w-10 h-1.5 rounded-full"
          style={{ background: "rgba(43, 58, 103, 0.1)" }}
        />
        {/* 互动计数 */}
        {petCount > 0 && (
          <div
            className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold z-20"
            style={{ background: "var(--color-neon-orange)", color: "#fff" }}
          >
            {petCount > 9 ? "9+" : petCount}
          </div>
        )}
      </button>
    </div>
  );
}
