"use client";
import { useState } from "react";
import { motion } from "framer-motion";
import { PageTransition } from "@/components/Animations";
import {
  Brain, ListTodo, Timer, Users, TreePine, Handshake,
  BarChart3, User, Sparkles, ChevronDown, ChevronRight,
  Target, Zap, Award, BookOpen, Lightbulb,
} from "lucide-react";

const SECTIONS = [
  {
    id: "intro",
    title: "欢迎使用 WhyWait",
    icon: Sparkles,
    content: `WhyWait 是一款专门为"拖延症患者"设计的效率工具。
我们相信：拖延不是时间管理问题，是情绪管理问题。
所以我们不做"逼你干活"的工具，我们帮你"降低启动的阻力"。`,
  },
  {
    id: "personality",
    title: "第一步：人格测试",
    icon: Brain,
    content: `先花 3 分钟做 8 道题，测出你的拖延人格类型。
共有 6 种类型：完美主义者、梦想家、焦虑者、危机制造者、反抗者、过度付出者。
知道自己为什么拖延，才能对症下药。
测试结果会影响 AI 给你的建议策略。`,
  },
  {
    id: "tasks",
    title: "任务管理 + AI 拆解",
    icon: ListTodo,
    content: `创建任务后，点击「AI 拆解」按钮，AI 会帮你：
1. 把大任务拆成 5-7 个小步骤
2. 给每个步骤评估"阻力分数"（1-10分）
3. 按阻力从低到高排序 —— 先做最容易的
4. 每个步骤都有"5分钟启动目标"，让你迈出第一步

📌 小技巧：任务描述写得越详细，AI 拆解越精准。
你还可以上传文件/图片，AI 会自动读取内容并总结。`,
  },
  {
    id: "focus",
    title: "专注模式（番茄钟）",
    icon: Timer,
    content: `在任务拆解结果里点「专注」按钮，或者直接进入专注模式：
- 🎯 番茄钟：25 分钟专注 + 5 分钟休息
- 🧠 深度工作：50 分钟深度专注
- ☕ 短休息：5 分钟放松

番茄钟可以和任务绑定，每次专注都会记录到任务里。
中途暂停也没关系，下次可以继续。
手机熄屏也不怕，时间会自动修正。`,
  },
  {
    id: "priority",
    title: "紧急度自动计算",
    icon: Zap,
    content: `给任务设置截止日期后，系统会自动计算紧急程度：
- 距离截止还有 7 天以上 → 低
- 3-7 天 → 中
- 1-3 天 → 高
- 1 天以内或已过期 → 紧急

紧急度会随着截止日期的接近自动升高，不用你手动调。
当然你也可以手动覆盖，设置自己认为的优先级。`,
  },
  {
    id: "studyroom",
    title: "自习室",
    icon: Users,
    content: `一个虚拟的自习空间，让你感觉不是一个人在战斗。
看到有多少人正在和你一起学习，增加陪伴感。
人数是基于当前在线用户的统计，让你不孤单。`,
  },
  {
    id: "treehole",
    title: "树洞",
    icon: TreePine,
    content: `学累了、压力大、想吐槽？来树洞说说话。
匿名分享你的心情和故事，也可以看看别人的经历。
有时候，说出来就好了一半。`,
  },
  {
    id: "partner",
    title: "学伴",
    icon: Handshake,
    content: `匹配一个学习伙伴，互相监督、互相鼓励。
一个人走得快，一群人走得远。
（该功能持续完善中）`,
  },
  {
    id: "diagnosis",
    title: "数据诊断",
    icon: BarChart3,
    content: `可视化你的拖延模式和学习趋势：
- 一周专注时长统计
- 任务完成率
- 推迟次数分析
- 情绪变化曲线

了解自己，才能改变自己。`,
  },
  {
    id: "achievements",
    title: "成就系统",
    icon: Award,
    content: `完成各种挑战解锁成就徽章：
- 🧠 认识自己：完成第一次人格测试
- 📝 迈出第一步：创建第一个任务
- ✅ 言出必行：完成第一个任务
- 🎯 心流初体验：第一次专注
- 🔥 三日不断 / ⚡ 一周坚持
- 还有更多等你解锁...

在「我的」页面可以查看所有成就。`,
  },
  {
    id: "profile",
    title: "我的",
    icon: User,
    content: `你的个人主页：
- 个人资料和头像
- 统计数据（完成任务、专注时长、连续打卡）
- 我的成就
- 动态时间线

所有数据只保存在你的浏览器本地，隐私安全。`,
  },
  {
    id: "tips",
    title: "使用小技巧",
    icon: Lightbulb,
    content: `1. 任务描述写得越具体，AI 拆解越好用
2. 先做阻力最低的子任务，进入状态再说
3. 番茄钟没做完也可以暂停，数据不会丢
4. 心情不好就去树洞逛逛，你不是一个人
5. 左下角可以开背景音乐，学习更有氛围
6. 右下角有只像素小狗，点它有惊喜
7. 设置里可以换主题色，找到你喜欢的风格

最重要的一条：开始比完美重要 ⚡`,
  },
];

export default function GuidePage() {
  const [expandedId, setExpandedId] = useState<string | null>("intro");

  const toggle = (id: string) => {
    setExpandedId(expandedId === id ? null : id);
  };

  return (
    <PageTransition>
      <div className="max-w-2xl mx-auto">
        <div className="mb-6">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: "var(--color-apricot)" }}>
              <BookOpen className="w-5 h-5" style={{ color: "var(--color-ink)" }} />
            </div>
            <div>
              <h1 className="font-sketch text-2xl font-bold" style={{ color: "var(--color-ink)" }}>
                使用指南
              </h1>
              <p className="text-sm font-hand" style={{ color: "var(--text-muted)" }}>
                10 分钟搞懂 WhyWait 的所有功能
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-2">
          {SECTIONS.map((section, index) => {
            const Icon = section.icon;
            const isExpanded = expandedId === section.id;
            return (
              <motion.div
                key={section.id}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.04, duration: 0.3 }}
                className="rounded-xl overflow-hidden"
                style={{
                  background: "var(--bg-card)",
                  border: `1px solid ${isExpanded ? "var(--color-neon-orange)" : "var(--card-border)"}`,
                }}
              >
                <button
                  onClick={() => toggle(section.id)}
                  className="w-full flex items-center gap-3 p-4 text-left transition-all hover:bg-black/[0.02]"
                >
                  <div
                    className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                    style={{ background: isExpanded ? "var(--color-neon-orange)" : "var(--color-apricot)" }}
                  >
                    <Icon className="w-4 h-4" style={{ color: isExpanded ? "#fff" : "var(--color-ink)" }} />
                  </div>
                  <span className="font-hand text-sm font-bold flex-1" style={{ color: "var(--text-primary)" }}>
                    {section.title}
                  </span>
                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                  >
                    <ChevronDown className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                  </motion.div>
                </button>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.25 }}
                    className="px-4 pb-4"
                  >
                    <div
                      className="pl-11 font-hand text-sm leading-relaxed whitespace-pre-line"
                      style={{ color: "var(--text-secondary)" }}
                    >
                      {section.content}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            );
          })}
        </div>

        <div className="mt-8 text-center">
          <p className="text-xs font-hand" style={{ color: "var(--text-muted)" }}>
            还有问题？去设置 → 意见反馈告诉我们 💬
          </p>
        </div>
      </div>
    </PageTransition>
  );
}
