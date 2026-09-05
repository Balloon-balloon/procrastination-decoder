"use client";
import { useEffect, useState } from "react";

export function PenLoader({ text = "loading" }: { text?: string }) {
  const [displayText, setDisplayText] = useState("");
  const [showPen, setShowPen] = useState(true);

  useEffect(() => {
    let i = 0;
    const interval = setInterval(() => {
      if (i <= text.length) {
        setDisplayText(text.slice(0, i));
        i++;
      } else {
        clearInterval(interval);
        setShowPen(false);
        // 重置循环
        setTimeout(() => {
          setDisplayText("");
          setShowPen(true);
          i = 0;
        }, 800);
      }
    }, 120);
    return () => clearInterval(interval);
  }, [text]);

  return (
    <div className="flex flex-col items-center justify-center gap-6 py-20">
      <div className="pen-loader">
        <span
          className="font-pixel text-sm typewriter-cursor"
          style={{ color: "var(--color-ink)" }}
        >
          {displayText}
        </span>
        {showPen && (
          <svg
            className="pen"
            width="20"
            height="20"
            viewBox="0 0 20 20"
            fill="none"
          >
            <path
              d="M14 2L18 6L8 16L4 17L5 13L14 2Z"
              fill="var(--color-neon-orange)"
              stroke="var(--color-ink)"
              strokeWidth="1"
            />
            <path d="M4 17L5 13L8 16L4 17Z" fill="var(--color-ink)" />
          </svg>
        )}
      </div>
      {/* 像素进度条 */}
      <div className="flex gap-1">
        {[0, 1, 2, 3, 4].map((i) => (
          <div
            key={i}
            className="w-2 h-2 rounded-sm"
            style={{
              background: "var(--color-ink)",
              animation: `pixelBounce 0.6s ease-in-out ${i * 0.12}s infinite`,
              opacity: 0.3,
            }}
          />
        ))}
      </div>
    </div>
  );
}
