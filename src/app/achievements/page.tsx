"use client";
import { useAppData } from "@/hooks/useAppData";
import { Lock, Check } from "lucide-react";
import { PageTransition, StaggerContainer, FadeInItem, GlowPulse } from "@/components/Animations";

export default function AchievementsPage() {
  const { data, loaded } = useAppData();

  if (!loaded) return <div className="text-center py-20 text-dark-400">加载中...</div>;

  const unlockedCount = data.achievements.filter((a) => a.unlocked).length;
  const totalCount = data.achievements.length;
  const progress = Math.round((unlockedCount / totalCount) * 100);

  return (
    <PageTransition>
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white">成就系统</h1>
        <p className="text-sm text-dark-400 mt-1">
          已解锁 {unlockedCount} / {totalCount} 个成就
        </p>
      </div>

      {/* Progress */}
      <div className="glass-card rounded-2xl p-6">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-dark-300">总进度</span>
          <span className="text-sm font-bold text-gradient">{progress}%</span>
        </div>
        <div className="w-full h-3 bg-dark-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-gradient-to-r from-accent-500 to-primary-600 transition-all duration-500"
            style={{ width: `${progress}%` }}
          />
        </div>
      </div>

      {/* Achievement Grid */}
      <StaggerContainer className="grid gap-4" delay={0.2}>
        {data.achievements.map((achievement) => (
          <FadeInItem key={achievement.id}>
            <div
              className={`glass-card rounded-2xl p-5 transition-all ${
                achievement.unlocked
                  ? "border-accent-500/30 glow"
                  : "opacity-60"
              }`}
            >
            <div className="flex items-start gap-4">
              <div
                className={`w-14 h-14 rounded-2xl flex items-center justify-center text-3xl ${
                  achievement.unlocked
                    ? "bg-gradient-to-br from-accent-500/30 to-primary-500/20"
                    : "bg-dark-800/50"
                }`}
              >
                {achievement.unlocked ? (
                  achievement.icon
                ) : (
                  <Lock className="w-6 h-6 text-dark-500" />
                )}
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <h3
                    className={`font-bold ${
                      achievement.unlocked ? "text-white" : "text-dark-400"
                    }`}
                  >
                    {achievement.title}
                  </h3>
                  {achievement.unlocked && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 border border-green-500/30">
                      已解锁
                    </span>
                  )}
                </div>
                <p className="text-sm text-dark-400 mb-3">{achievement.description}</p>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-dark-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all duration-500 ${
                        achievement.unlocked
                          ? "bg-gradient-to-r from-green-500 to-emerald-400"
                          : "bg-gradient-to-r from-accent-500 to-primary-600"
                      }`}
                      style={{
                        width: `${Math.min(
                          (achievement.progress / achievement.maxProgress) * 100,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                  <span className="text-xs text-dark-400 whitespace-nowrap">
                    {achievement.progress} / {achievement.maxProgress}
                  </span>
                </div>
                {achievement.unlocked && achievement.unlockedAt && (
                  <p className="text-xs text-dark-500 mt-2">
                    解锁于{" "}
                    {new Date(achievement.unlockedAt).toLocaleDateString("zh-CN", {
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                )}
              </div>
              {achievement.unlocked && (
                <div className="w-6 h-6 rounded-full bg-green-500/20 flex items-center justify-center">
                  <Check className="w-3 h-3 text-green-400" />
                </div>
              )}
            </div>
          </div>
          </FadeInItem>
        ))}
      </StaggerContainer>
    </div>
    </PageTransition>
  );
}
