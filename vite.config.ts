/// <reference types="vitest/config" />
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'
import fs from 'fs'

export default defineConfig({
  assetsInclude: ['**/*.kicad_mod'],
  plugins: [
    react(),
    {
      name: 'save-pcb',
      configureServer(server) {
        server.middlewares.use('/api/save-pcb', async (req, res) => {
          if (req.method !== 'POST') {
            res.statusCode = 405
            res.end('Method not allowed')
            return
          }
          let body = ''
          req.on('data', chunk => body += chunk)
          req.on('end', () => {
            try {
              const { filename, content } = JSON.parse(body)
              const outDir = path.resolve(__dirname, 'output')
              if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true })
              const safeName = filename.replace(/[^a-zA-Z0-9_-]/g, '_')
              fs.writeFileSync(path.join(outDir, safeName), content, 'utf-8')
              res.setHeader('Content-Type', 'application/json')
              res.end(JSON.stringify({ ok: true, path: `output/${safeName}` }))
            } catch (e: any) {
              res.statusCode = 500
              res.end(JSON.stringify({ error: e.message }))
            }
          })
        })
      },
    },
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  test: {
    globals: true,
    environment: 'jsdom',
  },
})
