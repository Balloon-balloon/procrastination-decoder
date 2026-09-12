"use client";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { Navigation } from "@/components/Navigation";
import { PixelDog } from "@/components/PixelDog";
import { PageLoader } from "@/components/PageLoader";
import { BackgroundMusic } from "@/components/BackgroundMusic";
import { SettingsPanel } from "@/components/SettingsPanel";
import { BackgroundSetup } from "@/components/BackgroundSetup";
import { OnboardingGuide } from "@/components/OnboardingGuide";
import { AlarmManager } from "@/components/AlarmManager";
import { playClickSound, isMuted } from "@/lib/sound";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/login";
  const [navCollapsed, setNavCollapsed] = useState(false);
  const [loading, setLoading] = useState(false);
  const [isDesktop, setIsDesktop] = useState(true);

  useEffect(() => {
    const checkWidth = () => setIsDesktop(window.innerWidth >= 768);
    checkWidth();
    window.addEventListener("resize", checkWidth);
    return () => window.removeEventListener("resize", checkWidth);
  }, []);

  // 路由切换时触发 PageLoader
  useEffect(() => {
    if (!isLoginPage) {
      setLoading(true);
      const timer = setTimeout(() => setLoading(false), 800 + Math.random() * 400);
      return () => clearTimeout(timer);
    }
  }, [pathname, isLoginPage]);

  // 全局点击音效
  useEffect(() => {
    if (isLoginPage) return;
    const handleClick = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      if (!target) return;
      const clickable = target.closest("button, a, [role='button'], .clickable");
      if (clickable && !isMuted()) {
        playClickSound();
      }
    };
    window.addEventListener("click", handleClick);
    return () => window.removeEventListener("click", handleClick);
  }, [isLoginPage]);

  // 加载自定义背景 + 恢复主题色
  useEffect(() => {
    const customBg = localStorage.getItem("pd-custom-bg");
    if (customBg) {
      const blur = localStorage.getItem("pd-blur") || "8";
      const bgLayer = document.querySelector(".custom-bg-layer") as HTMLElement;
      if (bgLayer) {
        bgLayer.style.backgroundImage = `url(${customBg})`;
        bgLayer.style.filter = `blur(${blur}px)`;
        bgLayer.style.opacity = "1";
      }
    }
    // 恢复主题色到 CSS 变量
    const savedThemeIdx = localStorage.getItem("pd-theme");
    const THEMES = [
      { color: "#FAD6A5", ink: "#2B3A67", bg: "#FDF6E3" },
      { color: "#A5D6BC", ink: "#2B5A50", bg: "#E8F5F3" },
      { color: "#FFCDD2", ink: "#6B2D3C", bg: "#FFF0F3" },
      { color: "#D4C5E8", ink: "#3D2B5A", bg: "#F0EBF8" },
      { color: "#FFCC80", ink: "#4A2C14", bg: "#FFF3E0" },
      { color: "#C5D5B5", ink: "#2B4A1A", bg: "#F0F4EC" },
      { color: "#F5F5F5", ink: "#1A1A1A", bg: "#FFFFFF" },
    ];
    if (savedThemeIdx) {
      const idx = parseInt(savedThemeIdx);
      const t = THEMES[idx];
      if (t) {
        const root = document.documentElement;
        root.style.setProperty("--color-apricot", t.color);
        root.style.setProperty("--color-ink", t.ink);
        root.style.setProperty("--bg-primary", t.bg);
        root.style.setProperty("--text-primary", t.ink);
        root.style.setProperty("--text-secondary", t.ink);
        root.style.setProperty("--text-muted", t.ink);
      }
    }
  }, []);

  if (isLoginPage) {
    return (
      <>
        <PageLoader show={loading} />
        {children}
      </>
    );
  }

  return (
    <>
      {/* 自定义背景层 */}
      <div
        className="custom-bg-layer fixed inset-0 z-0"
        style={{
          backgroundSize: "cover",
          backgroundPosition: "center",
          opacity: 0,
          transition: "opacity 0.5s ease",
        }}
      />
      {/* 蒙层 */}
      <div
        className="fixed inset-0 z-0 pointer-events-none"
        style={{
          background: `rgba(43,58,103,0.3)`,
        }}
      />

      <PageLoader show={loading} />
      <Navigation collapsed={navCollapsed} onToggleCollapse={() => setNavCollapsed(!navCollapsed)} />
      <PixelDog />
      <BackgroundMusic />
      <SettingsPanel />
      <AlarmManager />
      <BackgroundSetup />
      <OnboardingGuide />
      <main
        className="min-h-screen pb-20 md:pb-6 nav-collapse-transition relative z-10 md:ml-0"
        style={{
          marginLeft: "0px",
        }}
      >
        <div
          className="max-w-5xl mx-auto p-4 md:p-8 pt-16 md:pt-8"
          style={{
            marginLeft: isDesktop && !navCollapsed ? "256px" : "0px",
            transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
          }}
        >
          {children}
        </div>
      </main>
    </>
  );
}
