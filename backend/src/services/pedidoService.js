const db = require('../config/db');
const { notFound, badRequest, forbidden, conflict } = require('../utils/errors');

const STATUS_CONFIRMADOS = "('paid','preparing','shipped','completed')";

async function validarEndereco(idUsuario, idEndereco) {
  const endereco = await db.queryOne(
    `SELECT id FROM addresses WHERE id = ? AND user_id = ?`,
    [idEndereco, idUsuario]
  );
  if (!endereco) {
    throw notFound('Endereco nao encontrado ou nao pertence a esta conta.');
  }
  return endereco;
}

async function listar(idUsuario, { pagina = 1, limite = 10 } = {}) {
  limite = Math.min(Math.max(Number(limite) || 10, 1), 50);
  pagina = Math.max(Number(pagina) || 1, 1);
  const offset = (pagina - 1) * limite;

  const contagem = await db.queryOne('SELECT COUNT(*) AS total FROM orders WHERE user_id = ?', [idUsuario]);
  const ordens = await db.query(
    `SELECT id, status, subtotal, shipping_cost, total, payment_method, payment_status, created_at
     FROM orders WHERE user_id = ?
     ORDER BY created_at DESC, id DESC
     LIMIT ? OFFSET ?`,
    [idUsuario, limite, offset]
  );

  const itensPorOrdem = await db.query(
    `SELECT oi.order_id, oi.variant_id, oi.product_name_snapshot, oi.platform_name_snapshot,
            oi.price_snapshot, oi.quantity, oi.subtotal_snapshot,
            v.product_id
     FROM order_items oi
     LEFT JOIN product_variants v ON v.id = oi.variant_id
     WHERE oi.order_id IN (${ordens.length > 0 ? ordens.map(() => '?').join(',') : 'NULL'})`,
    ordens.map((o) => o.id)
  );

  const mapa = new Map();
  for (const item of itensPorOrdem) {
    if (!mapa.has(item.order_id)) {
      mapa.set(item.order_id, []);
    }
    mapa.get(item.order_id).push({
      produtoId: item.product_id != null ? Number(item.product_id) : null,
      produto: item.product_name_snapshot,
      plataforma: item.platform_name_snapshot,
      precoUnitario: Number(item.price_snapshot),
      quantidade: Number(item.quantity),
      subtotal: Number(item.subtotal_snapshot)
    });
  }

  return {
    itens: ordens.map((o) => ({
      id: Number(o.id),
      status: o.status,
      subtotal: Number(o.subtotal),
      frete: Number(o.shipping_cost),
      total: Number(o.total),
      metodoPagamento: o.payment_method,
      statusPagamento: o.payment_status,
      criadoEm: o.created_at,
      itens: mapa.get(o.id) || []
    })),
    pagina,
    limite,
    total: Number(contagem.total),
    paginas: Math.ceil(Number(contagem.total) / limite) || 0
  };
}

async function detalhar(idUsuario, idOrdem) {
  const ordem = await db.queryOne(
    `SELECT id, user_id, address_id, status, subtotal, shipping_cost, total,
            payment_method, payment_status, payment_confirmed_at, notes, created_at
     FROM orders WHERE id = ? AND user_id = ?`,
    [idOrdem, idUsuario]
  );
  if (!ordem) {
    throw notFound('Pedido nao encontrado.');
  }

  const itens = await db.query(
    `SELECT oi.variant_id, oi.product_name_snapshot, oi.platform_name_snapshot, oi.price_snapshot,
            oi.quantity, oi.subtotal_snapshot, v.product_id
     FROM order_items oi
     LEFT JOIN product_variants v ON v.id = oi.variant_id
     WHERE oi.order_id = ?`,
    [idOrdem]
  );

  return {
    id: Number(ordem.id),
    status: ordem.status,
    enderecoId: ordem.address_id != null ? Number(ordem.address_id) : null,
    subtotal: Number(ordem.subtotal),
    frete: Number(ordem.shipping_cost),
    total: Number(ordem.total),
    metodoPagamento: ordem.payment_method,
    statusPagamento: ordem.payment_status,
    confirmadoEm: ordem.payment_confirmed_at,
    observacoes: ordem.notes,
    criadoEm: ordem.created_at,
    itens: itens.map((item) => ({
      produtoId: item.product_id != null ? Number(item.product_id) : null,
      produto: item.product_name_snapshot,
      plataforma: item.platform_name_snapshot,
      precoUnitario: Number(item.price_snapshot),
      quantidade: Number(item.quantity),
      subtotal: Number(item.subtotal_snapshot)
    })),
    codigosDisponiveis: ordem.payment_status === 'paid'
  };
}

/* Checkout: precos e total sao SEMPRE recalculados no servidor.
 * A transacao garante consistencia entre carrinho, pedido e itens. */
async function finalizar(idUsuario, { enderecoId }) {
  return db.withTransaction(async (connection) => {
    const carrinho = await connection.execute(
      'SELECT id FROM carts WHERE user_id = ? FOR UPDATE',
      [idUsuario]
    );
    const carrinhoId = carrinho[0][0]?.id;
    if (!carrinhoId) {
      throw badRequest('Nao ha carrinho para finalizar.');
    }

    const [linhasItens] = await connection.execute(
      `SELECT ci.id, ci.variant_id, ci.quantity,
              v.price, v.sku, v.is_active, v.stock_quantity AS estoque,
              p.type, p.is_active AS produto_ativo,
              pl.name AS plataforma
       FROM cart_items ci
       INNER JOIN product_variants v ON v.id = ci.variant_id
       INNER JOIN products p ON p.id = v.product_id
       LEFT JOIN platforms pl ON pl.id = v.platform_id
       WHERE ci.cart_id = ?
       FOR UPDATE`,
      [carrinhoId]
    );

    if (linhasItens.length === 0) {
      throw badRequest('O carrinho está vazio.');
    }

    for (const item of linhasItens) {
      if (!item.is_active || !item.produto_ativo) {
        throw conflict(`Produto indisponivel: ${item.sku || item.variant_id}.`);
      }
      if (Number(item.quantity) < 1) {
        throw badRequest(`Quantidade invalida para ${item.sku || item.variant_id}.`);
      }
      if (Number(item.quantity) > Number(item.estoque)) {
        throw conflict(`Estoque insuficiente para ${item.sku || item.variant_id}: disponivel ${item.estoque}.`);
      }
    }

    const tipos = new Set(linhasItens.map((item) => item.type));
    const temFisico = tipos.has('physical');
    let addressId = null;

    if (temFisico) {
      if (!enderecoId) {
        throw badRequest('Endereco de entrega obrigatorio para produtos fisicos.');
      }
      const [linhaEndereco] = await connection.execute(
        'SELECT id FROM addresses WHERE id = ? AND user_id = ?',
        [enderecoId, idUsuario]
      );
      if (linhaEndereco[0].length === 0) {
        throw notFound('Endereco nao encontrado ou nao pertence a esta conta.');
      }
      addressId = enderecoId;
    }

    const subtotal = linhasItens.reduce(
      (soma, item) => soma + Number(item.price) * Number(item.quantity),
      0
    );
    const arredondar = (valor) => Math.round(valor * 100) / 100;

    const [resultadoOrdem] = await connection.execute(
      `INSERT INTO orders (user_id, address_id, status, subtotal, shipping_cost, total)
       VALUES (?, ?, 'pending_payment', ?, 0, ?)`,
      [idUsuario, addressId, arredondar(subtotal), arredondar(subtotal)]
    );
    const ordemId = resultadoOrdem.insertId;

    for (const item of linhasItens) {
      await connection.execute(
        `INSERT INTO order_items (order_id, variant_id, product_name_snapshot, platform_name_snapshot, price_snapshot, quantity, subtotal_snapshot)
         SELECT ?, v.id, p.name, pl.name, v.price, ?, v.price * ?
         FROM product_variants v
         LEFT JOIN platforms pl ON pl.id = v.platform_id
         INNER JOIN products p ON p.id = v.product_id
         WHERE v.id = ?`,
        [ordemId, item.quantity, item.quantity, item.variant_id]
      );
    }

    await connection.execute('DELETE FROM cart_items WHERE cart_id = ?', [carrinhoId]);

    return {
      pedidoId: Number(ordemId),
      subtotal: arredondar(subtotal),
      total: arredondar(subtotal),
      requiresAddress: temFisico,
      tipos: [...tipos],
      quantidadeItens: linhasItens.length
    };
  });
}

module.exports = { listar, detalhar, finalizar, validarEndereco, codigosDoPedido };

async function codigosDoPedido(idOrdem) {
  const linhas = await db.query(
    `SELECT dc.code, v.id AS variante_id, p.name AS produto
     FROM digital_codes dc
     INNER JOIN product_variants v ON v.id = dc.variant_id
     INNER JOIN products p ON p.id = v.product_id
     WHERE dc.used_by_order_id = ?
     ORDER BY dc.id`,
    [idOrdem]
  );
  return linhas.map((linha) => ({
    produto: linha.produto,
    varianteId: Number(linha.variante_id),
    codigo: linha.code
  }));
}
