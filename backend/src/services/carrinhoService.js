const db = require('../config/db');
const { notFound, badRequest, unauthorized } = require('../utils/errors');

async function obterOuCriarCarrinho(idUsuario) {
  let carrinho = await db.queryOne('SELECT id FROM carts WHERE user_id = ?', [idUsuario]);
  if (!carrinho) {
    const resultado = await db.query('INSERT INTO carts (user_id) VALUES (?)', [idUsuario]);
    carrinho = { id: Number(resultado.insertId) };
  }
  return carrinho;
}

async function validarVariante(idVariante) {
  const variante = await db.queryOne(
    `SELECT v.id, v.product_id, v.price, v.stock_quantity AS estoque, v.is_active AS ativo,
            p.name AS produto, p.type AS tipo, p.is_active AS produto_ativo,
            pl.name AS plataforma
     FROM product_variants v
     INNER JOIN products p ON p.id = v.product_id
     LEFT JOIN platforms pl ON pl.id = v.platform_id
     WHERE v.id = ?`,
    [idVariante]
  );
  if (!variante || !variante.ativo || !variante.produto_ativo) {
    throw notFound('Variante inexistente ou indisponivel.');
  }
  return variante;
}

function nomeTipo(tipo) {
  return tipo === 'physical' ? 'fisico' : 'digital';
}

async function visualizar(idUsuario) {
  const meuCarrinho = await obterOuCriarCarrinho(idUsuario);

  const linhas = await db.query(
    `SELECT ci.id, ci.variant_id, ci.quantity,
            v.price, v.stock_quantity AS estoque, v.sku,
            p.id AS produto_id, p.name AS produto, p.type AS tipo,
            pl.name AS plataforma,
            (SELECT i.url FROM product_images i
             WHERE i.product_id = p.id
             ORDER BY i.is_primary DESC, i.sort_order ASC, i.id ASC
             LIMIT 1) AS imagem
     FROM cart_items ci
     INNER JOIN product_variants v ON v.id = ci.variant_id
     INNER JOIN products p ON p.id = v.product_id
     LEFT JOIN platforms pl ON pl.id = v.platform_id
     WHERE ci.cart_id = ?
     ORDER BY ci.id ASC`,
    [meuCarrinho.id]
  );

  const itens = linhas.map((linha) => ({
    id: linha.id,
    varianteId: Number(linha.variant_id),
    produtoId: Number(linha.produto_id),
    produto: linha.produto,
    plataforma: linha.plataforma,
    tipo: nomeTipo(linha.tipo),
    sku: linha.sku,
    quantidade: Number(linha.quantity),
    precoUnitario: Number(linha.price),
    estoqueDisponivel: Number(linha.estoque),
    imagem: linha.imagem,
    subtotal: Number(linha.quantity) * Number(linha.price)
  }));

  const subtotal = itens.reduce((soma, item) => soma + item.subtotal, 0);

  return { itens, subtotal: Math.round(subtotal * 100) / 100, quantidadeItens: itens.length };
}

async function adicionarItem(idUsuario, idVariante, quantidade) {
  if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > 99) {
    throw badRequest('Quantidade deve ser inteira entre 1 e 99.');
  }

  const variante = await validarVariante(idVariante);
  const carrinho = await obterOuCriarCarrinho(idUsuario);

  const existente = await db.queryOne(
    'SELECT id, quantity FROM cart_items WHERE cart_id = ? AND variant_id = ?',
    [carrinho.id, idVariante]
  );

  const novaQuantidade = existente ? Number(existente.quantity) + quantidade : quantidade;
  if (novaQuantidade > variante.estoque) {
    throw badRequest(`Estoque insuficiente: disponivel ${variante.estoque}.`);
  }

  if (existente) {
    await db.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [novaQuantidade, existente.id]);
  } else {
    await db.query('INSERT INTO cart_items (cart_id, variant_id, quantity) VALUES (?, ?, ?)', [
      carrinho.id,
      idVariante,
      quantidade
    ]);
  }

  return visualizar(idUsuario);
}

async function alterarQuantidade(idUsuario, idItem, quantidade) {
  if (!Number.isInteger(quantidade) || quantidade < 1 || quantidade > 99) {
    throw badRequest('Quantidade deve ser inteira entre 1 e 99.');
  }

  const carrinho = await obterOuCriarCarrinho(idUsuario);
  const item = await db.queryOne(
    `SELECT ci.id, ci.variant_id, ci.quantity, v.stock_quantity AS estoque
     FROM cart_items ci
     INNER JOIN product_variants v ON v.id = ci.variant_id
     WHERE ci.id = ? AND ci.cart_id = ?`,
    [idItem, carrinho.id]
  );
  if (!item) {
    throw notFound('Item do carrinho nao encontrado.');
  }

  if (quantidade > Number(item.estoque)) {
    throw badRequest(`Estoque insuficiente: disponivel ${item.estoque}.`);
  }

  await db.query('UPDATE cart_items SET quantity = ? WHERE id = ?', [quantidade, item.id]);
  return visualizar(idUsuario);
}

async function removerItem(idUsuario, idItem) {
  const carrinho = await obterOuCriarCarrinho(idUsuario);
  const resultado = await db.query(
    'DELETE FROM cart_items WHERE id = ? AND cart_id = ?',
    [idItem, carrinho.id]
  );
  if (Number(resultado.affectedRows) === 0) {
    throw notFound('Item do carrinho nao encontrado.');
  }
  return visualizar(idUsuario);
}

async function esvaziar(idUsuario) {
  const carrinho = await obterOuCriarCarrinho(idUsuario);
  await db.query('DELETE FROM cart_items WHERE cart_id = ?', [carrinho.id]);
  return visualizar(idUsuario);
}

module.exports = { visualizar, adicionarItem, alterarQuantidade, removerItem, esvaziar, obterOuCriarCarrinho };
