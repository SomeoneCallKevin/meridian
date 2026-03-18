// ─── Client-side persistence layer ─────────────────────────
// Simple localStorage-backed store with typed getters/setters

const PREFIX = "meridian-";

export function storeGet<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(PREFIX + key);
    if (!raw) return fallback;
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

// Debounced server sync — saves user data to server after localStorage writes
let syncTimer: ReturnType<typeof setTimeout> | null = null;
function scheduleSyncToServer() {
  if (typeof window === "undefined") return;
  if (syncTimer) clearTimeout(syncTimer);
  syncTimer = setTimeout(() => {
    // Only sync if user is logged in (session cookie exists)
    const SYNC_KEYS: Record<string, string> = {
      "meridian-watchlist": "watchlist",
      "meridian-positions-open": "positionsOpen",
      "meridian-positions-closed": "positionsClosed",
      "meridian-signals-cache": "signalsCache",
      "meridian-settings": "settings",
    };
    const payload: Record<string, unknown> = {};
    for (const [lsKey, field] of Object.entries(SYNC_KEYS)) {
      try {
        const raw = localStorage.getItem(lsKey);
        if (raw !== null) payload[field] = JSON.parse(raw);
      } catch {}
    }
    fetch("/api/user/data", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    }).catch(() => {}); // Silently fail if not logged in
  }, 3000); // 3 second debounce
}

export function storeSet<T>(key: string, value: T): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(PREFIX + key, JSON.stringify(value));
    scheduleSyncToServer();
  } catch {
    // Storage full or unavailable
  }
}

export function storeRemove(key: string): void {
  if (typeof window === "undefined") return;
  try {
    localStorage.removeItem(PREFIX + key);
  } catch {}
}

// Timestamped cache helper
export function storeGetCached<T>(
  key: string,
  maxAgeMs: number
): { data: T; cachedAt: number } | null {
  const entry = storeGet<{ data: T; cachedAt: number } | null>(key, null);
  if (!entry) return null;
  if (Date.now() - entry.cachedAt > maxAgeMs) {
    storeRemove(key);
    return null;
  }
  return entry;
}

export function storeSetCached<T>(key: string, data: T): void {
  storeSet(key, { data, cachedAt: Date.now() });
}
