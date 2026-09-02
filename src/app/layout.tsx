import type { Metadata } from "next";
import "./globals.css";
import { Navigation } from "@/components/Navigation";
import { ToastProvider } from "@/components/Toast";

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
      <body className="gradient-bg min-h-screen">
        <div className="noise-overlay" />
        <ToastProvider>
          <Navigation />
          <main className="md:ml-64 min-h-screen pb-20 md:pb-6">
            <div className="max-w-5xl mx-auto p-4 md:p-8">
              {children}
            </div>
          </main>
        </ToastProvider>
      </body>
    </html>
  );
}
