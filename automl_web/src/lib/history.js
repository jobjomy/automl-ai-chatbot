// src/lib/history.js
// Stores full chat sessions (messages + report) in localStorage per user

export function getSessions(userId) {
  try {
    return JSON.parse(localStorage.getItem(`automl_sessions_${userId}`) || '[]')
  } catch { return [] }
}

export function saveSession(userId, session) {
  const sessions = getSessions(userId)
  const idx = sessions.findIndex(s => s.id === session.id)
  if (idx >= 0) sessions[idx] = session
  else sessions.unshift(session)
  // Keep max 50 sessions, trim messages to last 200 per session to stay under storage limits
  const trimmed = sessions.slice(0, 50).map(s => ({
    ...s,
    messages: (s.messages || []).slice(-200)
  }))
  try {
    localStorage.setItem(`automl_sessions_${userId}`, JSON.stringify(trimmed))
  } catch(e) {
    // If storage full, drop oldest sessions and retry
    try {
      localStorage.setItem(`automl_sessions_${userId}`, JSON.stringify(trimmed.slice(0, 20)))
    } catch {}
  }
}

export function deleteSession(userId, sessionId) {
  const sessions = getSessions(userId).filter(s => s.id !== sessionId)
  localStorage.setItem(`automl_sessions_${userId}`, JSON.stringify(sessions))
}

export function createSession() {
  return {
    id: Date.now().toString(),
    title: 'New Pipeline',
    createdAt: new Date().toISOString(),
    config: null,
    messages: [],   // ← full message thread saved here
    report: null,
    status: 'new',  // new | running | done | error
  }
}
