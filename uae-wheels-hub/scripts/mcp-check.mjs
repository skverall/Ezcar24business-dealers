#!/usr/bin/env node
// Minimal MCP stdio harness: spawns a server, sends initialize and tools/list.
// Usage:
//   node scripts/mcp-check.mjs --cmd node --args ./path/to/server.js
//   node scripts/mcp-check.mjs --cmd bun --args "run,server.ts"
//   node scripts/mcp-check.mjs --cmd deno --args "run,-A,server.ts"

import { spawn } from 'node:child_process'
import { Buffer } from 'node:buffer'

function parseArgs(argv) {
  const out = { cmd: null, args: [], navigate: null, listTabs: false }
  for (let i = 2; i < argv.length; i++) {
    const k = argv[i]
    if (k === '--cmd') {
      out.cmd = argv[++i]
    } else if (k === '--args') {
      const v = argv[++i]
      // allow CSV or JSON array
      if (!v) continue
      if (v.startsWith('[')) {
        try { out.args = JSON.parse(v) } catch { out.args = [] }
      } else {
        out.args = v.split(',').filter(Boolean)
      }
    } else if (k === '--navigate') {
      out.navigate = argv[++i]
    } else if (k === '--list-tabs') {
      out.listTabs = true
    } else {
      out.args.push(k)
    }
  }
  if (!out.cmd) {
    console.error('Usage: node scripts/mcp-check.mjs --cmd <command> --args <arg1,arg2,...> [--navigate https://example.com] [--list-tabs]')
    process.exit(2)
  }
  return out
}

function encodeMessage(obj) {
  const payload = Buffer.from(JSON.stringify(obj), 'utf8')
  const header = Buffer.from(`Content-Length: ${payload.length}\r\n\r\n`, 'utf8')
  return Buffer.concat([header, payload])
}

function createMessageReader(onMessage) {
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
          console.error('[parser] Missing Content-Length header')
          // attempt to discard to next separator
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
        console.error('[parser] JSON parse error:', e)
      }
    }
  }
}

async function main() {
  const { cmd, args, navigate, listTabs } = parseArgs(process.argv)
  console.error(`[mcp-check] Spawning: ${cmd} ${args.join(' ')}`)
  const child = spawn(cmd, args, { stdio: ['pipe', 'pipe', 'pipe'] })

  child.on('exit', (code, signal) => {
    console.error(`[server] exited code=${code} signal=${signal}`)
  })
  child.stderr.on('data', (d) => {
    process.stderr.write(Buffer.concat([Buffer.from('[server:stderr] '), Buffer.from(d)]))
  })

  const messages = []
  const waiters = []
  const reader = createMessageReader((msg) => {
    messages.push(msg)
    console.error('[<= server]', JSON.stringify(msg))
    // Notify waiters
    for (let i = 0; i < waiters.length; i++) {
      try {
        const done = waiters[i](msg)
        if (done) {
          waiters.splice(i, 1)
          i--
        }
      } catch {
        // ignore waiter errors
      }
    }
  })
  child.stdout.on('data', reader)

  let id = 1
  const send = (method, params = {}) => {
    const req = { jsonrpc: '2.0', id: id++, method, params }
    console.error('[=> client]', JSON.stringify(req))
    child.stdin.write(encodeMessage(req))
    return req.id
  }

  // 1) initialize
  const initId = send('initialize', {
    capabilities: {},
    clientInfo: { name: 'mcp-check', version: '0.0.1' },
  })

  // Wait for a JSON-RPC response with a specific id
  const waitForId = (targetId, label) => new Promise((resolve, reject) => {
    const timeout = setTimeout(() => {
      reject(new Error(`${label} timed out`))
    }, 15000)
    // Fast path: already received
    const existing = messages.find(m => Object.prototype.hasOwnProperty.call(m, 'id') && m.id === targetId)
    if (existing) {
      clearTimeout(timeout)
      return resolve(existing)
    }
    // Otherwise wait for it
    waiters.push((msg) => {
      if (Object.prototype.hasOwnProperty.call(msg, 'id') && msg.id === targetId) {
        clearTimeout(timeout)
        resolve(msg)
        return true
      }
      return false
    })
  })

  try {
    await waitForId(initId, 'initialize')
    console.error('[mcp-check] initialize: OK')
  } catch (e) {
    console.error('[mcp-check] initialize failed:', e.message)
    process.exit(1)
  }

  // 2) tools/list
  const toolsId = send('tools/list', {})
  try {
    await waitForId(toolsId, 'tools/list')
    console.error('[mcp-check] tools/list: OK')
  } catch (e) {
    console.error('[mcp-check] tools/list failed:', e.message)
    process.exit(1)
  }

  // 3) optional navigate
  if (navigate) {
    const callId = send('tools/call', { name: 'navigate', arguments: { url: navigate } })
    try {
      const res = await waitForId(callId, 'tools/call(navigate)')
      console.error('[mcp-check] navigate result:', JSON.stringify(res))
    } catch (e) {
      console.error('[mcp-check] navigate failed:', e.message)
      process.exit(1)
    }
  }

  if (listTabs) {
    const callId = send('tools/call', { name: 'list_tabs', arguments: {} })
    try {
      const res = await waitForId(callId, 'tools/call(list_tabs)')
      console.error('[mcp-check] list_tabs result:', JSON.stringify(res))
    } catch (e) {
      console.error('[mcp-check] list_tabs failed:', e.message)
      process.exit(1)
    }
  }

  // 3) Shut down politely
  try {
    send('shutdown', {})
  } catch {}
  setTimeout(() => {
    try { child.kill() } catch {}
  }, 200)
}

main().catch((e) => {
  console.error('[mcp-check] fatal:', e)
  process.exit(1)
})
