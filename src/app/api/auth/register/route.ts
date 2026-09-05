import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { email, username, verificationToken } = await req.json();

    if (!email || !verificationToken) {
      return NextResponse.json({ error: "缺少必要参数" }, { status: 400 });
    }

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || req.nextUrl.origin;
    const verifyUrl = `${baseUrl}/verify?token=${verificationToken}`;

    const html = `
      <div style="max-width:480px;margin:0 auto;font-family:'Patrick Hand','LXGW WenKai Screen',sans-serif;padding:32px 24px;background:#FDF6E3;border-radius:16px;">
        <div style="text-align:center;margin-bottom:24px;">
          <div style="width:56px;height:56px;margin:0 auto 16px;display:flex;align-items:center;justify-content:center;">
            <svg width="48" height="48" viewBox="0 0 32 32" fill="none">
              <circle cx="16" cy="16" r="14" stroke="#2B3A67" stroke-width="2.5" fill="#FAD6A5"/>
              <line x1="16" y1="4" x2="16" y2="6" stroke="#2B3A67" stroke-width="2" stroke-linecap="round"/>
              <line x1="16" y1="26" x2="16" y2="28" stroke="#2B3A67" stroke-width="2" stroke-linecap="round"/>
              <line x1="4" y1="16" x2="6" y2="16" stroke="#2B3A67" stroke-width="2" stroke-linecap="round"/>
              <line x1="26" y1="16" x2="28" y2="16" stroke="#2B3A67" stroke-width="2" stroke-linecap="round"/>
              <line x1="16" y1="16" x2="10" y2="11" stroke="#FF6B35" stroke-width="2.5" stroke-linecap="round"/>
              <line x1="16" y1="16" x2="22" y2="12" stroke="#2B3A67" stroke-width="2" stroke-linecap="round"/>
              <circle cx="16" cy="16" r="2" fill="#FF6B35"/>
            </svg>
          </div>
          <h1 style="font-family:'Amatic SC',cursive;font-size:32px;font-weight:700;color:#2B3A67;margin:0;letter-spacing:0.05em;">whywait</h1>
          <p style="color:#8B93A8;font-size:14px;margin:4px 0 0;font-style:italic;">Why Wait? · 别等了，开始吧</p>
        </div>
        <div style="background:#fff;border-radius:12px;padding:24px;border:1px solid rgba(43,58,103,0.08);">
          <h2 style="color:#2B3A67;font-size:18px;margin:0 0 12px;">Hi ${username}，欢迎注册！</h2>
          <p style="color:#5A6480;font-size:14px;line-height:1.6;margin:0 0 20px;">
            请点击下方按钮验证你的邮箱。验证后即可登录使用 whywait，开启你的高效之旅。
          </p>
          <a href="${verifyUrl}" style="display:block;text-align:center;background:#FF6B35;color:#fff;text-decoration:none;padding:14px 24px;border-radius:10px;font-size:16px;font-weight:bold;margin-bottom:16px;">
            ✉️ 验证我的邮箱
          </a>
          <p style="color:#8B93A8;font-size:12px;margin:0;">
            或复制此链接到浏览器：<br/>
            <span style="color:#5A6480;word-break:break-all;">${verifyUrl}</span>
          </p>
          <p style="color:#8B93A8;font-size:11px;margin:16px 0 0;text-align:center;">
            链接有效期 24 小时 · 如非本人操作请忽略此邮件
          </p>
        </div>
      </div>
    `;

    // 方式 1: 使用 Resend
    if (process.env.RESEND_API_KEY) {
      const resendResponse = await fetch("https://api.resend.com/emails", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: process.env.RESEND_FROM_EMAIL || "whywait <onboarding@resend.dev>",
          to: email,
          subject: "【whywait】验证你的邮箱",
          html,
        }),
      });

      if (!resendResponse.ok) {
        const err = await resendResponse.text();
        console.error("Resend error:", err);
        return NextResponse.json({ error: "邮件发送失败: " + err }, { status: 500 });
      }

      return NextResponse.json({ success: true, message: "验证邮件已发送" });
    }

    // 方式 2: 使用 Nodemailer + SMTP
    if (process.env.SMTP_HOST) {
      const nodemailer = (await import("nodemailer")).default;
      const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "465"),
        secure: true,
        auth: {
          user: process.env.SMTP_USER,
          pass: process.env.SMTP_PASS,
        },
      });

      await transporter.sendMail({
        from: process.env.SMTP_FROM || `"whywait" <noreply@example.com>`,
        to: email,
        subject: "【whywait】验证你的邮箱",
        html,
      });

      return NextResponse.json({ success: true, message: "验证邮件已发送" });
    }

    // 无配置时返回验证链接（开发模式）
    return NextResponse.json({
      success: true,
      message: "未配置邮件服务，请查看返回的验证链接",
      verifyUrl,
    });
  } catch (error: any) {
    console.error("Registration email error:", error);
    return NextResponse.json(
      { error: "发送邮件失败: " + (error?.message || "未知错误") },
      { status: 500 }
    );
  }
}
