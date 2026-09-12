"use client";
import { useState, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PageTransition, StaggerContainer, FadeInItem } from "@/components/Animations";
import {
  Heart, MessageCircle, Send, X, Image as ImageIcon,
  Eye, EyeOff, User as UserIcon, ThumbsUp, ImagePlus, Trash2,
} from "lucide-react";
import { playClickSound } from "@/lib/sound";
import { useToast } from "@/components/Toast";
import { getCurrentUser } from "@/lib/auth";

interface Comment {
  id: string;
  content: string;
  authorId?: string;
  authorName?: string;
  authorEmoji: string;
  anonymous: boolean;
  createdAt: number;
  liked: boolean;
  likes: number;
}

interface Post {
  id: string;
  content: string;
  images: string[];
  likes: number;
  liked: boolean;
  comments: Comment[];
  createdAt: number;
  anonymous: boolean;
  authorName?: string;
  authorId?: string;
  authorEmoji: string;
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
  const day = Math.floor(diff / 86400000);
  const h = Math.floor(diff / 3600000);
  const m = Math.floor(diff / 60000);
  if (day > 0) return `${day}天前`;
  if (h > 0) return `${h}小时前`;
  if (m > 0) return `${m}分钟前`;
  return "刚刚";
}

const POSTS_KEY = "pd-plaza-posts";

export default function PlazaPage() {
  const { showToast } = useToast();
  const [posts, setPosts] = useState<Post[]>([]);
  const [showCompose, setShowCompose] = useState(false);
  const [composeContent, setComposeContent] = useState("");
  const [composeImages, setComposeImages] = useState<string[]>([]);
  const [composeAnonymous, setComposeAnonymous] = useState(true);
  const [expandedComments, setExpandedComments] = useState<string | null>(null);
  const [commentInputs, setCommentInputs] = useState<Record<string, string>>({});
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 加载帖子
  useEffect(() => {
    const raw = localStorage.getItem(POSTS_KEY);
    if (raw) {
      try {
        const allPosts: Post[] = JSON.parse(raw);
        setPosts(allPosts.sort((a, b) => b.createdAt - a.createdAt));
      } catch {
        setPosts([]);
      }
    }
  }, []);

  const savePosts = (updated: Post[]) => {
    setPosts(updated);
    localStorage.setItem(POSTS_KEY, JSON.stringify(updated));
  };

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    if (composeImages.length + files.length > 6) {
      showToast("最多只能发 6 张图哦", "warning");
      return;
    }
    Array.from(files).forEach((file) => {
      const reader = new FileReader();
      reader.onload = () => {
        setComposeImages((prev) => [...prev, reader.result as string]);
      };
      reader.readAsDataURL(file);
    });
  };

  const removeImage = (index: number) => {
    setComposeImages((prev) => prev.filter((_, i) => i !== index));
  };

  const handlePost = () => {
    if (!composeContent.trim() && composeImages.length === 0) {
      showToast("写点什么或加张图再发吧", "warning");
      return;
    }

    const currentUser = getCurrentUser();
    const newPost: Post = {
      id: Date.now().toString(),
      content: filterContent(composeContent.trim()),
      images: composeImages,
      likes: 0,
      liked: false,
      comments: [],
      createdAt: Date.now(),
      anonymous: composeAnonymous,
      authorName: composeAnonymous ? undefined : currentUser?.username,
      authorId: composeAnonymous ? undefined : currentUser?.id,
      authorEmoji: randomEmoji(),
    };

    const updated = [newPost, ...posts];
    savePosts(updated);
    setComposeContent("");
    setComposeImages([]);
    setShowCompose(false);
    playClickSound();
    showToast("发布成功 🎉", "success");
  };

  const handleLike = (id: string) => {
    const updated = posts.map((p) => {
      if (p.id === id) {
        return { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 };
      }
      return p;
    });
    savePosts(updated);
    playClickSound();
  };

  const handleCommentLike = (postId: string, commentId: string) => {
    const updated = posts.map((p) => {
      if (p.id === postId) {
        return {
          ...p,
          comments: p.comments.map((c) =>
            c.id === commentId
              ? { ...c, liked: !c.liked, likes: c.liked ? c.likes - 1 : c.likes + 1 }
              : c
          ),
        };
      }
      return p;
    });
    savePosts(updated);
    playClickSound();
  };

  const handleAddComment = (postId: string) => {
    const content = commentInputs[postId]?.trim();
    if (!content) return;
    const currentUser = getCurrentUser();
    const newComment: Comment = {
      id: Date.now().toString(),
      content: filterContent(content),
      authorId: currentUser?.id,
      authorName: currentUser?.username,
      authorEmoji: randomEmoji(),
      anonymous: !currentUser,
      createdAt: Date.now(),
      liked: false,
      likes: 0,
    };
    const updated = posts.map((p) =>
      p.id === postId ? { ...p, comments: [...p.comments, newComment] } : p
    );
    savePosts(updated);
    setCommentInputs((prev) => ({ ...prev, [postId]: "" }));
    playClickSound();
  };

  const handleDeletePost = (id: string) => {
    if (!confirm("确定删除这条动态吗？")) return;
    const updated = posts.filter((p) => p.id !== id);
    savePosts(updated);
    showToast("已删除", "info");
  };

  const currentUser = getCurrentUser();

  return (
    <PageTransition>
      <div className="space-y-4 max-w-2xl mx-auto">
        {/* 标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="font-sketch text-2xl font-bold" style={{ color: "var(--color-ink)" }}>
              树洞
            </h1>
            <p className="font-hand text-xs mt-1" style={{ color: "var(--text-muted)" }}>
              🌳 把压力和拖延故事留在这里，匿名也可以
            </p>
          </div>
          <button
            onClick={() => setShowCompose(true)}
            className="btn-neon text-sm font-hand flex items-center gap-1.5"
          >
            <ImagePlus className="w-4 h-4" /> 写一条
          </button>
        </div>

        {/* 发帖弹窗 */}
        <AnimatePresence>
          {showCompose && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="fixed inset-0 z-[150] flex items-center justify-center p-4"
              style={{ background: "rgba(0,0,0,0.5)" }}
              onClick={() => setShowCompose(false)}
            >
              <motion.div
                initial={{ scale: 0.9, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                exit={{ scale: 0.9, y: 20 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-lg rounded-2xl p-5"
                style={{ background: "var(--bg-primary)" }}
              >
                <div className="flex items-center justify-between mb-3">
                  <h3 className="font-hand text-base font-bold" style={{ color: "var(--color-ink)" }}>
                    发一条动态
                  </h3>
                  <button onClick={() => setShowCompose(false)} className="p-1 rounded-lg">
                    <X className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                  </button>
                </div>

                <textarea
                  value={composeContent}
                  onChange={(e) => setComposeContent(e.target.value)}
                  placeholder="分享你的故事、吐槽或小胜利..."
                  rows={4}
                  maxLength={500}
                  className="w-full p-3 rounded-xl text-sm font-hand resize-none focus:outline-none"
                  style={{ background: "rgba(255,252,240,0.8)", border: "1px solid var(--divider)", color: "var(--text-primary)" }}
                  autoFocus
                />

                {/* 图片预览 */}
                {composeImages.length > 0 && (
                  <div className="grid grid-cols-3 gap-2 mt-3">
                    {composeImages.map((img, i) => (
                      <div key={i} className="relative aspect-square rounded-lg overflow-hidden">
                        <img src={img} alt="" className="w-full h-full object-cover" />
                        <button
                          onClick={() => removeImage(i)}
                          className="absolute top-1 right-1 w-5 h-5 rounded-full bg-black/50 flex items-center justify-center"
                        >
                          <X className="w-3 h-3 text-white" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                <div className="flex items-center justify-between mt-3">
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => fileInputRef.current?.click()}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-hand"
                      style={{ background: "rgba(43,58,103,0.06)", color: "var(--text-muted)" }}
                    >
                      <ImageIcon className="w-3.5 h-3.5" />
                      {composeImages.length > 0 ? `${composeImages.length}/6` : "加图片"}
                    </button>
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      multiple
                      onChange={handleImageUpload}
                      className="hidden"
                    />
                  </div>
                  <span className="text-xs font-hand" style={{ color: "var(--text-muted)" }}>
                    {composeContent.length}/500
                  </span>
                </div>

                {/* 匿名切换 */}
                <div className="flex items-center justify-between mt-3 pt-3" style={{ borderTop: "1px solid var(--divider)" }}>
                  <span className="text-xs font-hand" style={{ color: "var(--text-muted)" }}>
                    发布身份
                  </span>
                  <button
                    onClick={() => { setComposeAnonymous(!composeAnonymous); playClickSound(); }}
                    className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-hand font-bold transition-all"
                    style={{
                      background: composeAnonymous ? "rgba(43,58,103,0.06)" : "var(--color-neon-orange)",
                      color: composeAnonymous ? "var(--text-muted)" : "#fff",
                    }}
                  >
                    {composeAnonymous ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                    {composeAnonymous ? "匿名发布" : "实名发布"}
                  </button>
                </div>

                <button
                  onClick={handlePost}
                  className="btn-neon w-full mt-4 text-sm font-hand flex items-center justify-center gap-1.5"
                >
                  <Send className="w-4 h-4" /> 发布
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* 帖子列表 */}
        <StaggerContainer className="space-y-4">
          {posts.length === 0 ? (
            <div className="text-center py-16">
              <div className="text-5xl mb-3">🌳</div>
              <p className="font-hand text-sm mb-2" style={{ color: "var(--text-muted)" }}>
                树洞还安静着，写下第一句吧
              </p>
              <p className="font-hand text-xs" style={{ color: "var(--text-muted)" }}>
                可以发文字、图片，大家还能评论点赞哦
              </p>
            </div>
          ) : (
            posts.map((post) => (
              <FadeInItem key={post.id}>
                <div className="glass-card rounded-2xl p-4">
                  {/* 头部：头像+名字+时间+删除 */}
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center text-xl"
                        style={{ background: "var(--color-apricot)" }}
                      >
                        {post.authorEmoji}
                      </div>
                      <div>
                        <p className="font-hand text-sm font-bold" style={{ color: "var(--color-ink)" }}>
                          {post.anonymous ? `匿名${post.authorEmoji}` : post.authorName}
                        </p>
                        <p className="text-[10px] font-hand" style={{ color: "var(--text-muted)" }}>
                          {formatTime(post.createdAt)}
                        </p>
                      </div>
                    </div>
                    {currentUser && post.authorId === currentUser.id && (
                      <button
                        onClick={() => handleDeletePost(post.id)}
                        className="p-1 rounded-lg opacity-50 hover:opacity-100 transition-opacity"
                      >
                        <Trash2 className="w-3.5 h-3.5" style={{ color: "var(--text-muted)" }} />
                      </button>
                    )}
                  </div>

                  {/* 文字内容 */}
                  {post.content && (
                    <p className="font-hand text-sm leading-relaxed mb-3 whitespace-pre-wrap" style={{ color: "var(--color-ink)" }}>
                      {post.content}
                    </p>
                  )}

                  {/* 图片网格 */}
                  {post.images.length > 0 && (
                    <div
                      className={`grid gap-1.5 mb-3 rounded-xl overflow-hidden ${
                        post.images.length === 1 ? "grid-cols-1" :
                        post.images.length === 2 ? "grid-cols-2" :
                        post.images.length === 4 ? "grid-cols-2" :
                        "grid-cols-3"
                      }`}
                    >
                      {post.images.map((img, i) => (
                        <div key={i} className="relative">
                          <img
                            src={img}
                            alt=""
                            className="w-full object-cover rounded-lg cursor-pointer hover:opacity-90 transition-opacity"
                            style={{ aspectRatio: post.images.length === 1 ? "auto" : "1/1" }}
                            onClick={() => window.open(img, "_blank")}
                          />
                        </div>
                      ))}
                    </div>
                  )}

                  {/* 底部：点赞+评论 */}
                  <div className="flex items-center justify-between pt-2" style={{ borderTop: "1px solid var(--divider)" }}>
                    <div className="flex items-center gap-4">
                      <button
                        onClick={() => handleLike(post.id)}
                        className="flex items-center gap-1 text-xs font-hand font-bold transition-all hover:scale-110"
                        style={{ color: post.liked ? "var(--color-neon-orange)" : "var(--text-muted)" }}
                      >
                        <Heart className={`w-4 h-4 ${post.liked ? "fill-current" : ""}`} />
                        {post.likes}
                      </button>
                      <button
                        onClick={() => setExpandedComments(expandedComments === post.id ? null : post.id)}
                        className="flex items-center gap-1 text-xs font-hand font-bold transition-all hover:scale-110"
                        style={{ color: expandedComments === post.id ? "var(--color-neon-green)" : "var(--text-muted)" }}
                      >
                        <MessageCircle className="w-4 h-4" />
                        {post.comments.length}
                      </button>
                    </div>
                    <span className="text-[10px] font-hand" style={{ color: "var(--text-muted)" }}>
                      {post.anonymous ? "匿名发布" : "实名发布"}
                    </span>
                  </div>

                  {/* 评论区 */}
                  <AnimatePresence>
                    {expandedComments === post.id && (
                      <motion.div
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                      >
                        <div className="mt-3 pt-3 space-y-2" style={{ borderTop: "1px solid var(--divider)" }}>
                          {/* 评论列表 */}
                          {post.comments.length === 0 ? (
                            <p className="text-center text-[11px] font-hand py-2" style={{ color: "var(--text-muted)" }}>
                              还没有评论，来抢沙发～
                            </p>
                          ) : (
                            post.comments.map((comment) => (
                              <div key={comment.id} className="flex gap-2">
                                <div
                                  className="w-6 h-6 rounded-full flex-shrink-0 flex items-center justify-center text-sm"
                                  style={{ background: "var(--color-apricot)" }}
                                >
                                  {comment.authorEmoji}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <span className="text-[10px] font-hand font-bold" style={{ color: "var(--color-ink)" }}>
                                      {comment.anonymous ? `匿名${comment.authorEmoji}` : comment.authorName}
                                    </span>
                                    <span className="text-[9px] font-hand" style={{ color: "var(--text-muted)" }}>
                                      {formatTime(comment.createdAt)}
                                    </span>
                                  </div>
                                  <p className="text-xs font-hand mt-0.5" style={{ color: "var(--text-secondary)" }}>
                                    {comment.content}
                                  </p>
                                  <button
                                    onClick={() => handleCommentLike(post.id, comment.id)}
                                    className="flex items-center gap-1 mt-1 text-[10px] font-hand transition-all hover:scale-110"
                                    style={{ color: comment.liked ? "var(--color-neon-orange)" : "var(--text-muted)" }}
                                  >
                                    <ThumbsUp className={`w-2.5 h-2.5 ${comment.liked ? "fill-current" : ""}`} />
                                    {comment.likes > 0 && comment.likes}
                                  </button>
                                </div>
                              </div>
                            ))
                          )}

                          {/* 评论输入框 */}
                          <div className="flex gap-2 pt-2">
                            <input
                              type="text"
                              value={commentInputs[post.id] || ""}
                              onChange={(e) =>
                                setCommentInputs((prev) => ({ ...prev, [post.id]: e.target.value }))
                              }
                              onKeyDown={(e) => { if (e.key === "Enter") handleAddComment(post.id); }}
                              placeholder="说点什么..."
                              className="flex-1 px-3 py-1.5 rounded-lg text-xs font-hand focus:outline-none"
                              style={{ background: "rgba(255,252,240,0.8)", border: "1px solid var(--divider)", color: "var(--text-primary)" }}
                            />
                            <button
                              onClick={() => handleAddComment(post.id)}
                              className="px-3 py-1.5 rounded-lg text-xs font-hand font-bold"
                              style={{ background: "var(--color-neon-orange)", color: "#fff" }}
                            >
                              <Send className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </FadeInItem>
            ))
          )}
        </StaggerContainer>

        <p className="text-center text-[10px] font-hand py-4" style={{ color: "var(--text-muted)" }}>
          🌳 树洞 · 支持文字/图片 · 可匿名 · 评论点赞互动
        </p>
      </div>
    </PageTransition>
  );
}
