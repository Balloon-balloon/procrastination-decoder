import { NextRequest, NextResponse } from "next/server";
import { toPublicUser, withDatabase } from "@/lib/server-db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { token: rawToken, code: rawCode, email: rawEmail } = await req.json();
    const token = rawToken ? String(rawToken) : "";
    const code = rawCode ? String(rawCode).trim() : "";
    const email = rawEmail ? String(rawEmail).trim().toLocaleLowerCase() : "";

    const result = await withDatabase((database) => {
      let user;
      if (token) {
        // 通过 token 验证（邮件链接）
        user = database.users.find((item) => item.verificationToken === token);
        if (!user) return { status: 400, message: "验证链接无效或已使用" } as const;
      } else if (code && email) {
        if (!/^\d{6}$/.test(code)) {
          return { status: 400, message: "请输入邮件中的 6 位验证码" } as const;
        }
        // 通过邮件中的 6 位验证码验证
        user = database.users.find((item) => item.emailKey === email && item.verificationCode === code);
        if (!user) return { status: 400, message: "验证码错误，请重新输入" } as const;
      } else {
        return { status: 400, message: "验证参数不完整" } as const;
      }

      if (!user.verificationExpiresAt || new Date(user.verificationExpiresAt).getTime() < Date.now()) {
        return { status: 400, message: "验证已过期，请返回登录页重发" } as const;
      }
      user.verified = true;
      user.verificationToken = undefined;
      user.verificationCode = undefined;
      user.verificationExpiresAt = undefined;
      return { status: 200, message: "邮箱验证成功，请返回登录页登录", user: toPublicUser(user) } as const;
    });
    return NextResponse.json({ success: result.status === 200, message: result.message, user: result.user }, { status: result.status });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json({ success: false, message: "验证服务暂时不可用" }, { status: 500 });
  }
}
