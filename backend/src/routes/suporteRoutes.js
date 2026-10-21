const express = require('express');
const router = express.Router();

const db = require('../config/db');
const admin = require('../services/adminService');
const { requireAuth } = require('../middlewares/auth');
const v = require('../utils/validations');
const { forbidden } = require('../utils/errors');

const CATEGORIAS_TICKET = ['payment', 'digital_product', 'order_delivery', 'returns_refunds', 'account'];

async function mapearTicket(linha) {
  const mensagens = await db.query(
    'SELECT id, sender_type, message, created_at FROM support_messages WHERE ticket_id = ? ORDER BY id',
    [linha.id]
  );
  return {
    id: Number(linha.id),
    assunto: linha.subject,
    categoria: linha.category,
    status: linha.status,
    criadoEm: linha.created_at,
    atualizadoEm: linha.updated_at,
    mensagens: mensagens.map((m) => ({
      tipoRemetente: m.sender_type,
      mensagem: m.message,
      data: m.created_at
    }))
  };
}

router.use(requireAuth);

router.post('/', async (req, res, next) => {
  try {
    const assunto = v.texto(req.body.assunto, 'assunto', { min: 5, max: 200 });
    const categoria = v.enumValor(req.body.categoria, 'categoria', CATEGORIAS_TICKET);
    const mensagem = v.texto(req.body.mensagem, 'mensagem', { min: 10, max: 3000 });

    const resultado = await db.query(
      'INSERT INTO support_tickets (user_id, subject, category, status) VALUES (?, ?, ?, "open")',
      [req.usuario.id, assunto, categoria]
    );
    const idTicket = Number(resultado.insertId);

    await db.query(
      'INSERT INTO support_messages (ticket_id, sender_type, message) VALUES (?, "user", ?)',
      [idTicket, mensagem]
    );

    const linha = await db.queryOne('SELECT * FROM support_tickets WHERE id = ?', [idTicket]);
    return res.status(201).json(await mapearTicket(linha));
  } catch (err) {
    return next(err);
  }
});

router.get('/', async (req, res, next) => {
  try {
    const linhas = await db.query(
      'SELECT * FROM support_tickets WHERE user_id = ? ORDER BY updated_at DESC',
      [req.usuario.id]
    );
    const tickets = [];
    for (const linha of linhas) {
      tickets.push(await mapearTicket(linha));
    }
    return res.json(tickets);
  } catch (err) {
    return next(err);
  }
});

router.get('/:id', async (req, res, next) => {
  try {
    const id = v.id(req.params.id, 'id do ticket');
    const linha = await db.queryOne('SELECT * FROM support_tickets WHERE id = ?', [id]);
    if (!linha) {
      const e = forbidden();
      return res.status(e.statusCode).json({ erro: e.code, mensagem: 'Ticket nao encontrado ou de outra conta.' });
    }
    if (Number(linha.user_id) !== Number(req.usuario.id) && req.usuario.role !== 'admin') {
      return res.status(403).json({ erro: 'forbidden', mensagem: 'Ticket de outra conta.' });
    }
    return res.json(await mapearTicket(linha));
  } catch (err) {
    return next(err);
  }
});

router.post('/:id/mensagens', async (req, res, next) => {
  try {
    const id = v.id(req.params.id, 'id do ticket');
    const mensagem = v.texto(req.body.mensagem, 'mensagem', { min: 1, max: 3000 });

    const linha = await db.queryOne('SELECT * FROM support_tickets WHERE id = ?', [id]);
    if (!linha) {
      return res.status(404).json({ erro: 'not_found', mensagem: 'Ticket nao encontrado.' });
    }
    if (Number(linha.user_id) !== Number(req.usuario.id) && req.usuario.role !== 'admin') {
      return res.status(403).json({ erro: 'forbidden', mensagem: 'Ticket de outra conta.' });
    }
    if (['closed'].includes(linha.status)) {
      return res.status(409).json({ erro: 'conflict', mensagem: 'Ticket encerrado. Abra um novo.' });
    }

    const remetente = req.usuario.role === 'admin' ? 'admin' : 'user';
    await db.query(
      'INSERT INTO support_messages (ticket_id, sender_type, message) VALUES (?, ?, ?)',
      [id, remetente, mensagem]
    );
    if (remetente === 'admin' && linha.status === 'open') {
      await db.query('UPDATE support_tickets SET status = "in_progress" WHERE id = ?', [id]);
    }
    if (remetente === 'user' && linha.status === 'in_progress') {
      await db.query('UPDATE support_tickets SET status = "open" WHERE id = ?', [id]);
    }

    const atualizado = await db.queryOne('SELECT * FROM support_tickets WHERE id = ?', [id]);
    await admin.auditar(req.usuario.id, 'ticket_mensagem', 'support_ticket', id, remetente, req.ip);
    return res.status(201).json(await mapearTicket(atualizado));
  } catch (err) {
    return next(err);
  }
});

/* Rotas exclusivas de administrador para o mesmo recurso */
const rAdmin = express.Router();
rAdmin.use(requireAuth);
rAdmin.use((req, res, next) => {
  if (req.usuario.role !== 'admin') {
    return res.status(403).json({ erro: 'forbidden', mensagem: 'Recurso restrito a administradores.' });
  }
  next();
});

rAdmin.get('/admin/todos', async (req, res, next) => {
  try {
    const pagina = Math.max(Number(req.query.pagina) || 1, 1);
    const limite = Math.min(Math.max(Number(req.query.limite) || 20, 1), 100);
    let onde = '';
    const params = [];
    if (req.query.status) {
      onde = ' WHERE status = ?';
      params.push(req.query.status);
    }
    const contagem = await db.queryOne(`SELECT COUNT(*) AS total FROM support_tickets t ${onde}`, params);
    const linhas = await db.query(
      `SELECT t.*, u.name AS cliente FROM support_tickets t
       INNER JOIN users u ON u.id = t.user_id
       ${onde}
       ORDER BY t.updated_at DESC
       LIMIT ? OFFSET ?`,
      [...params, limite, (pagina - 1) * limite]
    );
    const itens = linhas.map((linha) => ({
      id: Number(linha.id),
      cliente: linha.cliente,
      assunto: linha.subject,
      categoria: linha.category,
      status: linha.status,
      criadoEm: linha.created_at,
      atualizadoEm: linha.updated_at
    }));
    return res.json({ itens, pagina, limite, total: Number(contagem.total) });
  } catch (err) {
    return next(err);
  }
});

rAdmin.patch('/admin/:id/status', async (req, res, next) => {
  try {
    const id = v.id(req.params.id, 'id do ticket');
    const status = v.enumValor(req.body.status, 'status', ['open', 'in_progress', 'resolved', 'closed']);
    await db.query('UPDATE support_tickets SET status = ? WHERE id = ?', [status, id]);
    await admin.auditar(req.usuario.id, 'ticket_status_alterado', 'support_ticket', id, status, req.ip);
    const linha = await db.queryOne('SELECT * FROM support_tickets WHERE id = ?', [id]);
    if (!linha) {
      return res.status(404).json({ erro: 'not_found', mensagem: 'Ticket nao encontrado.' });
    }
    return res.json(await mapearTicket(linha));
  } catch (err) {
    return next(err);
  }
});

module.exports = { router, rAdmin };
