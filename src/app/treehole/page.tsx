"use client";
import { useState, useEffect, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition, StaggerContainer, FadeInItem } from "@/components/Animations";
import { Heart, Handshake, Send, Filter, Clock, MessageCircle, X, Eye, EyeOff, User as UserIcon } from "lucide-react";
import { playClickSound } from "@/lib/sound";
import { useToast } from "@/components/Toast";
import { getCurrentUser } from "@/lib/auth";

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
  anonymous: boolean;
  authorName?: string;
  authorId?: string;
}

interface ChatMessage {
  id: string;
  from: string;
  to: string;
  content: string;
  createdAt: number;
  fromName: string;
  toName: string;
}

const EMOJIS = ["🐼", "🦊", "🐱", "🐶", "🐰", "🦉", "🐸", "🐧", "🦝", "🐙", "🦄", "🐝"];
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

const DM_STORAGE_KEY = "pd-dm-messages";
const POSTS_KEY = "pd-treehole-posts";
const POSTS_VERSION_KEY = "pd-treehole-posts-version";
const POSTS_VERSION = "2";

export default function TreeHolePage() {
  const { showToast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [filter, setFilter] = useState<"all" | "rant" | "success">("all");
  const [showCompose, setShowCompose] = useState(false);
  const [composeType, setComposeType] = useState<PostType>("rant");
  const [composeContent, setComposeContent] = useState("");
  const [composeAnonymous, setComposeAnonymous] = useState(true);
  const [todayPostCount, setTodayPostCount] = useState(0);
  const [chatTarget, setChatTarget] = useState<{ id: string; name: string; emoji: string } | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState("");

  // 加载帖子 + 定时清理过期帖
  useEffect(() => {
    const loadAndClean = () => {
      // 版本检查：清除旧版本数据
      const version = localStorage.getItem(POSTS_VERSION_KEY);
      if (version !== POSTS_VERSION) {
        localStorage.removeItem(POSTS_KEY);
        localStorage.setItem(POSTS_VERSION_KEY, POSTS_VERSION);
      }

      const raw = localStorage.getItem(POSTS_KEY);
      let allPosts: Post[] = [];
      if (raw) {
        try {
          allPosts = JSON.parse(raw);
          if (!Array.isArray(allPosts)) allPosts = [];
        } catch {
          allPosts = [];
        }
        const cutoff = Date.now() - 48 * 3600 * 1000;
        allPosts = allPosts.filter((p) => p.createdAt > cutoff);
        localStorage.setItem(POSTS_KEY, JSON.stringify(allPosts));
      }
      setPosts(allPosts.sort((a, b) => b.createdAt - a.createdAt));

      const todayKey = `pd-treehole-today-${new Date().toDateString()}`;
      const todayCount = parseInt(localStorage.getItem(todayKey) || "0");
      setTodayPostCount(todayCount);
    };

    loadAndClean();
    const interval = setInterval(loadAndClean, 60000);
    return () => clearInterval(interval);
  }, []);

  // 加载私聊消息
  useEffect(() => {
    if (!chatTarget) return;
    const currentUser = getCurrentUser();
    if (!currentUser) return;
    const raw = localStorage.getItem(DM_STORAGE_KEY);
    let allMsgs: ChatMessage[] = [];
    if (raw) allMsgs = JSON.parse(raw);
    const myMsgs = allMsgs.filter(
      (m) =>
        (m.from === currentUser.id && m.to === chatTarget.id) ||
        (m.to === currentUser.id && m.from === chatTarget.id)
    );
    setChatMessages(myMsgs.sort((a, b) => a.createdAt - b.createdAt));
  }, [chatTarget]);

  const filteredPosts = useMemo(() => {
    if (filter === "all") return posts;
    return posts.filter((p) => p.type === filter);
  }, [posts, filter]);

  const handlePost = () => {
    if (!composeContent.trim()) {
      showToast("写点什么再发吧", "warning");
      return;
    }
    if (todayPostCount >= 3) {
      showToast("今天已发3帖，明天再来吧", "warning");
      return;
    }

    const currentUser = getCurrentUser();
    const newPost: Post = {
      id: Date.now().toString(),
      emoji: randomEmoji(),
      type: composeType,
      content: filterContent(composeContent.trim()),
      resonances: 0,
      pats: 0,
      createdAt: Date.now(),
      anonymous: composeAnonymous,
      authorName: composeAnonymous ? undefined : currentUser?.username,
      authorId: composeAnonymous ? undefined : currentUser?.id,
    };

    const updated = [newPost, ...posts];
    setPosts(updated);
    localStorage.setItem(POSTS_KEY, JSON.stringify(updated));

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
    localStorage.setItem(POSTS_KEY, JSON.stringify(updated));
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
    localStorage.setItem(POSTS_KEY, JSON.stringify(updated));
    playClickSound();
  };

  const handleStartChat = (post: Post) => {
    if (post.anonymous) {
      showToast("匿名帖子无法发起私聊", "info");
      return;
    }
    if (!post.authorId || !post.authorName) {
      showToast("无法获取作者信息", "warning");
      return;
    }
    const currentUser = getCurrentUser();
    if (currentUser?.id === post.authorId) {
      showToast("不能给自己发私信", "info");
      return;
    }
    setChatTarget({ id: post.authorId, name: post.authorName, emoji: post.emoji });
    playClickSound();
  };

  const handleSendChat = () => {
    if (!chatInput.trim() || !chatTarget) return;
    const currentUser = getCurrentUser();
    if (!currentUser) {
      showToast("请先登录", "warning");
      return;
    }
    const newMsg: ChatMessage = {
      id: Date.now().toString(),
      from: currentUser.id,
      to: chatTarget.id,
      content: chatInput.trim(),
      createdAt: Date.now(),
      fromName: currentUser.username,
      toName: chatTarget.name,
    };
    const raw = localStorage.getItem(DM_STORAGE_KEY);
    const allMsgs: ChatMessage[] = raw ? JSON.parse(raw) : [];
    allMsgs.push(newMsg);
    localStorage.setItem(DM_STORAGE_KEY, JSON.stringify(allMsgs));
    setChatMessages([...chatMessages, newMsg]);
    setChatInput("");
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
            🌳 树洞 · 48小时后消失 · 可匿名可实名
          </p>
        </div>

        {/* 发帖按钮 */}
        <div className="flex gap-2">
          <button
            onClick={() => { setShowCompose(true); setComposeType("rant"); setComposeAnonymous(true); }}
            className="flex-1 py-2.5 rounded-xl text-sm font-hand font-bold transition-all hover:scale-[1.02]"
            style={{ background: "var(--sticky-yellow)", color: "var(--color-ink)" }}
          >
            😤 吐槽一下
          </button>
          <button
            onClick={() => { setShowCompose(true); setComposeType("success"); setComposeAnonymous(true); }}
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
                  {/* 匿名/实名切换 */}
                  <button
                    onClick={() => { setComposeAnonymous(!composeAnonymous); playClickSound(); }}
                    className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-hand font-bold transition-all"
                    style={{
                      background: composeAnonymous ? "rgba(43,58,103,0.06)" : "var(--color-neon-orange)",
                      color: composeAnonymous ? "var(--text-muted)" : "#fff",
                    }}
                  >
                    {composeAnonymous ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                    {composeAnonymous ? "匿名发布" : "实名发布"}
                  </button>
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
                    {/* 头像 - 可点击私聊 */}
                    <button
                      onClick={() => handleStartChat(post)}
                      className="text-2xl transition-transform hover:scale-125 cursor-pointer"
                      title={post.anonymous ? "匿名用户无法私聊" : `点击私聊 ${post.authorName}`}
                    >
                      {post.emoji}
                    </button>
                    <div className="flex-1">
                      {/* 作者信息 */}
                      <div className="flex items-center gap-1.5 mb-1">
                        {post.anonymous ? (
                          <span className="text-[10px] font-hand" style={{ color: "var(--text-muted)" }}>
                            匿名{post.emoji}用户
                          </span>
                        ) : (
                          <span className="text-[10px] font-hand font-bold flex items-center gap-1" style={{ color: "var(--color-ink)" }}>
                            <UserIcon className="w-2.5 h-2.5" /> {post.authorName}
                          </span>
                        )}
                        {!post.anonymous && (
                          <span className="text-[9px] font-hand px-1.5 py-0.5 rounded" style={{ background: "rgba(255,107,53,0.15)", color: "var(--color-neon-orange)" }}>
                            可私聊
                          </span>
                        )}
                      </div>
                      <p className="font-hand text-sm leading-relaxed" style={{ color: "var(--color-ink)" }}>
                        {post.content}
                      </p>
                    </div>
                  </div>

                  <div className="flex items-center justify-between mt-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-hand flex items-center gap-1" style={{ color: "var(--text-muted)" }}>
                        <Clock className="w-3 h-3" /> {formatTime(post.createdAt)} · 48h后消失
                      </span>
                      {!post.anonymous && (
                        <button
                          onClick={() => handleStartChat(post)}
                          className="text-[10px] font-hand flex items-center gap-0.5 transition-all hover:scale-110"
                          style={{ color: "var(--color-neon-orange)" }}
                        >
                          <MessageCircle className="w-3 h-3" /> 私聊
                        </button>
                      )}
                    </div>
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
          🌳 树洞帖仅保留48小时 · 每日限发3帖 · 可选匿名或实名 · 实名帖子可私聊
        </p>

        {/* 私聊弹窗 */}
        <AnimatePresence>
          {chatTarget && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[180] flex items-end md:items-center justify-center p-4"
              style={{ background: "rgba(0,0,0,0.5)" }}
              onClick={() => setChatTarget(null)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 50 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 50 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-md rounded-2xl flex flex-col"
                style={{ background: "var(--bg-primary)", maxHeight: "70vh" }}
              >
                {/* 聊天头部 */}
                <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: "var(--divider)" }}>
                  <div className="flex items-center gap-2">
                    <span className="text-2xl">{chatTarget.emoji}</span>
                    <span className="font-hand text-sm font-bold" style={{ color: "var(--color-ink)" }}>
                      {chatTarget.name}
                    </span>
                  </div>
                  <button onClick={() => setChatTarget(null)} className="p-1 rounded-lg hover:scale-110 transition-all">
                    <X className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                  </button>
                </div>

                {/* 消息列表 */}
                <div className="flex-1 overflow-y-auto p-4 space-y-3" style={{ minHeight: "200px" }}>
                  {chatMessages.length === 0 ? (
                    <div className="text-center py-8">
                      <div className="text-3xl mb-2">{chatTarget.emoji}</div>
                      <p className="font-hand text-xs" style={{ color: "var(--text-muted)" }}>
                        还没有消息，说点什么吧
                      </p>
                    </div>
                  ) : (
                    chatMessages.map((msg) => {
                      const isMe = msg.from === getCurrentUser()?.id;
                      return (
                        <div key={msg.id} className={`flex ${isMe ? "justify-end" : "justify-start"}`}>
                          <div
                            className="max-w-[75%] px-3 py-2 rounded-2xl font-hand text-sm"
                            style={{
                              background: isMe ? "var(--color-neon-orange)" : "rgba(43,58,103,0.08)",
                              color: isMe ? "#fff" : "var(--color-ink)",
                            }}
                          >
                            {msg.content}
                            <div className="text-[8px] mt-0.5 opacity-60">
                              {new Date(msg.createdAt).toLocaleTimeString("zh-CN", { hour: "2-digit", minute: "2-digit" })}
                            </div>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>

                {/* 输入框 */}
                <div className="p-3 border-t flex gap-2" style={{ borderColor: "var(--divider)" }}>
                  <input
                    type="text"
                    value={chatInput}
                    onChange={(e) => setChatInput(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") handleSendChat(); }}
                    placeholder="输入消息..."
                    className="flex-1 px-3 py-2 rounded-xl text-sm font-hand focus:outline-none"
                    style={{ background: "rgba(255,252,240,0.8)", border: "1px solid var(--divider)", color: "var(--text-primary)" }}
                    autoFocus
                  />
                  <button
                    onClick={handleSendChat}
                    className="btn-neon px-4 py-2 rounded-xl flex items-center justify-center"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </PageTransition>
  );
}
