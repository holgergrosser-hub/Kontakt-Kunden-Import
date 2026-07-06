import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { parseContactText } from './contact-parser.mjs'

function readJson(req) {
  return new Promise((resolve, reject) => {
    let body = ''

    req.on('data', (chunk) => {
      body += chunk
    })

    req.on('end', () => {
      try {
        resolve(body ? JSON.parse(body) : {})
      } catch (error) {
        reject(error)
      }
    })

    req.on('error', reject)
  })
}

function localParseContactApi() {
  return {
    name: 'local-parse-contact-api',
    configureServer(server) {
      server.middlewares.use('/api/parse-contact', async (req, res, next) => {
        if (req.method === 'OPTIONS') {
          res.statusCode = 204
          res.setHeader('Access-Control-Allow-Origin', '*')
          res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type')
          res.end()
          return
        }

        if (req.method !== 'POST') {
          next()
          return
        }

        try {
          const { text = '' } = await readJson(req)
          const parsed = await parseContactText(text, process.env.ANTHROPIC_API_KEY)
          res.statusCode = 200
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify(parsed))
        } catch (error) {
          res.statusCode = 500
          res.setHeader('Content-Type', 'application/json')
          res.end(JSON.stringify({ error: error.message }))
        }
      })
    },
  }
}

export default defineConfig({
  plugins: [react(), localParseContactApi()],
  build: {
    outDir: 'dist',
    minify: 'esbuild'
  }
})
