import "server-only";

interface VerificationEmailInput {
  email: string;
  username: string;
  verifyUrl: string;
}

export function hasEmailService(): boolean {
  return Boolean(process.env.RESEND_API_KEY || process.env.SMTP_HOST);
}

export async function sendVerificationEmail({
  email,
  username,
  verifyUrl,
}: VerificationEmailInput): Promise<void> {
  const html = `
    <div style="max-width:480px;margin:0 auto;font-family:sans-serif;padding:32px 24px;background:#FDF6E3;border-radius:16px;">
      <h1 style="color:#2B3A67;">whywait</h1>
      <h2 style="color:#2B3A67;font-size:18px;">Hi ${escapeHtml(username)}，欢迎注册！</h2>
      <p style="color:#5A6480;line-height:1.6;">请点击下方按钮验证你的邮箱。链接 24 小时内有效。</p>
      <a href="${verifyUrl}" style="display:block;text-align:center;background:#FF6B35;color:#fff;text-decoration:none;padding:14px 24px;border-radius:10px;font-weight:bold;">验证我的邮箱</a>
      <p style="color:#8B93A8;font-size:12px;word-break:break-all;">${verifyUrl}</p>
    </div>`;

  if (process.env.RESEND_API_KEY) {
    const response = await fetch("https://api.resend.com/emails", {
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
    if (!response.ok) throw new Error(`Resend: ${await response.text()}`);
    return;
  }

  if (process.env.SMTP_HOST) {
    const nodemailer = (await import("nodemailer")).default;
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT || 465),
      secure: (process.env.SMTP_SECURE || "true") !== "false",
      auth: process.env.SMTP_USER
        ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
        : undefined,
    });
    await transporter.sendMail({
      from: process.env.SMTP_FROM || `"whywait" <${process.env.SMTP_USER}>`,
      to: email,
      subject: "【whywait】验证你的邮箱",
      html,
    });
  }
}

function escapeHtml(value: string): string {
  return value.replace(/[&<>'"]/g, (char) => ({
    "&": "&amp;",
    "<": "&lt;",
    ">": "&gt;",
    "'": "&#39;",
    '"': "&quot;",
  })[char] || char);
}
