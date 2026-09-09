import { User, AuthState } from "./types";
import { apiRequest } from "./api";

const AUTH_STORAGE_KEY = "procrastination-decoder-auth";
const USER_DATA_PREFIX = "procrastination-decoder-user-";
const TAB_USER_KEY = "procrastination-decoder-current-user";

export function loadAuthState(): AuthState {
  if (typeof window === "undefined") return { currentUserId: null, users: [] };
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return { currentUserId: null, users: [] };
    const state = JSON.parse(raw) as AuthState;
    state.users = (state.users || []).map((user) => ({
      ...user,
      email: user.email || "",
      verified: user.verified ?? true,
      isFirstLogin: user.isFirstLogin ?? false,
    }));
    return state;
  } catch {
    return { currentUserId: null, users: [] };
  }
}

export function saveAuthState(state: AuthState): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(AUTH_STORAGE_KEY, JSON.stringify(state));
  } catch (error) {
    console.error("Failed to save auth state:", error);
  }
}

export function getUserDataKey(userId: string): string {
  return `${USER_DATA_PREFIX}${userId}`;
}

export interface AuthResult {
  success: boolean;
  message: string;
  user?: User;
  requiresVerification?: boolean;
  verificationCode?: string;
}

function upsertSessionUser(user: User, makeCurrent: boolean): void {
  const state = loadAuthState();
  const safeUser = { ...user, password: undefined };
  const users = state.users.some((item) => item.id === user.id)
    ? state.users.map((item) => (item.id === user.id ? safeUser : item))
    : [...state.users.filter((item) => item.email !== user.email), safeUser];
  saveAuthState({ currentUserId: makeCurrent ? user.id : state.currentUserId, users });
  if (makeCurrent && typeof window !== "undefined") {
    sessionStorage.setItem(TAB_USER_KEY, user.id);
  }
}

function genId(): string {
  return `user-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function genCode(): string {
  return Math.floor(1000 + Math.random() * 9000).toString();
}

// Client-side fallback for static hosting (GitHub Pages)
function clientRegister(username: string, email: string, password: string): AuthResult {
  const state = loadAuthState();
  const existing = state.users.find(
    (u) => u.email === email || u.username === username
  );
  if (existing) {
    if (existing.email === email) {
      return { success: false, message: "该邮箱已被注册" };
    }
    return { success: false, message: "该用户名已被使用" };
  }
  const code = genCode();
  const user: User = {
    id: genId(),
    username,
    email,
    password,
    verified: false,
    isFirstLogin: true,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
  };
  saveAuthState({
    currentUserId: state.currentUserId,
    users: [...state.users, user],
  });
  return {
    success: true,
    message: "注册成功（演示模式）",
    user,
    verificationCode: code,
  };
}

function clientLogin(identifier: string, password: string): AuthResult {
  const state = loadAuthState();
  const user = state.users.find(
    (u) => (u.username === identifier || u.email === identifier) && u.password === password
  );
  if (!user) {
    const exists = state.users.find(
      (u) => u.username === identifier || u.email === identifier
    );
    return {
      success: false,
      message: exists ? "密码错误" : "用户不存在",
      user: exists || undefined,
    };
  }
  saveAuthState({
    currentUserId: user.id,
    users: state.users.map((u) =>
      u.id === user.id ? { ...u, lastLoginAt: new Date().toISOString() } : u
    ),
  });
  return { success: true, message: "登录成功", user };
}

function clientVerifyByCode(email: string, code: string): AuthResult {
  const state = loadAuthState();
  const user = state.users.find((u) => u.email === email);
  if (!user) return { success: false, message: "用户不存在" };
  const updated = { ...user, verified: true };
  upsertSessionUser(updated, true);
  return { success: true, message: "验证成功", user: updated };
}

function clientResend(email: string): AuthResult {
  const state = loadAuthState();
  const user = state.users.find((u) => u.email === email);
  if (!user) return { success: false, message: "用户不存在" };
  return { success: true, message: "验证码已重新生成", verificationCode: genCode() };
}

export async function registerUserWithEmail(
  username: string,
  email: string,
  password: string,
  captchaAnswer?: number,
  captchaExpected?: number,
): Promise<AuthResult> {
  try {
    const result = await apiRequest<AuthResult>("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ username, email, password, captchaAnswer, captchaExpected }),
    });
    if (result.user) upsertSessionUser(result.user, result.success && result.user.verified);
    return result;
  } catch {
    return clientRegister(username, email, password);
  }
}

export async function loginUser(identifier: string, password: string): Promise<AuthResult> {
  try {
    let result = await apiRequest<AuthResult>("/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ identifier, password }),
    });

    if (!result.success && result.message === "用户不存在") {
      const legacy = loadAuthState().users.find(
        (user) => (user.username === identifier || user.email === identifier) && user.password === password
      );
      if (legacy?.email) {
        const migrated = await registerUserWithEmail(legacy.username, legacy.email, password);
        if (migrated.success && migrated.user?.verified) result = migrated;
        else if (migrated.success) return migrated;
      }
    }

    if (result.user) upsertSessionUser(result.user, result.success);
    return result;
  } catch {
    const fallback = clientLogin(identifier, password);
    if (fallback.success && fallback.user) {
      sessionStorage.setItem(TAB_USER_KEY, fallback.user.id);
    }
    return fallback;
  }
}

export async function verifyEmail(token: string): Promise<AuthResult> {
  try {
    const result = await apiRequest<AuthResult>("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ token }),
    });
    if (result.success && result.user) upsertSessionUser(result.user, true);
    return result;
  } catch {
    return { success: false, message: "验证链接无效或已过期" };
  }
}

export async function verifyEmailByCode(email: string, code: string): Promise<AuthResult> {
  try {
    const result = await apiRequest<AuthResult>("/api/auth/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email, code }),
    });
    if (result.success && result.user) upsertSessionUser(result.user, true);
    return result;
  } catch {
    return clientVerifyByCode(email, code);
  }
}

export async function resendVerification(email: string): Promise<AuthResult> {
  try {
    return await apiRequest<AuthResult>("/api/auth/resend", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email }),
    });
  } catch {
    return clientResend(email);
  }
}

export function logoutUser(): void {
  const state = loadAuthState();
  sessionStorage.removeItem(TAB_USER_KEY);
  saveAuthState({ ...state, currentUserId: null });
}

export function getCurrentUser(): User | null {
  if (typeof window === "undefined") return null;
  const state = loadAuthState();
  const tabUserId = sessionStorage.getItem(TAB_USER_KEY);
  const userId = tabUserId || state.currentUserId;
  if (!userId) return null;
  const user = state.users.find((item) => item.id === userId) || null;
  if (user && !tabUserId) sessionStorage.setItem(TAB_USER_KEY, user.id);
  return user;
}

export function isLoggedIn(): boolean {
  return getCurrentUser() !== null;
}

export function setCurrentUser(userId: string): void {
  const state = loadAuthState();
  const user = state.users.find((item) => item.id === userId);
  if (!user) return;
  sessionStorage.setItem(TAB_USER_KEY, userId);
  saveAuthState({
    currentUserId: userId,
    users: state.users.map((item) =>
      item.id === userId ? { ...item, lastLoginAt: new Date().toISOString() } : item
    ),
  });
}

export function markFirstLoginDone(userId: string): void {
  const state = loadAuthState();
  saveAuthState({
    ...state,
    users: state.users.map((user) =>
      user.id === userId ? { ...user, isFirstLogin: false } : user
    ),
  });
}
