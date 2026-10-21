const db = require('../config/db');
const { notFound } = require('../utils/errors');

async function perfil(idUsuario) {
  const usuario = await db.queryOne(
    'SELECT id, name, email, birth_date, role, is_active, created_at FROM users WHERE id = ?',
    [idUsuario]
  );
  if (!usuario) {
    throw notFound('Conta nao encontrada.');
  }
  return {
    id: usuario.id,
    nome: usuario.name,
    email: usuario.email,
    nascimento: usuario.birth_date,
    role: usuario.role,
    criadoEm: usuario.created_at
  };
}

async function atualizarPerfil(idUsuario, { nome, nascimento }) {
  const campos = [];
  const valores = [];

  if (nome !== undefined && nome !== null) {
    campos.push('name = ?');
    valores.push(nome);
  }
  if (nascimento !== undefined) {
    campos.push('birth_date = ?');
    valores.push(nascimento);
  }

  if (campos.length > 0) {
    valores.push(idUsuario);
    await db.query(`UPDATE users SET ${campos.join(', ')} WHERE id = ?`, valores);
  }

  return perfil(idUsuario);
}

const CAMPOS_ENDERECO = 'id, user_id, street, number, complement, neighborhood, city, state, zip_code, is_default';

function mapearEndereco(linha) {
  return {
    id: linha.id,
    rua: linha.street,
    numero: linha.number,
    complemento: linha.complement,
    bairro: linha.neighborhood,
    cidade: linha.city,
    uf: linha.state,
    cep: linha.zip_code,
    padrao: !!linha.is_default
  };
}

async function listarEnderecos(idUsuario) {
  const linhas = await db.query(
    `SELECT ${CAMPOS_ENDERECO} FROM addresses WHERE user_id = ? ORDER BY is_default DESC, id ASC`,
    [idUsuario]
  );
  return linhas.map(mapearEndereco);
}

async function criarEndereco(idUsuario, dados) {
  const total = await db.queryOne('SELECT COUNT(*) AS total FROM addresses WHERE user_id = ?', [idUsuario]);
  const primeiro = Number(total.total) === 0 || dados.padrao;

  if (dados.padrao) {
    await db.query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [idUsuario]);
  }

  const resultado = await db.query(
    `INSERT INTO addresses (user_id, street, number, complement, neighborhood, city, state, zip_code, is_default)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      idUsuario,
      dados.rua,
      dados.numero,
      dados.complemento === undefined ? null : dados.complemento,
      dados.bairro,
      dados.cidade,
      dados.uf,
      dados.cep,
      primeiro ? 1 : 0
    ]
  );

  const linha = await db.queryOne(`SELECT ${CAMPOS_ENDERECO} FROM addresses WHERE id = ?`, [Number(resultado.insertId)]);
  return mapearEndereco(linha);
}

async function atualizarEndereco(idUsuario, idEndereco, dados) {
  const existente = await db.queryOne(
    `SELECT ${CAMPOS_ENDERECO} FROM addresses WHERE id = ? AND user_id = ?`,
    [idEndereco, idUsuario]
  );
  if (!existente) {
    throw notFound('Endereco nao encontrado.');
  }

  if (dados.padrao) {
    await db.query('UPDATE addresses SET is_default = 0 WHERE user_id = ?', [idUsuario]);
  }

  const campos = [];
  const valores = [];
  if (dados.rua !== undefined) { campos.push('street = ?'); valores.push(dados.rua); }
  if (dados.numero !== undefined) { campos.push('number = ?'); valores.push(dados.numero); }
  if (dados.complemento !== undefined) { campos.push('complement = ?'); valores.push(dados.complemento); }
  if (dados.bairro !== undefined) { campos.push('neighborhood = ?'); valores.push(dados.bairro); }
  if (dados.cidade !== undefined) { campos.push('city = ?'); valores.push(dados.cidade); }
  if (dados.uf !== undefined) { campos.push('state = ?'); valores.push(dados.uf); }
  if (dados.cep !== undefined) { campos.push('zip_code = ?'); valores.push(dados.cep); }
  if (dados.padrao !== undefined) { campos.push('is_default = ?'); valores.push(dados.padrao ? 1 : 0); }

  if (campos.length > 0) {
    valores.push(idEndereco, idUsuario);
    await db.query(`UPDATE addresses SET ${campos.join(', ')} WHERE id = ? AND user_id = ?`, valores);
  }

  const linha = await db.queryOne(`SELECT ${CAMPOS_ENDERECO} FROM addresses WHERE id = ? AND user_id = ?`, [idEndereco, idUsuario]);
  return mapearEndereco(linha);
}

async function excluirEndereco(idUsuario, idEndereco) {
  const resultado = await db.query(
    'DELETE FROM addresses WHERE id = ? AND user_id = ?',
    [idEndereco, idUsuario]
  );
  if (Number(resultado.affectedRows) === 0) {
    throw notFound('Endereco nao encontrado.');
  }
}

module.exports = {
  perfil,
  atualizarPerfil,
  listarEnderecos,
  criarEndereco,
  atualizarEndereco,
  excluirEndereco
};
