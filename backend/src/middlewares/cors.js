const cors = require('cors');
const env = require('../config/env');

const allowAll = env.corsOrigins.length === 0 || env.corsOrigins.includes('*');

const corsMiddleware = cors({
  origin: allowAll ? true : env.corsOrigins,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true
});

module.exports = corsMiddleware;
