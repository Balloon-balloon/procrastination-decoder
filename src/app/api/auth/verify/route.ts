import { NextRequest, NextResponse } from "next/server";
import { toPublicUser, withDatabase } from "@/lib/server-db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { token: rawToken } = await req.json();
    const token = String(rawToken || "");
    const result = await withDatabase((database) => {
      const user = database.users.find((item) => item.verificationToken === token);
      if (!user) return { status: 400, message: "验证链接无效或已使用" } as const;
      if (!user.verificationExpiresAt || new Date(user.verificationExpiresAt).getTime() < Date.now()) return { status: 400, message: "验证链接已过期，请返回登录页重发" } as const;
      user.verified = true;
      user.verificationToken = undefined;
      user.verificationExpiresAt = undefined;
      user.lastLoginAt = new Date().toISOString();
      return { status: 200, message: "邮箱验证成功", user: { ...toPublicUser(user), isFirstLogin: true } } as const;
    });
    return NextResponse.json({ success: result.status === 200, message: result.message, user: result.user }, { status: result.status });
  } catch (error) {
    console.error("Verification error:", error);
    return NextResponse.json({ success: false, message: "验证服务暂时不可用" }, { status: 500 });
  }
}
