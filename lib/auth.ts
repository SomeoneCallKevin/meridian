// ─── Auth utilities (server-side) ────────────────────────────
// Uses Upstash Redis in production, falls back to file storage in dev
import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

const JWT_SECRET = new TextEncoder().encode(
  process.env.JWT_SECRET || "meridian-dev-secret-change-in-production-2024"
);

export const COOKIE_NAME = "meridian-session";

// ─── Types ──────────────────────────────────────────────────
export type User = {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: string;
};

export type UserPublic = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
};

export type UserData = {
  watchlist: unknown[];
  positionsOpen: unknown[];
  positionsClosed: unknown[];
  signalsCache: unknown | null;
  settings: Record<string, unknown>;
  [key: string]: unknown;
};

// ─── Storage backend ────────────────────────────────────────
// Detects if Redis env vars exist → use Redis. Otherwise → file fallback (dev).

interface StorageBackend {
  getUser(email: string): Promise<User | null>;
  getUserById(id: string): Promise<User | null>;
  saveUser(user: User): Promise<void>;
  emailExists(email: string): Promise<boolean>;
  getUserData(userId: string): Promise<UserData>;
  saveUserData(userId: string, data: Partial<UserData>): Promise<void>;
}

// ─── Redis backend (production) ─────────────────────────────
function createRedisBackend(): StorageBackend {
  // Dynamic import to avoid errors when env vars missing
  const { Redis } = require("@upstash/redis") as typeof import("@upstash/redis");
  const redis = new Redis({
    url: process.env.KV_REST_API_URL!,
    token: process.env.KV_REST_API_TOKEN!,
  });

  return {
    async getUser(email: string): Promise<User | null> {
      const userId = await redis.get<string>(`email:${email.toLowerCase()}`);
      if (!userId) return null;
      return redis.get<User>(`user:${userId}`);
    },
    async getUserById(id: string): Promise<User | null> {
      return redis.get<User>(`user:${id}`);
    },
    async saveUser(user: User): Promise<void> {
      await redis.set(`user:${user.id}`, user);
      await redis.set(`email:${user.email.toLowerCase()}`, user.id);
    },
    async emailExists(email: string): Promise<boolean> {
      const exists = await redis.get(`email:${email.toLowerCase()}`);
      return exists !== null;
    },
    async getUserData(userId: string): Promise<UserData> {
      const data = await redis.get<UserData>(`data:${userId}`);
      return data || {
        watchlist: [],
        positionsOpen: [],
        positionsClosed: [],
        signalsCache: null,
        settings: {},
      };
    },
    async saveUserData(userId: string, data: Partial<UserData>): Promise<void> {
      const existing = await this.getUserData(userId);
      const merged = { ...existing, ...data };
      await redis.set(`data:${userId}`, merged);
    },
  };
}

// ─── File backend (local development) ───────────────────────
function createFileBackend(): StorageBackend {
  const fs = require("fs") as typeof import("fs");
  const path = require("path") as typeof import("path");

  const DATA_DIR = path.join(process.cwd(), "data");
  const USERS_FILE = path.join(DATA_DIR, "users.json");
  const USERDATA_DIR = path.join(DATA_DIR, "userdata");

  function ensureDirs() {
    if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
    if (!fs.existsSync(USERDATA_DIR)) fs.mkdirSync(USERDATA_DIR, { recursive: true });
    if (!fs.existsSync(USERS_FILE)) fs.writeFileSync(USERS_FILE, "[]", "utf-8");
  }

  function readUsers(): User[] {
    ensureDirs();
    try { return JSON.parse(fs.readFileSync(USERS_FILE, "utf-8")); } catch { return []; }
  }

  function writeUsers(users: User[]) {
    ensureDirs();
    fs.writeFileSync(USERS_FILE, JSON.stringify(users, null, 2), "utf-8");
  }

  return {
    async getUser(email: string): Promise<User | null> {
      return readUsers().find((u) => u.email.toLowerCase() === email.toLowerCase()) || null;
    },
    async getUserById(id: string): Promise<User | null> {
      return readUsers().find((u) => u.id === id) || null;
    },
    async saveUser(user: User): Promise<void> {
      const users = readUsers();
      const idx = users.findIndex((u) => u.id === user.id);
      if (idx >= 0) users[idx] = user; else users.push(user);
      writeUsers(users);
    },
    async emailExists(email: string): Promise<boolean> {
      return readUsers().some((u) => u.email.toLowerCase() === email.toLowerCase());
    },
    async getUserData(userId: string): Promise<UserData> {
      ensureDirs();
      const p = path.join(USERDATA_DIR, `${userId}.json`);
      try {
        if (fs.existsSync(p)) return JSON.parse(fs.readFileSync(p, "utf-8"));
      } catch {}
      return { watchlist: [], positionsOpen: [], positionsClosed: [], signalsCache: null, settings: {} };
    },
    async saveUserData(userId: string, data: Partial<UserData>): Promise<void> {
      ensureDirs();
      const p = path.join(USERDATA_DIR, `${userId}.json`);
      const existing = await this.getUserData(userId);
      const merged = { ...existing, ...data };
      fs.writeFileSync(p, JSON.stringify(merged, null, 2), "utf-8");
    },
  };
}

// Pick backend based on environment
function getBackend(): StorageBackend {
  if (process.env.KV_REST_API_URL && process.env.KV_REST_API_TOKEN) {
    return createRedisBackend();
  }
  return createFileBackend();
}

const db = getBackend();

// ─── Public API ─────────────────────────────────────────────
export async function findUserByEmail(email: string): Promise<User | null> {
  return db.getUser(email);
}

export async function findUserById(id: string): Promise<User | null> {
  return db.getUserById(id);
}

export async function createUser(email: string, name: string, password: string): Promise<UserPublic> {
  if (await db.emailExists(email)) {
    throw new Error("Email already registered");
  }

  const id = `user-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
  const passwordHash = await bcrypt.hash(password, 10);

  const user: User = {
    id,
    email: email.toLowerCase(),
    name,
    passwordHash,
    createdAt: new Date().toISOString(),
  };

  await db.saveUser(user);

  // Initialize empty user data
  await db.saveUserData(id, {
    watchlist: [],
    positionsOpen: [],
    positionsClosed: [],
    signalsCache: null,
    settings: {},
  });

  return { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt };
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

// ─── JWT ────────────────────────────────────────────────────
export async function createSession(userId: string): Promise<string> {
  return new SignJWT({ userId })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("30d")
    .sign(JWT_SECRET);
}

export async function verifySession(token: string): Promise<{ userId: string } | null> {
  try {
    const { payload } = await jwtVerify(token, JWT_SECRET);
    return { userId: payload.userId as string };
  } catch {
    return null;
  }
}

// ─── User Data persistence ──────────────────────────────────
export async function getUserData(userId: string): Promise<UserData> {
  return db.getUserData(userId);
}

export async function saveUserData(userId: string, data: Partial<UserData>): Promise<void> {
  return db.saveUserData(userId, data);
}

export function toPublic(user: User): UserPublic {
  return { id: user.id, email: user.email, name: user.name, createdAt: user.createdAt };
}
