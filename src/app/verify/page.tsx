"use client";
import { useEffect, useState, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import { verifyEmail } from "@/lib/auth";
import { useAppData } from "@/hooks/useAppData";
import { PageTransition } from "@/components/Animations";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";

function VerifyContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const { switchToUser } = useAppData();
  const token = searchParams.get("token");
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [message, setMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setMessage("验证链接无效");
      return;
    }

    let active = true;
    const runVerification = async () => {
      const result = await verifyEmail(token);
      if (!active) return;
      if (result.success && result.user) {
        setStatus("success");
        setMessage("邮箱验证成功！正在为你登录...");
        switchToUser(result.user);
        setTimeout(() => router.push("/"), 2000);
      } else {
        setStatus("error");
        setMessage(result.message);
      }
    };
    void runVerification();
    return () => { active = false; };
  }, [token, router, switchToUser]);

  return (
    <div className="min-h-screen flex items-center justify-center p-4 paper-bg">
      <PageTransition>
        <div className="w-full max-w-md text-center">
          {status === "loading" && (
            <div className="glass-card rounded-2xl p-8">
              <Loader2 className="w-12 h-12 mx-auto mb-4 animate-spin" style={{ color: "var(--color-ink)" }} />
              <p className="font-hand text-lg" style={{ color: "var(--color-ink)" }}>
                正在验证邮箱...
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="glass-card rounded-2xl p-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: "var(--color-neon-green)" }}>
                <CheckCircle2 className="w-8 h-8 text-white" />
              </div>
              <h1 className="font-pixel text-sm mb-3" style={{ color: "var(--color-ink)" }}>
                VERIFIED!
              </h1>
              <p className="font-hand text-base" style={{ color: "var(--text-secondary)" }}>
                {message}
              </p>
            </div>
          )}

          {status === "error" && (
            <div className="glass-card rounded-2xl p-8">
              <div className="w-16 h-16 mx-auto mb-4 rounded-full flex items-center justify-center" style={{ background: "#EF4444" }}>
                <XCircle className="w-8 h-8 text-white" />
              </div>
              <h1 className="font-hand text-xl font-bold mb-3" style={{ color: "var(--color-ink)" }}>
                验证失败
              </h1>
              <p className="font-hand text-sm mb-6" style={{ color: "var(--text-muted)" }}>
                {message}
              </p>
              <button
                onClick={() => router.push("/login")}
                className="btn-neon text-sm"
              >
                返回登录
              </button>
            </div>
          )}
        </div>
      </PageTransition>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<div className="min-h-screen flex items-center justify-center paper-bg"><div className="animate-pulse font-hand text-lg" style={{color:"var(--color-ink)"}}>加载中...</div></div>}>
      <VerifyContent />
    </Suspense>
  );
}
