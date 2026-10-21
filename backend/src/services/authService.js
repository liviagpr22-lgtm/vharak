const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const env = require('../config/env');
const { unauthorized, conflict, forbidden } = require('../utils/errors');

const ROUNDS = 10;

function assinarToken(usuario) {
  return jwt.sign(
    { id: usuario.id, role: usuario.role, email: usuario.email },
    env.jwtSecret,
    { expiresIn: `${env.jwtExpiresHours}h` }
  );
}

function publicar(usuario) {
  return {
    id: usuario.id,
    nome: usuario.name,
    email: usuario.email,
    nascimento: usuario.birth_date,
    role: usuario.role,
    criadoEm: usuario.created_at
  };
}

async function cadastrar({ nome, email, senha, nascimento }) {
  const existente = await db.queryOne('SELECT id FROM users WHERE email = ?', [email]);
  if (existente) {
    throw conflict('Este e-mail ja esta cadastrado.');
  }

  const senhaHash = await bcrypt.hash(senha, ROUNDS);

  const resultado = await db.query(
    `INSERT INTO users (name, email, password_hash, birth_date, role)
     VALUES (?, ?, ?, ?, 'customer')`,
    [nome, email, senhaHash, nascimento || null]
  );
  const novoId = Number(resultado.insertId);

  const usuario = await db.queryOne('SELECT * FROM users WHERE id = ?', [novoId]);

  return { usuario: publicar(usuario), token: assinarToken(usuario) };
}

async function autenticarPorEmailSenha(email, senha) {
  const usuario = await db.queryOne('SELECT * FROM users WHERE email = ?', [email]);
  if (!usuario) {
    throw unauthorized('E-mail ou senha incorretos.');
  }
  if (!usuario.is_active) {
    throw forbidden('Conta desativada. Fale com o suporte.');
  }

  const confere = await bcrypt.compare(senha, usuario.password_hash);
  if (!confere) {
    throw unauthorized('E-mail ou senha incorretos.');
  }

  return { usuario: publicar(usuario), token: assinarToken(usuario) };
}

async function trocarSenha(idUsuario, senhaAtual, novaSenha) {
  const usuario = await db.queryOne('SELECT * FROM users WHERE id = ?', [idUsuario]);
  if (!usuario) {
    throw unauthorized('Conta nao encontrada.');
  }

  const confere = await bcrypt.compare(senhaAtual, usuario.password_hash);
  if (!confere) {
    throw unauthorized('Senha atual incorreta.');
  }

  const senhaHash = await bcrypt.hash(novaSenha, ROUNDS);
  await db.query('UPDATE users SET password_hash = ? WHERE id = ?', [senhaHash, idUsuario]);
}

module.exports = { cadastrar, autenticarPorEmailSenha, trocarSenha, publicar, assinarToken };
