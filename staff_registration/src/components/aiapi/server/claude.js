// src/claude.js
// Claude API client: manages the tool-use loop and prompt caching.

import Anthropic from '@anthropic-ai/sdk'
import { buildSystemPrompt } from './systemPrompt.js'
import { MCP_TOOLS, executeTool } from './mcp.js'

const anthropic = new Anthropic({
  apiKey: process.env.ANTHROPIC_API_KEY,
})

const MODEL = 'claude-sonnet-4-6'
const MAX_TOKENS = 1024
const MAX_TOOL_ROUNDS = 5  // safety limit on agentic loops

// ── Non-streaming: ask Claude a question, get full answer ────
export async function askClaude(messages, sessionMeta = {}) {
  const { sessionId = 'unknown', queryLog = [] } = sessionMeta

  // Deep copy to avoid mutating caller's array
  const history = [...messages]
  let totalInputTokens = 0
  let totalOutputTokens = 0

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    const response = await anthropic.messages.create({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      // Prompt caching on the system prompt — saves ~60% on repeated sessions
      system: [
        {
          type: 'text',
          text: buildSystemPrompt(),
          cache_control: { type: 'ephemeral' },
        },
      ],
      tools: MCP_TOOLS,
      messages: history,
    })

    totalInputTokens  += response.usage.input_tokens
    totalOutputTokens += response.usage.output_tokens

    // ── Claude is done ───────────────────────────────────────
    if (response.stop_reason === 'end_turn') {
      const textBlock = response.content.find(b => b.type === 'text')
      const answer = textBlock?.text ?? ''

      // Parse optional CHART_DATA block
      const chartMatch = answer.match(/CHART_DATA:({.+})/s)
      let chartData = null
      if (chartMatch) {
        try { chartData = JSON.parse(chartMatch[1]) } catch {}
      }

      const cleanAnswer = answer.replace(/CHART_DATA:{.+}/s, '').trim()

      console.log(`[Claude] Session ${sessionId} — ${round + 1} round(s), `
        + `${totalInputTokens} in / ${totalOutputTokens} out tokens`)

      return {
        answer: cleanAnswer,
        chartData,
        queryLog,
        usage: { inputTokens: totalInputTokens, outputTokens: totalOutputTokens },
      }
    }

    // ── Claude wants to use tools ────────────────────────────
    if (response.stop_reason === 'tool_use') {
      // Add Claude's response (with tool_use blocks) to history
      history.push({ role: 'assistant', content: response.content })

      // Execute all tool calls in this round
      const toolResults = []
      for (const block of response.content) {
        if (block.type !== 'tool_use') continue

        const { success, result, error } = await executeTool(block.name, block.input, queryLog)
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: success
            ? JSON.stringify(result, null, 2)
            : `Error: ${error}`,
          is_error: !success,
        })
      }

      // Feed tool results back to Claude
      history.push({ role: 'user', content: toolResults })
      continue
    }

    // Unexpected stop reason
    break
  }

  throw new Error('Max tool rounds exceeded — query too complex.')
}

// ── Streaming: send chunks to client as Claude generates them ─
export async function askClaudeStream(messages, onChunk, sessionMeta = {}) {
  const { sessionId = 'unknown', queryLog = [] } = sessionMeta
  const history = [...messages]

  for (let round = 0; round < MAX_TOOL_ROUNDS; round++) {
    let fullText = ''
    let toolUseBlocks = []
    let stopReason = null
    let currentToolBlock = null

    // Stream the response
    const stream = anthropic.messages.stream({
      model: MODEL,
      max_tokens: MAX_TOKENS,
      system: [
        {
          type: 'text',
          text: buildSystemPrompt(),
          cache_control: { type: 'ephemeral' },
        },
      ],
      tools: MCP_TOOLS,
      messages: history,
    })

    for await (const event of stream) {
      if (event.type === 'content_block_start') {
        if (event.content_block.type === 'tool_use') {
          currentToolBlock = { ...event.content_block, input: '' }
        }
      }

      if (event.type === 'content_block_delta') {
        if (event.delta.type === 'text_delta') {
          const chunk = event.delta.text
          fullText += chunk
          // Stream text chunks to client (excluding CHART_DATA)
          if (!chunk.includes('CHART_DATA')) {
            onChunk({ type: 'text', content: chunk })
          }
        }
        if (event.delta.type === 'input_json_delta' && currentToolBlock) {
          currentToolBlock.input += event.delta.partial_json
        }
      }

      if (event.type === 'content_block_stop' && currentToolBlock) {
        try {
          currentToolBlock.input = JSON.parse(currentToolBlock.input)
        } catch { currentToolBlock.input = {} }
        toolUseBlocks.push(currentToolBlock)
        currentToolBlock = null
      }

      if (event.type === 'message_delta') {
        stopReason = event.delta.stop_reason
      }
    }

    const finalMessage = await stream.finalMessage()

    // Done
    if (stopReason === 'end_turn') {
      const chartMatch = fullText.match(/CHART_DATA:({.+})/s)
      let chartData = null
      if (chartMatch) {
        try { chartData = JSON.parse(chartMatch[1]) } catch {}
      }
      onChunk({ type: 'done', chartData, queryLog })
      return
    }

    // Tool use — execute and continue
    if (stopReason === 'tool_use') {
      onChunk({ type: 'tool_start' })
      history.push({ role: 'assistant', content: finalMessage.content })

      const toolResults = []
      for (const block of toolUseBlocks) {
        const { success, result, error } = await executeTool(block.name, block.input, queryLog)
        toolResults.push({
          type: 'tool_result',
          tool_use_id: block.id,
          content: success ? JSON.stringify(result, null, 2) : `Error: ${error}`,
          is_error: !success,
        })
      }

      history.push({ role: 'user', content: toolResults })
    }
  }

  onChunk({ type: 'error', message: 'Max tool rounds exceeded.' })
}
