import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import tailwindcss from '@tailwindcss/vite';
import aiHandler from './api/ai.js';

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  ['GEMINI_API_KEY', 'GEMINI_API_KEY_1', 'GEMINI_API_KEY_2', 'GEMINI_API_KEY_3'].forEach(k => {
    if (env[k]) {
      process.env[k] = env[k];
    }
  });

  return {
    plugins: [
      react(),
      tailwindcss(),
      {
        name: 'local-ai-api-middleware',
        configureServer(server) {
          server.middlewares.use('/api/ai', async (req, res) => {
            if (req.method === 'POST') {
              let body = '';
              req.on('data', chunk => { body += chunk; });
              req.on('end', async () => {
                try {
                  const parsed = body ? JSON.parse(body) : {};
                  const mockReq = { method: 'POST', body: parsed };
                  const mockRes = {
                    status(statusCode) {
                      res.statusCode = statusCode;
                      return this;
                    },
                    json(data) {
                      res.setHeader('Content-Type', 'application/json');
                      res.end(JSON.stringify(data));
                      return this;
                    }
                  };
                  await aiHandler(mockReq, mockRes);
                } catch (err) {
                  res.statusCode = 500;
                  res.setHeader('Content-Type', 'application/json');
                  res.end(JSON.stringify({ success: false, message: err.message }));
                }
              });
            } else {
              res.statusCode = 405;
              res.end('Method not allowed');
            }
          });
        }
      }
    ]
  };
});
