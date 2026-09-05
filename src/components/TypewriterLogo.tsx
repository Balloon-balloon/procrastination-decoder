"use client";
import { useState, useEffect } from "react";

export function TypewriterLogo({
  text = "whywait",
  className = "",
  speed = 150,
  pauseDuration = 2000,
}: {
  text?: string;
  className?: string;
  speed?: number;
  pauseDuration?: number;
}) {
  const [displayed, setDisplayed] = useState("");
  const [phase, setPhase] = useState<"typing" | "pausing" | "deleting">("typing");

  useEffect(() => {
    let timeout: ReturnType<typeof setTimeout>;

    if (phase === "typing") {
      if (displayed.length < text.length) {
        timeout = setTimeout(() => {
          setDisplayed(text.slice(0, displayed.length + 1));
        }, speed);
      } else {
        timeout = setTimeout(() => setPhase("pausing"), speed);
      }
    } else if (phase === "pausing") {
      timeout = setTimeout(() => setPhase("deleting"), pauseDuration);
    } else if (phase === "deleting") {
      if (displayed.length > 0) {
        timeout = setTimeout(() => {
          setDisplayed(text.slice(0, displayed.length - 1));
        }, speed / 2);
      } else {
        setPhase("typing");
      }
    }

    return () => clearTimeout(timeout);
  }, [displayed, phase, text, speed, pauseDuration]);

  return (
    <span className={`font-sketch ${className}`} style={{ position: "relative" }}>
      {displayed}
      <span
        className="inline-block w-[3px] h-[0.8em] ml-1 align-middle"
        style={{
          background: "var(--color-neon-orange, #FF6B35)",
          animation: "cursorBlink 0.8s step-end infinite",
        }}
      />
      <style>{`
        @keyframes cursorBlink {
          0%, 50% { opacity: 1; }
          50.01%, 100% { opacity: 0; }
        }
      `}</style>
    </span>
  );
}

export function WhyWaitLogo({ size = 32 }: { size?: number }) {
  return (
    <div className="flex items-center gap-2">
      {/* Logo 图标：一个时钟+问号的像素风设计 */}
      <svg
        width={size}
        height={size}
        viewBox="0 0 32 32"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
      >
        {/* 圆形时钟外框 */}
        <circle
          cx="16"
          cy="16"
          r="14"
          stroke="var(--color-ink, #2B3A67)"
          strokeWidth="2.5"
          fill="var(--color-apricot, #FAD6A5)"
        />
        {/* 时钟刻度 */}
        <line x1="16" y1="4" x2="16" y2="6" stroke="var(--color-ink, #2B3A67)" strokeWidth="2" strokeLinecap="round" />
        <line x1="16" y1="26" x2="16" y2="28" stroke="var(--color-ink, #2B3A67)" strokeWidth="2" strokeLinecap="round" />
        <line x1="4" y1="16" x2="6" y2="16" stroke="var(--color-ink, #2B3A67)" strokeWidth="2" strokeLinecap="round" />
        <line x1="26" y1="16" x2="28" y2="16" stroke="var(--color-ink, #2B3A67)" strokeWidth="2" strokeLinecap="round" />
        {/* 时针指向 11 点（拖延感） */}
        <line
          x1="16"
          y1="16"
          x2="10"
          y2="11"
          stroke="var(--color-neon-orange, #FF6B35)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        {/* 分针指向 2 点 */}
        <line
          x1="16"
          y1="16"
          x2="22"
          y2="12"
          stroke="var(--color-ink, #2B3A67)"
          strokeWidth="2"
          strokeLinecap="round"
        />
        {/* 中心点 */}
        <circle cx="16" cy="16" r="2" fill="var(--color-neon-orange, #FF6B35)" />
      </svg>
      <span
        className="font-sketch text-xl font-bold"
        style={{
          color: "var(--color-ink, #2B3A67)",
          letterSpacing: "0.05em",
        }}
      >
        whywait
      </span>
    </div>
  );
}
