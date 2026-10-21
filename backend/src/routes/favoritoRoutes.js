const express = require('express');
const router = express.Router();

const service = require('../services/vitrineService');
const { requireAuth } = require('../middlewares/auth');
const v = require('../utils/validations');

router.use(requireAuth);

router.post('/:produtoId', async (req, res, next) => {
  try {
    const idProduto = v.id(req.params.produtoId, 'id do produto');
    return res.status(201).json(await service.adicionarFavorito(req.usuario.id, idProduto));
  } catch (err) {
    return next(err);
  }
});

router.delete('/:produtoId', async (req, res, next) => {
  try {
    const idProduto = v.id(req.params.produtoId, 'id do produto');
    return res.json(await service.removerFavorito(req.usuario.id, idProduto));
  } catch (err) {
    return next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    return res.json(await service.listarFavoritos(req.usuario.id));
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
