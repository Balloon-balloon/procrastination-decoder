import "server-only";

import { promises as fs } from "fs";
import path from "path";
import { randomBytes, scryptSync, timingSafeEqual } from "crypto";

export interface StoredUser {
  id: string;
  username: string;
  usernameKey: string;
  email: string;
  emailKey: string;
  passwordHash: string;
  passwordSalt: string;
  verified: boolean;
  verificationToken?: string;
  verificationCode?: string;
  verificationExpiresAt?: string;
  hasLoggedIn?: boolean;
  createdAt: string;
  lastLoginAt: string;
}

export interface MatchProfile {
  userId: string;
  username: string;
  emoji: string;
  goal: string;
  tags: string[];
  completedTasks: number;
  totalTasks: number;
  activeTime: string;
  availableUntil: string;
  updatedAt: string;
}

export interface PartnerMatch {
  id: string;
  dateKey: string;
  userIds: [string, string];
  createdAt: string;
}

export interface PartnerNotification {
  id: string;
  userId: string;
  fromUserId: string;
  message: string;
  createdAt: string;
}

export interface AppDatabase {
  users: StoredUser[];
  matchProfiles: MatchProfile[];
  partnerMatches: PartnerMatch[];
  partnerNotifications: PartnerNotification[];
}

const EMPTY_DB: AppDatabase = {
  users: [],
  matchProfiles: [],
  partnerMatches: [],
  partnerNotifications: [],
};

const configuredPath = process.env.WHYWAIT_DATA_FILE;
const DB_PATH = configuredPath
  ? path.resolve(configuredPath)
  : path.join(process.cwd(), "data", "whywait-db.json");

let writeQueue: Promise<unknown> = Promise.resolve();

async function readDatabase(): Promise<AppDatabase> {
  try {
    const raw = await fs.readFile(DB_PATH, "utf8");
    const parsed = JSON.parse(raw) as Partial<AppDatabase>;
    return {
      users: parsed.users || [],
      matchProfiles: parsed.matchProfiles || [],
      partnerMatches: parsed.partnerMatches || [],
      partnerNotifications: parsed.partnerNotifications || [],
    };
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return structuredClone(EMPTY_DB);
    throw error;
  }
}

async function writeDatabase(data: AppDatabase): Promise<void> {
  await fs.mkdir(path.dirname(DB_PATH), { recursive: true });
  const temporaryPath = `${DB_PATH}.tmp`;
  await fs.writeFile(temporaryPath, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(temporaryPath, DB_PATH);
}

export async function withDatabase<T>(
  updater: (database: AppDatabase) => T | Promise<T>
): Promise<T> {
  let resolveResult!: (value: T | PromiseLike<T>) => void;
  let rejectResult!: (reason?: unknown) => void;
  const result = new Promise<T>((resolve, reject) => {
    resolveResult = resolve;
    rejectResult = reject;
  });

  writeQueue = writeQueue.then(async () => {
    try {
      const database = await readDatabase();
      const value = await updater(database);
      await writeDatabase(database);
      resolveResult(value);
    } catch (error) {
      rejectResult(error);
    }
  });

  return result;
}

export async function readOnlyDatabase<T>(
  reader: (database: AppDatabase) => T | Promise<T>
): Promise<T> {
  await writeQueue;
  return reader(await readDatabase());
}

export function createId(): string {
  return randomBytes(16).toString("hex");
}

export function hashPassword(password: string, salt = randomBytes(16).toString("hex")) {
  return {
    salt,
    hash: scryptSync(password, salt, 64).toString("hex"),
  };
}

export function verifyPassword(password: string, salt: string, expectedHash: string): boolean {
  const actual = scryptSync(password, salt, 64);
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function toPublicUser(user: StoredUser) {
  return {
    id: user.id,
    username: user.username,
    email: user.email,
    verified: user.verified,
    createdAt: user.createdAt,
    lastLoginAt: user.lastLoginAt,
    isFirstLogin:
      user.hasLoggedIn === false ||
      (user.hasLoggedIn === undefined && user.createdAt === user.lastLoginAt),
  };
}
