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
  }, []);

  // 退出登录
  const logout = useCallback(() => {
    logoutUser();
    setCurrentUser(null);
    // 切回全局默认数据
    setData(loadData());
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
      tasks: data.tasks || [],
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
