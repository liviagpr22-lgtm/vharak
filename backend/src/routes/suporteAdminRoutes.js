const express = require('express');
const router = express.Router();

const db = require('../config/db');
const admin = require('../services/adminService');
const { requireAdmin } = require('../middlewares/auth');
const v = require('../utils/validations');

router.use(requireAdmin);

function mapearTicket(linha) {
  return {
    id: Number(linha.id),
    cliente: linha.cliente,
    clienteId: linha.user_id ? Number(linha.user_id) : undefined,
    assunto: linha.subject,
    categoria: linha.category,
    status: linha.status,
    criadoEm: linha.created_at,
    atualizadoEm: linha.updated_at
  };
}

router.get('/tickets', async (req, res, next) => {
  try {
    const pagina = Math.max(Number(req.query.pagina) || 1, 1);
    const limite = Math.min(Math.max(Number(req.query.limite) || 20, 1), 100);
    let onde = '';
    const params = [];
    if (req.query.status) {
      onde = ' WHERE t.status = ?';
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
    return res.json({
      itens: linhas.map(mapearTicket),
      pagina,
      limite,
      total: Number(contagem.total)
    });
  } catch (err) {
    return next(err);
  }
});

router.get('/tickets/:id', async (req, res, next) => {
  try {
    const id = v.id(req.params.id, 'id do ticket');
    const linha = await db.queryOne(
      'SELECT t.*, u.name AS cliente FROM support_tickets t INNER JOIN users u ON u.id = t.user_id WHERE t.id = ?',
      [id]
    );
    if (!linha) {
      return res.status(404).json({ erro: 'not_found', mensagem: 'Ticket nao encontrado.' });
    }
    const mensagens = await db.query(
      'SELECT id, sender_type, message, created_at FROM support_messages WHERE ticket_id = ? ORDER BY id',
      [id]
    );
    return res.json({
      ...mapearTicket(linha),
      clienteEmail: linha.email || undefined,
      mensagens: mensagens.map((m) => ({ tipoRemetente: m.sender_type, mensagem: m.message, data: m.created_at }))
    });
  } catch (err) {
    return next(err);
  }
});

router.post('/tickets/:id/respostas', async (req, res, next) => {
  try {
    const id = v.id(req.params.id, 'id do ticket');
    const mensagem = v.texto(req.body.mensagem, 'mensagem', { min: 1, max: 3000 });
    const linha = await db.queryOne('SELECT id, status FROM support_tickets WHERE id = ?', [id]);
    if (!linha) {
      return res.status(404).json({ erro: 'not_found', mensagem: 'Ticket nao encontrado.' });
    }
    await db.query(
      'INSERT INTO support_messages (ticket_id, sender_type, message) VALUES (?, "admin", ?)',
      [id, mensagem]
    );
    if (linha.status === 'open') {
      await db.query('UPDATE support_tickets SET status = "in_progress" WHERE id = ?', [id]);
    }
    await admin.auditar(req.usuario.id, 'ticket_resposta', 'support_ticket', id, null, req.ip);
    const atualizado = await db.queryOne(
      'SELECT t.*, u.name AS cliente FROM support_tickets t INNER JOIN users u ON u.id = t.user_id WHERE t.id = ?',
      [id]
    );
    return res.status(201).json(mapearTicket(atualizado));
  } catch (err) {
    return next(err);
  }
});

router.patch('/tickets/:id/status', async (req, res, next) => {
  try {
    const id = v.id(req.params.id, 'id do ticket');
    const status = v.enumValor(req.body.status, 'status', ['open', 'in_progress', 'resolved', 'closed']);
    await db.query('UPDATE support_tickets SET status = ? WHERE id = ?', [status, id]);
    await admin.auditar(req.usuario.id, 'ticket_status_alterado', 'support_ticket', id, status, req.ip);
    const atualizado = await db.queryOne(
      'SELECT t.*, u.name AS cliente FROM support_tickets t INNER JOIN users u ON u.id = t.user_id WHERE t.id = ?',
      [id]
    );
    if (!atualizado) {
      return res.status(404).json({ erro: 'not_found', mensagem: 'Ticket nao encontrado.' });
    }
    return res.json(mapearTicket(atualizado));
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
