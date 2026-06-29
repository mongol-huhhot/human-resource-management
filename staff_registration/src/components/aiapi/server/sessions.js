// src/sessions.js
// Simple in-memory session store.
// For production, replace with Redis or a DB-backed store.

const sessions = new Map()
const SESSION_TTL_MS = 4 * 60 * 60 * 1000  // 4 hours
const MAX_HISTORY_TURNS = 20  // keep last 20 turns to control token usage

export function getOrCreateSession(sessionId) {
  if (!sessions.has(sessionId)) {
    sessions.set(sessionId, {
      id: sessionId,
      messages: [],
      queryLog: [],
      createdAt: Date.now(),
      lastActiveAt: Date.now(),
    })
  }
  const session = sessions.get(sessionId)
  session.lastActiveAt = Date.now()
  return session
}

export function addMessage(sessionId, role, content) {
  const session = getOrCreateSession(sessionId)
  session.messages.push({ role, content })

  // Trim history to avoid unbounded token growth
  // Keep pairs (user+assistant) so we don't break the alternating pattern
  if (session.messages.length > MAX_HISTORY_TURNS * 2) {
    session.messages = session.messages.slice(-MAX_HISTORY_TURNS * 2)
  }
}

export function getMessages(sessionId) {
  return getOrCreateSession(sessionId).messages
}

export function clearSession(sessionId) {
  sessions.delete(sessionId)
}

// Cleanup expired sessions every 30 minutes
setInterval(() => {
  const now = Date.now()
  for (const [id, session] of sessions.entries()) {
    if (now - session.lastActiveAt > SESSION_TTL_MS) {
      sessions.delete(id)
      console.log(`[Sessions] Expired session ${id}`)
    }
  }
}, 30 * 60 * 1000)

export function sessionStats() {
  return {
    activeSessions: sessions.size,
    sessions: [...sessions.values()].map(s => ({
      id: s.id,
      turns: Math.floor(s.messages.length / 2),
      queryCount: s.queryLog.length,
      ageMinutes: Math.floor((Date.now() - s.createdAt) / 60000),
    })),
  }
}
