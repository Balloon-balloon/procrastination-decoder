import { NextRequest, NextResponse } from "next/server";
import { toPublicUser, verifyPassword, withDatabase } from "@/lib/server-db";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { identifier: rawIdentifier, password: rawPassword } = await req.json();
    const identifier = String(rawIdentifier || "").trim().toLocaleLowerCase();
    const password = String(rawPassword || "");
    if (!identifier || !password) return NextResponse.json({ success: false, message: "请输入账号和密码" }, { status: 400 });

    const result = await withDatabase((database) => {
      const user = database.users.find((item) => item.usernameKey === identifier || item.emailKey === identifier);
      if (!user) return { status: 404, message: "用户不存在" } as const;
      if (!verifyPassword(password, user.passwordSalt, user.passwordHash)) return { status: 401, message: "密码错误" } as const;
      if (!user.verified) return { status: 403, message: "请先验证邮箱", user: toPublicUser(user) } as const;
      const isFirstLogin = user.hasLoggedIn === undefined
        ? user.createdAt === user.lastLoginAt
        : !user.hasLoggedIn;
      user.hasLoggedIn = true;
      user.lastLoginAt = new Date().toISOString();
      return {
        status: 200,
        message: "登录成功",
        user: { ...toPublicUser(user), isFirstLogin },
      } as const;
    });
    return NextResponse.json({ success: result.status === 200, message: result.message, user: result.user }, { status: result.status });
  } catch (error) {
    console.error("Login error:", error);
    return NextResponse.json({ success: false, message: "登录服务暂时不可用" }, { status: 500 });
  }
}
