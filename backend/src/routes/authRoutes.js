const express = require('express');
const bcrypt = require('bcryptjs');
const router = express.Router();

const authService = require('../services/authService');
const { optionalAuth } = require('../middlewares/auth');
const rateLimit = require('express-rate-limit');
const v = require('../utils/validations');
const { badRequest } = require('../utils/errors');

const limiteAuth = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 30,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { erro: 'muitas_requisicoes', mensagem: 'Muitas tentativas. Tente novamente mais tarde.' }
});

router.post('/cadastro', limiteAuth, async (req, res, next) => {
  try {
    const nome = v.texto(req.body.nome, 'nome', { min: 3, max: 100 });
    const email = v.email(req.body.email);
    const senha = v.senhaforte(req.body.senha);

    let nascimento = null;
    if (req.body.nascimento) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(req.body.nascimento))) {
        throw badRequest('Informe o nascimento no formato AAAA-MM-DD.');
      }
      nascimento = req.body.nascimento;
    }

    const resultado = await authService.cadastrar({ nome, email, senha, nascimento });
    return res.status(201).json(resultado);
  } catch (err) {
    return next(err);
  }
});

router.post('/login', limiteAuth, async (req, res, next) => {
  try {
    const email = v.email(req.body.email);
    const senha = v.senhaforte(req.body.senha);
    const resultado = await authService.autenticarPorEmailSenha(email, senha);
    return res.json(resultado);
  } catch (err) {
    return next(err);
  }
});

router.post('/logout', optionalAuth, (req, res) => {
  return res.status(204).end();
});

module.exports = router;
