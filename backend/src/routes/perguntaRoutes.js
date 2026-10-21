const express = require('express');
const router = express.Router();

const service = require('../services/vitrineService');
const { requireAuth } = require('../middlewares/auth');
const v = require('../utils/validations');

router.get('/:produtoId', async (req, res, next) => {
  try {
    const idProduto = v.id(req.params.produtoId, 'id do produto');
    return res.json(await service.listarPerguntas(idProduto, { pagina: req.query.pagina, limite: req.query.limite }));
  } catch (err) {
    return next(err);
  }
});

router.post('/:produtoId', requireAuth, async (req, res, next) => {
  try {
    const idProduto = v.id(req.params.produtoId, 'id do produto');
    const pergunta = v.texto(req.body.pergunta, 'pergunta', { min: 10, max: 500 });
    return res.status(201).json(await service.criarPergunta(req.usuario.id, idProduto, pergunta));
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
