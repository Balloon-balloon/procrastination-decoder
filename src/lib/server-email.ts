import "server-only";

import nodemailer from "nodemailer";

export type EmailProvider = "resend" | "smtp";

export interface VerificationEmailInput {
  email: string;
  username: string;
  verifyUrl: string;
  verificationCode: string;
  idempotencyKey?: string;
}

export interface EmailDeliveryResult {
  provider: EmailProvider;
  messageId?: string;
}

type EmailConfiguration =
  | {
      ok: true;
      provider: "resend";
      apiKey: string;
      from: string;
    }
  | {
      ok: true;
      provider: "smtp";
      host: string;
      port: number;
      secure: boolean;
      user: string;
      password: string;
      from: string;
    }
  | {
      ok: false;
      message: string;
    };

export class EmailDeliveryError extends Error {
  constructor(
    public readonly code: "EMAIL_NOT_CONFIGURED" | "RESEND_REJECTED" | "SMTP_REJECTED",
    message: string,
  ) {
    super(message);
    this.name = "EmailDeliveryError";
  }
}

function env(name: string): string {
  return process.env[name]?.trim() ?? "";
}

function isPlaceholder(value: string): boolean {
  const normalized = value.toLowerCase();
  return (
    !value ||
    normalized.includes("your_") ||
    normalized.includes("your-") ||
    normalized.includes("example.com") ||
    normalized.includes("authorization_code") ||
    normalized.includes("replace") ||
    normalized.includes("changeme") ||
    /^re_x+$/i.test(value) ||
    /^x{6,}$/i.test(value)
  );
}

export function getEmailConfiguration(): EmailConfiguration {
  const resendApiKey = env("RESEND_API_KEY");
  if (resendApiKey && !isPlaceholder(resendApiKey)) {
    const configuredFrom = env("RESEND_FROM_EMAIL");
    if (configuredFrom && isPlaceholder(configuredFrom)) {
      return {
        ok: false,
        message: "RESEND_FROM_EMAIL 仍是示例地址，请填写已验证域名下的真实发件地址。",
      };
    }
    return {
      ok: true,
      provider: "resend",
      apiKey: resendApiKey,
      from: env("RESEND_FROM_EMAIL") || "whywait <onboarding@resend.dev>",
    };
  }

  const host = env("SMTP_HOST");
  const user = env("SMTP_USER");
  const password = env("SMTP_PASS");
  const hasAnySmtpValue = Boolean(host || user || password);
  const smtpComplete =
    host &&
    user &&
    password &&
    !isPlaceholder(host) &&
    !isPlaceholder(user) &&
    !isPlaceholder(password);

  if (smtpComplete) {
    const parsedPort = Number(env("SMTP_PORT") || "465");
    const port = Number.isInteger(parsedPort) && parsedPort > 0 ? parsedPort : 465;
    const secureValue = env("SMTP_SECURE").toLowerCase();

    return {
      ok: true,
      provider: "smtp",
      host,
      port,
      secure: secureValue ? secureValue === "true" : port === 465,
      user,
      password,
      from: env("SMTP_FROM") || `whywait <${user}>`,
    };
  }

  if (hasAnySmtpValue) {
    return {
      ok: false,
      message:
        "SMTP 邮件配置不完整或仍是示例值，请检查 SMTP_HOST、SMTP_USER 和 SMTP_PASS。",
    };
  }

  return {
    ok: false,
    message:
      "邮件服务尚未配置，请在 .env.local 中配置 RESEND_API_KEY，或完整配置 SMTP_HOST、SMTP_USER 和 SMTP_PASS。",
  };
}

function escapeHtml(value: string): string {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function buildEmailContent(input: VerificationEmailInput) {
  const username = escapeHtml(input.username);
  const code = escapeHtml(input.verificationCode);
  const verifyUrl = escapeHtml(input.verifyUrl);

  const subject = `${input.verificationCode} 是你的 whywait 邮箱验证码`;
  const text = [
    `你好，${input.username}：`,
    "",
    `你的邮箱验证码是：${input.verificationCode}`,
    "验证码和验证链接将在 15 分钟后失效。",
    "",
    `也可以打开下面的链接完成验证：${input.verifyUrl}`,
    "",
    "如果这不是你的操作，请忽略此邮件。",
  ].join("\n");
  const html = `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;max-width:560px;margin:0 auto;color:#253858;line-height:1.7">
      <h2 style="margin-bottom:8px">验证你的 whywait 邮箱</h2>
      <p>你好，${username}：</p>
      <p>请在注册页面输入下面的 6 位验证码：</p>
      <div style="font-size:32px;font-weight:700;letter-spacing:8px;background:#f4f6f8;border-radius:12px;padding:18px 22px;text-align:center">${code}</div>
      <p style="color:#6b778c">验证码和验证链接将在 15 分钟后失效。</p>
      <p style="text-align:center;margin:28px 0">
        <a href="${verifyUrl}" style="display:inline-block;background:#ff6846;color:#fff;text-decoration:none;padding:12px 24px;border-radius:9px;font-weight:600">立即验证邮箱</a>
      </p>
      <p style="font-size:13px;color:#8993a4;word-break:break-all">按钮无法打开时，请复制此链接：${verifyUrl}</p>
      <p style="font-size:13px;color:#8993a4">如果这不是你的操作，请忽略此邮件。</p>
    </div>
  `;

  return { subject, text, html };
}

async function sendWithResend(
  config: Extract<EmailConfiguration, { ok: true; provider: "resend" }>,
  input: VerificationEmailInput,
): Promise<EmailDeliveryResult> {
  const content = buildEmailContent(input);
  const headers: Record<string, string> = {
    Authorization: `Bearer ${config.apiKey}`,
    "Content-Type": "application/json",
  };
  if (input.idempotencyKey) {
    headers["Idempotency-Key"] = input.idempotencyKey;
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers,
    body: JSON.stringify({
      from: config.from,
      to: [input.email],
      subject: content.subject,
      text: content.text,
      html: content.html,
    }),
  });
  const payload = (await response.json().catch(() => ({}))) as {
    id?: string;
    message?: string;
    name?: string;
  };

  if (!response.ok) {
    const providerMessage = payload.message || payload.name || `HTTP ${response.status}`;
    const onboardingRestriction =
      response.status === 403 && config.from.toLowerCase().includes("onboarding@resend.dev");
    const message = onboardingRestriction
      ? "Resend 测试发件人只能发送到该 Resend 账号自己的邮箱。要给注册用户发信，请先在 Resend 验证域名，并将 RESEND_FROM_EMAIL 改为该域名下的地址。"
      : `Resend 拒绝发送验证邮件：${providerMessage}`;
    throw new EmailDeliveryError("RESEND_REJECTED", message);
  }

  return { provider: "resend", messageId: payload.id };
}

async function sendWithSmtp(
  config: Extract<EmailConfiguration, { ok: true; provider: "smtp" }>,
  input: VerificationEmailInput,
): Promise<EmailDeliveryResult> {
  const content = buildEmailContent(input);
  const transporter = nodemailer.createTransport({
    host: config.host,
    port: config.port,
    secure: config.secure,
    auth: { user: config.user, pass: config.password },
    connectionTimeout: 10_000,
    greetingTimeout: 10_000,
    socketTimeout: 20_000,
  });

  try {
    await transporter.verify();
    const result = await transporter.sendMail({
      from: config.from,
      to: input.email,
      subject: content.subject,
      text: content.text,
      html: content.html,
    });
    return { provider: "smtp", messageId: result.messageId };
  } catch (error) {
    const detail = error instanceof Error ? error.message : "未知错误";
    throw new EmailDeliveryError("SMTP_REJECTED", `SMTP 发送验证邮件失败：${detail}`);
  } finally {
    transporter.close();
  }
}

export async function sendVerificationEmail(
  input: VerificationEmailInput,
): Promise<EmailDeliveryResult> {
  const config = getEmailConfiguration();
  if (!config.ok) {
    throw new EmailDeliveryError("EMAIL_NOT_CONFIGURED", config.message);
  }

  try {
    return config.provider === "resend"
      ? await sendWithResend(config, input)
      : await sendWithSmtp(config, input);
  } catch (error) {
    if (error instanceof EmailDeliveryError) throw error;
    const detail = error instanceof Error ? error.message : "未知错误";
    throw new EmailDeliveryError(
      config.provider === "resend" ? "RESEND_REJECTED" : "SMTP_REJECTED",
      `验证邮件发送失败：${detail}`,
    );
  }
}

export function getPublicEmailError(error: unknown): string {
  return error instanceof EmailDeliveryError
    ? error.message
    : "验证邮件暂时无法发送，请稍后重试或联系管理员检查邮件服务配置。";
}
