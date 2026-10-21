const express = require('express');
const router = express.Router();

const admin = require('../services/adminService');
const pagamentoService = require('../services/pagamentoService');
const vitrine = require('../services/vitrineService');
const db = require('../config/db');
const { requireAdmin } = require('../middlewares/auth');
const v = require('../utils/validations');

router.use(requireAdmin);

/* ------------ PRODUTOS ------------ */

router.get('/produtos', async (req, res, next) => {
  try {
    return res.json(await admin.listarProdutos({
      pagina: req.query.pagina,
      limite: req.query.limite,
      ativo: req.query.ativo
    }));
  } catch (err) {
    return next(err);
  }
});

router.post('/produtos', async (req, res, next) => {
  try {
    const dados = {
      nome: v.texto(req.body.nome, 'nome', { min: 2, max: 200 }),
      descricao: v.textoOpcional(req.body.descricao, 'descricao', { max: 5000 }),
      categoriaId: req.body.categoriaId != null ? v.id(req.body.categoriaId, 'categoriaId') : null,
      tipo: v.enumValor(req.body.tipo, 'tipo', ['physical', 'digital'], { obrig: false, padrao: 'physical' }),
      precoBase: v.preco(req.body.precoBase, 'precoBase', { obrig: true }),
      destaque: Boolean(req.body.destaque),
      plataformas: Array.isArray(req.body.plataformas) ? req.body.plataformas.map((p) => p.id) : [],
      generos: Array.isArray(req.body.generos) ? req.body.generos.map((g) => g.id) : [],
      imagens: Array.isArray(req.body.imagens) ? req.body.imagens.filter(Boolean) : []
    };
    return res.status(201).json(await admin.criarProduto(dados));
  } catch (err) {
    return next(err);
  }
});

router.get('/produtos/:id', async (req, res, next) => {
  try {
    const id = v.id(req.params.id, 'id');
    return res.json(await admin.detalharProduto(id));
  } catch (err) {
    return next(err);
  }
});

router.patch('/produtos/:id', async (req, res, next) => {
  try {
    const id = v.id(req.params.id, 'id');
    const body = req.body || {};
    const dados = {};
    if (body.nome !== undefined) dados.nome = v.texto(body.nome, 'nome', { min: 2, max: 200 });
    if (body.descricao !== undefined) dados.descricao = v.textoOpcional(body.descricao, 'descricao', { max: 5000 });
    if (body.categoriaId !== undefined) dados.categoriaId = body.categoriaId != null ? v.id(body.categoriaId, 'categoriaId') : null;
    if (body.tipo !== undefined) dados.tipo = v.enumValor(body.tipo, 'tipo', ['physical', 'digital']);
    if (body.precoBase !== undefined) dados.precoBase = v.preco(body.precoBase, 'precoBase');
    if (body.ativo !== undefined) dados.ativo = Boolean(body.ativo);
    if (body.destaque !== undefined) dados.destaque = Boolean(body.destaque);
    if (Array.isArray(body.plataformas)) dados.plataformas = body.plataformas.map((p) => p.id);
    if (Array.isArray(body.generos)) dados.generos = body.generos.map((g) => g.id);
    return res.json(await admin.atualizarProduto(id, dados));
  } catch (err) {
    return next(err);
  }
});

router.delete('/produtos/:id', async (req, res, next) => {
  try {
    const id = v.id(req.params.id, 'id');
    return res.json(await admin.atualizarProduto(id, { ativo: false }));
  } catch (err) {
    return next(err);
  }
});

/* ------------ VARIANTES ------------ */

router.post('/produtos/:id/variantes', async (req, res, next) => {
  try {
    const id = v.id(req.params.id, 'id');
    const dados = {
      sku: req.body.sku ? v.texto(req.body.sku, 'sku', { max: 50 }) : null,
      preco: v.preco(req.body.preco, 'preco', { obrig: true }),
      estoque: v.numero(req.body.estoque ?? 0, 'estoque', { min: 0, max: 100000 }),
      plataformaId: req.body.plataformaId != null ? v.id(req.body.plataformaId, 'plataformaId') : null
    };
    return res.status(201).json(await admin.criarVariante(id, dados));
  } catch (err) {
    return next(err);
  }
});

router.patch('/variantes/:id', async (req, res, next) => {
  try {
    const id = v.id(req.params.id, 'id');
    const body = req.body || {};
    const dados = {};
    if (body.preco !== undefined) dados.preco = v.preco(body.preco, 'preco');
    if (body.estoque !== undefined) dados.estoque = v.numero(body.estoque, 'estoque', { min: 0, max: 100000 });
    if (body.ativo !== undefined) dados.ativo = Boolean(body.ativo);
    if (body.sku !== undefined) dados.sku = v.texto(body.sku, 'sku', { max: 50 });
    return res.json(await admin.atualizarVariante(id, dados));
  } catch (err) {
    return next(err);
  }
});

/* ------------ CODIGOS DIGITAIS ------------ */

router.get('/variantes/:id/codigos', async (req, res, next) => {
  try {
    const id = v.id(req.params.id, 'id');
    return res.json(await admin.listarCodigos(id));
  } catch (err) {
    return next(err);
  }
});

router.post('/variantes/:id/codigos', async (req, res, next) => {
  try {
    const id = v.id(req.params.id, 'id');
    if (!Array.isArray(req.body.codigos) || req.body.codigos.length === 0 || req.body.codigos.length > 500) {
      throw new Error('Envie entre 1 e 500 codigos.');
    }
    const codigos = req.body.codigos.map((c) => v.texto(c, 'codigo', { min: 1, max: 100 }));
    return res.status(201).json(await admin.adicionarCodigos(id, codigos));
  } catch (err) {
    return next(err);
  }
});

/* ------------ PEDIDOS ------------ */

router.get('/pedidos', async (req, res, next) => {
  try {
    return res.json(await admin.listarPedidos({
      pagina: req.query.pagina,
      limite: req.query.limite,
      status: req.query.status,
      payment_status: req.query.payment_status
    }));
  } catch (err) {
    return next(err);
  }
});

router.get('/pedidos/:id', async (req, res, next) => {
  try {
    const id = v.id(req.params.id, 'id');
    return res.json(await admin.detalharPedidoAdmin(id));
  } catch (err) {
    return next(err);
  }
});

router.patch('/pedidos/:id/status', async (req, res, next) => {
  try {
    const id = v.id(req.params.id, 'id');
    const status = v.enumValor(req.body.status, 'status', ['', 'pending_payment', 'paid', 'preparing', 'shipped', 'completed', 'cancelled'].slice(1));
    return res.json(await admin.atualizarStatusPedido(id, status));
  } catch (err) {
    return next(err);
  }
});

/* ------------ CLIENTES ------------ */

router.get('/clientes', async (req, res, next) => {
  try {
    return res.json(await admin.listarClientes({
      pagina: req.query.pagina,
      limite: req.query.limite,
      busca: req.query.busca
    }));
  } catch (err) {
    return next(err);
  }
});

router.patch('/clientes/:id', async (req, res, next) => {
  try {
    const id = v.id(req.params.id, 'id');
    const dados = {};
    if (req.body.ativo !== undefined) dados.ativo = Boolean(req.body.ativo);
    if (req.body.role !== undefined) dados.role = req.body.role;
    return res.json(await admin.atualizarContaCliente(id, dados));
  } catch (err) {
    return next(err);
  }
});

/* ------------ PAGAMENTOS ------------ */

router.post('/pagamentos/:id/confirmar', async (req, res, next) => {
  try {
    const id = v.id(req.params.id, 'id');
    const pagamento = await db.queryOne('SELECT id, order_id, method, status FROM payments WHERE id = ?', [id]);
    if (!pagamento) {
      return res.status(404).json({ erro: 'not_found', mensagem: 'Pagamento nao encontrado.' });
    }
    if (pagamento.method === 'credit_card') {
      return res.status(409).json({ erro: 'conflict', mensagem: 'Pagamento de cartao e aprovado automaticamente.' });
    }
    const resultado = await pagamentoService.confirmarPagamentoSimulado(id);
    await admin.auditar(req.usuario.id, 'pagamento_confirmado_manual', 'payment', id, null, req.ip);
    return res.json(resultado);
  } catch (err) {
    return next(err);
  }
});

/* ------------ DEVOLUCOES ------------ */

router.get('/devolucoes', async (req, res, next) => {
  try {
    return res.json(await admin.listarDevolucoes({ status: req.query.status }));
  } catch (err) {
    return next(err);
  }
});

router.patch('/devolucoes/:id/decisao', async (req, res, next) => {
  try {
    const id = v.id(req.params.id, 'id');
    const status = v.enumValor(req.body.status, 'status', ['approved', 'rejected']);
    const decisao = v.textoOpcional(req.body.decisao, 'decisao', { max: 2000 });
    return res.json(await admin.decidirDevolucao(id, { status, decisao, idAdmin: req.usuario.id }));
  } catch (err) {
    return next(err);
  }
});

/* ------------ AUDITORIA ------------ */

router.get('/auditoria', async (req, res, next) => {
  try {
    const pagina = Math.max(Number(req.query.pagina) || 1, 1);
    const limite = Math.min(Math.max(Number(req.query.limite) || 30, 1), 100);
    const linhas = await db.query(
      'SELECT * FROM audit_logs ORDER BY id DESC LIMIT ? OFFSET ?',
      [limite, (pagina - 1) * limite]
    );
    return res.json(linhas);
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
