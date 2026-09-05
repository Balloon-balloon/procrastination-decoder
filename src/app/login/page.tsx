"use client";
import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PageTransition } from "@/components/Animations";
import {
  registerUserWithEmail,
  loginUser,
  resendVerification,
} from "@/lib/auth";
import { useAppData } from "@/hooks/useAppData";
import {
  Brain,
  User,
  Mail,
  Lock,
  LogIn,
  UserPlus,
  LogOut,
  Send,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";
import { useToast } from "@/components/Toast";
import { playClickSound, playErrorSound } from "@/lib/sound";

function LoginContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { currentUser, switchToUser, logout } = useAppData();
  const { showToast } = useToast();
  const [mode, setMode] = useState<"login" | "register">("login");
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);
  const [showResend, setShowResend] = useState(false);
  const [unverifiedEmail, setUnverifiedEmail] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSuccess("");
    setShowResend(false);
    setLoading(true);
    playClickSound();

    await new Promise((r) => setTimeout(r, 500));

    if (mode === "register") {
      if (password !== confirmPassword) {
        setError("两次输入的密码不一致");
        playErrorSound();
        setLoading(false);
        return;
      }
      const result = registerUserWithEmail(username, email, password);
      if (result.success && result.user) {
        // 如果已自动验证（开发模式），直接登录
        if (result.user.verified) {
          setSuccess("注册成功！正在为你登录...");
          showToast(`欢迎加入 whywait，${result.user.username} 🎉`, "success");
          switchToUser(result.user);
          setTimeout(() => router.push("/"), 800);
        } else {
          // 生产模式：调用 API 发送验证邮件
          try {
            const res = await fetch("/api/auth/register", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                email: result.user.email,
                username: result.user.username,
                verificationToken: result.user.verificationToken,
              }),
            });
            const data = await res.json();

            if (data.verifyUrl) {
              setSuccess(`验证邮件已发送到 ${email}，请查收邮箱`);
            } else {
              setSuccess(`验证邮件已发送到 ${email}，请查收邮箱并点击验证链接完成注册`);
            }
            setShowResend(true);
            setUnverifiedEmail(email);
            showToast("验证邮件已发送 📧", "success");
          } catch {
            setSuccess("注册成功，但邮件发送失败。请联系管理员或重试。");
            setShowResend(true);
            setUnverifiedEmail(email);
          }
        }
      } else {
        setError(result.message);
        playErrorSound();
      }
    } else {
      const result = loginUser(username, password);
      if (result.success && result.user) {
        setSuccess("登录成功！");
        showToast(`欢迎回来，${result.user.username}`, "success");
        switchToUser(result.user);
        setTimeout(() => router.push("/"), 500);
      } else {
        setError(result.message);
        if (!result.user?.verified) {
          setShowResend(true);
          setUnverifiedEmail(result.user?.email || username);
        }
        playErrorSound();
      }
    }
    setLoading(false);
  };

  const handleResend = async () => {
    if (!unverifiedEmail) return;
    playClickSound();
    const result = resendVerification(unverifiedEmail);
    if (result.success && result.user) {
      try {
        await fetch("/api/auth/register", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            email: result.user.email,
            username: result.user.username,
            verificationToken: result.user.verificationToken,
          }),
        });
      } catch {}
      showToast("验证邮件已重新发送 📧", "success");
      setSuccess(`验证邮件已重新发送到 ${unverifiedEmail}`);
    } else {
      setError(result.message);
      playErrorSound();
    }
  };

  const handleLogout = () => {
    logout();
    showToast("已退出登录", "info");
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 paper-bg">
      <PageTransition>
        <div className="w-full max-w-md">
          {/* Logo */}
          <div className="text-center mb-8">
            <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <svg width="56" height="56" viewBox="0 0 32 32" fill="none">
                <circle cx="16" cy="16" r="14" stroke="var(--color-ink)" strokeWidth="2.5" fill="var(--color-apricot)" />
                <line x1="16" y1="4" x2="16" y2="6" stroke="var(--color-ink)" strokeWidth="2" strokeLinecap="round" />
                <line x1="16" y1="26" x2="16" y2="28" stroke="var(--color-ink)" strokeWidth="2" strokeLinecap="round" />
                <line x1="4" y1="16" x2="6" y2="16" stroke="var(--color-ink)" strokeWidth="2" strokeLinecap="round" />
                <line x1="26" y1="16" x2="28" y2="16" stroke="var(--color-ink)" strokeWidth="2" strokeLinecap="round" />
                <line x1="16" y1="16" x2="10" y2="11" stroke="var(--color-neon-orange)" strokeWidth="2.5" strokeLinecap="round" />
                <line x1="16" y1="16" x2="22" y2="12" stroke="var(--color-ink)" strokeWidth="2" strokeLinecap="round" />
                <circle cx="16" cy="16" r="2" fill="var(--color-neon-orange)" />
              </svg>
            </div>
            <h1 className="font-sketch text-3xl font-bold mb-1" style={{ color: "var(--color-ink)", letterSpacing: "0.05em" }}>
              whywait
            </h1>
            <p className="font-handwritten text-base" style={{ color: "var(--text-muted)" }}>
              Why Wait? · 别等了，开始吧
            </p>
          </div>

          {/* 已登录状态 */}
          {currentUser ? (
            <div className="glass-card rounded-2xl p-6 text-center">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: "var(--color-apricot)" }}>
                <User className="w-8 h-8" style={{ color: "var(--color-ink)" }} />
              </div>
              <h2 className="font-hand text-lg font-bold mb-1" style={{ color: "var(--color-ink)" }}>
                {currentUser.username}
              </h2>
              <p className="font-hand text-sm mb-4" style={{ color: "var(--text-muted)" }}>
                已登录
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => router.push("/")}
                  className="btn-neon flex-1 text-sm font-hand"
                >
                  进入应用
                </button>
                <button
                  onClick={handleLogout}
                  className="flex-1 py-2.5 rounded-lg text-sm font-hand transition-colors flex items-center justify-center gap-1.5"
                  style={{
                    background: "rgba(43,58,103,0.06)",
                    color: "var(--text-secondary)",
                    border: "1px solid var(--divider)",
                  }}
                >
                  <LogOut className="w-4 h-4" /> 退出
                </button>
              </div>
            </div>
          ) : (
            <div className="glass-card rounded-2xl p-6">
              {/* Tab 切换 */}
              <div
                className="flex rounded-xl p-1 mb-6"
                style={{ background: "rgba(43,58,103,0.06)" }}
              >
                <button
                  onClick={() => { setMode("login"); setError(""); setSuccess(""); setShowResend(false); }}
                  className="flex-1 py-2 rounded-lg text-sm font-bold font-hand transition-all flex items-center justify-center gap-1.5"
                  style={mode === "login" ? { background: "var(--color-neon-orange)", color: "#fff" } : { color: "var(--text-muted)" }}
                >
                  <LogIn className="w-4 h-4" /> 登录
                </button>
                <button
                  onClick={() => { setMode("register"); setError(""); setSuccess(""); setShowResend(false); }}
                  className="flex-1 py-2 rounded-lg text-sm font-bold font-hand transition-all flex items-center justify-center gap-1.5"
                  style={mode === "register" ? { background: "var(--color-neon-orange)", color: "#fff" } : { color: "var(--text-muted)" }}
                >
                  <UserPlus className="w-4 h-4" /> 注册
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 用户名 */}
                <div>
                  <label className="text-xs font-hand mb-1.5 block" style={{ color: "var(--text-muted)" }}>
                    用户名
                  </label>
                  <div className="relative">
                    <User className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-subtle)" }} />
                    <input
                      type="text"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                      placeholder="输入用户名"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-hand focus:outline-none transition-colors"
                      style={{ background: "rgba(255,252,240,0.8)", border: "1px solid var(--divider)", color: "var(--text-primary)" }}
                      autoFocus
                    />
                  </div>
                </div>

                {/* 邮箱（注册时显示） */}
                {mode === "register" && (
                  <div>
                    <label className="text-xs font-hand mb-1.5 block" style={{ color: "var(--text-muted)" }}>
                      邮箱
                    </label>
                    <div className="relative">
                      <Mail className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-subtle)" }} />
                      <input
                        type="email"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        placeholder="your@email.com"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-hand focus:outline-none transition-colors"
                        style={{ background: "rgba(255,252,240,0.8)", border: "1px solid var(--divider)", color: "var(--text-primary)" }}
                      />
                    </div>
                  </div>
                )}

                {/* 密码 */}
                <div>
                  <label className="text-xs font-hand mb-1.5 block" style={{ color: "var(--text-muted)" }}>
                    密码
                  </label>
                  <div className="relative">
                    <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-subtle)" }} />
                    <input
                      type="password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="输入密码"
                      className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-hand focus:outline-none transition-colors"
                      style={{ background: "rgba(255,252,240,0.8)", border: "1px solid var(--divider)", color: "var(--text-primary)" }}
                    />
                  </div>
                </div>

                {/* 确认密码（注册时） */}
                {mode === "register" && (
                  <div>
                    <label className="text-xs font-hand mb-1.5 block" style={{ color: "var(--text-muted)" }}>
                      确认密码
                    </label>
                    <div className="relative">
                      <Lock className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: "var(--text-subtle)" }} />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                        placeholder="再次输入密码"
                        className="w-full pl-10 pr-4 py-2.5 rounded-xl text-sm font-hand focus:outline-none transition-colors"
                        style={{ background: "rgba(255,252,240,0.8)", border: "1px solid var(--divider)", color: "var(--text-primary)" }}
                      />
                    </div>
                  </div>
                )}

                {/* 错误提示 */}
                {error && (
                  <div className="p-3 rounded-lg text-sm font-hand flex items-start gap-2" style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.3)", color: "#EF4444" }}>
                    <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span>{error}</span>
                  </div>
                )}

                {/* 成功提示 */}
                {success && (
                  <div className="p-3 rounded-lg text-sm font-hand flex items-start gap-2" style={{ background: "rgba(78,205,196,0.1)", border: "1px solid rgba(78,205,196,0.3)", color: "#2E9A92" }}>
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" />
                    <span className="break-all">{success}</span>
                  </div>
                )}

                {/* 重发验证邮件 */}
                {showResend && (
                  <button
                    type="button"
                    onClick={handleResend}
                    className="w-full py-2 rounded-lg text-xs font-hand flex items-center justify-center gap-1.5 transition-colors"
                    style={{ background: "rgba(250,214,165,0.3)", color: "var(--color-ink)" }}
                  >
                    <Send className="w-3.5 h-3.5" /> 重发验证邮件
                  </button>
                )}

                {/* 提交按钮 */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-neon w-full text-sm font-hand disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      处理中...
                    </>
                  ) : mode === "login" ? (
                    "登录"
                  ) : (
                    "注册并发送验证邮件"
                  )}
                </button>
              </form>

              {/* 底部切换 */}
              <p className="text-[11px] font-hand text-center mt-4" style={{ color: "var(--text-muted)" }}>
                {mode === "login" ? (
                  <>
                    还没有账号？
                    <button
                      onClick={() => { setMode("register"); setError(""); setSuccess(""); setShowResend(false); }}
                      className="ml-1 font-bold font-hand"
                      style={{ color: "var(--color-neon-orange)" }}
                    >
                      立即注册
                    </button>
                  </>
                ) : (
                  <>
                    已有账号？
                    <button
                      onClick={() => { setMode("login"); setError(""); setSuccess(""); setShowResend(false); }}
                      className="ml-1 font-bold font-hand"
                      style={{ color: "var(--color-neon-orange)" }}
                    >
                      去登录
                    </button>
                  </>
                )}
              </p>

              <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--divider)" }}>
                <p className="text-[10px] font-hand text-center" style={{ color: "var(--text-muted)" }}>
                  💡 注册后需验证邮箱才能登录 · 每个账号数据独立存储
                </p>
              </div>
            </div>
          )}
        </div>
      </PageTransition>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center paper-bg"><div className="animate-pulse font-hand text-lg" style={{color:"var(--color-ink)"}}>加载中...</div></div>}>
      <LoginContent />
    </Suspense>
  );
}
