#!/usr/bin/env node
// Minimal MCP stdio server powered by Playwright (headless only)
// Tools:
// - navigate(url): opens URL and returns final URL + title
// - get_title(): returns current page title
// - current_url(): returns current page URL
// - screenshot(type?): returns base64 screenshot (default png)
//
// Start:
//   node scripts/playwright-mcp-server.mjs
// VS Code (settings.json):
//   "mcp.servers": {
//     "playwright": {
//       "command": "node",
//       "args": ["/absolute/path/uae-wheels-hub/scripts/playwright-mcp-server.mjs"],
//       "transport": "stdio"
//     }
//   }

import { stdin, stdout, stderr } from 'node:process'
import { Buffer } from 'node:buffer'
import { chromium } from 'playwright-core'

const SERVER_NAME = 'playwright-mcp'
const SERVER_VERSION = '0.1.0'

// ----- JSON-RPC over MCP framing -----
function encode(obj) {
  const payload = Buffer.from(JSON.stringify(obj), 'utf8')
  const header = Buffer.from(`Content-Length: ${payload.length}\r\n\r\n`, 'utf8')
  return Buffer.concat([header, payload])
}

function createReader(onMessage) {
  let buf = Buffer.alloc(0)
  let expected = null
  return (chunk) => {
    buf = Buffer.concat([buf, chunk])
    while (true) {
      if (expected == null) {
        const sep = buf.indexOf('\r\n\r\n')
        if (sep === -1) return
        const headers = buf.slice(0, sep).toString('utf8')
        const match = headers.match(/Content-Length:\s*(\d+)/i)
        if (!match) {
          stderr.write(`[${SERVER_NAME}] Missing Content-Length\n`)
          buf = buf.slice(sep + 4)
          continue
        }
        expected = parseInt(match[1], 10)
        buf = buf.slice(sep + 4)
      }
      if (buf.length < expected) return
      const body = buf.slice(0, expected)
      buf = buf.slice(expected)
      expected = null
      try {
        const msg = JSON.parse(body.toString('utf8'))
        onMessage(msg)
      } catch (e) {
        stderr.write(`[${SERVER_NAME}] JSON parse error: ${e?.message}\n`)
      }
    }
  }
}

function send(obj) {
  stdout.write(encode(obj))
}

function ok(id, result = {}) {
  send({ jsonrpc: '2.0', id, result })
}

function err(id, code = -32000, message = 'Server error', data) {
  send({ jsonrpc: '2.0', id, error: { code, message, data } })
}

// ----- Playwright session mgmt -----
let browser
let context
let page

async function ensurePage() {
  if (!browser) {
    browser = await chromium.launch({ headless: true })
  }
  if (!context) {
    context = await browser.newContext()
  }
  if (!page) {
    page = await context.newPage()
  }
  return page
}

async function closeAll() {
  try { await page?.close() } catch {}
  try { await context?.close() } catch {}
  try { await browser?.close() } catch {}
  page = undefined
  context = undefined
  browser = undefined
}

// ----- Tools -----
const tools = {
  async navigate({ url }) {
    if (typeof url !== 'string' || !/^https?:\/\//.test(url)) {
      throw new Error('Invalid url; must start with http(s)://')
    }
    const p = await ensurePage()
    const resp = await p.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 })
    const title = await p.title()
    return {
      content: [
        { type: 'text', text: `OK: ${resp?.status()} ${resp?.url()}` },
        { type: 'text', text: `Title: ${title}` },
      ],
    }
  },
  async get_title() {
    const p = await ensurePage()
    const title = await p.title()
    return { content: [{ type: 'text', text: title }] }
  },
  async current_url() {
    const p = await ensurePage()
    return { content: [{ type: 'text', text: p.url() }] }
  },
  async screenshot({ type = 'png' } = {}) {
    const p = await ensurePage()
    const data = await p.screenshot({ type: type === 'jpeg' ? 'jpeg' : 'png', fullPage: true })
    return { content: [{ type: 'image', data: data.toString('base64'), mimeType: type === 'jpeg' ? 'image/jpeg' : 'image/png' }] }
  },
  async list_tabs() {
    await ensurePage()
    const contexts = browser.contexts()
    const results = []
    for (let ci = 0; ci < contexts.length; ci++) {
      const pages = contexts[ci].pages()
      for (let pi = 0; pi < pages.length; pi++) {
        const p = pages[pi]
        let title = ''
        try { title = await p.title() } catch {}
        results.push({ contextIndex: ci, pageIndex: pi, url: p.url(), title })
      }
    }
    return { content: [{ type: 'text', text: JSON.stringify(results) }] }
  },
}

const toolSchemas = [
  {
    name: 'navigate',
    description: 'Open a URL in headless browser and return title + final URL',
    inputSchema: {
      type: 'object',
      properties: {
        url: { type: 'string', description: 'HTTP(S) URL to open' },
      },
      required: ['url'],
      additionalProperties: false,
    },
  },
  {
    name: 'get_title',
    description: 'Get the current page title',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'current_url',
    description: 'Get the current page URL',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
  {
    name: 'screenshot',
    description: 'Take a full-page screenshot and return as base64 image content',
    inputSchema: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['png', 'jpeg'], default: 'png' },
      },
      additionalProperties: false,
    },
  },
  {
    name: 'list_tabs',
    description: 'List open Playwright pages with context/page indexes, URLs, and titles',
    inputSchema: { type: 'object', properties: {}, additionalProperties: false },
  },
]

// ----- Request handling -----
const handle = async (msg) => {
  if (msg.jsonrpc !== '2.0') return
  const { id, method, params } = msg
  try {
    switch (method) {
      case 'initialize':
        return ok(id, {
          protocolVersion: '1.0',
          serverInfo: { name: SERVER_NAME, version: SERVER_VERSION },
          capabilities: { tools: {} },
        })
      case 'tools/list':
        return ok(id, { tools: toolSchemas })
      case 'tools/call': {
        const name = params?.name
        const args = params?.arguments ?? {}
        if (!(name in tools)) throw new Error(`Unknown tool: ${name}`)
        const result = await tools[name](args)
        return ok(id, result)
      }
      case 'shutdown':
        await closeAll()
        ok(id, {})
        // Give client time to flush
        setTimeout(() => process.exit(0), 50)
        return
      default:
        return err(id, -32601, `Method not found: ${method}`)
    }
  } catch (e) {
    return err(id, -32000, e?.message || 'Server error')
  }
}

stdin.on('data', createReader((msg) => {
  handle(msg)
}))

process.on('SIGINT', async () => {
  await closeAll()
  process.exit(0)
})

stderr.write(`[${SERVER_NAME}] ready on stdio\n`)
