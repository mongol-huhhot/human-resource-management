# Board MCP Server

Node.js backend that connects your Vue 3 dashboard to PostgreSQL via Claude API.

## File structure

```
board-mcp/
├── src/
│   ├── server.js       ← Express server & API routes
│   ├── claude.js       ← Claude API client (tool-use loop + streaming)
│   ├── mcp.js          ← MCP tool definitions & executor
│   ├── db.js           ← PostgreSQL pool, query guard, schema helpers
│   ├── sessions.js     ← In-memory conversation history
│   ├── systemPrompt.js ← Schema context Claude reads each session
│   └── useAsk.js       ← Vue 3 composable (copy to your frontend)
├── .env.example
└── package.json
```

## Quick start

```bash
# 1. Install
cp .env.example .env   # fill in your keys
npm install

# 2. Start (development, auto-restarts on file change)
npm run dev

# 3. Check health
curl http://localhost:3000/health
```

## Environment variables

| Variable | Required | Description |
|---|---|---|
| `ANTHROPIC_API_KEY` | Yes | From platform.claude.com |
| `DATABASE_URL` | Yes | PostgreSQL connection string (read-only user) |
| `API_SECRET` | Production | Bearer token for dashboard auth |
| `ALLOWED_ORIGINS` | Production | Comma-separated frontend URLs |
| `PORT` | No | Default: 3000 |

## API reference

### POST /api/ask
Full response (waits for complete answer).

```bash
curl -X POST http://localhost:3000/api/ask \
  -H "Content-Type: application/json" \
  -d '{"question": "今週売上ワースト3店舗は？"}'
```

Response:
```json
{
  "sessionId": "uuid",
  "answer": "今週の売上ワースト3店舗は...",
  "chartData": { "type": "bar", "labels": [...], "values": [...] },
  "usage": { "inputTokens": 1240, "outputTokens": 187 }
}
```

### POST /api/ask/stream
SSE streaming — text arrives word-by-word.

```js
// In Vue component:
import { useAsk } from './useAsk.js'
const { askStream, answer, isStreaming, chartData } = useAsk()

await askStream('今週の問題店舗を教えて', {
  onChunk: (text) => console.log(text),      // each token
  onStatus: (msg) => console.log(msg),       // "データを照会中..."
  onDone: ({ chartData }) => renderChart(chartData),
})
```

### DELETE /api/session/:id
Clear conversation history and start fresh.

## Wiring into StoreDashboard.vue

Replace the `simulateAIResponse` function with real API calls:

```js
// In StoreDashboard.vue <script setup>
import { useAsk } from './useAsk.js'

const { askStream, isStreaming } = useAsk()

async function sendMessage() {
  const text = chatInput.value.trim()
  if (!text || isStreaming.value) return
  chatInput.value = ''

  messages.value.push({ role: 'user', content: text, time: nowTime() })
  aiTyping.value = true

  let streamBuffer = ''
  const msgIndex = messages.value.length  // placeholder index

  messages.value.push({ role: 'assistant', content: '', time: nowTime() })

  try {
    await askStream(text, {
      onChunk: (chunk) => {
        streamBuffer += chunk
        messages.value[msgIndex].content = streamBuffer
        scrollChat()
      },
      onStatus: () => {},
      onDone: ({ chartData }) => {
        if (chartData) currentChart.value = chartData
        aiTyping.value = false
      },
    })
  } catch (err) {
    messages.value[msgIndex].content = 'エラーが発生しました。再度お試しください。'
    aiTyping.value = false
  }
}
```

## Adding your own views

Edit `src/systemPrompt.js` to document your actual view names and columns.
The system prompt is cached — after changing it, existing sessions will pick up
the new version on their next request.

## Production checklist

- [ ] `API_SECRET` set to a strong random value (`openssl rand -hex 32`)
- [ ] `ALLOWED_ORIGINS` set to your production frontend URL
- [ ] `NODE_ENV=production` in environment
- [ ] PostgreSQL user is read-only (verified with `\du` in psql)
- [ ] Run behind a reverse proxy (nginx/Caddy) with TLS
- [ ] Set spending limit in platform.claude.com → Billing
- [ ] Consider Redis for session storage if running multiple instances
