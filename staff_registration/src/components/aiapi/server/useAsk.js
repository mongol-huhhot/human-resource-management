// useAsk.js
// Vue 3 composable — drop this into your dashboard component.
// Handles both streaming and non-streaming modes, session management,
// and chart data extraction.

import { ref, readonly } from 'vue'

const BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000'
const API_SECRET = import.meta.env.VITE_API_SECRET || ''

// Shared session ID — persists across component re-mounts
const sessionId = ref(localStorage.getItem('boardSessionId') || null)

function authHeaders() {
  return {
    'Content-Type': 'application/json',
    ...(API_SECRET ? { Authorization: `Bearer ${API_SECRET}` } : {}),
    ...(sessionId.value ? { 'X-Session-Id': sessionId.value } : {}),
  }
}

export function useAsk() {
  const answer = ref('')
  const chartData = ref(null)
  const isLoading = ref(false)
  const isStreaming = ref(false)
  const error = ref(null)
  const queryLog = ref([])

  // ── Non-streaming ask ──────────────────────────────────────
  async function ask(question) {
    if (!question.trim() || isLoading.value) return

    isLoading.value = true
    error.value = null
    answer.value = ''
    chartData.value = null

    try {
      const res = await fetch(`${BASE_URL}/api/ask`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ question, sessionId: sessionId.value }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || `HTTP ${res.status}`)
      }

      const data = await res.json()

      // Persist session ID
      if (data.sessionId) {
        sessionId.value = data.sessionId
        localStorage.setItem('boardSessionId', data.sessionId)
      }

      answer.value = data.answer
      chartData.value = data.chartData
      if (data.queryLog) queryLog.value.push(...data.queryLog)

      return data

    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isLoading.value = false
    }
  }

  // ── Streaming ask ──────────────────────────────────────────
  // onChunk(text) is called for each streamed text fragment.
  // onDone({ chartData }) is called when streaming completes.
  async function askStream(question, { onChunk, onStatus, onDone } = {}) {
    if (!question.trim() || isStreaming.value) return

    isStreaming.value = true
    isLoading.value = true
    error.value = null
    answer.value = ''
    chartData.value = null

    try {
      const res = await fetch(`${BASE_URL}/api/ask/stream`, {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ question, sessionId: sessionId.value }),
      })

      if (!res.ok) {
        const data = await res.json()
        throw new Error(data.error || `HTTP ${res.status}`)
      }

      // Capture session ID from response header
      const newSessionId = res.headers.get('X-Session-Id')
      if (newSessionId) {
        sessionId.value = newSessionId
        localStorage.setItem('boardSessionId', newSessionId)
      }

      // Read SSE stream
      const reader = res.body.getReader()
      const decoder = new TextDecoder()
      let buffer = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break

        buffer += decoder.decode(value, { stream: true })
        const lines = buffer.split('\n')
        buffer = lines.pop() // keep incomplete line in buffer

        for (const line of lines) {
          if (!line.startsWith('data: ')) continue
          try {
            const event = JSON.parse(line.slice(6))

            if (event.type === 'text') {
              answer.value += event.content
              onChunk?.(event.content)

            } else if (event.type === 'status') {
              onStatus?.(event.message)

            } else if (event.type === 'done') {
              chartData.value = event.chartData
              onDone?.({ chartData: event.chartData })

            } else if (event.type === 'error') {
              throw new Error(event.message)
            }
          } catch (parseErr) {
            // Ignore malformed SSE lines
          }
        }
      }

    } catch (err) {
      error.value = err.message
      throw err
    } finally {
      isStreaming.value = false
      isLoading.value = false
    }
  }

  // ── Clear session ─────────────────────────────────────────
  async function clearSession() {
    if (!sessionId.value) return
    try {
      await fetch(`${BASE_URL}/api/session/${sessionId.value}`, {
        method: 'DELETE',
        headers: authHeaders(),
      })
    } catch {}
    sessionId.value = null
    localStorage.removeItem('boardSessionId')
    answer.value = ''
    chartData.value = null
    queryLog.value = []
  }

  return {
    ask,
    askStream,
    clearSession,
    answer: readonly(answer),
    chartData: readonly(chartData),
    isLoading: readonly(isLoading),
    isStreaming: readonly(isStreaming),
    error: readonly(error),
    queryLog: readonly(queryLog),
    sessionId: readonly(sessionId),
  }
}
