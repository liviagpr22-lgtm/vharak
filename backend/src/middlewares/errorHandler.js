const env = require('../config/env');
const { AppError } = require('../utils/errors');

function errorHandler(err, req, res, next) {
  if (env.nodeEnv !== 'test') {
    console.error(`[erro] ${req.method} ${req.originalUrl} ->`, err.message);
  }

  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      erro: err.code,
      mensagem: err.message,
      ...(err.details ? { detalhes: err.details } : {})
    });
  }

  if (err.type === 'entity.parse.failed') {
    return res.status(400).json({ erro: 'json_invalido', mensagem: 'Corpo da requisicao invalido.' });
  }

  if (err.code === 'ER_DUP_ENTRY') {
    return res.status(409).json({ erro: 'registro_duplicado', mensagem: 'Registro ja existente.' });
  }

  return res.status(500).json({
    erro: 'erro_interno',
    mensagem: 'Erro interno do servidor.'
  });
}

module.exports = errorHandler;
