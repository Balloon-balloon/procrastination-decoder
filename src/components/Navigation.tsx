"use client";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Brain,
  ListTodo,
  Timer,
  BarChart3,
  Sparkles,
  Trophy,
} from "lucide-react";

const NAV_ITEMS = [
  { href: "/", label: "仪表盘", icon: LayoutDashboard },
  { href: "/test", label: "人格测试", icon: Brain },
  { href: "/tasks", label: "任务管理", icon: ListTodo },
  { href: "/focus", label: "专注模式", icon: Timer },
  { href: "/diagnosis", label: "数据诊断", icon: BarChart3 },
  { href: "/coach", label: "AI 教练", icon: Sparkles },
  { href: "/achievements", label: "成就", icon: Trophy },
];

export function Navigation() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop Sidebar */}
      <nav className="hidden md:flex flex-col w-64 min-h-screen bg-dark-900/80 backdrop-blur-xl border-r border-dark-700/50 fixed left-0 top-0 z-40">
        <motion.div
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5, ease: "easeOut" }}
          className="p-6"
        >
          <Link href="/" className="flex items-center gap-3 group">
            <motion.div
              whileHover={{ scale: 1.05, rotate: 5 }}
              whileTap={{ scale: 0.95 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-accent-500 to-primary-600 flex items-center justify-center text-white font-bold text-lg shadow-lg glow"
            >
              P
            </motion.div>
            <div>
              <h1 className="text-lg font-bold text-white">拖延解码器</h1>
              <p className="text-xs text-dark-400">Procrastination Decoder</p>
            </div>
          </Link>
        </motion.div>

        <div className="flex-1 px-3 py-2 space-y-1">
          {NAV_ITEMS.map((item, index) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <motion.div
                key={item.href}
                initial={{ opacity: 0, x: -15 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.1 + index * 0.05, duration: 0.3 }}
              >
                <Link
                  href={item.href}
                  className={cn(
                    "relative flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 group overflow-hidden",
                    isActive
                      ? "text-white"
                      : "text-dark-400 hover:text-white"
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="nav-active-bg"
                      className="absolute inset-0 bg-gradient-to-r from-accent-500/20 to-primary-500/10 border border-accent-500/30 rounded-xl"
                      transition={{ type: "spring", stiffness: 300, damping: 30 }}
                    />
                  )}
                  <motion.div
                    whileHover={{ x: 3 }}
                    className="relative flex items-center gap-3 w-full"
                  >
                    <Icon
                      className={cn(
                        "w-5 h-5 transition-all duration-200",
                        isActive && "text-accent-400",
                        "group-hover:scale-110"
                      )}
                    />
                    <span className="text-sm font-medium relative z-10">
                      {item.label}
                    </span>
                  </motion.div>
                </Link>
              </motion.div>
            );
          })}
        </div>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6, duration: 0.4 }}
          className="p-4"
        >
          <div className="glass-card rounded-xl p-4 text-center">
            <p className="text-xs text-dark-400 mb-1">v1.0.0 · 黑客松项目</p>
            <p className="text-xs text-dark-500">解码拖延，重启行动</p>
          </div>
        </motion.div>
      </nav>

      {/* Mobile Bottom Nav */}
      <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-dark-900/95 backdrop-blur-xl border-t border-dark-700/50">
        <div className="flex items-center justify-around px-2 py-2 overflow-x-auto">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon;
            const isActive =
              item.href === "/"
                ? pathname === "/"
                : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  "relative flex flex-col items-center gap-1 px-2 py-1.5 rounded-lg transition-all min-w-[60px]",
                  isActive ? "text-accent-400" : "text-dark-400"
                )}
              >
                {isActive && (
                  <motion.div
                    layoutId="mobile-nav-dot"
                    className="absolute -top-1 w-1 h-1 rounded-full bg-accent-400"
                    transition={{ type: "spring", stiffness: 500, damping: 30 }}
                  />
                )}
                <motion.div whileTap={{ scale: 0.9 }}>
                  <Icon className="w-5 h-5" />
                </motion.div>
                <span className="text-[10px] font-medium">{item.label}</span>
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
