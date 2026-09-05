"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Palette,
  ImagePlus,
  Camera,
  X,
  Check,
  Sun,
  Moon,
} from "lucide-react";

type ThemeColor = {
  id: string;
  name: string;
  colors: { bg: string; apricot: string; ink: string; neonOrange: string; neonGreen: string };
};

const THEME_COLORS: ThemeColor[] = [
  { id: "warm", name: "暖杏", colors: { bg: "#FDF6E3", apricot: "#FAD6A5", ink: "#2B3A67", neonOrange: "#FF6B35", neonGreen: "#4ECDC4" } },
  { id: "ink", name: "墨蓝", colors: { bg: "#1A2440", apricot: "#FAD6A5", ink: "#E8EAF0", neonOrange: "#FF6B35", neonGreen: "#4ECDC4" } },
  { id: "mint", name: "薄荷", colors: { bg: "#E8F5F3", apricot: "#A5D6BC", ink: "#2B5A50", neonOrange: "#FF8C5A", neonGreen: "#2E9A92" } },
  { id: "sakura", name: "樱花粉", colors: { bg: "#FFF0F3", apricot: "#FFCDD2", ink: "#6B2D3C", neonOrange: "#FF6B6B", neonGreen: "#7FD8BE" } },
  { id: "lavender", name: "薰衣草", colors: { bg: "#F0EBF8", apricot: "#D4C5E8", ink: "#3D2B5A", neonOrange: "#FF8C5A", neonGreen: "#7FD8C4" } },
  { id: "sunset", name: "日落橙", colors: { bg: "#FFF3E0", apricot: "#FFCC80", ink: "#4A2C14", neonOrange: "#FF5722", neonGreen: "#66BB6A" } },
  { id: "ocean", name: "深海蓝", colors: { bg: "#0D1B2A", apricot: "#5C7A99", ink: "#E0E7EE", neonOrange: "#FF8C42", neonGreen: "#48CAE4" } },
  { id: "forest", name: "森林绿", colors: { bg: "#F0F4EC", apricot: "#C5D5B5", ink: "#2B4A1A", neonOrange: "#FF8C42", neonGreen: "#5A8A3A" } },
  { id: "dark", name: "暗夜黑", colors: { bg: "#121212", apricot: "#333333", ink: "#E0E0E0", neonOrange: "#FF6B35", neonGreen: "#4ECDC4" } },
  { id: "white", name: "极简白", colors: { bg: "#FFFFFF", apricot: "#F5F5F5", ink: "#1A1A1A", neonOrange: "#FF6B35", neonGreen: "#4ECDC4" } },
];

export function BackgroundSetup() {
  const [show, setShow] = useState(false);
  const [step, setStep] = useState<"theme" | "image" | "camera">("theme");
  const [selectedTheme, setSelectedTheme] = useState<string>("warm");
  const [customBg, setCustomBg] = useState<string | null>(null);
  const [blurAmount, setBlurAmount] = useState(8);
  const [overlayOpacity, setOverlayOpacity] = useState(0.3);
  const [cameraStream, setCameraStream] = useState<MediaStream | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  useEffect(() => {
    const hasSeen = localStorage.getItem("pd-bg-setup-done");
    if (!hasSeen) {
      const timer = setTimeout(() => setShow(true), 500);
      return () => clearTimeout(timer);
    }
  }, []);

  const applyTheme = (themeId: string) => {
    const theme = THEME_COLORS.find((t) => t.id === themeId);
    if (!theme) return;
    const root = document.documentElement;
    root.style.setProperty("--bg-primary", theme.colors.bg);
    root.style.setProperty("--color-apricot", theme.colors.apricot);
    root.style.setProperty("--color-ink", theme.colors.ink);
    root.style.setProperty("--color-neon-orange", theme.colors.neonOrange);
    root.style.setProperty("--color-neon-green", theme.colors.neonGreen);
  };

  const handleSelectTheme = (themeId: string) => {
    setSelectedTheme(themeId);
    applyTheme(themeId);
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => {
      const result = reader.result as string;
      setCustomBg(result);
      applyBgImage(result);
    };
    reader.readAsDataURL(file);
  };

  const applyBgImage = (dataUrl: string) => {
    const bgLayer = document.querySelector(".custom-bg-layer") as HTMLElement;
    if (bgLayer) {
      bgLayer.style.backgroundImage = `url(${dataUrl})`;
      bgLayer.style.filter = `blur(${blurAmount}px)`;
      bgLayer.style.opacity = "1";
    }
    localStorage.setItem("pd-custom-bg", dataUrl);
    localStorage.setItem("pd-blur", String(blurAmount));
    localStorage.setItem("pd-overlay", String(overlayOpacity));
  };

  const startCamera = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        videoRef.current.play();
      }
    } catch (err) {
      console.error("Camera access failed:", err);
      alert("无法访问摄像头，请确认已授予权限");
    }
  };

  const capturePhoto = () => {
    if (!videoRef.current || !canvasRef.current) return;
    const video = videoRef.current;
    const canvas = canvasRef.current;
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.drawImage(video, 0, 0);
    const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
    setCustomBg(dataUrl);
    applyBgImage(dataUrl);
    cameraStream?.getTracks().forEach((t) => t.stop());
    setCameraStream(null);
    setStep("theme");
  };

  useEffect(() => {
    if (cameraStream && videoRef.current) {
      videoRef.current.srcObject = cameraStream;
      videoRef.current.play();
    }
    return () => {
      cameraStream?.getTracks().forEach((t) => t.stop());
    };
  }, [cameraStream]);

  const handleFinish = () => {
    localStorage.setItem("pd-bg-setup-done", "true");
    localStorage.setItem("pd-theme", selectedTheme);
    setShow(false);
  };

  useEffect(() => {
    if (customBg) {
      applyBgImage(customBg);
    }
  }, [blurAmount, overlayOpacity]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[200] flex items-center justify-center p-4"
          style={{ background: "rgba(0,0,0,0.5)", backdropFilter: "blur(4px)" }}
        >
          <motion.div
            initial={{ scale: 0.9, y: 20 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.9, y: 20 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="w-full max-w-lg rounded-2xl overflow-hidden"
            style={{ background: "var(--bg-primary)", maxHeight: "90vh", overflow: "auto" }}
          >
            {/* 头部 */}
            <div className="p-5 flex items-center justify-between" style={{ borderBottom: "1px solid var(--divider)" }}>
              <div>
                <h2 className="font-pixel text-xs" style={{ color: "var(--color-ink)" }}>
                  WELCOME!
                </h2>
                <p className="font-hand text-sm mt-1" style={{ color: "var(--text-muted)" }}>
                  个性化你的背景
                </p>
              </div>
              <button onClick={handleFinish} className="p-1.5 rounded-lg hover:scale-110 transition-transform" style={{ color: "var(--text-muted)" }}>
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* 步骤选择 */}
            <div className="flex p-3 gap-2" style={{ borderBottom: "1px solid var(--divider)" }}>
              {[
                { id: "theme", label: "主题色", icon: Palette },
                { id: "image", label: "相册", icon: ImagePlus },
                { id: "camera", label: "相机", icon: Camera },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <button
                    key={s.id}
                    onClick={() => setStep(s.id as any)}
                    className="flex-1 py-2 rounded-lg text-xs font-hand font-bold transition-all flex items-center justify-center gap-1.5"
                    style={step === s.id ? { background: "var(--color-neon-orange)", color: "#fff" } : { background: "rgba(43,58,103,0.06)", color: "var(--text-muted)" }}
                  >
                    <Icon className="w-3.5 h-3.5" /> {s.label}
                  </button>
                );
              })}
            </div>

            {/* 内容 */}
            <div className="p-5">
              {step === "theme" && (
                <div>
                  <p className="font-hand text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
                    选择一个你喜欢的主题配色 🎨
                  </p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {THEME_COLORS.map((theme) => (
                      <button
                        key={theme.id}
                        onClick={() => handleSelectTheme(theme.id)}
                        className="relative p-3 rounded-xl transition-all hover:scale-105"
                        style={{
                          background: theme.colors.bg,
                          border: selectedTheme === theme.id ? `2px solid ${theme.colors.neonOrange}` : "2px solid transparent",
                        }}
                      >
                        <div className="flex gap-1 mb-2">
                          <div className="w-4 h-4 rounded-full" style={{ background: theme.colors.apricot }} />
                          <div className="w-4 h-4 rounded-full" style={{ background: theme.colors.ink }} />
                          <div className="w-4 h-4 rounded-full" style={{ background: theme.colors.neonOrange }} />
                          <div className="w-4 h-4 rounded-full" style={{ background: theme.colors.neonGreen }} />
                        </div>
                        <span className="font-hand text-xs font-bold" style={{ color: theme.colors.ink }}>
                          {theme.name}
                        </span>
                        {selectedTheme === theme.id && (
                          <div className="absolute top-1 right-1 w-5 h-5 rounded-full flex items-center justify-center" style={{ background: theme.colors.neonOrange }}>
                            <Check className="w-3 h-3 text-white" />
                          </div>
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {step === "image" && (
                <div>
                  <p className="font-hand text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
                    上传一张照片作为背景 📸
                  </p>
                  <label className="block w-full p-6 rounded-xl border-2 border-dashed cursor-pointer transition-colors hover:opacity-80" style={{ borderColor: "var(--divider)", background: "rgba(43,58,103,0.03)" }}>
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                    <div className="text-center">
                      <ImagePlus className="w-8 h-8 mx-auto mb-2" style={{ color: "var(--text-muted)" }} />
                      <p className="font-hand text-sm" style={{ color: "var(--text-secondary)" }}>
                        点击选择照片
                      </p>
                    </div>
                  </label>
                  {customBg && (
                    <div className="mt-4 space-y-3">
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="font-hand text-xs" style={{ color: "var(--text-muted)" }}>模糊度</span>
                          <span className="font-hand text-xs font-bold" style={{ color: "var(--color-ink)" }}>{blurAmount}px</span>
                        </div>
                        <input type="range" min="0" max="20" value={blurAmount} onChange={(e) => setBlurAmount(Number(e.target.value))} className="w-full" />
                      </div>
                      <div>
                        <div className="flex justify-between mb-1">
                          <span className="font-hand text-xs" style={{ color: "var(--text-muted)" }}>蒙层透明度</span>
                          <span className="font-hand text-xs font-bold" style={{ color: "var(--color-ink)" }}>{Math.round(overlayOpacity * 100)}%</span>
                        </div>
                        <input type="range" min="0" max="0.8" step="0.05" value={overlayOpacity} onChange={(e) => setOverlayOpacity(Number(e.target.value))} className="w-full" />
                      </div>
                      <div className="rounded-xl overflow-hidden" style={{ height: "120px", backgroundImage: `url(${customBg})`, backgroundSize: "cover", backgroundPosition: "center", filter: `blur(${blurAmount}px)` }} />
                    </div>
                  )}
                </div>
              )}

              {step === "camera" && (
                <div>
                  <p className="font-hand text-sm mb-3" style={{ color: "var(--text-secondary)" }}>
                    拍一张照片作为背景 📷
                  </p>
                  {!cameraStream ? (
                    <button onClick={startCamera} className="btn-neon w-full text-sm font-hand flex items-center justify-center gap-2">
                      <Camera className="w-4 h-4" /> 开启摄像头
                    </button>
                  ) : (
                    <div>
                      <video ref={videoRef} autoPlay playsInline className="w-full rounded-xl mb-3" style={{ maxHeight: "240px", objectFit: "cover" }} />
                      <div className="flex gap-2">
                        <button onClick={capturePhoto} className="btn-neon flex-1 text-sm font-hand flex items-center justify-center gap-2">
                          <Camera className="w-4 h-4" /> 拍照
                        </button>
                        <button
                          onClick={() => { cameraStream?.getTracks().forEach((t) => t.stop()); setCameraStream(null); }}
                          className="flex-1 py-2.5 rounded-lg text-sm font-hand"
                          style={{ background: "rgba(43,58,103,0.06)", color: "var(--text-secondary)" }}
                        >
                          取消
                        </button>
                      </div>
                    </div>
                  )}
                  <canvas ref={canvasRef} className="hidden" />
                </div>
              )}
            </div>

            {/* 底部 */}
            <div className="p-4 flex gap-3" style={{ borderTop: "1px solid var(--divider)" }}>
              <button onClick={handleFinish} className="btn-neon flex-1 text-sm font-hand">
                完成
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
