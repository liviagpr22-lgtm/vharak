const db = require('../config/db');
const { notFound, badRequest, conflict, forbidden } = require('../utils/errors');

function arredondar(valor) {
  return Math.round(valor * 100) / 100;
}

/* ------------------------- AUDITORIA ------------------------- */

async function auditar(idUsuario, acao, entidadeTipo, entidadeId, detalhes, enderecoIp) {
  try {
    await db.query(
      'INSERT INTO audit_logs (user_id, action, entity_type, entity_id, details, ip_address) VALUES (?, ?, ?, ?, ?, ?)',
      [idUsuario || null, acao, entidadeTipo, entidadeId || null, detalhes || null, enderecoIp || null]
    );
  } catch (err) {
    console.error('[auditoria] Falha ao gravar log:', err.message);
  }
}

/* ------------------------- PRODUTOS ------------------------- */

const CAMPOS_PRODUTO = 'id, name, description, category_id, type, base_price, is_active, is_featured, external_igdb_id, external_source, average_rating, reviews_count';

async function listarProdutos({ pagina = 1, limite = 20, ativo = null }) {
  limite = Math.min(Math.max(Number(limite) || 20, 1), 100);
  pagina = Math.max(Number(pagina) || 1, 1);
  const offset = (pagina - 1) * limite;

  let onde = '';
  const params = [];
  if (ativo === '1') { onde = ' AND p.is_active = 1'; }
  if (ativo === '0') { onde = ' AND p.is_active = 0'; }

  const contagem = await db.queryOne(`SELECT COUNT(*) AS total FROM products p WHERE 1=1 ${onde}`, params);
  const linhas = await db.query(
    `SELECT p.id, p.name, p.description, p.category_id, p.type, p.base_price, p.is_active, p.is_featured,
            p.external_igdb_id, p.external_source, p.average_rating, p.reviews_count
     FROM products p WHERE 1=1 ${onde}
     ORDER BY p.id DESC LIMIT ? OFFSET ?`,
    [...params, limite, offset]
  );

  return {
    itens: linhas.map((linha) => ({
      id: Number(linha.id),
      nome: linha.name,
      descricao: linha.description,
      categoriaId: linha.category_id != null ? Number(linha.category_id) : null,
      tipo: linha.type,
      precoBase: Number(linha.base_price),
      ativo: !!linha.is_active,
      destaque: !!linha.is_featured,
      igdbId: linha.external_igdb_id,
      source: linha.external_source,
      mediaAvaliacoes: Number(linha.average_rating ?? 0),
      totalAvaliacoes: Number(linha.reviews_count ?? 0)
    })),
    pagina,
    limite,
    total: Number(contagem.total),
    paginas: Math.ceil(Number(contagem.total) / limite) || 0
  };
}

async function criarProduto(dados) {
  const resultado = await db.query(
    `INSERT INTO products (name, description, category_id, type, base_price, is_active, is_featured)
     VALUES (?, ?, ?, ?, ?, 1, ?)`,
    [dados.nome, dados.descricao, dados.categoriaId || null, dados.tipo, arredondar(dados.precoBase), dados.destaque ? 1 : 0]
  );

  const idProduto = Number(resultado.insertId);

  if (dados.plataformas?.length > 0) {
    for (const idPlataforma of dados.plataformas) {
      await db.query('INSERT IGNORE INTO product_platforms (product_id, platform_id) VALUES (?, ?)', [idProduto, idPlataforma]);
    }
  }
  if (dados.generos?.length > 0) {
    for (const idGenero of dados.generos) {
      await db.query('INSERT IGNORE INTO product_genres (product_id, genre_id) VALUES (?, ?)', [idProduto, idGenero]);
    }
  }
  if (dados.imagens?.length > 0) {
    let ordem = 0;
    for (const url of dados.imagens) {
      await db.query(
        'INSERT INTO product_images (product_id, url, is_primary, sort_order) VALUES (?, ?, ?, ?)',
        [idProduto, url, ordem === 0 ? 1 : 0, ordem]
      );
      ordem += 1;
    }
  }

  await auditar(null, 'produto_criado', 'product', idProduto, JSON.stringify({ nome: dados.nome }));
  return detalharProduto(idProduto);
}

async function detalharProduto(idProduto) {
  const linha = await db.queryOne(`SELECT ${CAMPOS_PRODUTO} FROM products WHERE id = ?`, [idProduto]);
  if (!linha) {
    throw notFound('Produto nao encontrado.');
  }
  const [plataformas, generos, imagens, variantes] = await Promise.all([
    db.query('SELECT platform_id FROM product_platforms WHERE product_id = ?', [idProduto]),
    db.query('SELECT genre_id FROM product_genres WHERE product_id = ?', [idProduto]),
    db.query('SELECT id, url, is_primary, sort_order FROM product_images WHERE product_id = ? ORDER BY sort_order', [idProduto]),
    db.query('SELECT id, sku, price, stock_quantity, is_active, platform_id FROM product_variants WHERE product_id = ?', [idProduto])
  ]);

  return {
    id: Number(linha.id),
    nome: linha.name,
    descricao: linha.description,
    categoriaId: linha.category_id != null ? Number(linha.category_id) : null,
    tipo: linha.type,
    precoBase: Number(linha.base_price),
    ativo: !!linha.is_active,
    destaque: !!linha.is_featured,
    igdbId: linha.external_igdb_id,
    source: linha.external_source,
    mediaAvaliacoes: Number(linha.average_rating ?? 0),
    totalAvaliacoes: Number(linha.reviews_count ?? 0),
    plataformas: plataformas.map((p) => Number(p.platform_id)),
    generos: generos.map((g) => Number(g.genre_id)),
    imagens: imagens.map((i) => ({ id: Number(i.id), url: i.url, principal: !!i.is_primary, ordem: Number(i.sort_order) })),
    variantes: variantes.map((v) => ({
      id: Number(v.id),
      sku: v.sku,
      preco: Number(v.price),
      estoque: Number(v.stock_quantity),
      ativo: !!v.is_active,
      plataformaId: v.platform_id != null ? Number(v.platform_id) : null
    }))
  };
}

async function atualizarProduto(idProduto, dados) {
  const campos = [];
  const valores = [];

  const mapa = {
    nome: 'name',
    descricao: 'description',
    categoriaId: 'category_id',
    tipo: 'type',
    precoBase: 'base_price',
    destaque: 'is_featured'
  };
  for (const [chave, coluna] of Object.entries(mapa)) {
    if (dados[chave] !== undefined) {
      campos.push(`${coluna} = ?`);
      valores.push(chave === 'destaque' ? (dados[chave] ? 1 : 0) : dados[chave]);
    }
  }
  if (dados.ativo !== undefined) {
    campos.push('is_active = ?');
    valores.push(dados.ativo ? 1 : 0);
  }

  if (campos.length > 0) {
    valores.push(idProduto);
    await db.query(`UPDATE products SET ${campos.join(', ')} WHERE id = ?`, valores);
  }

  if (dados.plataformas !== undefined) {
    await db.query('DELETE FROM product_platforms WHERE product_id = ?', [idProduto]);
    for (const idPlataforma of dados.plataformas) {
      await db.query('INSERT IGNORE INTO product_platforms (product_id, platform_id) VALUES (?, ?)', [idProduto, idPlataforma]);
    }
  }
  if (dados.generos !== undefined) {
    await db.query('DELETE FROM product_genres WHERE product_id = ?', [idProduto]);
    for (const idGenero of dados.generos) {
      await db.query('INSERT IGNORE INTO product_genres (product_id, genre_id) VALUES (?, ?)', [idProduto, idGenero]);
    }
  }

  await auditar(null, 'produto_atualizado', 'product', idProduto, JSON.stringify(Object.keys(dados)));
  return detalharProduto(idProduto);
}

/* ------------------------- VARIANTES ------------------------- */

async function criarVariante(idProduto, { sku, preco, estoque, plataformaId }) {
  const produto = await db.queryOne('SELECT id FROM products WHERE id = ?', [idProduto]);
  if (!produto) {
    throw notFound('Produto nao encontrado.');
  }
  const resultado = await db.query(
    'INSERT INTO product_variants (product_id, platform_id, sku, price, stock_quantity, is_active) VALUES (?, ?, ?, ?, ?, 1)',
    [idProduto, plataformaId || null, sku || null, arredondar(preco), estoque]
  );

  const idVariante = Number(resultado.insertId);
  await db.query('UPDATE products SET base_price = ? WHERE id = ? AND base_price = 0', [arredondar(preco), idProduto]);
  return detalhadoVariante(idVariante);
}

async function detalhadoVariante(idVariante) {
  const linha = await db.queryOne(
    `SELECT v.id, v.product_id, v.sku, v.price, v.stock_quantity, v.is_active, v.platform_id,
            SUM(CASE WHEN dc.is_used = 0 THEN 1 ELSE 0 END) AS codigos
     FROM product_variants v
     LEFT JOIN digital_codes dc ON dc.variant_id = v.id AND dc.is_used = 0
     WHERE v.id = ?
     GROUP BY v.id`,
    [idVariante]
  );
  if (!linha) {
    throw notFound('Variante nao encontrada.');
  }
  return {
    id: Number(linha.id),
    produtoId: Number(linha.product_id),
    sku: linha.sku,
    preco: Number(linha.price),
    estoque: Number(linha.stock_quantity),
    ativo: !!linha.is_active,
    plataformaId: linha.platform_id != null ? Number(linha.platform_id) : null,
    codigosDigitaisLivres: Number(linha.codigos)
  };
}

async function atualizarVariante(idVariante, { preco, estoque, ativo, sku }) {
  const campos = [];
  const valores = [];
  if (preco !== undefined) { campos.push('price = ?'); valores.push(arredondar(preco)); }
  if (estoque !== undefined) { campos.push('stock_quantity = ?'); valores.push(estoque); }
  if (ativo !== undefined) { campos.push('is_active = ?'); valores.push(ativo ? 1 : 0); }
  if (sku !== undefined) { campos.push('sku = ?'); valores.push(sku); }

  if (campos.length > 0) {
    valores.push(idVariante);
    await db.query(`UPDATE product_variants SET ${campos.join(', ')} WHERE id = ?`, valores);
  }
  return detalhadoVariante(idVariante);
}

/* ------------------------- PEDIDOS (ADMIN) ------------------------- */

async function listarPedidos({ pagina = 1, limite = 20, status, payment_status } = {}) {
  limite = Math.min(Math.max(Number(limite) || 20, 1), 100);
  pagina = Math.max(Number(pagina) || 1, 1);
  const offset = (pagina - 1) * limite;

  let onde = '';
  const params = [];
  if (status) { onde += ' AND o.status = ?'; params.push(status); }
  if (payment_status) { onde += ' AND o.payment_status = ?'; params.push(payment_status); }

  const contagem = await db.queryOne(`SELECT COUNT(*) AS total FROM orders o WHERE 1=1 ${onde}`, params);
  const ordens = await db.query(
    `SELECT o.id, o.user_id, o.address_id, o.status, o.subtotal, o.total, o.payment_method, o.payment_status, o.created_at,
            u.name AS cliente, u.email
     FROM orders o
     INNER JOIN users u ON u.id = o.user_id
     WHERE 1=1 ${onde}
     ORDER BY o.id DESC
     LIMIT ? OFFSET ?`,
    [...params, limite, offset]
  );

  return {
    itens: ordens.map((o) => ({
      id: Number(o.id),
      clienteId: Number(o.user_id),
      cliente: o.cliente,
      email: o.email,
      status: o.status,
      subtotal: Number(o.subtotal),
      total: Number(o.total),
      metodoPagamento: o.payment_method,
      statusPagamento: o.payment_status,
      criadoEm: o.created_at
    })),
    pagina,
    limite,
    total: Number(contagem.total),
    paginas: Math.ceil(Number(contagem.total) / limite) || 0
  };
}

const STATUS_ORDEM = ['pending_payment', 'paid', 'preparing', 'shipped', 'completed', 'cancelled'];

async function atualizarStatusPedido(idOrdem, status) {
  if (!STATUS_ORDEM.includes(status)) {
    throw badRequest(`Status invalido. Use: ${STATUS_ORDEM.join(', ')}.`);
  }
  const ordem = await db.queryOne('SELECT id, payment_status FROM orders WHERE id = ?', [idOrdem]);
  if (!ordem) {
    throw notFound('Pedido nao encontrado.');
  }
  if (status !== 'pending_payment' && ordem.payment_status === 'pending') {
    throw conflict('Pedido sem pagamento confirmado. Cancele ou confirme o pagamento antes.');
  }

  await db.query('UPDATE orders SET status = ? WHERE id = ?', [status, idOrdem]);
  await auditar(null, 'pedido_status_alterado', 'order', idOrdem, status);
  return detalharPedidoAdmin(idOrdem);
}

async function detalharPedidoAdmin(idOrdem) {
  const ordem = await db.queryOne(
    `SELECT o.*, u.name AS cliente, u.email AS cliente_email,
            a.street AS end_rua, a.number AS end_numero, a.complement AS end_compl,
            a.neighborhood AS end_bairro, a.city AS end_cidade, a.state AS end_uf, a.zip_code AS end_cep
     FROM orders o
     INNER JOIN users u ON u.id = o.user_id
     LEFT JOIN addresses a ON a.id = o.address_id
     WHERE o.id = ?`,
    [idOrdem]
  );
  if (!ordem) {
    throw notFound('Pedido nao encontrado.');
  }
  const itens = await db.query('SELECT * FROM order_items WHERE order_id = ?', [idOrdem]);

  return {
    id: Number(ordem.id),
    cliente: { id: Number(ordem.user_id), nome: ordem.cliente, email: ordem.cliente_email },
    status: ordem.status,
    statusPagamento: ordem.payment_status,
    total: Number(ordem.total),
    frete: Number(ordem.shipping_cost),
    endereco: ordem.address_id
      ? { rua: ordem.end_rua, numero: ordem.end_numero, complemento: ordem.end_compl, bairro: ordem.end_bairro, cidade: ordem.end_cidade, uf: ordem.end_uf, cep: ordem.end_cep }
      : null,
    itens: itens.map((i) => ({
      produto: i.product_name_snapshot,
      plataforma: i.platform_name_snapshot,
      preco: Number(i.price_snapshot),
      quantidade: Number(i.quantity),
      subtotal: Number(i.subtotal_snapshot)
    })),
    criadoEm: ordem.created_at
  };
}

/* ------------------------- CLIENTES (ADMIN) ------------------------- */

async function listarClientes({ pagina = 1, limite = 20, busca } = {}) {
  limite = Math.min(Math.max(Number(limite) || 20, 1), 100);
  pagina = Math.max(Number(pagina) || 1, 1);
  const offset = (pagina - 1) * limite;

  let onde = '';
  const params = [];
  if (busca) {
    onde = ' AND (u.name LIKE ? OR u.email LIKE ?)';
    params.push(`%${busca}%`, `%${busca}%`);
  }

  const contagem = await db.queryOne(`SELECT COUNT(*) AS total FROM users u WHERE 1=1 ${onde}`, params);
  const linhas = await db.query(
    `SELECT u.id, u.name, u.email, u.role, u.is_active, u.created_at,
            COUNT(DISTINCT o.id) AS pedidos
     FROM users u
     LEFT JOIN orders o ON o.user_id = u.id
     WHERE 1=1 ${onde}
     GROUP BY u.id
     ORDER BY u.id ASC
     LIMIT ? OFFSET ?`,
    [...params, limite, offset]
  );

  return {
    itens: linhas.map((linha) => ({
      id: Number(linha.id),
      nome: linha.name,
      email: linha.email,
      role: linha.role,
      ativo: !!linha.is_active,
      pedidos: Number(linha.pedidos),
      criadoEm: linha.created_at
    })),
    pagina,
    limite,
    total: Number(contagem.total),
    paginas: Math.ceil(Number(contagem.total) / limite) || 0
  };
}

async function atualizarContaCliente(idCliente, { ativo, role }) {
  const campos = [];
  const valores = [];
  if (ativo !== undefined) { campos.push('is_active = ?'); valores.push(ativo ? 1 : 0); }
  if (role !== undefined) {
    if (!['customer', 'admin'].includes(role)) {
      throw badRequest('Role invalida.');
    }
    campos.push('role = ?');
    valores.push(role);
  }
  const alvo = await db.queryOne('SELECT id FROM users WHERE id = ?', [idCliente]);
  if (!alvo) {
    throw notFound('Cliente nao encontrado.');
  }
  if (campos.length > 0) {
    valores.push(idCliente);
    await db.query(`UPDATE users SET ${campos.join(', ')} WHERE id = ?`, valores);
  }
  const linha = await db.queryOne('SELECT id, name, email, role, is_active FROM users WHERE id = ?', [idCliente]);
  return { id: Number(linha.id), nome: linha.name, email: linha.email, role: linha.role, ativo: !!linha.is_active };
}

/* ------------------------- CODIGOS DIGITAIS ------------------------- */

async function listarCodigos(idVariante) {
  const linhas = await db.query(
    'SELECT id, code, is_used, used_by_order_id, used_at, created_at FROM digital_codes WHERE variant_id = ? ORDER BY id',
    [idVariante]
  );
  return linhas.map((linha) => ({
    id: Number(linha.id),
    codigo: linha.code,
    usado: !!linha.is_used,
    pedidoId: linha.used_by_order_id != null ? Number(linha.used_by_order_id) : null,
    usadoEm: linha.used_at,
    criadoEm: linha.created_at
  }));
}

async function adicionarCodigos(idVariante, codigos) {
  const variante = await db.queryOne('SELECT id FROM product_variants WHERE id = ?', [idVariante]);
  if (!variante) {
    throw notFound('Variante nao encontrada.');
  }
  let inseridos = 0;
  for (const codigo of codigos) {
    try {
      await db.query('INSERT INTO digital_codes (variant_id, code) VALUES (?, ?)', [idVariante, codigo]);
      inseridos += 1;
    } catch (err) {
      if (err.code === 'ER_DUP_ENTRY') {
        await auditar(null, 'codigo_duplicado', 'digital_code', idVariante, codigo);
      } else {
        throw err;
      }
    }
  }
  if (inseridos > 0) {
    await db.query('UPDATE product_variants SET stock_quantity = stock_quantity + ? WHERE id = ?', [inseridos, idVariante]);
  }
  return { adicionados: inseridos };
}

/* ------------------------- DEVOLUCOES ------------------------- */

async function criarDevolucao(idUsuario, { pedidoId, itemPedidoId, motivo }) {
  const ordem = await db.queryOne(
    `SELECT id, user_id, payment_status, status FROM orders WHERE id = ? AND user_id = ?`,
    [pedidoId, idUsuario]
  );
  if (!ordem) {
    throw notFound('Pedido nao encontrado.');
  }
  if (ordem.payment_status !== 'paid' || ordem.status === 'cancelled') {
    throw conflict('So pedidos pagos podem ter devolucao solicitada.');
  }

  if (itemPedidoId != null) {
    const item = await db.queryOne('SELECT id FROM order_items WHERE id = ? AND order_id = ?', [itemPedidoId, pedidoId]);
    if (!item) {
      throw notFound('Item de pedido nao encontrado nestes pedido.');
    }
  }

  const resultado = await db.query(
    'INSERT INTO returns (order_id, user_id, order_item_id, reason, status) VALUES (?, ?, ?, ?, \'pending\')',
    [pedidoId, idUsuario, itemPedidoId || null, motivo]
  );
  return { id: Number(resultado.insertId), status: 'pending' };
}

async function minhasDevolucoes(idUsuario) {
  const linhas = await db.query(
    `SELECT r.id, r.order_id, r.order_item_id, r.reason, r.status, r.admin_decision, r.decided_at, r.created_at
     FROM returns r WHERE r.user_id = ? ORDER BY r.created_at DESC`,
    [idUsuario]
  );
  return linhas.map((linha) => ({
    id: Number(linha.id),
    pedidoId: Number(linha.order_id),
    itemPedidoId: linha.order_item_id != null ? Number(linha.order_item_id) : null,
    motivo: linha.reason,
    status: linha.status,
    decisaoAdmin: linha.admin_decision,
    decididoEm: linha.decided_at,
    criadoEm: linha.created_at
  }));
}

async function listarDevolucoes({ status } = {}) {
  let onde = '';
  const params = [];
  if (status) { onde = ' WHERE r.status = ?'; params.push(status); }

  const linhas = await db.query(
    `SELECT r.id, r.order_id, r.user_id, r.order_item_id, r.reason, r.status, r.admin_decision, r.decided_at, r.created_at,
            u.name AS cliente, o.total AS pedido_total
     FROM returns r
     INNER JOIN users u ON u.id = r.user_id
     INNER JOIN orders o ON o.id = r.order_id
     ${onde}
     ORDER BY r.created_at DESC`,
    params
  );
  return linhas.map((linha) => ({
    id: Number(linha.id),
    pedidoId: Number(linha.order_id),
    cliente: linha.cliente,
    clienteId: Number(linha.user_id),
    itemPedidoId: linha.order_item_id != null ? Number(linha.order_item_id) : null,
    motivo: linha.reason,
    status: linha.status,
    decisaoAdmin: linha.admin_decision,
    decididoEm: linha.decided_at,
    pedidoTotal: Number(linha.pedido_total),
    criadoEm: linha.created_at
  }));
}

async function decidirDevolucao(idDevolucao, { status, decisao, idAdmin }) {
  if (!['approved', 'rejected'].includes(status)) {
    throw badRequest('Decisao deve ser approved ou rejected.');
  }
  const devolucao = await db.queryOne('SELECT id, order_id, status FROM returns WHERE id = ?', [idDevolucao]);
  if (!devolucao) {
    throw notFound('Devolucao nao encontrada.');
  }
  if (devolucao.status !== 'pending') {
    throw conflict('Esta devolucao ja foi decidida.');
  }

  await db.query(
    'UPDATE returns SET status = ?, admin_decision = ?, decided_by = ?, decided_at = NOW() WHERE id = ?',
    [status, decisao || null, idAdmin, idDevolucao]
  );
  await auditar(idAdmin, 'devolucao_decidida', 'return', idDevolucao, status);

  // Devolvido aprovado: devolve o pagamento e reposiciona estoque/codigos
  if (status === 'approved') {
    await db.withTransaction(async (connection) => {
      await connection.execute(
        `UPDATE payments pm JOIN orders o ON o.id = pm.order_id
         SET pm.status = 'refunded' WHERE o.id = ?`,
        [devolucao.order_id]
      );

      const [linhasItens] = await connection.execute(
        `SELECT oi.variant_id, oi.quantity, p.type FROM order_items oi
         INNER JOIN product_variants v ON v.id = oi.variant_id
         INNER JOIN products p ON p.id = v.product_id
         WHERE oi.order_id = ?`,
        [devolucao.order_id]
      );

      for (const item of linhasItens) {
        if (item.type === 'digital') {
          await connection.execute(
            'UPDATE digital_codes SET is_used = 0, used_by_order_id = NULL, used_at = NULL WHERE used_by_order_id = ?',
            [devolucao.order_id]
          );
        } else {
          await connection.execute(
            'UPDATE product_variants SET stock_quantity = stock_quantity + ? WHERE id = ?',
            [item.quantity, item.variant_id]
          );
        }
      }

      await connection.execute(
        `UPDATE orders SET status = 'cancelled', payment_status = 'refunded' WHERE id = ?`,
        [devolucao.order_id]
      );
    });
  }

  return { id: Number(idDevolucao), status, decisao: decisao || null };
}

module.exports = {
  auditar,
  listarProdutos,
  criarProduto,
  detalharProduto,
  atualizarProduto,
  criarVariante,
  atualizarVariante,
  listarPedidos,
  atualizarStatusPedido,
  detalharPedidoAdmin,
  listarClientes,
  atualizarContaCliente,
  listarCodigos,
  adicionarCodigos,
  criarDevolucao,
  minhasDevolucoes,
  listarDevolucoes,
  decidirDevolucao
};
