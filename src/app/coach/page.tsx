"use client";
import { useState, useRef, useEffect } from "react";
import { useAppData } from "@/hooks/useAppData";
import { PERSONALITY_TYPES } from "@/lib/personality";
import { calculateStreak } from "@/lib/store";
import { PageTransition } from "@/components/Animations";
import { Sparkles, Send, Bot, User } from "lucide-react";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const QUICK_QUESTIONS = [
  "我总是拖延怎么办？",
  "怎么提高专注力？",
  "完美主义让我无法开始",
  "怎么克服焦虑型拖延？",
];

export default function CoachPage() {
  const { data, loaded } = useAppData();
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  useEffect(() => {
    // 初始欢迎语
    const personality = data.profile.personalityResult;
    const personalityName = personality
      ? PERSONALITY_TYPES[personality.type].name
      : "未测试";

    setMessages([
      {
        role: "assistant",
        content: `你好！我是你的拖延解码教练 🧠\n\n我看到你的拖延人格类型是「${personalityName}」。有什么问题可以问我，比如：\n• 我总是拖延怎么办？\n• 怎么提高专注力？\n• 针对我的类型有什么建议？`,
      },
    ]);
  }, [data.profile.personalityResult]);

  const handleSend = async () => {
    if (!input.trim() || loading) return;

    const userMessage = input.trim();
    setInput("");
    setMessages((prev) => [...prev, { role: "user", content: userMessage }]);
    setLoading(true);

    try {
      const personality = data.profile.personalityResult;
      const completedTasks = data.tasks.filter((t) => t.status === "completed");
      const completionRate =
        data.tasks.length > 0
          ? Math.round((completedTasks.length / data.tasks.length) * 100)
          : 0;
      const totalPostpone = data.tasks.reduce((sum, t) => sum + t.postponedCount, 0);
      const focusMin = Math.floor(
        data.focusSessions
          .filter((s) => s.completed)
          .reduce((sum, s) => sum + s.duration, 0) / 60
      );
      const streak = calculateStreak(data.tasks);

      const res = await fetch("/api/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            ...messages.slice(-6),
            { role: "user", content: userMessage },
          ],
          context: {
            personalityType: personality?.type,
            personalityName: personality
              ? PERSONALITY_TYPES[personality.type].name
              : undefined,
            taskStats: {
              total: data.tasks.length,
              completed: completedTasks.length,
              postponed: totalPostpone,
              avgPostpone:
                data.tasks.length > 0
                  ? totalPostpone / data.tasks.length
                  : 0,
              completionRate,
            },
            focusMin,
            streak,
          },
        }),
      });

      const data2 = await res.json();
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: data2.reply || "抱歉，我暂时无法回复。" },
      ]);
    } catch (error) {
      setMessages((prev) => [
        ...prev,
        { role: "assistant", content: "抱歉，连接出了点问题，请稍后再试。" },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickQuestion = (q: string) => {
    setInput(q);
  };

  if (!loaded) return <div className="text-center py-20 text-dark-400">加载中...</div>;

  return (
    <PageTransition>
    <div className="flex flex-col h-[calc(100vh-120px)]">
      <div className="mb-4">
        <h1 className="text-2xl font-bold text-white">AI 教练</h1>
        <p className="text-sm text-dark-400 mt-1">
          基于你的拖延人格，提供个性化建议
        </p>
      </div>

      {/* Messages */}
      <div className="flex-1 glass-card rounded-2xl p-4 overflow-y-auto mb-4">
        <div className="space-y-4">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex items-start gap-3 ${
                msg.role === "user" ? "flex-row-reverse" : ""
              }`}
            >
              <div
                className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                  msg.role === "user"
                    ? "bg-gradient-to-br from-accent-500 to-primary-600"
                    : "bg-gradient-to-br from-purple-500 to-pink-500"
                }`}
              >
                {msg.role === "user" ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <Bot className="w-4 h-4 text-white" />
                )}
              </div>
              <div
                className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-gradient-to-br from-accent-500/30 to-primary-600/30 text-white border border-accent-500/30"
                    : "bg-dark-800/50 text-dark-200 border border-dark-700/50"
                }`}
              >
                {msg.content}
              </div>
            </div>
          ))}
          {loading && (
            <div className="flex items-start gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                <Bot className="w-4 h-4 text-white" />
              </div>
              <div className="px-4 py-3 rounded-2xl bg-dark-800/50 border border-dark-700/50">
                <div className="flex gap-1">
                  <span className="w-2 h-2 bg-dark-400 rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                  <span className="w-2 h-2 bg-dark-400 rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                  <span className="w-2 h-2 bg-dark-400 rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {/* Quick Questions */}
      {messages.length <= 1 && (
        <div className="flex flex-wrap gap-2 mb-4">
          {QUICK_QUESTIONS.map((q) => (
            <button
              key={q}
              onClick={() => handleQuickQuestion(q)}
              className="px-3 py-1.5 rounded-full glass-card text-xs text-dark-300 hover:text-white hover:border-accent-500/50 transition-all"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      {/* Input */}
      <div className="flex gap-3">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSend()}
          placeholder="输入你的问题..."
          className="flex-1 px-4 py-3 rounded-xl bg-dark-800/50 border border-dark-700/50 text-white text-sm focus:outline-none focus:border-accent-500/50 transition-colors"
        />
        <button
          onClick={handleSend}
          disabled={!input.trim() || loading}
          className="px-5 py-3 rounded-xl bg-gradient-to-r from-accent-500 to-primary-600 text-white text-sm font-medium hover:opacity-90 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
        >
          <Sparkles className="w-4 h-4" />
          发送
        </button>
      </div>
    </div>
    </PageTransition>
  );
}
