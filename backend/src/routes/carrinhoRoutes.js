const express = require('express');
const router = express.Router();

const service = require('../services/carrinhoService');
const { requireAuth } = require('../middlewares/auth');
const v = require('../utils/validations');

router.use(requireAuth);

router.get('/', async (req, res, next) => {
  try {
    return res.json(await service.visualizar(req.usuario.id));
  } catch (err) {
    return next(err);
  }
});

router.post('/itens', async (req, res, next) => {
  try {
    const idVariante = v.id(req.body.varianteId, 'varianteId');
    const quantidade = v.numero(req.body.quantidade ?? 1, 'quantidade', { min: 1, max: 99 });
    return res.status(201).json(await service.adicionarItem(req.usuario.id, idVariante, quantidade));
  } catch (err) {
    return next(err);
  }
});

router.patch('/itens/:id', async (req, res, next) => {
  try {
    const idItem = v.id(req.params.id, 'id do item');
    const quantidade = v.numero(req.body.quantidade, 'quantidade', { min: 1, max: 99 });
    return res.json(await service.alterarQuantidade(req.usuario.id, idItem, quantidade));
  } catch (err) {
    return next(err);
  }
});

router.delete('/itens/:id', async (req, res, next) => {
  try {
    const idItem = v.id(req.params.id, 'id do item');
    return res.json(await service.removerItem(req.usuario.id, idItem));
  } catch (err) {
    return next(err);
  }
});

router.delete('/', async (req, res, next) => {
  try {
    return res.json(await service.esvaziar(req.usuario.id));
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
