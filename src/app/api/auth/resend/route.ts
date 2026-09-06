import { NextRequest, NextResponse } from "next/server";
import { createId, withDatabase } from "@/lib/server-db";
import { hasEmailService, sendVerificationEmail } from "@/lib/server-email";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  try {
    const { email: rawEmail } = await req.json();
    const emailKey = String(rawEmail || "").trim().toLocaleLowerCase();
    if (!emailKey) return NextResponse.json({ success: false, message: "请输入邮箱" }, { status: 400 });
    if (!hasEmailService()) return NextResponse.json({ success: false, message: "当前未配置邮件服务" }, { status: 400 });

    const result = await withDatabase((database) => {
      const user = database.users.find((item) => item.emailKey === emailKey);
      if (!user) return { status: 404, message: "该邮箱未注册" } as const;
      if (user.verified) return { status: 409, message: "该账号已验证，请直接登录" } as const;
      user.verificationToken = createId() + createId();
      user.verificationExpiresAt = new Date(Date.now() + 86400000).toISOString();
      return { status: 200, message: "", user } as const;
    });
    if (result.status !== 200 || !("user" in result)) return NextResponse.json({ success: false, message: result.message }, { status: result.status });

    const verifyUrl = `${req.nextUrl.origin}${req.nextUrl.basePath || ""}/verify?token=${result.user.verificationToken}`;
    await sendVerificationEmail({ email: result.user.email, username: result.user.username, verifyUrl });
    return NextResponse.json({ success: true, message: "验证邮件已重新发送" });
  } catch (error) {
    console.error("Resend verification error:", error);
    return NextResponse.json({ success: false, message: "邮件发送失败，请稍后重试" }, { status: 500 });
  }
}
