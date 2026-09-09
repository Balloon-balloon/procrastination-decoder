import { randomInt } from "crypto";
import { NextRequest, NextResponse } from "next/server";
import { createId, hashPassword, toPublicUser, withDatabase } from "@/lib/server-db";
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
    const body = await req.json();
    const username = String(body.username || "").trim();
    const email = String(body.email || "").trim();
    const password = String(body.password || "");
    const captchaAnswer = Number(body.captchaAnswer);
    const captchaExpected = Number(body.captchaExpected);

    if (!Number.isFinite(captchaAnswer) || captchaAnswer !== captchaExpected) {
      return NextResponse.json(
        { success: false, message: "人机验证答案错误，请重试" },
        { status: 400 },
      );
    }

    const validationError = validateRegistration(username, email, password);
    if (validationError) {
      return NextResponse.json({ success: false, message: validationError }, { status: 400 });
    }

    // 没有真实邮件服务时禁止创建“看似成功”的账号，避免演示验证码绕过邮箱所有权校验。
    const emailConfiguration = getEmailConfiguration();
    if (!emailConfiguration.ok) {
      return NextResponse.json(
        { success: false, message: emailConfiguration.message },
        { status: 503 },
      );
    }

    const usernameKey = username.toLocaleLowerCase();
    const emailKey = email.toLocaleLowerCase();
    const now = new Date().toISOString();
    const verificationToken = createId() + createId();
    const verificationCode = generateVerifyCode();
    const { hash, salt } = hashPassword(password);

    const created = await withDatabase((database) => {
      const existingEmail = database.users.find((user) => user.emailKey === emailKey);
      if (existingEmail && !existingEmail.verified) {
        return { pendingUser: existingEmail } as const;
      }
      if (existingEmail) {
        return { error: "该邮箱已注册" } as const;
      }
      if (database.users.some((user) => user.usernameKey === usernameKey)) {
        return { error: "用户名已存在" } as const;
      }

      const user = {
        id: createId(),
        username,
        usernameKey,
        email,
        emailKey,
        passwordHash: hash,
        passwordSalt: salt,
        verified: false,
        verificationToken,
        verificationCode,
        verificationExpiresAt: new Date(Date.now() + VERIFICATION_TTL_MS).toISOString(),
        hasLoggedIn: false,
        createdAt: now,
        lastLoginAt: now,
      };
      database.users.push(user);
      return { user } as const;
    });

    if ("error" in created) {
      return NextResponse.json({ success: false, message: created.error }, { status: 409 });
    }
    if ("pendingUser" in created) {
      return NextResponse.json(
        {
          success: false,
          message: "该邮箱正在等待验证，请输入邮件中的验证码或重新获取验证码",
          requiresVerification: true,
          user: toPublicUser(created.pendingUser!),
        },
        { status: 409 },
      );
    }

    try {
      await sendVerificationEmail({
        email,
        username,
        verifyUrl: getVerifyUrl(req, verificationToken),
        verificationCode,
        idempotencyKey: `register-${created.user.id}`,
      });
    } catch (error) {
      console.error("Registration email error:", error);

      // 邮件没被服务商接受时回滚本次注册，用户修复配置后可以用同一邮箱重试。
      await withDatabase((database) => {
        database.users = database.users.filter((user) => user.id !== created.user.id);
      });

      return NextResponse.json(
        { success: false, message: getPublicEmailError(error) },
        { status: 502 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "6 位验证码已发送，请在 15 分钟内完成邮箱验证",
      requiresVerification: true,
      user: toPublicUser(created.user),
    });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { success: false, message: "注册服务暂时不可用" },
      { status: 500 },
    );
  }
}

function validateRegistration(username: string, email: string, password: string): string | null {
  if (username.length < 2) return "用户名至少2个字符";
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "邮箱格式不正确";
  if (password.length < 4) return "密码至少4个字符";
  return null;
}
