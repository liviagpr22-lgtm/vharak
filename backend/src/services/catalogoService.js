const db = require('../config/db');
const { notFound, badRequest } = require('../utils/errors');

const ORDENADORES = {
  relevancia: 't.is_destaque DESC, t.nome ASC',
  novidades: 't.created_at DESC',
  preco_asc: 't.preco_min ASC, t.nome ASC',
  preco_desc: 't.preco_min DESC, t.nome ASC',
  nome_asc: 't.nome ASC',
  nome_desc: 't.nome DESC',
  avaliacao: 't.media_avaliacoes DESC, t.total_avaliacoes DESC, t.nome ASC'
};

function consultaBase() {
  return `
    SELECT
      p.id,
      p.name AS nome,
      p.description AS descricao,
      p.type AS tipo,
      p.base_price AS preco_base,
      p.is_featured AS is_destaque,
      p.average_rating AS media_avaliacoes,
      p.reviews_count AS total_avaliacoes,
      p.created_at,
      c.name AS categoria,
      c.slug AS categoria_slug,
      (SELECT SUM(v.stock_quantity) FROM product_variants v
        WHERE v.product_id = p.id AND v.is_active = 1) AS estoque_total,
      (SELECT MIN(v.price) FROM product_variants v
        WHERE v.product_id = p.id AND v.is_active = 1) AS preco_min,
      (SELECT MAX(v.price) FROM product_variants v
        WHERE v.product_id = p.id AND v.is_active = 1) AS preco_max,
      (SELECT i.url FROM product_images i
        WHERE i.product_id = p.id
        ORDER BY i.is_primary DESC, i.sort_order ASC, i.id ASC
        LIMIT 1) AS imagem
    FROM products p
    LEFT JOIN categories c ON c.id = p.category_id
    WHERE p.is_active = 1`;
}

function aplicarFiltros(filtros) {
  const clausulas = [];
  const parametros = [];

  if (filtros.busca) {
    clausulas.push('AND (p.name LIKE ? OR p.description LIKE ?)');
    const termo = `%${filtros.busca}%`;
    parametros.push(termo, termo);
  }
  if (filtros.categoria) {
    clausulas.push('AND c.slug = ?');
    parametros.push(filtros.categoria);
  }
  if (filtros.tipo) {
    clausulas.push('AND p.type = ?');
    parametros.push(filtros.tipo === 'fisico' ? 'physical' : 'digital');
  }
  if (filtros.plataforma) {
    clausulas.push(`AND (
      EXISTS (SELECT 1 FROM product_platforms pp
        INNER JOIN platforms pl ON pl.id = pp.platform_id
        WHERE pp.product_id = p.id AND pl.slug = ?)
      OR EXISTS (SELECT 1 FROM product_variants vv
        INNER JOIN platforms pl ON pl.id = vv.platform_id
        WHERE vv.product_id = p.id AND pl.slug = ?))`);
    parametros.push(filtros.plataforma, filtros.plataforma);
  }
  if (filtros.genero) {
    clausulas.push(`AND EXISTS (
      SELECT 1 FROM product_genres pg
      INNER JOIN genres g ON g.id = pg.genre_id
      WHERE pg.product_id = p.id AND g.slug = ?)`);
    parametros.push(filtros.genero);
  }
  if (filtros.destaque) {
    clausulas.push('AND p.is_featured = 1');
  }

  return { clausulas: clausulas.join('\n'), parametros };
}

async function listar(filtros) {
  const limitesValidos = [1, 50];
  const limite = Math.min(Math.max(Number(filtros.limite) || 12, limitesValidos[0]), limitesValidos[1]);
  const pagina = Math.max(Number(filtros.pagina) || 1, 1);
  const offset = (pagina - 1) * limite;

  const ordenar = ORDENADORES[filtros.ordenar] || ORDENADORES.relevancia;
  const { clausulas, parametros } = aplicarFiltros(filtros);

  let sqlFiltragemExtra = '';
  const parametrosExternos = [];

  if (filtros.precoMin !== undefined && filtros.precoMin !== null && filtros.precoMin !== '') {
    sqlFiltragemExtra += ' AND preco_min >= ?';
    parametrosExternos.push(Number(filtros.precoMin));
  }
  if (filtros.precoMax !== undefined && filtros.precoMax !== null && filtros.precoMax !== '') {
    sqlFiltragemExtra += ' AND preco_min <= ?';
    parametrosExternos.push(Number(filtros.precoMax));
  }

  if (filtros.disponiveis === '1' || filtros.disponiveis === 'true') {
    sqlFiltragemExtra += ' AND COALESCE(estoque_total, 0) > 0';
  }

  const contagem = await db.queryOne(
    `SELECT COUNT(*) AS total FROM (${consultaBase()} ${clausulas}) t WHERE 1=1 ${sqlFiltragemExtra}`,
    [...parametros, ...parametrosExternos]
  );

  const produtos = await db.query(
    `SELECT * FROM (${consultaBase()} ${clausulas}) t
     WHERE 1=1 ${sqlFiltragemExtra}
     ORDER BY ${ordenar}
     LIMIT ? OFFSET ?`,
    [...parametros, ...parametrosExternos, limite, offset]
  );

  const itens = produtos.map((linha) => ({
    id: linha.id,
    nome: linha.nome,
    categoria: linha.categoria,
    categoriaSlug: linha.categoria_slug,
    tipo: linha.tipo === 'physical' ? 'fisico' : 'digital',
    precoMin: Number(linha.preco_min ?? 0),
    precoMax: Number(linha.preco_max ?? 0),
    emDestaque: !!linha.is_destaque,
    mediaAvaliacoes: Number(linha.media_avaliacoes ?? 0),
    totalAvaliacoes: Number(linha.total_avaliacoes ?? 0),
    estoqueTotal: Number(linha.estoque_total ?? 0),
    disponivel: Number(linha.estoque_total ?? 0) > 0,
    imagem: linha.imagem
  }));

  return {
    itens,
    pagina,
    limite,
    total: Number(contagem.total),
    paginas: Math.ceil(Number(contagem.total) / limite) || 0
  };
}

async function detalhar(idProduto) {
  const base = await db.queryOne(`${consultaBase()} AND p.id = ?`, [idProduto]);
  if (!base) {
    throw notFound('Produto nao encontrado.');
  }

  const [variantes, imagens, generos, plataformas, codigosDisponiveis] = await Promise.all([
    db.query(
      `SELECT v.id, v.sku, v.price AS preco, v.stock_quantity AS estoque,
              v.is_active AS ativo, pl.name AS plataforma, pl.slug AS plataforma_slug
       FROM product_variants v
       LEFT JOIN platforms pl ON pl.id = v.platform_id
       WHERE v.product_id = ?
       ORDER BY v.is_active DESC, pl.name`,
      [idProduto]
    ),
    db.query(
      `SELECT id, url, is_primary AS principal, sort_order AS ordem
       FROM product_images WHERE product_id = ?
       ORDER BY is_primary DESC, sort_order ASC, id ASC`,
      [idProduto]
    ),
    db.query(
      `SELECT g.name AS nome, g.slug FROM product_genres pg
       INNER JOIN genres g ON g.id = pg.genre_id
       WHERE pg.product_id = ? ORDER BY g.name`,
      [idProduto]
    ),
    db.query(
      `SELECT pl.name AS nome, pl.slug FROM product_platforms pp
       INNER JOIN platforms pl ON pl.id = pp.platform_id
       WHERE pp.product_id = ?
       UNION
       SELECT pl.name AS nome, pl.slug FROM product_variants vv
       INNER JOIN platforms pl ON pl.id = vv.platform_id
       WHERE vv.product_id = ?
       ORDER BY nome`,
      [idProduto, idProduto]
    ),
    db.query(
      `SELECT v.id AS variante_id, COUNT(dc.id) AS disponiveis
       FROM product_variants v
       LEFT JOIN digital_codes dc ON dc.variant_id = v.id AND dc.is_used = 0
       WHERE v.product_id = ?
       GROUP BY v.id`,
      [idProduto]
    )
  ]);

  const mapaCodigos = new Map(codigosDisponiveis.map((row) => [row.variante_id, Number(row.disponiveis)]));

  return {
    id: base.id,
    nome: base.nome,
    descricao: base.descricao,
    categoria: base.categoria,
    categoriaSlug: base.categoria_slug,
    tipo: base.tipo === 'physical' ? 'fisico' : 'digital',
    precoBase: Number(base.preco_base ?? 0),
    emDestaque: !!base.is_destaque,
    mediaAvaliacoes: Number(base.media_avaliacoes ?? 0),
    totalAvaliacoes: Number(base.total_avaliacoes ?? 0),
    imagens,
    generos: generos.map((g) => ({ nome: g.nome, slug: g.slug })),
    plataformas: plataformas.map((pl) => ({ nome: pl.nome, slug: pl.slug })),
    variantes: variantes.map((v) => {
      const estoque = Number(v.estoque ?? 0);
      const codigoDisponivel = mapaCodigos.get(v.id);
      return {
        id: v.id,
        sku: v.sku,
        plataforma: v.plataforma,
        plataformaSlug: v.plataforma_slug,
        preco: Number(v.preco ?? 0),
        estoque,
        ativo: !!v.ativo,
        disponivel: estoque > 0 && (base.tipo === 'physical' || codigoDisponivel > 0)
      };
    })
  };
}

async function estoque(idProduto) {
  const produto = await db.queryOne('SELECT id, type FROM products WHERE id = ? AND is_active = 1', [idProduto]);
  if (!produto) throw notFound('Produto nao encontrado.');

  const variantes = await db.query(
    `SELECT v.id, v.sku, v.stock_quantity AS estoque, pl.name AS plataforma
     FROM product_variants v
     LEFT JOIN platforms pl ON pl.id = v.platform_id
     WHERE v.product_id = ? AND v.is_active = 1`,
    [idProduto]
  );

  return variantes.map((v) => ({
    varianteId: v.id,
    sku: v.sku,
    plataforma: v.plataforma,
    estoque: Number(v.estoque)
  }));
}

async function listarCategorias() {
  const linhas = await db.query('SELECT name, slug, description FROM categories WHERE is_active = 1 ORDER BY name');
  return linhas.map((l) => ({ nome: l.name, slug: l.slug, descricao: l.description }));
}

async function listarPlataformas() {
  const linhas = await db.query('SELECT name, slug, manufacturer FROM platforms WHERE is_active = 1 ORDER BY name');
  return linhas.map((l) => ({ nome: l.name, slug: l.slug, fabricante: l.manufacturer }));
}

async function listarGeneros() {
  const linhas = await db.query('SELECT name, slug FROM genres WHERE is_active = 1 ORDER BY name');
  return linhas.map((l) => ({ nome: l.name, slug: l.slug }));
}

module.exports = { listar, detalhar, estoque, listarCategorias, listarPlataformas, listarGeneros };
