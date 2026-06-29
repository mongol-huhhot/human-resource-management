// src/server.js
// Express server: API routes for the Vue dashboard

import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import { rateLimit } from 'express-rate-limit'
import { v4 as uuidv4 } from 'uuid'

import { testConnection } from './db.js'
import { askClaude, askClaudeStream } from './claude.js'
import {
  getOrCreateSession,
  addMessage,
  getMessages,
  clearSession,
  sessionStats,
} from './sessions.js'

const app = express()
const PORT = process.env.PORT || 3000

// ── Middleware ───────────────────────────────────────────────

app.use(express.json({ limit: '1mb' }))

// CORS — allow Vue dev server and production origin
app.use(cors({
  origin: (process.env.ALLOWED_ORIGINS || 'http://localhost:5173').split(','),
  methods: ['GET', 'POST', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization', 'X-Session-Id'],
}))

// Rate limiting — max 30 requests/min per IP
const limiter = rateLimit({
  windowMs: 60 * 1000,
  max: 30,
  message: { error: 'Too many requests. Please wait a moment.' },
  standardHeaders: true,
})
app.use('/api', limiter)

// Simple token auth — checks Authorization: Bearer <API_SECRET>
function requireAuth(req, res, next) {
  const secret = process.env.API_SECRET
  if (!secret || secret === 'your-secret-token-here') {
    // Skip auth in development if no secret configured
    if (process.env.NODE_ENV !== 'production') return next()
    return res.status(401).json({ error: 'Server not configured for auth.' })
  }
  const header = req.headers.authorization || ''
  if (header !== `Bearer ${secret}`) {
    return res.status(401).json({ error: 'Unauthorized.' })
  }
  next()
}

// ── Routes ───────────────────────────────────────────────────

// Health check
app.get('/health', async (req, res) => {
  try {
    const db = await testConnection()
    res.json({
      status: 'ok',
      db: { connected: true, time: db.time, user: db.user },
      sessions: sessionStats(),
    })
  } catch (err) {
    res.status(503).json({ status: 'error', db: { connected: false, error: err.message } })
  }
})

// ── POST /api/ask ─────────────────────────────────────────────
// Main endpoint: send a question, get a full answer (non-streaming)
app.post('/api/ask', requireAuth, async (req, res) => {
  const { question, sessionId: clientSessionId } = req.body

  if (!question?.trim()) {
    return res.status(400).json({ error: 'question is required.' })
  }

  // Use provided sessionId or create a new one
  const sessionId = clientSessionId || uuidv4()

  try {
    // Add user message to history
    addMessage(sessionId, 'user', question)

    const session = getOrCreateSession(sessionId)
    const messages = getMessages(sessionId)

    const result = await askClaude(messages, {
      sessionId,
      queryLog: session.queryLog,
    })

    // Add assistant reply to history
    addMessage(sessionId, 'assistant', result.answer)

    res.json({
      sessionId,
      answer: result.answer,
      chartData: result.chartData,
      queryLog: result.queryLog,
      usage: result.usage,
    })

  } catch (err) {
    console.error(`[/api/ask] Error (session ${sessionId}):`, err.message)
    // Remove the user message we added if Claude failed
    const messages = getMessages(sessionId)
    if (messages.at(-1)?.role === 'user') messages.pop()

    res.status(500).json({
      error: 'AI analysis failed. Please try again.',
      detail: process.env.NODE_ENV !== 'production' ? err.message : undefined,
    })
  }
})

// ── POST /api/ask/stream ──────────────────────────────────────
// Streaming endpoint: sends SSE chunks as Claude generates text
// Vue frontend: use EventSource or fetch with ReadableStream
app.post('/api/ask/stream', requireAuth, async (req, res) => {
  const { question, sessionId: clientSessionId } = req.body

  if (!question?.trim()) {
    return res.status(400).json({ error: 'question is required.' })
  }

  const sessionId = clientSessionId || uuidv4()

  // Server-Sent Events headers
  res.setHeader('Content-Type', 'text/event-stream')
  res.setHeader('Cache-Control', 'no-cache')
  res.setHeader('Connection', 'keep-alive')
  res.setHeader('X-Session-Id', sessionId)
  res.flushHeaders()

  const send = (data) => {
    res.write(`data: ${JSON.stringify(data)}\n\n`)
  }

  addMessage(sessionId, 'user', question)

  const session = getOrCreateSession(sessionId)
  const messages = getMessages(sessionId)
  let fullAnswer = ''

  try {
    await askClaudeStream(
      messages,
      (chunk) => {
        if (chunk.type === 'text') {
          fullAnswer += chunk.content
          send({ type: 'text', content: chunk.content })
        } else if (chunk.type === 'tool_start') {
          send({ type: 'status', message: 'データを照会中...' })
        } else if (chunk.type === 'done') {
          addMessage(sessionId, 'assistant', fullAnswer)
          send({ type: 'done', sessionId, chartData: chunk.chartData })
          res.end()
        } else if (chunk.type === 'error') {
          send({ type: 'error', message: chunk.message })
          res.end()
        }
      },
      { sessionId, queryLog: session.queryLog },
    )
  } catch (err) {
    console.error(`[/api/ask/stream] Error:`, err.message)
    send({ type: 'error', message: 'Analysis failed. Please try again.' })
    res.end()
  }
})

// ── GET /api/session/:id ──────────────────────────────────────
// Get current session info and history length
app.get('/api/session/:id', requireAuth, (req, res) => {
  const session = getOrCreateSession(req.params.id)
  res.json({
    sessionId: session.id,
    turns: Math.floor(session.messages.length / 2),
    queryCount: session.queryLog.length,
    queryLog: session.queryLog,
  })
})

// ── DELETE /api/session/:id ───────────────────────────────────
// Clear conversation history (start fresh)
app.delete('/api/session/:id', requireAuth, (req, res) => {
  clearSession(req.params.id)
  res.json({ cleared: true })
})

// ── GET /api/sessions (admin) ─────────────────────────────────
app.get('/api/sessions', requireAuth, (req, res) => {
  res.json(sessionStats())
})

// ── Start ────────────────────────────────────────────────────
app.listen(PORT, async () => {
  console.log(`\n Board MCP Server running on http://localhost:${PORT}`)
  console.log(` Mode: ${process.env.NODE_ENV || 'development'}`)
  try {
    const db = await testConnection()
    console.log(` DB: connected as "${db.user}" at ${db.time}`)
  } catch (err) {
    console.error(` DB: connection FAILED — ${err.message}`)
    console.error(' Check DATABASE_URL in your .env file.')
  }
  console.log('\n Routes:')
  console.log('  GET  /health')
  console.log('  POST /api/ask           (full response)')
  console.log('  POST /api/ask/stream    (SSE streaming)')
  console.log('  GET  /api/session/:id')
  console.log('  DEL  /api/session/:id\n')
})
