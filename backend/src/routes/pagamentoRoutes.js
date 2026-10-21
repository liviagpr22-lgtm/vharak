const express = require('express');
const router = express.Router();

const service = require('../services/pagamentoService');
const { requireAuth } = require('../middlewares/auth');
const v = require('../utils/validations');

router.use(requireAuth);

const METODOS = ['pix', 'credit_card', 'boleto'];

function corpoMetodo(req) {
  const metodo = v.enumValor(req.body?.metodo, 'metodo', METODOS);
  const idOrdem = v.id(req.body?.pedidoId, 'pedidoId');
  return { metodo, idOrdem };
}

router.post('/', async (req, res, next) => {
  try {
    const { metodo, idOrdem } = corpoMetodo(req);

    let resultado;
    if (metodo === 'pix') {
      resultado = await service.criarPix(req.usuario.id, idOrdem);
      service.agendarConfirmacao(resultado.pagamentoId, 'pix');
    } else if (metodo === 'boleto') {
      resultado = await service.criarBoleto(req.usuario.id, idOrdem);
      service.agendarConfirmacao(resultado.pagamentoId, 'boleto');
    } else {
      resultado = await service.pagarCartao(req.usuario.id, idOrdem, {
        numero: String(req.body?.cartao?.numero || ''),
        cvv: req.body?.cartao?.cvv,
        validade: req.body?.cartao?.validade,
        titular: req.body?.cartao?.titular
      });
    }

    return res.status(201).json(resultado);
  } catch (err) {
    return next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const idPagamento = v.id(req.params.id, 'id do pagamento');
    return res.json(await service.consultar(req.usuario.id, idPagamento));
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
