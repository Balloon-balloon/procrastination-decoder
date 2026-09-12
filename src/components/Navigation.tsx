"use client";
import { useState } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  SquaresFour,
  Brain,
  ListChecks,
  Timer,
  UserCircle,
  SignOut,
  SidebarSimple,
  UsersThree,
  GearSix,
  BookOpen,
  ChatCircleDots,
  Cat,
  Sparkle,
  DotsThree,
  X,
  Lifebuoy,
} from "@phosphor-icons/react";
import { useAppData } from "@/hooks/useAppData";
import { useToast } from "@/components/Toast";
import { IS_STATIC_DEPLOYMENT } from "@/lib/deployment";

const NAV_SECTIONS = [
  {
    title: "",
    items: [
      { href: "/", label: "仪表盘", icon: SquaresFour },
      { href: "/test", label: "人格测试", icon: Brain },
      { href: "/tasks", label: "任务管理", icon: ListChecks },
      { href: "/focus", label: "专注模式", icon: Timer },
      { href: "/rescue", label: "行动救援", icon: Lifebuoy },
    ],
  },
  {
    title: "",
    items: [
      { href: "/decode", label: "灵感拆解", icon: Sparkle },
      { href: "/community", label: "陪伴社区", icon: UsersThree },
    ],
  },
  {
    title: "",
    items: [
      { href: "/diary", label: "拖延日记", icon: BookOpen },
      { href: "/profile", label: "我的", icon: UserCircle },
      { href: "/settings", label: "设置", icon: GearSix },
    ],
  },
]
  .map((section) => ({
    ...section,
    items: section.items.filter(
      (item) => !(IS_STATIC_DEPLOYMENT && item.href === "/decode")
    ),
  }))
  .filter((section) => section.items.length > 0);

const NAV_ITEMS = NAV_SECTIONS.flatMap((s) => s.items);

const MOBILE_NAV_HIDDEN_ITEMS = NAV_ITEMS.filter(
  (item) => ["/test", "/decode", "/rescue", "/diary", "/profile", "/settings"].includes(item.href)
);
const MOBILE_NAV_ITEMS = NAV_ITEMS.filter(
  (item) => ["/", "/tasks", "/focus", "/community"].includes(item.href)
);

export function Navigation({
  collapsed = false,
  onToggleCollapse = () => {},
}: {
  collapsed?: boolean;
  onToggleCollapse?: () => void;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { currentUser, logout } = useAppData();
  const { showToast } = useToast();
  const [showMore, setShowMore] = useState(false);

  if (pathname === "/login") {
    return null;
  }

  const handleLogout = () => {
    logout();
    showToast("已退出登录", "info");
    router.push("/login");
  };

  return (
    <>
      {/* 折叠按钮（始终可见） */}
      <button
        onClick={onToggleCollapse}
        className="fixed top-4 z-50 p-2 rounded-lg transition-all hover:scale-110"
        style={{
          left: collapsed ? "12px" : "244px",
          background: "var(--bg-card)",
          border: "1px solid var(--card-border)",
          boxShadow: "var(--card-shadow)",
          color: "var(--color-ink)",
          transition: "left 0.3s cubic-bezier(0.4,0,0.2,1)",
        }}
        aria-label={collapsed ? "展开导航" : "收起导航"}
      >
        {collapsed ? <SidebarSimple className="w-4 h-4" weight="fill" /> : <SidebarSimple className="w-4 h-4" weight="duotone" />}
      </button>

      {/* 侧边栏 */}
      <AnimatePresence>
        {!collapsed && (
          <motion.nav
            initial={{ x: -260, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: -260, opacity: 0 }}
            transition={{ duration: 0.3, ease: [0.4, 0, 0.2, 1] }}
            className="doodle-sidebar hidden md:flex flex-col w-64 min-h-screen fixed left-0 top-0 z-40 border-r"
            style={{
              background: "var(--bg-card)",
              backdropFilter: "blur(8px)",
              borderColor: "var(--divider)",
            }}
          >
            {/* Logo */}
            <div className="p-6 pb-4">
              <Link href="/" className="flex items-center gap-3 group">
                <motion.div
                  whileHover={{ scale: 1.08, rotate: -5 }}
                  whileTap={{ scale: 0.95 }}
                  className="flex-shrink-0"
                >
                  <svg
                    width="36"
                    height="36"
                    viewBox="0 0 32 32"
                    fill="none"
                  >
                    <circle cx="16" cy="16" r="14" stroke="var(--color-ink)" strokeWidth="2.5" fill="var(--color-apricot)" />
                    <line x1="16" y1="4" x2="16" y2="6" stroke="var(--color-ink)" strokeWidth="2" strokeLinecap="round" />
                    <line x1="16" y1="26" x2="16" y2="28" stroke="var(--color-ink)" strokeWidth="2" strokeLinecap="round" />
                    <line x1="4" y1="16" x2="6" y2="16" stroke="var(--color-ink)" strokeWidth="2" strokeLinecap="round" />
                    <line x1="26" y1="16" x2="28" y2="16" stroke="var(--color-ink)" strokeWidth="2" strokeLinecap="round" />
                    <line x1="16" y1="16" x2="10" y2="11" stroke="var(--color-neon-orange)" strokeWidth="2.5" strokeLinecap="round" />
                    <line x1="16" y1="16" x2="22" y2="12" stroke="var(--color-ink)" strokeWidth="2" strokeLinecap="round" />
                    <circle cx="16" cy="16" r="2" fill="var(--color-neon-orange)" />
                  </svg>
                </motion.div>
                <div>
                  <h1 className="font-sketch text-2xl font-bold" style={{ color: "var(--color-ink)", letterSpacing: "0.05em" }}>
                    whywait
                  </h1>
                  <p className="font-handwritten text-sm" style={{ color: "var(--text-muted)" }}>
                    Why Wait?
                  </p>
                </div>
              </Link>
              <div className="ml-12 mt-2 doodle-note doodle-wiggle text-[10px] font-hand">
                别等灵感，先动一下
              </div>
            </div>

            {/* 导航项 */}
            <div className="flex-1 px-3 py-2 space-y-1 overflow-y-auto">
              {NAV_SECTIONS.map((section, sIdx) => (
                <div key={sIdx}>
                  {section.title && (
                    <p
                      className="text-[10px] font-bold uppercase tracking-wider px-4 mt-3 mb-1"
                      style={{ color: "var(--text-muted)" }}
                    >
                      {section.title}
                    </p>
                  )}
                  {section.items.map((item, index) => {
                    const Icon = item.icon;
                    const isRescue = item.href === "/rescue";
                    const isActive =
                      item.href === "/"
                        ? pathname === "/"
                        : pathname.startsWith(item.href);
                    return (
                      <motion.div
                        key={item.href}
                        initial={{ opacity: 0, x: -15 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: 0.05 + (sIdx * 4 + index) * 0.04, duration: 0.3 }}
                      >
                        <Link
                          href={item.href}
                          data-guide={
                            item.href === "/" ? "dashboard" :
                            item.href === "/test" ? "test" :
                            item.href === "/tasks" ? "tasks" :
                            item.href === "/focus" ? "focus" :
                            item.href === "/decode" ? "decode" :
                            item.href === "/studyroom" ? "studyroom" :
                            item.href === "/treehole" ? "treehole" :
                            item.href === "/partner" ? "partner" :
                            item.href === "/diary" ? "diary" :
                            item.href === "/achievements" ? "achievements" : undefined
                          }
                          className={cn(
                            "doodle-nav-item relative flex items-center gap-3 px-4 py-2.5 rounded-lg transition-all duration-200 group overflow-hidden",
                            isRescue && "doodle-nav-game mt-2 mb-1"
                          )}
                          data-active={isActive ? "true" : "false"}
                          data-game={isRescue ? "true" : "false"}
                          style={
                            isRescue
                              ? undefined
                              : isActive
                              ? {
                                  background:
                                    "linear-gradient(100deg, rgba(255,245,168,.92), rgba(250,214,165,.76))",
                                  color: "var(--color-ink)",
                                  fontWeight: 700,
                                }
                              : {
                                  color: "var(--text-secondary)",
                                }
                          }
                        >
                          {isActive && !isRescue && (
                            <motion.div
                              layoutId="nav-active-bg"
                              className="absolute inset-0 rounded-lg"
                              style={{
                                background:
                                  "linear-gradient(100deg, rgba(255,245,168,.94), rgba(250,214,165,.72))",
                                borderLeft: "3px solid var(--color-neon-orange)",
                                borderRadius: "13px 9px 15px 8px / 9px 14px 8px 12px",
                              }}
                              transition={{ type: "spring", stiffness: 300, damping: 30 }}
                            />
                          )}
                          <motion.div
                            whileHover={{ x: 3 }}
                            className="relative flex items-center gap-3 w-full z-10"
                          >
                            <Icon
                              className={cn(
                                "w-[18px] h-[18px] transition-all duration-200",
                                isActive && !isRescue ? "text-neon-orange" : "group-hover:scale-110"
                              )}
                              style={
                                isActive && !isRescue
                                  ? { color: "var(--color-neon-orange)" }
                                  : isRescue
                                    ? { color: "#4ECDC4" }
                                    : undefined
                              }
                              weight={isRescue || isActive ? "fill" : "duotone"}
                            />
                            <span className="text-sm font-medium">{item.label}</span>
                            {isRescue && (
                              <>
                                <span className="game-badge">LIVE</span>
                                <span className="game-dot ml-auto" />
                              </>
                            )}
                          </motion.div>
                        </Link>
                      </motion.div>
                    );
                  })}
                </div>
              ))}
            </div>

            {/* 底部用户区 */}
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.4, duration: 0.4 }}
              className="p-4"
            >
              {currentUser ? (
                  <div
                    className="rounded-xl p-4"
                    style={{
                      background: "rgba(255, 249, 207, 0.65)",
                      border: "1.5px solid rgba(43,58,103,.16)",
                      boxShadow: "2px 3px 0 rgba(43,58,103,.08)",
                      transform: "rotate(-.45deg)",
                    }}
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div
                      className="w-9 h-9 rounded-full flex items-center justify-center"
                      style={{ background: "var(--color-apricot)" }}
                    >
                      <UserCircle className="w-4 h-4" weight="duotone" style={{ color: "var(--color-ink)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p
                        className="text-sm font-bold truncate"
                        style={{ color: "var(--text-primary)" }}
                      >
                        {currentUser.username}
                      </p>
                      <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                        已登录
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={handleLogout}
                    className="w-full py-1.5 rounded-lg text-xs transition-all flex items-center justify-center gap-1.5"
                    style={{ color: "var(--text-muted)" }}
                  >
                    <SignOut className="w-3.5 h-3.5" weight="bold" /> 退出登录
                  </button>
                </div>
              ) : (
                <Link href="/login">
                  <div
                    className="rounded-xl p-4 cursor-pointer transition-all hover:border-neon-orange/30"
                    style={{
                      background: "rgba(255, 249, 207, 0.65)",
                      border: "1.5px solid rgba(43,58,103,.16)",
                      boxShadow: "2px 3px 0 rgba(43,58,103,.08)",
                      transform: "rotate(.5deg)",
                    }}
                  >
                    <div className="flex items-center gap-3">
                      <div
                        className="w-9 h-9 rounded-full flex items-center justify-center"
                        style={{ background: "var(--color-apricot)" }}
                      >
                        <UserCircle className="w-4 h-4" weight="duotone" style={{ color: "var(--color-ink)" }} />
                      </div>
                      <div>
                        <p
                          className="text-sm font-medium"
                          style={{ color: "var(--text-primary)" }}
                        >
                          登录 / 注册
                        </p>
                        <p className="text-xs" style={{ color: "var(--text-muted)" }}>
                          保存你的数据
                        </p>
                      </div>
                    </div>
                  </div>
                </Link>
              )}
              <p
                  className="text-[10px] text-center mt-3 font-pixel"
                style={{ color: "var(--text-muted)" }}
              >
                v1.1 · 涂鸦版
              </p>
            </motion.div>
          </motion.nav>
        )}
      </AnimatePresence>

      {/* 移动端底部导航 */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-40 border-t"
        style={{
          background: "rgba(255,252,240,.94)",
          backdropFilter: "blur(8px)",
          borderColor: "rgba(43,58,103,.2)",
          borderTopStyle: "dashed",
          boxShadow: "0 -4px 0 rgba(43,58,103,.04)",
        }}
      >
        <div className="flex items-center justify-around px-1 py-2">
          {MOBILE_NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-all flex-1",
                )}
                style={
                  isActive
                    ? { color: "var(--color-neon-orange)" }
                    : { color: "var(--text-muted)" }
                }
              >
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-dot"
                    className="absolute -top-0.5 w-6 h-1 rounded-full"
                    style={{ background: "var(--color-neon-orange)" }}
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <Icon className="w-[18px] h-[18px]" />
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
          {/* 更多按钮 */}
          <button
            onClick={() => setShowMore(true)}
            className={cn(
              "relative flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-all flex-1"
            )}
            style={
              MOBILE_NAV_HIDDEN_ITEMS.some(
                (item) => item.href === "/" ? pathname === "/" : pathname.startsWith(item.href)
              )
                ? { color: "var(--color-neon-orange)" }
                : { color: "var(--text-muted)" }
            }
          >
            <DotsThree className="w-[18px] h-[18px]" weight="bold" />
            <span className="text-[10px] font-medium">更多</span>
          </button>
        </div>
      </nav>

      {/* 移动端更多菜单 */}
      <AnimatePresence>
        {showMore && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setShowMore(false)}
              className="md:hidden fixed inset-0 z-[60]"
              style={{ background: "rgba(0,0,0,0.4)" }}
            />
            <motion.div
              initial={{ y: 300 }}
              animate={{ y: 0 }}
              exit={{ y: 300 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="md:hidden fixed bottom-0 left-0 right-0 z-[61] p-4 pb-6"
              style={{
                background: "var(--bg-primary)",
                borderTop: "2px dashed rgba(43,58,103,.22)",
                borderRadius: "20px 12px 0 0",
                boxShadow: "0 -8px 0 rgba(43,58,103,.05)",
              }}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-hand text-sm font-bold" style={{ color: "var(--color-ink)" }}>
                  更多功能
                </h3>
                <button onClick={() => setShowMore(false)} className="p-1 rounded-lg">
                  <X className="w-4 h-4" style={{ color: "var(--text-muted)" }} />
                </button>
              </div>
              <div className="grid grid-cols-5 gap-2">
                {MOBILE_NAV_HIDDEN_ITEMS.map((item) => {
                  const Icon = item.icon;
                  const isActive =
                    item.href === "/" ? pathname === "/" : pathname.startsWith(item.href);
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      onClick={() => setShowMore(false)}
                      className="flex flex-col items-center gap-2 p-2 rounded-xl transition-all"
                      style={{
                        background: isActive ? "var(--color-apricot)" : "rgba(250,214,165,0.1)",
                      }}
                    >
                      <Icon
                        className="w-5 h-5"
                        style={{ color: isActive ? "var(--color-neon-orange)" : "var(--color-ink)" }}
                      />
                      <span
                        className="text-[10px] font-medium text-center"
                        style={{ color: "var(--color-ink)" }}
                      >
                        {item.label}
                      </span>
                    </Link>
                  );
                })}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
}
