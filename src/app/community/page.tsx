"use client";
import Link from "next/link";
import { PageTransition, StaggerContainer, FadeInItem } from "@/components/Animations";
import { motion } from "framer-motion";
import { Users, MessageCircle, Cat, ChevronRight } from "lucide-react";
import { playClickSound } from "@/lib/sound";

const STICKY_COLORS = [
  { bg: "var(--sticky-green)", rotate: "-1.5deg" },
  { bg: "var(--sticky-yellow)", rotate: "1deg" },
  { bg: "var(--sticky-pink)", rotate: "-0.5deg" },
];

const MODULES = [
  {
    href: "/studyroom",
    icon: Users,
    title: "自习室",
    desc: "一起专注，互相陪伴的线上自习空间",
    tag: "实时陪伴",
    color: 0,
  },
  {
    href: "/treehole",
    icon: MessageCircle,
    title: "树洞",
    desc: "匿名倾诉，说说话，释放你的压力",
    tag: "匿名聊天",
    color: 1,
  },
  {
    href: "/partner",
    icon: Cat,
    title: "学伴",
    desc: "匹配学习伙伴，互相监督一起进步",
    tag: "互助匹配",
    color: 2,
  },
];

export default function CommunityPage() {
  return (
    <PageTransition>
      <div className="space-y-6 max-w-2xl mx-auto">
        {/* 标题 */}
        <div>
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-3 mb-2"
          >
            <div
              className="w-12 h-12 rounded-2xl flex items-center justify-center"
              style={{ background: "var(--color-neon-green)" }}
            >
              <Users className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="font-sketch text-3xl font-bold" style={{ color: "var(--color-ink)" }}>
                陪伴社区
              </h1>
              <p className="font-handwritten text-sm" style={{ color: "var(--text-muted)" }}>
                你不是一个人在战斗
              </p>
            </div>
          </motion.div>
        </div>

        {/* 三个模块卡片 */}
        <StaggerContainer className="space-y-4" delay={0.1}>
          {MODULES.map((mod, i) => {
            const Icon = mod.icon;
            return (
              <FadeInItem key={mod.href}>
                <Link
                  href={mod.href}
                  onClick={() => playClickSound()}
                  className="block"
                >
                  <div
                    className="sticky-note p-5 cursor-pointer"
                    style={{
                      background: STICKY_COLORS[mod.color].bg,
                      transform: `rotate(${STICKY_COLORS[mod.color].rotate})`,
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div
                        className="w-14 h-14 rounded-2xl flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(43,58,103,0.08)" }}
                      >
                        <Icon className="w-7 h-7" style={{ color: "var(--color-ink)" }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="text-lg font-bold" style={{ color: "var(--color-ink)" }}>
                            {mod.title}
                          </h3>
                          <span
                            className="text-[10px] px-2 py-0.5 rounded-full font-bold"
                            style={{
                              background: "var(--color-neon-orange)",
                              color: "#fff",
                            }}
                          >
                            {mod.tag}
                          </span>
                        </div>
                        <p className="text-sm" style={{ color: "var(--text-muted)" }}>
                          {mod.desc}
                        </p>
                      </div>
                      <ChevronRight className="w-5 h-5 flex-shrink-0" style={{ color: "var(--color-ink)" }} />
                    </div>
                  </div>
                </Link>
              </FadeInItem>
            );
          })}
        </StaggerContainer>

        {/* 底部鼓励语 */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
          className="text-center py-4"
        >
          <p className="font-handwritten text-sm" style={{ color: "var(--text-muted)" }}>
            一个人走得快，一群人走得远 ✨
          </p>
        </motion.div>
      </div>
    </PageTransition>
  );
}
