import { randomInt } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createId, withDatabase } from "@/lib/server-db";
import {
  getEmailConfiguration,
  getPublicEmailError,
  sendVerificationEmail,
} from "@/lib/server-email";

export const runtime = "nodejs";

const VERIFICATION_TTL_MS = 15 * 60 * 1000;

function generateVerifyCode(): string {
  return randomInt(100000, 1000000).toString();
}

function getVerifyUrl(req: NextRequest, token: string): string {
  const configuredOrigin = (process.env.APP_URL || process.env.NEXT_PUBLIC_APP_URL || "")
    .trim()
    .replace(/\/$/, "");
  const origin = configuredOrigin || `${req.nextUrl.origin}${req.nextUrl.basePath || ""}`;
  return `${origin}/verify?token=${encodeURIComponent(token)}`;
}

export async function POST(req: NextRequest) {
  try {
    const { email: rawEmail } = await req.json();
    const emailKey = String(rawEmail || "").trim().toLocaleLowerCase();
    if (!emailKey) {
      return NextResponse.json({ success: false, message: "请输入邮箱" }, { status: 400 });
    }

    const emailConfiguration = getEmailConfiguration();
    if (!emailConfiguration.ok) {
      return NextResponse.json(
        { success: false, message: emailConfiguration.message },
        { status: 503 },
      );
    }

    const result = await withDatabase((database) => {
      const user = database.users.find((item) => item.emailKey === emailKey);
      if (!user) return { status: 404, message: "该邮箱未注册" } as const;
      if (user.verified) return { status: 409, message: "该账号已验证，请直接登录" } as const;

      const previousVerification = {
        token: user.verificationToken,
        code: user.verificationCode,
        expiresAt: user.verificationExpiresAt,
      };
      user.verificationToken = createId() + createId();
      user.verificationCode = generateVerifyCode();
      user.verificationExpiresAt = new Date(Date.now() + VERIFICATION_TTL_MS).toISOString();
      return { status: 200, message: "", user: { ...user }, previousVerification } as const;
    });

    if (result.status !== 200 || !("user" in result)) {
      return NextResponse.json(
        { success: false, message: result.message },
        { status: result.status },
      );
    }

    const pendingUser = result.user;
    const previousVerification = result.previousVerification;

    try {
      await sendVerificationEmail({
        email: pendingUser.email,
        username: pendingUser.username,
        verifyUrl: getVerifyUrl(req, pendingUser.verificationToken!),
        verificationCode: pendingUser.verificationCode!,
        idempotencyKey: `resend-${pendingUser.id}-${pendingUser.verificationToken}`,
      });
    } catch (error) {
      console.error("Resend verification error:", error);

      // 发送失败时保留旧验证码，避免一次失败的重发让用户手里的有效邮件失效。
      await withDatabase((database) => {
        const user = database.users.find((item) => item.id === pendingUser.id);
        if (!user || user.verificationToken !== pendingUser.verificationToken) return;
        user.verificationToken = previousVerification.token;
        user.verificationCode = previousVerification.code;
        user.verificationExpiresAt = previousVerification.expiresAt;
      });

      return NextResponse.json(
        { success: false, message: getPublicEmailError(error) },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "新的 6 位验证码已发送，请在 15 分钟内完成验证",
    });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json(
      { success: false, message: "邮件发送失败，请稍后重试" },
      { status: 500 },
    );
  }
}
