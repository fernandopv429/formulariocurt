import express from 'express';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DEFAULT_WEBHOOK_URL = 'https://n8n.nexusdevhub.com/webhook/4d5aa228-e370-428b-9a9e-0148abb02e51';

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;
  const isProd = process.env.NODE_ENV === 'production';

  app.use(express.json());

  // Health check for Coolify monitoring
  app.get('/api/health', (_req, res) => {
    res.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      webhookConfigured: true,
    });
  });

  // Proxy endpoint to prevent browser CORS issues with n8n
  app.post('/api/submit', async (req, res) => {
    const { name, phone, email, company, utm, clientMetadata } = req.body || {};

    if (!name || !phone || !email || !company) {
      return res.status(400).json({
        success: false,
        error: 'Todos os campos (Nome, Telefone, E-mail e Nome da Empresa) são obrigatórios.',
      });
    }

    const targetWebhook = process.env.N8N_WEBHOOK_URL || DEFAULT_WEBHOOK_URL;

    const payload = {
      name: String(name).trim(),
      phone: String(phone).trim(),
      email: String(email).trim().toLowerCase(),
      company: String(company).trim(),
      submittedAt: new Date().toISOString(),
      source: 'coolify_mobile_form',
      utm: utm || {},
      clientMetadata: clientMetadata || {},
      ip: req.headers['x-forwarded-for'] || req.socket.remoteAddress,
    };

    try {
      const response = await fetch(targetWebhook, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'Coolify-Lead-Form-Proxy/1.0',
        },
        body: JSON.stringify(payload),
      });

      let responseData: unknown = null;
      const responseText = await response.text();
      try {
        responseData = responseText ? JSON.parse(responseText) : { received: true };
      } catch {
        responseData = { text: responseText };
      }

      if (!response.ok) {
        return res.status(response.status).json({
          success: false,
          error: `O webhook do n8n respondeu com erro (${response.status})`,
          details: responseData,
        });
      }

      return res.json({
        success: true,
        message: 'Lead enviado com sucesso ao n8n!',
        data: responseData,
      });
    } catch (err: unknown) {
      console.error('Erro ao enviar dados para o webhook do n8n:', err);
      const errorMessage = err instanceof Error ? err.message : 'Falha na conexão com o servidor de webhook';
      return res.status(502).json({
        success: false,
        error: errorMessage,
      });
    }
  });

  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: {
        middlewareMode: true,
        host: '0.0.0.0',
        port: PORT,
      },
      appType: 'spa',
    });

    app.use(vite.middlewares);
  } else {
    // Production: serve built static files from dist
    const distPath = path.resolve(__dirname, 'dist');
    app.use(express.static(distPath));

    app.get('*', (_req, res) => {
      res.sendFile(path.resolve(distPath, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server listening on http://0.0.0.0:${PORT} (env: ${isProd ? 'production' : 'development'})`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
