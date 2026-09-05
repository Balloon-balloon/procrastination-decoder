"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Volume2, VolumeX, Heart, Cloud, Guitar } from "lucide-react";

type Playlist = "kamasutra" | "rain" | "acoustic";

const PLAYLIST_CONFIG: Record<
  Playlist,
  { label: string; icon: typeof Music; desc: string; src: string }
> = {
  kamasutra: {
    label: "Kamasutra",
    icon: Heart,
    desc: "原曲 · 无限循环",
    src: "/whywait.mp3",
  },
  rain: {
    label: "雨声轻音",
    icon: Cloud,
    desc: "白噪音+旋律",
    src: "/whywait.mp3",
  },
  acoustic: {
    label: "轻电子原声",
    icon: Guitar,
    desc: "原声吉他风",
    src: "/whywait.mp3",
  },
};

export function BackgroundMusic() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [playlist, setPlaylist] = useState<Playlist>("kamasutra");
  const [showPanel, setShowPanel] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // 初始化 audio
  useEffect(() => {
    const audio = new Audio(PLAYLIST_CONFIG[playlist].src);
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;

    return () => {
      audio.pause();
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 切换歌单时换源
  useEffect(() => {
    if (!audioRef.current) return;
    const wasPlaying = isPlaying;
    audioRef.current.src = PLAYLIST_CONFIG[playlist].src;
    audioRef.current.volume = volume;
    if (wasPlaying) {
      audioRef.current.play().catch(() => {});
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlist]);

  // 音量变化
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const startMusic = () => {
    if (!audioRef.current) return;
    audioRef.current.play().then(() => {
      setIsPlaying(true);
    }).catch(() => {
      // 浏览器策略：需要用户交互
    });
  };

  const stopMusic = () => {
    if (!audioRef.current) return;
    audioRef.current.pause();
    setIsPlaying(false);
  };

  // 首次点击激活音乐 + 全局点击涟漪特效
  useEffect(() => {
    let firstClick = true;

    const handleClick = (e: MouseEvent) => {
      // 涟漪特效（每次点击都触发）
      const ripple = document.createElement("div");
      ripple.style.cssText = `
        position: fixed;
        left: ${e.clientX - 10}px;
        top: ${e.clientY - 10}px;
        width: 20px;
        height: 20px;
        border-radius: 50%;
        background: radial-gradient(circle, var(--color-neon-orange) 0%, transparent 70%);
        pointer-events: none;
        z-index: 9999;
        animation: rippleExpand 0.6s ease-out forwards;
      `;
      document.body.appendChild(ripple);
      setTimeout(() => ripple.remove(), 600);

      // 首次点击激活音乐
      if (firstClick) {
        firstClick = false;
        if (!isPlaying && audioRef.current) {
          startMusic();
        }
      }
    };

    // 注入 keyframes（只注入一次）
    const styleEl = document.createElement("style");
    styleEl.textContent = `
      @keyframes rippleExpand {
        0% { transform: scale(0); opacity: 0.8; }
        100% { transform: scale(8); opacity: 0; }
      }
    `;
    document.head.appendChild(styleEl);

    window.addEventListener("click", handleClick);
    return () => {
      window.removeEventListener("click", handleClick);
      styleEl.remove();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isPlaying]);

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 z-50">
      <AnimatePresence>
        {showPanel && (
          <motion.div
            initial={{ opacity: 0, y: 10, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 400, damping: 25 }}
            className="mb-2 p-4 rounded-2xl glass-card"
            style={{ width: "240px" }}
          >
            <div className="space-y-2 mb-4">
              <p className="text-xs font-bold font-hand mb-2" style={{ color: "var(--text-muted)" }}>
                歌单
              </p>
              {(Object.keys(PLAYLIST_CONFIG) as Playlist[]).map((key) => {
                const config = PLAYLIST_CONFIG[key];
                const Icon = config.icon;
                const isActive = playlist === key;
                return (
                  <button
                    key={key}
                    onClick={() => setPlaylist(key)}
                    className="w-full flex items-center gap-3 p-2 rounded-lg transition-all"
                    style={{ background: isActive ? "var(--color-apricot)" : "transparent" }}
                  >
                    <Icon className="w-4 h-4" style={{ color: isActive ? "var(--color-ink)" : "var(--text-muted)" }} />
                    <div className="text-left flex-1">
                      <p className="text-xs font-bold font-hand" style={{ color: isActive ? "var(--color-ink)" : "var(--text-primary)" }}>
                        {config.label}
                      </p>
                      <p className="text-[10px] font-hand" style={{ color: "var(--text-muted)" }}>
                        {config.desc}
                      </p>
                    </div>
                    {isActive && (
                      <div className="flex gap-0.5">
                        {[0, 1, 2].map((i) => (
                          <div
                            key={i}
                            className="w-0.5 rounded-full"
                            style={{
                              height: "8px",
                              background: "var(--color-ink)",
                              animation: `pixelBounce 0.4s ease-in-out ${i * 0.1}s infinite alternate`,
                            }}
                          />
                        ))}
                      </div>
                    )}
                  </button>
                );
              })}
            </div>

            <div className="mb-3">
              <div className="flex items-center justify-between mb-1.5">
                <p className="text-xs font-bold font-hand" style={{ color: "var(--text-muted)" }}>
                  音量
                </p>
                <span className="text-xs font-bold font-hand" style={{ color: "var(--color-ink)" }}>
                  {Math.round(volume * 100)}%
                </span>
              </div>
              <input
                type="range"
                min="0"
                max="1"
                step="0.05"
                value={volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-full h-2 rounded-full appearance-none cursor-pointer"
                style={{
                  background: `linear-gradient(to right, var(--color-neon-orange) ${volume * 100}%, var(--divider) ${volume * 100}%)`,
                }}
              />
            </div>

            <button
              onClick={() => (isPlaying ? stopMusic() : startMusic())}
              className="btn-neon w-full text-xs font-hand flex items-center justify-center gap-2"
            >
              {isPlaying ? (
                <><VolumeX className="w-3.5 h-3.5" /> 暂停音乐</>
              ) : (
                <><Volume2 className="w-3.5 h-3.5" /> 播放音乐</>
              )}
            </button>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setShowPanel(!showPanel)}
        className="p-2.5 rounded-full transition-all hover:scale-110"
        style={{
          background: "var(--bg-card)",
          border: "1px solid var(--card-border)",
          boxShadow: "var(--card-shadow)",
          backdropFilter: "blur(8px)",
        }}
        title="背景音乐"
      >
        {isPlaying ? (
          <div className="flex gap-0.5 items-end h-4">
            {[0, 1, 2, 3].map((i) => (
              <div
                key={i}
                className="w-0.5 rounded-full"
                style={{
                  background: "var(--color-neon-orange)",
                  height: "100%",
                  animation: `pixelBounce 0.5s ease-in-out ${i * 0.12}s infinite alternate`,
                }}
              />
            ))}
          </div>
        ) : (
          <Music className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
        )}
      </button>
    </div>
  );
}
