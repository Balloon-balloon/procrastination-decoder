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

  // 加载自定义背景
  useEffect(() => {
    const customBg = localStorage.getItem("pd-custom-bg");
    if (customBg) {
      const blur = localStorage.getItem("pd-blur") || "8";
      const overlay = localStorage.getItem("pd-overlay") || "0.3";
      const bgLayer = document.querySelector(".custom-bg-layer") as HTMLElement;
      if (bgLayer) {
        bgLayer.style.backgroundImage = `url(${customBg})`;
        bgLayer.style.filter = `blur(${blur}px)`;
        bgLayer.style.opacity = "1";
      }
    }
    // 加载主题色
    const savedTheme = localStorage.getItem("pd-theme");
    if (savedTheme) {
      const event = new CustomEvent("apply-theme", { detail: savedTheme });
      window.dispatchEvent(event);
    }
  }, []);

  if (isLoginPage) {
    return (
      <>
        <PageLoader show={loading} />
        <BackgroundSetup />
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
        className="min-h-screen pb-20 md:pb-6 nav-collapse-transition relative z-10"
        style={{
          marginLeft: navCollapsed ? 0 : "256px",
          transition: "margin-left 0.3s cubic-bezier(0.4, 0, 0.2, 1)",
        }}
      >
        <div className="max-w-5xl mx-auto p-4 md:p-8 pt-16 md:pt-8">
          {children}
        </div>
      </main>
    </>
  );
}
