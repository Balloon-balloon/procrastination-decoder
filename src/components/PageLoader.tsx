"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

export function PageLoader({ show }: { show: boolean }) {
  const [dots, setDots] = useState("");

  useEffect(() => {
    if (!show) return;
    let i = 0;
    const interval = setInterval(() => {
      setDots(".".repeat(i % 4));
      i++;
    }, 300);
    return () => clearInterval(interval);
  }, [show]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.3, ease: "easeInOut" }}
          className="fixed inset-0 z-[100] flex flex-col items-center justify-center"
          style={{
            background: "linear-gradient(180deg, #0D1224 0%, #1A2440 50%, #2B3A67 100%)",
          }}
        >
          {/* 像素小人拿大笔写字 */}
          <svg
            width="120"
            height="120"
            viewBox="0 0 30 30"
            shapeRendering="crispEdges"
            className="mb-8"
          >
            {/* 小人头部 */}
            <rect x="11" y="3" width="5" height="4" fill="#FAD6A5" />
            <rect x="11" y="2" width="5" height="1" fill="#2B3A67" />
            {/* 眼睛 */}
            <rect x="12" y="4" width="1" height="1" fill="#2B3A67" />
            <rect x="14" y="4" width="1" height="1" fill="#2B3A67" />
            {/* 嘴 */}
            <rect x="13" y="6" width="1" height="1" fill="#FF6B35" />
            {/* 身体 */}
            <rect x="10" y="7" width="7" height="5" fill="#4ECDC4" />
            {/* 手臂举着笔 */}
            <rect x="16" y="8" width="3" height="1" fill="#FAD6A5" />
            <rect x="19" y="7" width="2" height="2" fill="#FAD6A5" />
            {/* 大黑笔 */}
            <rect x="19" y="5" width="3" height="6" fill="#1A2440" />
            <rect x="19" y="4" width="3" height="1" fill="#2B3A67" />
            <rect x="20" y="3" width="1" height="1" fill="#5A6480" />
            {/* 笔尖 */}
            <rect x="20" y="11" width="1" height="1" fill="#FF6B35" />
            {/* 写字痕迹 */}
            <rect x="20" y="13" width="2" height="1" fill="#FAD6A5" opacity="0.6" />
            <rect x="22" y="12" width="1" height="1" fill="#FAD6A5" opacity="0.4" />
            {/* 另一只手臂 */}
            <rect x="8" y="9" width="2" height="1" fill="#FAD6A5" />
            {/* 腿 */}
            <rect x="11" y="12" width="2" height="4" fill="#2B3A67" />
            <rect x="14" y="12" width="2" height="4" fill="#2B3A67" />
            {/* 脚 */}
            <rect x="10" y="16" width="3" height="1" fill="#1A2440" />
            <rect x="14" y="16" width="3" height="1" fill="#1A2440" />
            {/* 书写动画 - 笔在动 */}
            <g style={{ animation: "penWrite 0.8s ease-in-out infinite", transformOrigin: "20px 8px" }}>
              <rect x="20" y="11" width="1" height="1" fill="#FF6B35" />
            </g>
            {/* 墨点 */}
            <rect x="21" y="14" width="1" height="1" fill="#FAD6A5" opacity="0.5" className="star-twinkle" />
            <rect x="23" y="15" width="1" height="1" fill="#FAD6A5" opacity="0.3" />
          </svg>

          {/* loading 文字 */}
          <div className="flex flex-col items-center gap-3">
            <span
              className="font-pixel text-sm typewriter-cursor"
              style={{ color: "#FAD6A5", letterSpacing: "0.1em" }}
            >
              loading{dots}
            </span>
            {/* 像素进度条 */}
            <div className="flex gap-1.5">
              {[0, 1, 2, 3, 4, 5, 6].map((i) => (
                <div
                  key={i}
                  className="w-2 h-2 rounded-sm"
                  style={{
                    background: "#FAD6A5",
                    animation: `pixelBounce 0.7s ease-in-out ${i * 0.1}s infinite alternate`,
                    opacity: 0.4,
                  }}
                />
              ))}
            </div>
          </div>

          {/* 底部渐变光晕 */}
          <div
            className="absolute bottom-0 left-0 right-0 h-32"
            style={{
              background: "linear-gradient(to top, rgba(255,107,53,0.05) 0%, transparent 100%)",
            }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  );
}
