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

export async function registerUserWithEmail(
  username: string,
  email: string,
  password: string
): Promise<AuthResult> {
  const result = await apiRequest<AuthResult>("/api/auth/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, email, password }),
  });
  if (result.user) upsertSessionUser(result.user, result.success && result.user.verified);
  return result;
}

export async function loginUser(identifier: string, password: string): Promise<AuthResult> {
  let result = await apiRequest<AuthResult>("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ identifier, password }),
  });

  // One-time migration for accounts created by the previous browser-only version.
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
}

export async function verifyEmail(token: string): Promise<AuthResult> {
  const result = await apiRequest<AuthResult>("/api/auth/verify", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });
  if (result.success && result.user) upsertSessionUser(result.user, true);
  return result;
}

export async function resendVerification(email: string): Promise<AuthResult> {
  return apiRequest<AuthResult>("/api/auth/resend", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
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
