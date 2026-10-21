const express = require('express');
const router = express.Router();

const service = require('../services/vitrineService');
const { requireAuth } = require('../middlewares/auth');
const v = require('../utils/validations');
const db = require('../config/db');

router.get('/:produtoId', async (req, res, next) => {
  try {
    const idProduto = v.id(req.params.produtoId, 'id do produto');
    return res.json(await service.listarAvaliacoes(idProduto, { pagina: req.query.pagina, limite: req.query.limite }));
  } catch (err) {
    return next(err);
  }
});

router.put('/:produtoId', requireAuth, async (req, res, next) => {
  try {
    const idProduto = v.id(req.params.produtoId, 'id do produto');
    const nota = v.numero(req.body.nota, 'nota', { min: 1, max: 5 });
    const comentario = v.textoOpcional(req.body.comentario, 'comentario', { max: 2000 });
    return res.status(201).json(await service.salvarAvaliacao(req.usuario.id, idProduto, { nota, comentario }));
  } catch (err) {
    return next(err);
  }
});

router.delete('/:produtoId', requireAuth, async (req, res, next) => {
  try {
    const idProduto = v.id(req.params.produtoId, 'id do produto');
    await service.excluirAvaliacao(req.usuario.id, idProduto);
    return res.status(204).end();
  } catch (err) {
    return next(err);
  }
});

router.get('/minhas/vinculadas', requireAuth, async (req, res, next) => {
  try {
    const linhas = await db.query(
      `SELECT r.product_id, r.rating, r.comment, r.created_at
       FROM reviews r WHERE r.user_id = ? ORDER BY r.created_at DESC`,
      [req.usuario.id]
    );
    return res.json(linhas.map((linha) => ({
      produtoId: Number(linha.product_id),
      nota: linha.rating,
      comentario: linha.comment,
      criadoEm: linha.created_at
    })));
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
