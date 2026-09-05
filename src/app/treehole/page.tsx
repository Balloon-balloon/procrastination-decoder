"use client";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition, StaggerContainer, FadeInItem } from "@/components/Animations";
import { Heart, Handshake, Send, Filter, Clock, Sparkles } from "lucide-react";
import { playClickSound } from "@/lib/sound";
import { useToast } from "@/components/Toast";

type PostType = "rant" | "success";

interface Post {
  id: string;
  emoji: string;
  type: PostType;
  content: string;
  resonances: number;
  pats: number;
  createdAt: number;
  resonated?: boolean;
  patted?: boolean;
}

const EMOJIS = ["🐼", "🦊", "🐱", "🐶", "🐰", "🦉", "🐸", "🐧", "🦝", "🐙", "🦄", "🐝"];

const ENCOURAGE_WORDS = ["加油！你并不孤独", "每一步都算数", "我也在拖延，一起努力", "完成了就很棒", "慢慢来比较快", "你比昨天强了"];

// 敏感词过滤（基础词库）
const SENSITIVE_WORDS = ["傻逼", "滚", "去死", "杀", "毒品"];

function filterContent(text: string): string {
  let filtered = text;
  SENSITIVE_WORDS.forEach((w) => {
    filtered = filtered.replace(new RegExp(w, "gi"), "🚫".repeat(w.length));
  });
  return filtered;
}

function randomEmoji(): string {
  return EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
}

function formatTime(ts: number): string {
  const diff = Date.now() - ts;
  const h = Math.floor(diff / 3600000);
  const m = Math.floor(diff / 60000);
  if (h > 0) return `${h}小时前`;
  if (m > 0) return `${m}分钟前`;
  return "刚刚";
}

export default function TreeHolePage() {
  const { showToast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState<"all" | "rant" | "success">("all");
  const [showCompose, setShowCompose] = useState(false);
  const [composeType, setComposeType] = useState<PostType>("rant");
  const [composeContent, setComposeContent] = useState("");
  const [todayPostCount, setTodayPostCount] = useState(0);

  // 加载帖子 + 定时清理过期帖
  useEffect(() => {
    const loadAndClean = () => {
      const raw = localStorage.getItem("pd-treehole-posts");
      let allPosts: Post[] = [];
      if (raw) {
        allPosts = JSON.parse(raw);
        // 清理 48h 过期帖
        const cutoff = Date.now() - 48 * 3600 * 1000;
        allPosts = allPosts.filter((p) => p.createdAt > cutoff);
        localStorage.setItem("pd-treehole-posts", JSON.stringify(allPosts));
      }

      // 如果没有帖子，生成一些模拟数据
      if (allPosts.length === 0) {
        const mockPosts: Post[] = [
          { id: "m1", emoji: "🐼", type: "rant", content: "微积分作业拖了一周了，翻开课本就开始刷手机😭", resonances: 12, pats: 8, createdAt: Date.now() - 3600000 * 2 },
          { id: "m2", emoji: "🦊", type: "success", content: "今天用5分钟启动法写了500字论文！虽然不多但是开始了！", resonances: 23, pats: 15, createdAt: Date.now() - 3600000 * 5 },
          { id: "m3", emoji: "🐱", type: "rant", content: "明早要交报告，我现在还在看猫视频...救命", resonances: 7, pats: 5, createdAt: Date.now() - 1800000 },
          { id: "m4", emoji: "🐰", type: "success", content: "连续3天完成每日任务了！拖延解码器真的有用✨", resonances: 31, pats: 20, createdAt: Date.now() - 3600000 * 8 },
          { id: "m5", emoji: "🦉", type: "rant", content: "知道自己拖延但就是不想动，有没有人懂这种感觉", resonances: 19, pats: 12, createdAt: Date.now() - 3600000 * 3 },
        ];
        allPosts = mockPosts;
        localStorage.setItem("pd-treehole-posts", JSON.stringify(allPosts));
      }

      setPosts(allPosts.sort((a, b) => b.createdAt - a.createdAt));

      // 统计今日发帖数
      const todayStart = new Date().setHours(0, 0, 0, 0);
      const todayKey = `pd-treehole-today-${new Date().toDateString()}`;
      const todayCount = parseInt(localStorage.getItem(todayKey) || "0");
      setTodayPostCount(todayCount);
    };

    loadAndClean();
    const interval = setInterval(loadAndClean, 60000);
    return () => clearInterval(interval);
  }, []);

  const filteredPosts = useMemo(() => {
    if (filter === "all") return posts;
    return posts.filter((p) => p.type === filter);
  }, [posts, filter]);

  const handlePost = () => {
    if (!composeContent.trim()) {
      showToast("写点什么再发吧", "warn");
      return;
    }
    if (todayPostCount >= 3) {
      showToast("今天已发3帖，明天再来吧", "warn");
      return;
    }

    const newPost: Post = {
      id: Date.now().toString(),
      emoji: randomEmoji(),
      type: composeType,
      content: filterContent(composeContent.trim()),
      resonances: 0,
      pats: 0,
      createdAt: Date.now(),
    };

    const updated = [newPost, ...posts];
    setPosts(updated);
    localStorage.setItem("pd-treehole-posts", JSON.stringify(updated));

    const todayKey = `pd-treehole-today-${new Date().toDateString()}`;
    const newCount = todayPostCount + 1;
    localStorage.setItem(todayKey, String(newCount));
    setTodayPostCount(newCount);

    setComposeContent("");
    setShowCompose(false);
    playClickSound();
    showToast("发布成功 🎉", "success");
  };

  const handleResonate = (id: string) => {
    const updated = posts.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          resonated: !p.resonated,
          resonances: p.resonated ? p.resonances - 1 : p.resonances + 1,
        };
      }
      return p;
    });
    setPosts(updated);
    localStorage.setItem("pd-treehole-posts", JSON.stringify(updated));
    playClickSound();
  };

  const handlePat = (id: string) => {
    const updated = posts.map((p) => {
      if (p.id === id) {
        return {
          ...p,
          patted: !p.patted,
          pats: p.patted ? p.pats - 1 : p.pats + 1,
        };
      }
      return p;
    });
    setPosts(updated);
    localStorage.setItem("pd-treehole-posts", JSON.stringify(updated));
    playClickSound();
  };

  return (
    <PageTransition>
      <div className="space-y-5 max-w-2xl mx-auto">
        {/* 标题 */}
        <div className="text-center">
          <h1 className="font-pixel text-sm mb-2" style={{ color: "var(--color-ink)" }}>
            TREE HOLE
          </h1>
          <p className="font-hand text-sm" style={{ color: "var(--text-muted)" }}>
            🌳 匿名树洞 · 48小时后消失 · 无社交压力
          </p>
        </div>

        {/* 发帖按钮 */}
        <div className="flex gap-2">
          <button
            onClick={() => { setShowCompose(true); setComposeType("rant"); }}
            className="flex-1 py-2.5 rounded-xl text-sm font-hand font-bold transition-all hover:scale-[1.02]"
            style={{ background: "var(--sticky-yellow)", color: "var(--color-ink)" }}
          >
            😤 吐槽一下
          </button>
          <button
            onClick={() => { setShowCompose(true); setComposeType("success"); }}
            className="flex-1 py-2.5 rounded-xl text-sm font-hand font-bold transition-all hover:scale-[1.02]"
            style={{ background: "var(--sticky-green)", color: "var(--color-ink)" }}
          >
            🎉 分享胜利
          </button>
        </div>

        {/* 今日发帖数 */}
        <p className="text-xs font-hand text-center" style={{ color: "var(--text-muted)" }}>
          今日已发 {todayPostCount}/3 帖
        </p>

        {/* 筛选 */}
        <div className="flex gap-2 justify-center">
          {[
            { id: "all", label: "全部" },
            { id: "rant", label: "😤 吐槽" },
            { id: "success", label: "🎉 成功" },
          ].map((f) => (
            <button
              key={f.id}
              onClick={() => { setFilter(f.id as any); playClickSound(); }}
              className="px-3 py-1 rounded-lg text-xs font-hand font-bold transition-all"
              style={
                filter === f.id
                  ? { background: "var(--color-neon-orange)", color: "#fff" }
                  : { background: "rgba(43,58,103,0.06)", color: "var(--text-muted)" }
              }
            >
              {f.label}
            </button>
          ))}
        </div>

        {/* 发帖弹窗 */}
        <AnimatePresence>
          {showCompose && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[150] flex items-center justify-center p-4"
              style={{ background: "rgba(0,0,0,0.4)" }}
              onClick={() => setShowCompose(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md rounded-2xl p-5"
                style={{ background: "var(--bg-primary)" }}
              >
                <h3 className="font-hand text-base font-bold mb-3" style={{ color: "var(--color-ink)" }}>
                  {composeType === "rant" ? "😤 吐槽一下" : "🎉 分享胜利"}
                </h3>
                <textarea
                  value={composeContent}
                  onChange={(e) => setComposeContent(e.target.value)}
                  placeholder={composeType === "rant" ? "宣泄你的拖延焦虑..." : "分享今天战胜拖延的小胜利！"}
                  rows={4}
                  maxLength={200}
                  className="w-full p-3 rounded-xl text-sm font-hand resize-none focus:outline-none"
                  style={{ background: "rgba(255,252,240,0.8)", border: "1px solid var(--divider)", color: "var(--text-primary)" }}
                  autoFocus
                />
                <div className="flex justify-between items-center mt-2">
                  <span className="text-xs font-hand" style={{ color: "var(--text-muted)" }}>
                    {composeContent.length}/200
                  </span>
                  <span className="text-xs font-hand" style={{ color: "var(--text-muted)" }}>
                    匿名发布 · 系统随机分配 emoji 代号
                  </span>
                </div>
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => setShowCompose(false)}
                    className="flex-1 py-2 rounded-lg text-sm font-hand"
                    style={{ background: "rgba(43,58,103,0.06)", color: "var(--text-secondary)" }}
                  >
                    取消
                  </button>
                  <button
                    onClick={handlePost}
                    className="btn-neon flex-1 text-sm font-hand flex items-center justify-center gap-1.5"
                  >
                    <Send className="w-3.5 h-3.5" /> 发布
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 帖子列表 */}
        <StaggerContainer className="space-y-3">
          {filteredPosts.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-3">🌱</div>
              <p className="font-hand text-sm" style={{ color: "var(--text-muted)" }}>
                还没有帖子，来发第一条吧
              </p>
            </div>
          ) : (
            filteredPosts.slice(0, 20).map((post) => (
              <FadeInItem key={post.id}>
                <div
                  className="rounded-2xl p-4 relative"
                  style={{
                    background: post.type === "rant" ? "var(--sticky-yellow)" : "var(--sticky-green)",
                    transform: `rotate(${post.type === "rant" ? -0.5 : 0.5}deg)`,
                  }}
                >
                  {/* 对话气泡尾巴 */}
                  <div
                    className="absolute -bottom-2 left-6 w-4 h-4 rotate-45"
                    style={{ background: post.type === "rant" ? "var(--sticky-yellow)" : "var(--sticky-green)" }}
                  />

                  <div className="flex items-start gap-3 mb-2">
                    <span className="text-2xl">{post.emoji}</span>
                    <div className="flex-1">
                      <p className="font-hand text-sm leading-relaxed" style={{ color: "var(--color-ink)" }}>
                        {post.content}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <span className="text-[10px] font-hand flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                      <Clock className="w-3 h-3" /> {formatTime(post.createdAt)} · 48h后消失
                    </span>
                    <div className="flex gap-3">
                      <button
                        onClick={() => handleResonate(post.id)}
                        className="flex items-center gap-1 text-xs font-hand font-bold transition-all hover:scale-110"
                        style={{ color: post.resonated ? "var(--color-neon-orange)" : "var(--text-muted)" }}
                      >
                        <Heart className={`w-3.5 h-3.5 ${post.resonated ? "fill-current" : ""}`} />
                        {post.resonances}
                      </button>
                      <button
                        onClick={() => handlePat(post.id)}
                        className="flex items-center gap-1 text-xs font-hand font-bold transition-all hover:scale-110"
                        style={{ color: post.patted ? "var(--color-neon-green)" : "var(--text-muted)" }}
                      >
                        <Handshake className={`w-3.5 h-3.5 ${post.patted ? "fill-current" : ""}`} />
                        {post.pats}
                      </button>
                    </div>
                  </div>
                </div>
              </FadeInItem>
            ))
          )}
        </StaggerContainer>

        <p className="text-center text-[10px] font-hand py-4" style={{ color: "var(--text-muted)" }}>
          🌳 树洞帖仅保留48小时 · 每日限发3帖 · 全匿名无社交压力
        </p>
      </div>
    </PageTransition>
  );
}
