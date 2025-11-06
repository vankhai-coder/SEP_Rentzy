import tough from "tough-cookie";

// Simple in-memory store for captcha sessions
// Key: sessionId, Value: { jar: CookieJar, expiresAt: number }
const store = new Map();

export function createSession(jar, ttlMs = 5 * 60 * 1000) {
  const sessionId = `${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
  const expiresAt = Date.now() + ttlMs;
  store.set(sessionId, { jar, expiresAt });
  return sessionId;
}

export function getSessionJar(sessionId) {
  cleanup();
  const record = store.get(sessionId);
  if (!record) return null;
  return record.jar || null;
}

function cleanup() {
  const now = Date.now();
  for (const [key, value] of store.entries()) {
    if (!value || value.expiresAt <= now) {
      store.delete(key);
    }
  }
}

export function deleteSession(sessionId) {
  store.delete(sessionId);
}

export function createEmptyJar() {
  return new tough.CookieJar();
}


