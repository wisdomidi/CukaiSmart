import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import dotenv from 'dotenv';
import { scanRouter } from './server/routes/scan.ts';
import { adminRouter } from './server/routes/admin.ts';
import { lhdnRouter } from './server/routes/lhdn.ts';
import { advisorRouter } from './server/routes/advisor.ts';
import { myinvoisRouter } from './server/routes/myinvois.ts';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 3000;

app.use(express.json({ limit: '20mb' }));

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    version: '1.2.0',
    platform: 'CukaiSmart - Google Cloud AI Builder Cup 2026 Edition',
    timestamp: new Date().toISOString(),
  });
});

// Mount Modular API Routers
app.use('/api', scanRouter);
app.use('/api/admin', adminRouter);
app.use('/api/lhdn', lhdnRouter);
app.use('/api/advisor', advisorRouter);
app.use('/api/myinvois', myinvoisRouter);

// Development mode with Vite middleware / Production static serving
async function setupServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true, hmr: false },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`CukaiSmart server running on http://0.0.0.0:${PORT}`);
  });
}

setupServer();
