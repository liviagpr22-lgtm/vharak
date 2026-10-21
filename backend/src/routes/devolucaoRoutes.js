const express = require('express');
const router = express.Router();

const admin = require('../services/adminService');
const { requireAuth } = require('../middlewares/auth');
const v = require('../utils/validations');

router.use(requireAuth);

router.post('/', async (req, res, next) => {
  try {
    const pedidoId = v.id(req.body.pedidoId, 'pedidoId');
    const itemPedidoId = req.body.itemPedidoId != null ? v.id(req.body.itemPedidoId, 'itemPedidoId') : null;
    const motivo = v.texto(req.body.motivo, 'motivo', { min: 10, max: 2000 });
    return res.status(201).json(await admin.criarDevolucao(req.usuario.id, { pedidoId, itemPedidoId, motivo }));
  } catch (err) {
    return next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    return res.json(await admin.minhasDevolucoes(req.usuario.id));
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
