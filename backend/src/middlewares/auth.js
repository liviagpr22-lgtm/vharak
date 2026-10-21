const jwt = require('jsonwebtoken');
const env = require('../config/env');
const { unauthorized, forbidden } = require('../utils/errors');

function extrairToken(req) {
  const header = req.headers.authorization || '';
  const [esquema, token] = header.split(' ');
  if (esquema !== 'Bearer' || !token) {
    return null;
  }
  return token;
}

function payload(req) {
  const token = extrairToken(req);
  if (!token) {
    return null;
  }
  try {
    return jwt.verify(token, env.jwtSecret);
  } catch (err) {
    return null;
  }
}

function optionalAuth(req, res, next) {
  const token = extrairToken(req);
  if (!token) {
    req.usuario = null;
    return next();
  }
  const dados = payload(req);
  req.usuario = dados ? { id: dados.id, role: dados.role, email: dados.email } : null;
  req.token = token;
  next();
}

function requireAuth(req, res, next) {
  const token = extrairToken(req);
  if (!token) {
    throw unauthorized();
  }
  let dados;
  try {
    dados = jwt.verify(token, env.jwtSecret);
  } catch (err) {
    throw unauthorized('Sessao invalida ou expirada.');
  }
  req.usuario = { id: dados.id, role: dados.role, email: dados.email };
  req.token = token;
  next();
}

function requireAdmin(req, res, next) {
  requireAuth(req, res, (err) => {
    if (err) {
      return next(err);
    }
    if (req.usuario.role !== 'admin') {
      return next(forbidden());
    }
    return next();
  });
}

module.exports = { extrairToken, payload, optionalAuth, requireAuth, requireAdmin };
