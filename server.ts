import express from 'express';
import app from './api/index.ts';

async function start() {
  const server = express();
  if (process.env.NODE_ENV !== 'production') {
    const { createServer } = await import('vite');
    const vite = await createServer({ server: { middlewareMode: true }, appType: 'spa' });
    server.use(vite.middlewares);
  }
  server.use(app);
  server.listen(Number(process.env.PORT) || 3000, '0.0.0.0');
}
start().catch(console.error);
