import { NextRequest, NextResponse } from "next/server";
import {
  AppDatabase,
  createId,
  MatchProfile,
  PartnerMatch,
  withDatabase,
} from "@/lib/server-db";

export const runtime = "nodejs";

// 前端等待 60 秒，额外保留 30 秒处理后台标签页计时节流和网络延迟。
const ONLINE_WINDOW_MS = 90 * 1000;
const EMOJIS = ["🦊", "🐼", "🦉", "🐰", "🐯", "🐧", "🐨", "🦁"];

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const userId = String(body.userId || "");
    const tags = Array.isArray(body.tags) ? body.tags.map(String).slice(0, 8) : [];
    const goal = String(body.goal || "").trim().slice(0, 100);
    if (!userId || tags.length === 0) {
      return NextResponse.json({ status: "error", message: "缺少匹配信息" }, { status: 400 });
    }

    const result = await withDatabase((database) => {
      cleanup(database);
      const user = database.users.find((item) => item.id === userId && item.verified);
      if (!user) return { statusCode: 401, body: { status: "error", message: "请先登录后匹配真人学伴" } };

      const now = new Date();
      const profile: MatchProfile = {
        userId,
        username: user.username,
        emoji: EMOJIS[Math.abs(hashCode(userId)) % EMOJIS.length],
        goal: goal || "完成今天的计划",
        tags,
        completedTasks: Math.max(0, Number(body.completedTasks) || 0),
        totalTasks: Math.max(0, Number(body.totalTasks) || 0),
        activeTime: getActiveTime(now),
        availableUntil: new Date(now.getTime() + ONLINE_WINDOW_MS).toISOString(),
        updatedAt: now.toISOString(),
      };
      const profileIndex = database.matchProfiles.findIndex((item) => item.userId === userId);
      if (profileIndex >= 0) database.matchProfiles[profileIndex] = profile;
      else database.matchProfiles.push(profile);

      const existing = findTodayMatch(database, userId);
      if (existing) return { statusCode: 200, body: matchedResponse(database, existing, userId) };

      const matchedIds = new Set(
        database.partnerMatches.filter((item) => item.dateKey === getDateKey()).flatMap((item) => item.userIds)
      );
      const candidates = database.matchProfiles
        .filter((item) =>
          item.userId !== userId &&
          !matchedIds.has(item.userId) &&
          new Date(item.availableUntil).getTime() > Date.now() &&
          new Date(item.updatedAt).getTime() > Date.now() - ONLINE_WINDOW_MS
        )
        .map((item) => ({
          profile: item,
          score: item.tags.filter((tag) => tags.includes(tag)).length * 10 + (item.activeTime === profile.activeTime ? 2 : 0),
        }))
        .sort((a, b) => b.score - a.score || new Date(b.profile.updatedAt).getTime() - new Date(a.profile.updatedAt).getTime());

      if (candidates.length === 0) {
        return { statusCode: 200, body: { status: "waiting", message: "正在等待真人学伴上线" } };
      }

      const match: PartnerMatch = {
        id: createId(),
        dateKey: getDateKey(),
        userIds: [userId, candidates[0].profile.userId],
        createdAt: now.toISOString(),
      };
      database.partnerMatches.push(match);
      return { statusCode: 200, body: matchedResponse(database, match, userId) };
    });
    return NextResponse.json(result.body, { status: result.statusCode });
  } catch (error) {
    console.error("Partner matching error:", error);
    return NextResponse.json({ status: "error", message: "真人匹配服务暂时不可用" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const userId = req.nextUrl.searchParams.get("userId") || "";
    if (!userId) return NextResponse.json({ status: "error", message: "缺少用户信息" }, { status: 400 });
    const body = await withDatabase((database) => {
      cleanup(database);
      const match = findTodayMatch(database, userId);
      const notifications = database.partnerNotifications.filter((item) => item.userId === userId);
      database.partnerNotifications = database.partnerNotifications.filter((item) => item.userId !== userId);
      return match
        ? { ...matchedResponse(database, match, userId), notifications: notifications.map((item) => item.message) }
        : { status: "waiting", notifications: notifications.map((item) => item.message) };
    });
    return NextResponse.json(body);
  } catch (error) {
    console.error("Partner status error:", error);
    return NextResponse.json({ status: "error", message: "无法读取匹配状态" }, { status: 500 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    const { userId: rawUserId, action } = await req.json();
    const userId = String(rawUserId || "");
    const result = await withDatabase((database) => {
      const match = findTodayMatch(database, userId);
      if (action === "cancel") {
        if (match) return matchedResponse(database, match, userId);
        database.matchProfiles = database.matchProfiles.filter((profile) => profile.userId !== userId);
        return { status: "cancelled", success: true };
      }
      if (!match) return { status: "error", success: false, message: "今日真人匹配已失效" };
      const targetId = match.userIds.find((id) => id !== userId);
      const sender = database.users.find((item) => item.id === userId);
      if (!targetId || !sender) return { status: "error", success: false, message: "匹配信息无效" };

      if (action === "disconnect") {
        database.partnerMatches = database.partnerMatches.filter((item) => item.id !== match.id);
        database.matchProfiles = database.matchProfiles.filter((profile) => !match.userIds.includes(profile.userId));
        database.partnerNotifications.push({
          id: createId(),
          userId: targetId,
          fromUserId: userId,
          message: `${sender.username} 已取消学伴连接`,
          createdAt: new Date().toISOString(),
        });
        return { status: "disconnected", success: true };
      }

      if (action !== "high-five") return { status: "error", success: false, message: "互动参数无效" };
      database.partnerNotifications.push({
        id: createId(),
        userId: targetId,
        fromUserId: userId,
        message: `${sender.username} 给你击了个掌！👏`,
        createdAt: new Date().toISOString(),
      });
      return { status: "sent", success: true };
    });
    return NextResponse.json(result, { status: result.status === "error" ? 404 : 200 });
  } catch (error) {
    console.error("Partner interaction error:", error);
    return NextResponse.json({ success: false, message: "互动发送失败" }, { status: 500 });
  }
}

function findTodayMatch(database: AppDatabase, userId: string): PartnerMatch | undefined {
  return database.partnerMatches.find((item) => item.dateKey === getDateKey() && item.userIds.includes(userId));
}

function matchedResponse(database: AppDatabase, match: PartnerMatch, userId: string) {
  const partnerId = match.userIds.find((id) => id !== userId) || "";
  const profile = database.matchProfiles.find((item) => item.userId === partnerId);
  const user = database.users.find((item) => item.id === partnerId);
  return {
    status: "matched",
    partner: {
      id: partnerId,
      kind: "real",
      emoji: profile?.emoji || "🙂",
      name: profile?.username || user?.username || "真人学伴",
      goal: profile?.goal || "完成今天的计划",
      tags: profile?.tags || [],
      completedTasks: profile?.completedTasks || 0,
      totalTasks: profile?.totalTasks || 0,
      activeTime: profile?.activeTime || "今天",
    },
  };
}

function cleanup(database: AppDatabase): void {
  const today = getDateKey();
  database.partnerMatches = database.partnerMatches.filter((item) => item.dateKey === today);
  database.partnerNotifications = database.partnerNotifications.filter((item) => new Date(item.createdAt).getTime() > Date.now() - 86400000);
  database.matchProfiles = database.matchProfiles.filter((item) => new Date(item.updatedAt).getTime() > Date.now() - 86400000);
}

function getDateKey(): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: process.env.TZ || "Asia/Shanghai" }).format(new Date());
}

function getActiveTime(date: Date): string {
  const hour = date.getHours();
  if (hour < 12) return "上午";
  if (hour < 18) return "下午";
  return "晚上";
}

function hashCode(value: string): number {
  return value.split("").reduce((hash, char) => ((hash << 5) - hash + char.charCodeAt(0)) | 0, 0);
}
