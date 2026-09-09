"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Music, Volume2, VolumeX, Heart, Cloud, Upload, X, Play, Pause } from "lucide-react";

type Playlist = "kamasutra" | "rain" | "custom";

interface CustomTrack {
  name: string;
  url: string;
}

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
  custom: {
    label: "我的歌单",
    icon: Music,
    desc: "你上传的音乐",
    src: "",
  },
};

export function BackgroundMusic() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [volume, setVolume] = useState(0.3);
  const [playlist, setPlaylist] = useState<Playlist>("kamasutra");
  const [showPanel, setShowPanel] = useState(false);
  const [customTracks, setCustomTracks] = useState<CustomTrack[]>([]);
  const [currentTrackIndex, setCurrentTrackIndex] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // 加载自定义音乐
  useEffect(() => {
    const saved = localStorage.getItem("pd-custom-music");
    if (saved) {
      try {
        setCustomTracks(JSON.parse(saved));
      } catch {}
    }
  }, []);

  // 初始化 audio
  useEffect(() => {
    const audio = new Audio();
    audio.loop = true;
    audio.volume = volume;
    audioRef.current = audio;

    audio.addEventListener("ended", () => {
      // 自定义歌单播放下一首
      if (playlist === "custom" && customTracks.length > 1) {
        const next = (currentTrackIndex + 1) % customTracks.length;
        setCurrentTrackIndex(next);
      }
    });

    return () => {
      audio.pause();
      audioRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 获取当前播放源
  const getCurrentSrc = () => {
    if (playlist === "custom") {
      return customTracks[currentTrackIndex]?.url || "";
    }
    return PLAYLIST_CONFIG[playlist].src;
  };

  // 切换歌单时换源
  useEffect(() => {
    if (!audioRef.current) return;
    const wasPlaying = isPlaying;
    const src = getCurrentSrc();
    if (src) {
      audioRef.current.src = src;
      audioRef.current.volume = volume;
      if (wasPlaying) {
        audioRef.current.play().catch(() => {});
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playlist, currentTrackIndex]);

  // 音量变化
  useEffect(() => {
    if (audioRef.current) {
      audioRef.current.volume = volume;
    }
  }, [volume]);

  const startMusic = () => {
    if (!audioRef.current) return;
    const src = getCurrentSrc();
    if (!src) return;
    if (audioRef.current.src !== src) {
      audioRef.current.src = src;
    }
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

  const togglePlay = () => {
    if (isPlaying) {
      stopMusic();
    } else {
      startMusic();
    }
  };

  // 上传自定义音乐
  const handleUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newTracks: CustomTrack[] = [];
    Array.from(files).forEach((file) => {
      if (file.type.startsWith("audio/")) {
        const url = URL.createObjectURL(file);
        newTracks.push({ name: file.name.replace(/\.[^/.]+$/, ""), url });
      }
    });

    if (newTracks.length > 0) {
      const updated = [...customTracks, ...newTracks];
      setCustomTracks(updated);
      // 只保存元信息（名字和索引），URL 是 blob 不能持久化
      // 重新打开页面后需要重新上传
      localStorage.setItem("pd-custom-music-names", JSON.stringify(updated.map(t => t.name)));
    }

    e.target.value = "";
  };

  const removeTrack = (index: number) => {
    const updated = customTracks.filter((_, i) => i !== index);
    setCustomTracks(updated);
    if (currentTrackIndex >= updated.length && updated.length > 0) {
      setCurrentTrackIndex(updated.length - 1);
    }
    if (updated.length === 0 && playlist === "custom") {
      stopMusic();
      setPlaylist("kamasutra");
    }
  };

  const playTrack = (index: number) => {
    setCurrentTrackIndex(index);
    setPlaylist("custom");
    setTimeout(() => startMusic(), 50);
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

  const currentTrackName = playlist === "custom"
    ? customTracks[currentTrackIndex]?.name || "暂无音乐"
    : PLAYLIST_CONFIG[playlist].label;

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
            style={{ width: "260px" }}
          >
            {/* 当前播放 */}
            <div className="mb-3 pb-3" style={{ borderBottom: "1px solid var(--divider)" }}>
              <p className="text-[10px] font-hand mb-1" style={{ color: "var(--text-muted)" }}>
                当前播放
              </p>
              <p className="text-sm font-bold font-hand truncate" style={{ color: "var(--text-primary)" }}>
                {currentTrackName}
              </p>
            </div>

            {/* 歌单列表 */}
            <div className="space-y-1 mb-3 max-h-40 overflow-y-auto">
              <p className="text-[10px] font-hand mb-1" style={{ color: "var(--text-muted)" }}>
                推荐歌单
              </p>
              {(Object.keys(PLAYLIST_CONFIG) as Playlist[]).filter(k => k !== "custom").map((key) => {
                const config = PLAYLIST_CONFIG[key];
                const Icon = config.icon;
                const isActive = playlist === key;
                return (
                  <button
                    key={key}
                    onClick={() => { setPlaylist(key); startMusic(); }}
                    className="w-full flex items-center gap-2 p-2 rounded-lg transition-all"
                    style={{ background: isActive ? "var(--color-apricot)" : "transparent" }}
                  >
                    <Icon className="w-4 h-4" style={{ color: isActive ? "var(--color-ink)" : "var(--text-muted)" }} />
                    <div className="text-left flex-1">
                      <p className="text-xs font-bold font-hand" style={{ color: isActive ? "var(--color-ink)" : "var(--text-primary)" }}>
                        {config.label}
                      </p>
                    </div>
                    {isActive && isPlaying && (
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

              {/* 自定义歌单 */}
              {customTracks.length > 0 && (
                <>
                  <p className="text-[10px] font-hand mt-2 mb-1" style={{ color: "var(--text-muted)" }}>
                    我的音乐
                  </p>
                  {customTracks.map((track, i) => {
                    const isActive = playlist === "custom" && currentTrackIndex === i;
                    return (
                      <div
                        key={i}
                        className="flex items-center gap-2 p-2 rounded-lg"
                        style={{ background: isActive ? "var(--color-apricot)" : "transparent" }}
                      >
                        <button
                          onClick={() => playTrack(i)}
                          className="flex-1 flex items-center gap-2 text-left"
                        >
                          <Music className="w-3.5 h-3.5" style={{ color: isActive ? "var(--color-ink)" : "var(--text-muted)" }} />
                          <span className="text-xs font-hand truncate" style={{ color: isActive ? "var(--color-ink)" : "var(--text-primary)" }}>
                            {track.name}
                          </span>
                        </button>
                        <button
                          onClick={(e) => { e.stopPropagation(); removeTrack(i); }}
                          className="p-1 rounded hover:bg-black/10"
                        >
                          <X className="w-3 h-3" style={{ color: "var(--text-muted)" }} />
                        </button>
                      </div>
                    );
                  })}
                </>
              )}
            </div>

            {/* 上传按钮 */}
            <button
              onClick={() => fileInputRef.current?.click()}
              className="w-full flex items-center justify-center gap-2 py-2 rounded-lg text-xs font-hand mb-3 transition-all hover:opacity-80"
              style={{ background: "rgba(43,58,103,0.06)", color: "var(--text-secondary)" }}
            >
              <Upload className="w-3.5 h-3.5" /> 上传本地音乐
            </button>
            <input
              ref={fileInputRef}
              type="file"
              accept="audio/*"
              multiple
              onChange={handleUpload}
              className="hidden"
            />

            {/* 音量 */}
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

            {/* 播放/暂停按钮 */}
            <button
              onClick={togglePlay}
              className="btn-neon w-full text-xs font-hand flex items-center justify-center gap-2"
            >
              {isPlaying ? (
                <><Pause className="w-3.5 h-3.5" /> 暂停音乐</>
              ) : (
                <><Play className="w-3.5 h-3.5" /> 播放音乐</>
              )}
            </button>

            <p className="text-[9px] font-hand text-center mt-2" style={{ color: "var(--text-muted)" }}>
              💡 上传的音乐只保存在本地
            </p>
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
