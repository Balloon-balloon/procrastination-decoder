"use client";
import { useCallback, useEffect, useState } from "react";
import { AppData, User } from "@/lib/types";
import { loadData, saveData, getDefaultData } from "@/lib/store";
import {
  loadAuthState,
  getCurrentUser,
  setCurrentUser as setAuthCurrentUser,
  logoutUser,
  getUserDataKey,
} from "@/lib/auth";

export function useAppData() {
  const [data, setData] = useState<AppData>(getDefaultData());
  const [loaded, setLoaded] = useState(false);
  const [currentUser, setCurrentUser] = useState<User | null>(null);

  // 加载当前用户和对应数据
  useEffect(() => {
    const user = getCurrentUser();
    setCurrentUser(user);

    // 如果有用户，加载该用户的数据；否则加载全局默认数据
    if (user) {
      const userData = loadUserData(user.id);
      setData(userData);
    } else {
      setData(loadData());
    }
    setLoaded(true);
  }, []);

  // 监听其他 useAppData 实例发出的登录/登出事件，保持同步
  useEffect(() => {
    const handleAuthChange = () => {
      const user = getCurrentUser();
      setCurrentUser(user);
      if (user) {
        setData(loadUserData(user.id));
      } else {
        setData(loadData());
      }
    };
    window.addEventListener("pd-auth-change", handleAuthChange);
    return () => window.removeEventListener("pd-auth-change", handleAuthChange);
  }, []);

  // 保存数据（根据是否登录决定保存到哪里）
  useEffect(() => {
    if (loaded) {
      if (currentUser) {
        saveUserData(currentUser.id, data);
      } else {
        saveData(data);
      }
    }
  }, [data, loaded, currentUser]);

  const update = useCallback((updater: (prev: AppData) => AppData) => {
    setData((prev) => updater(prev));
  }, []);

  // 切换到指定用户
  const switchToUser = useCallback((user: User) => {
    setAuthCurrentUser(user.id);
    setCurrentUser({ ...user, lastLoginAt: new Date().toISOString() });
    // 加载该用户的数据
    const userData = loadUserData(user.id);
    setData(userData);
    // 通知其他 useAppData 实例
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("pd-auth-change"));
    }
  }, []);

  // 退出登录
  const logout = useCallback(() => {
    logoutUser();
    setCurrentUser(null);
    // 切回全局默认数据
    setData(loadData());
    // 通知其他 useAppData 实例
    if (typeof window !== "undefined") {
      window.dispatchEvent(new Event("pd-auth-change"));
    }
  }, []);

  return { data, update, loaded, currentUser, switchToUser, logout };
}

// ========== 用户独立数据存取 ==========

function loadUserData(userId: string): AppData {
  if (typeof window === "undefined") return getDefaultData();
  try {
    const key = getUserDataKey(userId);
    const raw = localStorage.getItem(key);
    if (!raw) return getDefaultData();
    const data = JSON.parse(raw) as AppData;
    const defaults = getDefaultData();
    return {
      profile: { ...defaults.profile, ...data.profile },
      tasks: (data.tasks || []).map((task) => ({
        ...task,
        estimatedUnit: task.estimatedUnit || "minute",
      })),
      subTasks: data.subTasks || [],
      focusSessions: data.focusSessions || [],
      moodEntries: data.moodEntries || [],
      achievements: data.achievements || defaults.achievements,
    };
  } catch {
    return getDefaultData();
  }
}

function saveUserData(userId: string, data: AppData): void {
  if (typeof window === "undefined") return;
  try {
    const key = getUserDataKey(userId);
    localStorage.setItem(key, JSON.stringify(data));
  } catch (e) {
    console.error("Failed to save user data:", e);
  }
}
