const path = require('path');
const express = require('express');
const helmet = require('helmet');
const rateLimit = require('express-rate-limit');

const env = require('./src/config/env');
const db = require('./src/config/db');
const corsMiddleware = require('./src/middlewares/cors');
const errorHandler = require('./src/middlewares/errorHandler');

function criarApp() {
  const app = express();

  app.disable('x-powered-by');
  app.use(helmet({
    contentSecurityPolicy: false,
    crossOriginResourcePolicy: { policy: 'cross-origin' }
  }));
  app.use(corsMiddleware);
  app.use(express.json({ limit: '200kb' }));
  app.use('/api', rateLimit({
    windowMs: 15 * 60 * 1000,
    limit: 600,
    standardHeaders: 'draft-7',
    legacyHeaders: false
  }));

  app.get('/api/health', async (req, res) => {
    try {
      await db.checkConnection();
      return res.json({ status: 'ok', banco: 'conectado', nome: 'VHARAK API' });
    } catch (err) {
      return res.status(503).json({ status: 'falha', banco: 'inacessivel', nome: 'VHARAK API' });
    }
  });

  const suporte = require('./src/routes/suporteRoutes');

  const rotas = [
    ['/api/catalogo', require('./src/routes/catalogoRoutes')],
    ['/api/auth', require('./src/routes/authRoutes')],
    ['/api/clientes', require('./src/routes/clienteRoutes')],
    ['/api/favoritos', require('./src/routes/favoritoRoutes')],
    ['/api/avaliacoes', require('./src/routes/avaliacaoRoutes')],
    ['/api/perguntas', require('./src/routes/perguntaRoutes')],
    ['/api/carrinho', require('./src/routes/carrinhoRoutes')],
    ['/api/pedidos', require('./src/routes/pedidoRoutes')],
    ['/api/pagamentos', require('./src/routes/pagamentoRoutes')],
    ['/api/igdb', require('./src/routes/igdbRoutes')],
    ['/api/admin', require('./src/routes/adminRoutes')],
    ['/api/devolucoes', require('./src/routes/devolucaoRoutes')],
    ['/api/suporte', suporte.router],
    ['/api/suporte', suporte.rAdmin],
    ['/api/admin/suporte', require('./src/routes/suporteAdminRoutes')]
  ];

  for (const [prefixo, roteador] of rotas) {
    app.use(prefixo, roteador);
  }

  app.use(express.static(path.join(__dirname, '..', 'frontend')));

  app.use(errorHandler);
  return app;
}

function iniciar() {
  const app = criarApp();
  return app.listen(env.port, () => {
    console.log(`[VHARAK] API rodando em http://localhost:${env.port}`);
  });
}

if (require.main === module) {
  db.checkConnection()
    .then(() => {
      console.log('[VHARAK] Banco de dados conectado.');
      iniciar();
    })
    .catch((err) => {
      console.error('[VHARAK] Nao foi possivel conectar ao banco:', err.message);
      process.exit(1);
    });
}

module.exports = { criarApp, iniciar };
