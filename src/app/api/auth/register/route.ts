import { NextRequest, NextResponse } from "next/server";
import { createId, hashPassword, toPublicUser, withDatabase } from "@/lib/server-db";
import { hasEmailService, sendVerificationEmail } from "@/lib/server-email";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const username = String(body.username || "").trim();
    const email = String(body.email || "").trim();
    const password = String(body.password || "");
    const captchaAnswer = Number(body.captchaAnswer);
    const captchaExpected = Number(body.captchaExpected);

    // 人机验证
    if (isNaN(captchaAnswer) || captchaAnswer !== captchaExpected) {
      return NextResponse.json({ success: false, message: "人机验证答案错误，请重试" }, { status: 400 });
    }

    const validationError = validateRegistration(username, email, password);
    if (validationError) return NextResponse.json({ success: false, message: validationError }, { status: 400 });

    const usernameKey = username.toLocaleLowerCase();
    const emailKey = email.toLocaleLowerCase();
    const hasEmail = hasEmailService();
    const now = new Date().toISOString();
    const verificationToken = hasEmail ? createId() + createId() : undefined;
    const { hash, salt } = hashPassword(password);

    const created = await withDatabase((database) => {
      if (database.users.some((user) => user.usernameKey === usernameKey)) return { error: "用户名已存在" } as const;
      if (database.users.some((user) => user.emailKey === emailKey)) return { error: "该邮箱已注册" } as const;
      const user = {
        id: createId(), username, usernameKey, email, emailKey,
        passwordHash: hash, passwordSalt: salt,
        verified: !hasEmail,
        verificationToken,
        verificationExpiresAt: hasEmail ? new Date(Date.now() + 86400000).toISOString() : undefined,
        createdAt: now, lastLoginAt: now,
      };
      database.users.push(user);
      return { user } as const;
    });
    if ("error" in created) return NextResponse.json({ success: false, message: created.error }, { status: 409 });

    if (hasEmail && verificationToken) {
      const verifyUrl = `${req.nextUrl.origin}${req.nextUrl.basePath || ""}/verify?token=${verificationToken}`;
      try {
        await sendVerificationEmail({ email, username, verifyUrl });
        return NextResponse.json({
          success: true,
          message: "注册成功，验证链接已发送到你的邮箱，请点击邮件中的链接完成验证",
          requiresVerification: true,
          user: toPublicUser(created.user),
        });
      } catch (error) {
        console.error("Registration email error:", error);
        return NextResponse.json({
          success: false,
          message: "验证邮件发送失败，请检查邮箱地址或稍后重试",
        }, { status: 502 });
      }
    }

    // 无邮件服务：直接注册成功，自动登录
    return NextResponse.json({
      success: true,
      message: "注册成功，已自动登录",
      requiresVerification: false,
      user: toPublicUser(created.user),
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ success: false, message: "注册服务暂时不可用" }, { status: 500 });
  }
}

function validateRegistration(username: string, email: string, password: string): string | null {
  if (username.length < 2) return "用户名至少2个字符";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "邮箱格式不正确";
  if (password.length < 4) return "密码至少4个字符";
  return null;
}
