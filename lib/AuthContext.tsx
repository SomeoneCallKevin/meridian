"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

type User = {
  id: string;
  email: string;
  name: string;
  createdAt: string;
};

type AuthContextType = {
  user: User | null;
  loading: boolean;
  isNewUser: boolean;
  setIsNewUser: (v: boolean) => void;
  login: (email: string, password: string) => Promise<{ error?: string }>;
  register: (email: string, name: string, password: string) => Promise<{ error?: string }>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

// localStorage keys that hold user data (must match store.ts PREFIX = "meridian-")
const SYNC_KEYS = [
  "meridian-watchlist",
  "meridian-positions-open",
  "meridian-positions-closed",
  "meridian-signals-cache",
  "meridian-settings",
];

const KEY_TO_FIELD: Record<string, string> = {
  "meridian-watchlist": "watchlist",
  "meridian-positions-open": "positionsOpen",
  "meridian-positions-closed": "positionsClosed",
  "meridian-signals-cache": "signalsCache",
  "meridian-settings": "settings",
};

const FIELD_TO_KEY: Record<string, string> = Object.fromEntries(
  Object.entries(KEY_TO_FIELD).map(([k, v]) => [v, k])
);

// Save current localStorage data to server
async function pushToServer() {
  const payload: Record<string, unknown> = {};
  for (const lsKey of SYNC_KEYS) {
    try {
      const raw = localStorage.getItem(lsKey);
      if (raw !== null) {
        const field = KEY_TO_FIELD[lsKey];
        payload[field] = JSON.parse(raw);
      }
    } catch {}
  }
  try {
    await fetch("/api/user/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {}
}

// Pull server data into localStorage
async function pullFromServer() {
  try {
    const res = await fetch("/api/user/data");
    if (!res.ok) return;
    const { data } = await res.json();
    if (!data) return;
    for (const [field, lsKey] of Object.entries(FIELD_TO_KEY)) {
      if (data[field] !== undefined && data[field] !== null) {
        localStorage.setItem(lsKey, JSON.stringify(data[field]));
      }
    }
  } catch {}
}

// Clear all meridian localStorage keys
function clearLocalData() {
  for (const lsKey of SYNC_KEYS) {
    try { localStorage.removeItem(lsKey); } catch {}
  }
  // Also clear the signals cache which uses a different key
  try { localStorage.removeItem("meridian-signals-cache"); } catch {}
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [isNewUser, setIsNewUser] = useState(false);

  // Check session on mount
  useEffect(() => {
    fetch("/api/auth/session")
      .then((res) => res.json())
      .then(({ user }) => {
        setUser(user || null);
        if (user) {
          // Pull saved data from server into localStorage
          pullFromServer().then(() => {
            // Dispatch event so hooks re-read localStorage
            window.dispatchEvent(new Event("meridian-data-sync"));
          });
        }
      })
      .catch(() => setUser(null))
      .finally(() => setLoading(false));
  }, []);

  // Auto-save to server periodically when logged in
  useEffect(() => {
    if (!user) return;
    const interval = setInterval(() => pushToServer(), 60000); // every 60s
    return () => clearInterval(interval);
  }, [user]);

  // Save to server before tab close
  useEffect(() => {
    if (!user) return;
    const handler = () => pushToServer();
    window.addEventListener("beforeunload", handler);
    return () => window.removeEventListener("beforeunload", handler);
  }, [user]);

  const login = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || "Login failed" };
      setUser(data.user);
      // Pull user's saved data
      await pullFromServer();
      window.dispatchEvent(new Event("meridian-data-sync"));
      return {};
    } catch {
      return { error: "Network error" };
    }
  }, []);

  const register = useCallback(async (email: string, name: string, password: string) => {
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, name, password }),
      });
      const data = await res.json();
      if (!res.ok) return { error: data.error || "Registration failed" };

      // Clear any existing localStorage data — new users start fresh
      clearLocalData();
      setUser(data.user);
      setIsNewUser(true);

      return {};
    } catch {
      return { error: "Network error" };
    }
  }, []);

  const logout = useCallback(async () => {
    // Save data before logging out
    await pushToServer();
    await fetch("/api/auth/logout", { method: "POST" });
    setUser(null);
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, isNewUser, setIsNewUser, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
