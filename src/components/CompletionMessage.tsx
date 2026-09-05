"use client";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";

const SNARKY_MESSAGES = [
  "哟，终于做完了？本汪等得花儿都谢了 🌸",
  "恭喜！你战胜了拖延...这一次 ✊",
  "看吧？开始做了就没有那么难 😏",
  "本汪为你感到骄傲！真的！🐶",
  "又一个任务倒下了！下一个是谁？💥",
  "拖延者的胜利！记住了这种感觉！",
  "完成比完美更重要，你做到了 👏",
  "虽然晚了点...但总比不做强！",
  "本汪要给你加鸡腿！🍗",
  "今日成就解锁：做事不拖延 +1 ✨",
];

const WARM_MESSAGES = [
  "每一步都算数，你做得很好 💚",
  "慢慢来，比较快。你找到了自己的节奏 🌿",
  "完成就是最好的奖励，为你开心 🎉",
  "你正在变成更好的自己，继续加油 🌟",
  "今天的你，比昨天的你更强了 💪",
];

export function CompletionMessage({
  show,
  onClose,
}: {
  show: boolean;
  onClose: () => void;
}) {
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (show) {
      const isSnarky = Math.random() > 0.4;
      const pool = isSnarky ? SNARKY_MESSAGES : WARM_MESSAGES;
      setMessage(pool[Math.floor(Math.random() * pool.length)]);
      const timer = setTimeout(onClose, 3500);
      return () => clearTimeout(timer);
    }
  }, [show, onClose]);

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ opacity: 0, y: 20, scale: 0.8 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10, scale: 0.9 }}
          transition={{ type: "spring", stiffness: 400, damping: 25 }}
          className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 z-50 print-message"
        >
          <div
            className="px-6 py-3 rounded-2xl text-sm font-bold flex items-center gap-3"
            style={{
              background: "var(--color-neon-green)",
              color: "#fff",
              boxShadow: "0 4px 20px rgba(78, 205, 196, 0.4)",
            }}
          >
            <span className="text-lg">✓</span>
            <span>{message}</span>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
