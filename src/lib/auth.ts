import { User, AuthState } from "./types";
import { generateId } from "./utils";

const AUTH_STORAGE_KEY = "procrastination-decoder-auth";
const USER_DATA_PREFIX = "procrastination-decoder-user-";

// ========== 认证状态管理 ==========

export function loadAuthState(): AuthState {
  if (typeof window === "undefined") {
    return { currentUserId: null, users: [] };
  }
  try {
    const raw = localStorage.getItem(AUTH_STORAGE_KEY);
    if (!raw) return { currentUserId: null, users: [] };
    const state = JSON.parse(raw) as AuthState;
    // 兼容旧数据：补全新字段
    state.users = state.users.map((u) => ({
      ...u,
      email: u.email || "",
      verified: u.verified ?? true,
      isFirstLogin: u.isFirstLogin ?? false,
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
  } catch (e) {
    console.error("Failed to save auth state:", e);
  }
}

export function getUserDataKey(userId: string): string {
  return `${USER_DATA_PREFIX}${userId}`;
}

export interface AuthResult {
  success: boolean;
  message: string;
  user?: User;
}

// ========== 邮箱格式校验 ==========

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
}

// ========== 注册（客户端：保存用户 + 标记未验证） ==========

export function registerUserWithEmail(
  username: string,
  email: string,
  password: string
): AuthResult {
  const state = loadAuthState();

  if (!username.trim()) return { success: false, message: "用户名不能为空" };
  if (username.length < 2) return { success: false, message: "用户名至少2个字符" };
  if (!isValidEmail(email)) return { success: false, message: "邮箱格式不正确" };
  if (!password) return { success: false, message: "密码不能为空" };
  if (password.length < 4) return { success: false, message: "密码至少4个字符" };

  if (state.users.some((u) => u.username === username)) {
    return { success: false, message: "用户名已存在" };
  }
  if (state.users.some((u) => u.email === email)) {
    return { success: false, message: "该邮箱已注册" };
  }

  const verificationToken = generateId() + generateId();

  // 开发模式（无 SMTP 配置）自动验证
  const isDev = typeof window !== "undefined" && window.location.hostname === "localhost";
  const autoVerified = isDev;

  const newUser: User = {
    id: generateId(),
    username: username.trim(),
    email: email.trim(),
    password,
    verified: autoVerified,
    verificationToken: autoVerified ? undefined : verificationToken,
    createdAt: new Date().toISOString(),
    lastLoginAt: new Date().toISOString(),
    isFirstLogin: autoVerified,
  };

  const newState: AuthState = {
    currentUserId: autoVerified ? newUser.id : null,
    users: [...state.users, newUser],
  };

  saveAuthState(newState);
  return {
    success: true,
    message: autoVerified
      ? "注册成功！（开发模式自动验证）"
      : "注册成功，请查收验证邮件",
    user: newUser,
  };
}

// ========== 验证邮箱 ==========

export function verifyEmail(token: string): AuthResult {
  const state = loadAuthState();
  const user = state.users.find((u) => u.verificationToken === token);

  if (!user) {
    return { success: false, message: "验证链接无效或已过期" };
  }

  const updatedUser: User = {
    ...user,
    verified: true,
    verificationToken: undefined,
    lastLoginAt: new Date().toISOString(),
    isFirstLogin: true,
  };

  const newState: AuthState = {
    currentUserId: user.id,
    users: state.users.map((u) => (u.id === user.id ? updatedUser : u)),
  };
  saveAuthState(newState);

  return { success: true, message: "邮箱验证成功！", user: updatedUser };
}

// ========== 重发验证邮件 ==========

export function resendVerification(email: string): AuthResult {
  const state = loadAuthState();
  const user = state.users.find((u) => u.email === email);

  if (!user) return { success: false, message: "该邮箱未注册" };
  if (user.verified) return { success: false, message: "该账号已验证，请直接登录" };

  const newToken = generateId() + generateId();
  const updatedUser = { ...user, verificationToken: newToken };
  const newState: AuthState = {
    ...state,
    users: state.users.map((u) => (u.id === user.id ? updatedUser : u)),
  };
  saveAuthState(newState);

  return { success: true, message: "验证邮件已重新发送", user: updatedUser };
}

// ========== 登录 ==========

export function loginUser(identifier: string, password: string): AuthResult {
  const state = loadAuthState();
  const user = state.users.find(
    (u) => u.username === identifier || u.email === identifier
  );

  if (!user) return { success: false, message: "用户不存在" };
  if (user.password !== password) return { success: false, message: "密码错误" };
  if (!user.verified) {
    return {
      success: false,
      message: "请先验证邮箱",
      user: user,
    };
  }

  const updatedUser = { ...user, lastLoginAt: new Date().toISOString() };
  const newState: AuthState = {
    currentUserId: user.id,
    users: state.users.map((u) => (u.id === user.id ? updatedUser : u)),
  };
  saveAuthState(newState);

  return { success: true, message: "登录成功", user: updatedUser };
}

// ========== 登出 ==========

export function logoutUser(): void {
  const state = loadAuthState();
  saveAuthState({ ...state, currentUserId: null });
}

// ========== 获取当前用户 ==========

export function getCurrentUser(): User | null {
  const state = loadAuthState();
  if (!state.currentUserId) return null;
  return state.users.find((u) => u.id === state.currentUserId) || null;
}

export function isLoggedIn(): boolean {
  return getCurrentUser() !== null;
}

export function setCurrentUser(userId: string): void {
  const state = loadAuthState();
  const user = state.users.find((u) => u.id === userId);
  if (!user) return;

  const updatedUser = { ...user, lastLoginAt: new Date().toISOString() };
  saveAuthState({
    currentUserId: userId,
    users: state.users.map((u) => (u.id === userId ? updatedUser : u)),
  });
}

// ========== 标记首次登录完成 ==========

export function markFirstLoginDone(userId: string): void {
  const state = loadAuthState();
  const user = state.users.find((u) => u.id === userId);
  if (!user) return;

  const updatedUser = { ...user, isFirstLogin: false };
  saveAuthState({
    ...state,
    users: state.users.map((u) => (u.id === userId ? updatedUser : u)),
  });
}
