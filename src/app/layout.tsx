import type { Metadata } from "next";
import "./globals.css";
import { AppShell } from "@/components/AppShell";
import { ToastProvider } from "@/components/Toast";
import { DarkModeManager } from "@/components/DarkModeManager";

export const metadata: Metadata = {
  title: "拖延解码器 | Procrastination Decoder",
  description: "解码你的拖延人格，重启行动力",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="zh-CN">
      <body className="paper-bg min-h-screen">
        <DarkModeManager />
        <ToastProvider>
          <AppShell>{children}</AppShell>
        </ToastProvider>
      </body>
    </html>
  );
}
