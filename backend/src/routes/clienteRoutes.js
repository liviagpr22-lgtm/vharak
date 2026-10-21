const express = require('express');
const router = express.Router();

const authService = require('../services/authService');
const clienteService = require('../services/clienteService');
const { requireAuth } = require('../middlewares/auth');
const v = require('../utils/validations');
const { badRequest } = require('../utils/errors');

router.use(requireAuth);

function lerEndereco(req, { completo = true } = {}) {
  const dados = {};
  if (completo || req.body.rua !== undefined) {
    dados.rua = v.texto(req.body.rua, 'rua', { max: 200 });
  }
  if (completo || req.body.numero !== undefined) {
    dados.numero = v.texto(req.body.numero, 'numero', { max: 20 });
  }
  if (req.body.complemento !== undefined) {
    dados.complemento = v.textoOpcional(req.body.complemento, 'complemento', { max: 100 });
  }
  if (completo || req.body.bairro !== undefined) {
    dados.bairro = v.texto(req.body.bairro, 'bairro', { max: 100 });
  }
  if (completo || req.body.cidade !== undefined) {
    dados.cidade = v.texto(req.body.cidade, 'cidade', { max: 100 });
  }
  if (completo || req.body.uf !== undefined) {
    const uf = String(req.body.uf || '').trim().toUpperCase();
    if (!/^[A-Z]{2}$/.test(uf)) {
      throw badRequest('Informe a UF com 2 letras (ex.: SP).');
    }
    dados.uf = uf;
  }
  if (completo || req.body.cep !== undefined) {
    const cep = String(req.body.cep || '').replace(/\D/g, '');
    if (cep.length !== 8) {
      throw badRequest('Informe um CEP com 8 digitos.');
    }
    dados.cep = cep;
  }
  if (req.body.padrao !== undefined) {
    dados.padrao = Boolean(req.body.padrao);
  }
  return dados;
}

router.get('/perfil', async (req, res, next) => {
  try {
    return res.json(await clienteService.perfil(req.usuario.id));
  } catch (err) {
    return next(err);
  }
});

router.patch('/perfil', async (req, res, next) => {
  try {
    const dados = {};
    if (req.body.nome !== undefined) {
      dados.nome = v.texto(req.body.nome, 'nome', { min: 3, max: 100 });
    }
    if (req.body.nascimento !== undefined && req.body.nascimento !== null) {
      if (!/^\d{4}-\d{2}-\d{2}$/.test(String(req.body.nascimento))) {
        throw badRequest('Informe o nascimento no formato AAAA-MM-DD.');
      }
      dados.nascimento = req.body.nascimento;
    }
    return res.json(await clienteService.atualizarPerfil(req.usuario.id, dados));
  } catch (err) {
    return next(err);
  }
});

router.patch('/senha', async (req, res, next) => {
  try {
    const atual = v.senhaforte(req.body.senha_atual, 'senha_atual');
    const nova = v.senhaforte(req.body.senha_nova, 'senha_nova');
    if (atual === nova) {
      throw badRequest('A nova senha deve ser diferente da atual.');
    }
    await authService.trocarSenha(req.usuario.id, atual, nova);
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
});

router.get('/enderecos', async (req, res, next) => {
  try {
    return res.json(await clienteService.listarEnderecos(req.usuario.id));
  } catch (err) {
    return next(err);
  }
});

router.post('/enderecos', async (req, res, next) => {
  try {
    const dados = lerEndereco(req);
    return res.status(201).json(await clienteService.criarEndereco(req.usuario.id, dados));
  } catch (err) {
    return next(err);
  }
});

router.patch('/enderecos/:id', async (req, res, next) => {
  try {
    const idEndereco = v.id(req.params.id, 'id do endereco');
    const dados = lerEndereco(req, { completo: false });
    return res.json(await clienteService.atualizarEndereco(req.usuario.id, idEndereco, dados));
  } catch (err) {
    return next(err);
  }
});

router.delete('/enderecos/:id', async (req, res, next) => {
  try {
    const idEndereco = v.id(req.params.id, 'id do endereco');
    await clienteService.excluirEndereco(req.usuario.id, idEndereco);
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
});

module.exports = router;

