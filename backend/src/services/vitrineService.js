const db = require('../config/db');
const { notFound, conflict, forbidden, badRequest } = require('../utils/errors');

async function produtoAtivo(idProduto) {
  const produto = await db.queryOne('SELECT id FROM products WHERE id = ? AND is_active = 1', [idProduto]);
  if (!produto) {
    throw notFound('Produto nao encontrado.');
  }
  return produto;
}

/* ------------------------- FAVORITOS ------------------------- */

async function adicionarFavorito(idUsuario, idProduto) {
  await produtoAtivo(idProduto);

  const existente = await db.queryOne(
    'SELECT id FROM favorites WHERE user_id = ? AND product_id = ?',
    [idUsuario, idProduto]
  );
  if (existente) {
    throw conflict('Produto ja esta nos favoritos.');
  }

  await db.query('INSERT INTO favorites (user_id, product_id) VALUES (?, ?)', [idUsuario, idProduto]);
  return { adicionado: true };
}

async function removerFavorito(idUsuario, idProduto) {
  const resultado = await db.query(
    'DELETE FROM favorites WHERE user_id = ? AND product_id = ?',
    [idUsuario, idProduto]
  );
  if (Number(resultado.affectedRows) === 0) {
    throw notFound('Favorito nao encontrado.');
  }
  return { removido: true };
}

async function listarFavoritos(idUsuario) {
  const linhas = await db.query(
    `SELECT
      p.id,
      p.name AS nome,
      c.name AS categoria,
      c.slug AS categoria_slug,
      p.type AS tipo,
      p.average_rating AS media_avaliacoes,
      p.reviews_count AS total_avaliacoes,
      (SELECT MIN(v.price) FROM product_variants v
        WHERE v.product_id = p.id AND v.is_active = 1) AS preco_min,
      (SELECT SUM(v.stock_quantity) FROM product_variants v
        WHERE v.product_id = p.id AND v.is_active = 1) AS estoque_total,
      (SELECT i.url FROM product_images i
        WHERE i.product_id = p.id
        ORDER BY i.is_primary DESC, i.sort_order ASC, i.id ASC
        LIMIT 1) AS imagem,
      f.created_at AS favoritado_em
     FROM favorites f
     INNER JOIN products p ON p.id = f.product_id AND p.is_active = 1
     LEFT JOIN categories c ON c.id = p.category_id
     WHERE f.user_id = ?
     ORDER BY f.created_at DESC`,
    [idUsuario]
  );

  return linhas.map((linha) => ({
    id: linha.id,
    nome: linha.nome,
    categoria: linha.categoria,
    categoriaSlug: linha.categoria_slug,
    tipo: linha.tipo === 'physical' ? 'fisico' : 'digital',
    precoMin: Number(linha.preco_min ?? 0),
    mediaAvaliacoes: Number(linha.media_avaliacoes ?? 0),
    totalAvaliacoes: Number(linha.total_avaliacoes ?? 0),
    estoqueTotal: Number(linha.estoque_total ?? 0),
    disponivel: Number(linha.estoque_total ?? 0) > 0,
    imagem: linha.imagem,
    favoritadoEm: linha.favoritado_em
  }));
}

/* ------------------------- AVALIACOES ------------------------- */

async function temCompraConfirmada(idUsuario, idProduto) {
  const compra = await db.queryOne(
    `SELECT COUNT(*) AS total
     FROM order_items oi
     INNER JOIN orders o ON o.id = oi.order_id
     INNER JOIN product_variants v ON v.id = oi.variant_id
     WHERE o.user_id = ?
       AND v.product_id = ?
       AND o.payment_status = 'paid'
       AND o.status IN ('paid','preparing','shipped','completed')`,
    [idUsuario, idProduto]
  );
  return Number(compra.total) > 0;
}

async function recalcularAgregados(idProduto) {
  await db.query(
    `UPDATE products p SET
      p.average_rating = COALESCE((SELECT ROUND(AVG(r.rating), 2) FROM reviews r WHERE r.product_id = p.id), 0),
      p.reviews_count = (SELECT COUNT(*) FROM reviews r WHERE r.product_id = p.id)
     WHERE p.id = ?`,
    [idProduto]
  );
}

async function temCompraConfirmada(idUsuario, idProduto) {
  const compra = await db.queryOne(
    `SELECT COUNT(*) AS total
     FROM order_items oi
     INNER JOIN orders o ON o.id = oi.order_id
     INNER JOIN product_variants v ON v.id = oi.variant_id
     WHERE o.user_id = ?
       AND v.product_id = ?
       AND o.payment_status = 'paid'
       AND o.status IN ('paid','preparing','shipped','completed')`,
    [idUsuario, idProduto]
  );
  return Number(compra.total) > 0;
}

async function salvarAvaliacao(idUsuario, idProduto, { nota, comentario }) {
  await produtoAtivo(idProduto);

  if (!Number.isInteger(nota) || nota < 1 || nota > 5) {
    throw badRequest('A nota deve ser inteira de 1 a 5.');
  }

  const compra = await temCompraConfirmada(idUsuario, idProduto);
  if (!compra) {
    throw forbidden('So e possivel avaliar apos uma compra paga deste produto.');
  }

  const existente = await db.queryOne(
    'SELECT id FROM reviews WHERE user_id = ? AND product_id = ?',
    [idUsuario, idProduto]
  );

  if (existente) {
    await db.query(
      'UPDATE reviews SET rating = ?, comment = ? WHERE id = ?',
      [nota, comentario, existente.id]
    );
  } else {
    await db.query(
      'INSERT INTO reviews (user_id, product_id, rating, comment) VALUES (?, ?, ?, ?)',
      [idUsuario, idProduto, nota, comentario]
    );
  }

  await recalcularAgregados(idProduto);
  return detalhesMinhaAvaliacao(idUsuario, idProduto);
}

async function detalhesMinhaAvaliacao(idUsuario, idProduto) {
  const linha = await db.queryOne(
    `SELECT r.id, r.rating, r.comment, r.created_at
     FROM reviews r
     WHERE r.user_id = ? AND r.product_id = ?`,
    [idUsuario, idProduto]
  );
  if (!linha) {
    throw notFound('Avaliacao nao encontrada.');
  }
  return { id: linha.id, nota: linha.rating, comentario: linha.comment, criadoEm: linha.created_at };
}

async function listarAvaliacoes(idProduto, { pagina = 1, limite = 10 } = {}) {
  limite = Math.min(Math.max(Number(limite) || 10, 1), 50);
  pagina = Math.max(Number(pagina) || 1, 1);
  const offset = (pagina - 1) * limite;

  await produtoAtivo(idProduto);

  const contagem = await db.queryOne('SELECT COUNT(*) AS total FROM reviews WHERE product_id = ?', [idProduto]);
  const linhas = await db.query(
    `SELECT r.id, r.rating, r.comment, r.created_at, u.name AS autor
     FROM reviews r
     INNER JOIN users u ON u.id = r.user_id
     WHERE r.product_id = ?
     ORDER BY r.created_at DESC
     LIMIT ? OFFSET ?`,
    [idProduto, limite, offset]
  );

  return {
    itens: linhas.map((linha) => ({
      id: linha.id,
      nota: linha.rating,
      comentario: linha.comment,
      criadoEm: linha.created_at,
      autor: linha.autor
    })),
    pagina,
    limite,
    total: Number(contagem.total),
    paginas: Math.ceil(Number(contagem.total) / limite) || 0
  };
}

async function excluirAvaliacao(idUsuario, idProduto) {
  await produtoAtivo(idProduto);
  const resultado = await db.query(
    'DELETE FROM reviews WHERE user_id = ? AND product_id = ?',
    [idUsuario, idProduto]
  );
  if (Number(resultado.affectedRows) === 0) {
    throw notFound('Avaliacao nao encontrada.');
  }
  await recalcularAgregados(idProduto);
}

/* ------------------------- PERGUNTAS ------------------------- */

async function criarPergunta(idUsuario, idProduto, pergunta) {
  await produtoAtivo(idProduto);
  const resultado = await db.query(
    'INSERT INTO questions (user_id, product_id, question) VALUES (?, ?, ?)',
    [idUsuario, idProduto, pergunta]
  );
  return { id: Number(resultado.insertId) };
}

async function listarPerguntas(idProduto, { pagina = 1, limite = 10 } = {}) {
  limite = Math.min(Math.max(Number(limite) || 10, 1), 50);
  pagina = Math.max(Number(pagina) || 1, 1);
  const offset = (pagina - 1) * limite;

  await produtoAtivo(idProduto);

  const contagem = await db.queryOne('SELECT COUNT(*) AS total FROM questions WHERE product_id = ?', [idProduto]);
  const linhas = await db.query(
    `SELECT q.id, q.question, q.created_at, u.name AS autor,
            qa.id AS resposta_id, qa.answer AS resposta, qa.created_at AS resposta_em
     FROM questions q
     INNER JOIN users u ON u.id = q.user_id
     LEFT JOIN question_answers qa ON qa.question_id = q.id
     WHERE q.product_id = ?
     ORDER BY q.created_at DESC
     LIMIT ? OFFSET ?`,
    [idProduto, limite, offset]
  );

  const mapaPerguntas = new Map();
  for (const linha of linhas) {
    if (!mapaPerguntas.has(linha.id)) {
      mapaPerguntas.set(linha.id, {
        id: linha.id,
        pergunta: linha.question,
        criadoEm: linha.created_at,
        autor: linha.autor,
        resposta: null
      });
    }
    if (linha.resposta_id) {
      const alvo = mapaPerguntas.get(linha.id);
      alvo.resposta = { texto: linha.resposta, criadoEm: linha.resposta_em };
    }
  }

  return {
    itens: [...mapaPerguntas.values()],
    pagina,
    limite,
    total: Number(contagem.total),
    paginas: Math.ceil(Number(contagem.total) / limite) || 0
  };
}

module.exports = {
  adicionarFavorito,
  removerFavorito,
  listarFavoritos,
  salvarAvaliacao,
  listarAvaliacoes,
  excluirAvaliacao,
  criarPergunta,
  listarPerguntas,
  produtoAtivo
};
