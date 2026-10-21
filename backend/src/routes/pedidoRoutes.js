const express = require('express');
const router = express.Router();

const service = require('../services/pedidoService');
const { requireAuth } = require('../middlewares/auth');
const v = require('../utils/validations');

router.use(requireAuth);

router.post('/', async (req, res, next) => {
  try {
    const resultado = await service.finalizar(req.usuario.id, {
      enderecoId: req.body?.enderecoId != null ? v.id(req.body.enderecoId, 'enderecoId') : null
    });
    return res.status(201).json(resultado);
  } catch (err) {
    return next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    return res.json(await service.listar(req.usuario.id, { pagina: req.query.pagina, limite: req.query.limite }));
  } catch (err) {
    return next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const idOrdem = v.id(req.params.id, 'id do pedido');
    return res.json(await service.detalhar(req.usuario.id, idOrdem));
  } catch (err) {
    return next(err);
  }
});

router.get('/:id/codigos', async (req, res, next) => {
  try {
    const idOrdem = v.id(req.params.id, 'id do pedido');
    const ordem = await service.detalhar(req.usuario.id, idOrdem);
    if (!ordem.codigosDisponiveis) {
      return res.status(409).json({ erro: 'pagamento_pendente', mensagem: 'Codigos digitais sao liberados apos a confirmacao do pagamento.' });
    }
    return res.json(await service.codigosDoPedido(idOrdem));
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
