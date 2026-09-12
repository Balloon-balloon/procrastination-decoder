"use client";
import Link from "next/link";
import { PageTransition, StaggerContainer, FadeInItem } from "@/components/Animations";
import { motion } from "framer-motion";
import { UsersThree, ChatCircleDots, Cat, CaretRight } from "@phosphor-icons/react";
import { playClickSound } from "@/lib/sound";
import { IS_STATIC_DEPLOYMENT } from "@/lib/deployment";

const STICKY_COLORS = [
  { bg: "var(--sticky-green)", rotate: "-1.5deg" },
  { bg: "var(--sticky-yellow)", rotate: "1deg" },
  { bg: "var(--sticky-pink)", rotate: "-0.5deg" },
];

const MODULES = [
  {
    href: "/studyroom",
    icon: UsersThree,
    title: "自习室",
    desc: "一起专注，互相陪伴的线上自习空间",
    tag: "实时陪伴",
    color: 0,
  },
  {
    href: "/treehole",
    icon: ChatCircleDots,
    title: "广场",
    desc: "发图发帖，评论点赞，大家一起凑热闹",
    tag: "发帖互动",
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
              <UsersThree className="w-7 h-7 text-[#F5F7FF]" weight="fill" />
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

        {/* 功能入口卡片 */}
        <StaggerContainer className="space-y-4" delay={0.2}>
          {MODULES.filter(
            (mod) => !(IS_STATIC_DEPLOYMENT && mod.href === "/partner")
          ).map((mod, i) => {
            const Icon = mod.icon;
            return (
              <FadeInItem key={mod.href}>
                <Link
                  href={mod.href}
                  onClick={playClickSound}
                  className="block"
                >
                  <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    whileTap={{ scale: 0.98 }}
                    className="sticky-note relative p-5 cursor-pointer overflow-hidden"
                    style={{
                      background: STICKY_COLORS[mod.color].bg,
                      transform: `rotate(${STICKY_COLORS[mod.color].rotate})`,
                    }}
                  >
                    {/* 标签 */}
                    <div className="absolute top-3 right-3 px-2 py-0.5 rounded-full text-[10px] font-hand font-bold"
                      style={{ background: "rgba(255,255,255,0.5)", color: "var(--color-ink)" }}
                    >
                      {mod.tag}
                    </div>

                    <div className="flex items-center gap-4">
                      <div
                        className="doodle-icon-sticker w-12 h-12 flex-shrink-0"
                        style={{ background: "rgba(255,255,255,0.4)" }}
                      >
                        <Icon className="w-6 h-6" weight="duotone" style={{ color: "var(--color-ink)" }} />
                      </div>
                      <div className="flex-1">
                        <h2 className="font-hand text-lg font-bold mb-1" style={{ color: "var(--color-ink)" }}>
                          {mod.title}
                        </h2>
                        <p className="font-hand text-xs" style={{ color: "var(--text-secondary)" }}>
                          {mod.desc}
                        </p>
                      </div>
                      <CaretRight className="w-5 h-5 flex-shrink-0" weight="bold" style={{ color: "var(--color-ink)" }} />
                    </div>
                  </motion.div>
                </Link>
              </FadeInItem>
            );
          })}
        </StaggerContainer>

        {/* 底部说明 */}
        <p className="text-center text-[10px] font-hand pt-4" style={{ color: "var(--text-muted)" }}>
          🌳 陪伴社区 · 一起告别拖延
        </p>
      </div>
    </PageTransition>
  );
}
