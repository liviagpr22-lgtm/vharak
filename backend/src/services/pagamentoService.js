const db = require('../config/db');
const { notFound, badRequest, conflict, forbidden } = require('../utils/errors');

function arredondar(valor) {
  return Math.round(valor * 100) / 100;
}

/*
 * Pagamentos 100% SIMULADOS: nenhuma cobranca real, nenhum dado de cartao
 * armazenado. A confirmacao só acontece dentro do servidor (transacao),
 * nunca por uma requisicao de cliente.
 */

const ATRASOS_MS = { pix: 3000, boleto: 6000 };

async function validarOrdemParaPagamento(idUsuario, idOrdem) {
  const ordem = await db.queryOne(
    `SELECT id, user_id, status, total, payment_method, payment_status
     FROM orders WHERE id = ? AND user_id = ?`,
    [idOrdem, idUsuario]
  );
  if (!ordem) {
    throw notFound('Pedido nao encontrado.');
  }
  if (ordem.payment_status === 'paid') {
    throw conflict('Este pedido ja esta pago.');
  }
  if (ordem.status === 'cancelled') {
    throw badRequest('Nao e possivel pagar um pedido cancelado.');
  }
  return ordem;
}

async function registrarPagamento(idOrdem, metodo) {
  const existente = await db.queryOne(
    `SELECT id, status, method FROM payments WHERE order_id = ? AND status = 'pending'`,
    [idOrdem]
  );
  if (existente) {
    if (existente.method !== metodo) {
      throw conflict('Ja existe um pagamento pendente com outro metodo.');
    }
    return existente;
  }

  const resultado = await db.query(
    `INSERT INTO payments (order_id, method, amount, status)
     VALUES (?, ?, (SELECT total FROM orders WHERE id = ?), 'pending')`,
    [idOrdem, metodo, idOrdem]
  );
  return { id: Number(resultado.insertId), status: 'pending', method: metodo };
}

async function marcarMetodo(ordemId, metodo) {
  await db.query('UPDATE orders SET payment_method = ? WHERE id = ?', [metodo, ordemId]);
}

function luhnValido(numero) {
  const digitos = String(numero).replace(/\D/g, '');
  if (digitos.length < 13 || digitos.length > 19) {
    return false;
  }
  let soma = 0;
  let alternado = false;
  for (let i = digitos.length - 1; i >= 0; i -= 1) {
    let valor = Number(digitos[i]);
    if (alternado) {
      valor *= 2;
      if (valor > 9) valor -= 9;
    }
    soma += valor;
    alternado = !alternado;
  }
  return soma % 10 === 0;
}

async function criarPix(idUsuario, idOrdem) {
  await validarOrdemParaPagamento(idUsuario, idOrdem);
  const pagamento = await registrarPagamento(idOrdem, 'pix');
  await marcarMetodo(idOrdem, 'pix');

  const chave = `VHARAK-PIX-SIMULADO-${pagamento.id}-${Date.now().toString(36).toUpperCase()}`;
  return {
    pagamentoId: Number(pagamento.id),
    metodo: 'pix',
    status: 'pending',
    pronto: false,
    mensagem: 'Pix simulado. A confirmacao ocorre automaticamente alguns segundos depois (simulacao do retorno do banco).',
    codigoSimulado: chave
  };
}

async function criarBoleto(idUsuario, idOrdem) {
  await validarOrdemParaPagamento(idUsuario, idOrdem);
  const pagamento = await registrarPagamento(idOrdem, 'boleto');
  await marcarMetodo(idOrdem, 'boleto');

  const vencimento = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
  const linha = `0339${String(pagamento.id).padStart(7, '0')}${Date.now() % 100000000 / 100000000}`.slice(0, 47);
  return {
    pagamentoId: Number(pagamento.id),
    metodo: 'boleto',
    status: 'pending',
    linhaDigitavelSimulada: `03399 ${String(pagamento.id).padStart(6, '0')} ${Date.now().toString().slice(-11)} 0001`,
    vencimento,
    mensagem: 'Boleto simulado. A confirmacao ocorre automaticamente depois de alguns segundos (simulacao da baixa bancaria).'
  };
}

async function pagarCartao(idUsuario, idOrdem, dadosCartao) {
  await validarOrdemParaPagamento(idUsuario, idOrdem);

  if (!luhnValido(dadosCartao.numero)) {
    throw badRequest('Numero de cartao invalido.');
  }
  if (!/^\d{3,4}$/.test(String(dadosCartao.cvv || ''))) {
    throw badRequest('CVV invalido.');
  }
  const validade = String(dadosCartao.validade || '');
  const partido = validade.match(/^(\d{2})\/(\d{4})$/);
  const mes = partido ? Number(partido[1]) : 0;
  const ano = partido ? Number(partido[2]) : 0;
  const agora = new Date();
  const expirou = ano < agora.getFullYear() || (ano === agora.getFullYear() && mes < agora.getMonth() + 1);
  if (!partido || mes < 1 || mes > 12 || expirou) {
    throw badRequest('Validade do cartao invalida (usar MM/AAAA).');
  }
  if (!String(dadosCartao.titular || '').trim()) {
    throw badRequest('Informe o nome do titular.');
  }

  // Os dados do cartao sao validados e descartados. Nada e armazenado.
  const pagamento = await registrarPagamento(idOrdem, 'credit_card');
  await marcarMetodo(idOrdem, 'credit_card');
  return confirmarPagamentoSimulado(pagamento.id);
}

/*
 * Confirmacao SERVER-SIDE em transacao: marca pagamento e pedido como pagos,
 * decrementa estoque e libera codigos digitais. Idempotente.
 */
async function confirmarPagamentoSimulado(idPagamento) {
  return db.withTransaction(async (connection) => {
    const [linhasPagamento] = await connection.execute(
      'SELECT id, order_id, method, amount, status FROM payments WHERE id = ? FOR UPDATE',
      [idPagamento]
    );
    const pagamento = linhasPagamento[0];
    if (!pagamento) {
      throw notFound('Pagamento nao encontrado.');
    }
    if (pagamento.status === 'paid') {
      const [ordemJaPaga] = await connection.execute(
        'SELECT id, status, payment_status FROM orders WHERE id = ?',
        [pagamento.order_id]
      );
      return { pagamentoId: pagamento.id, status: 'paid', pedidoStatus: ordemJaPaga[0].status };
    }
    if (pagamento.status !== 'pending') {
      throw conflict('Este pagamento nao esta mais pendente.');
    }
    const [linhasOrdem] = await connection.execute(
      'SELECT id, user_id, total, status FROM orders WHERE id = ? FOR UPDATE',
      [pagamento.order_id]
    );
    const ordem = linhasOrdem[0];
    if (!ordem || ordem.status === 'cancelled') {
      await connection.execute("UPDATE payments SET status = 'failed' WHERE id = ?", [idPagamento]);
      throw conflict('Pedido invalido ou cancelado.');
    }
    if (Number(pagamento.amount) !== Number(ordem.total)) {
      await connection.execute("UPDATE payments SET status = 'failed' WHERE id = ?", [idPagamento]);
      throw conflict('Valor do pagamento nao corresponde ao pedido.');
    }

    const [linhasItens] = await connection.execute(
      `SELECT oi.variant_id, oi.quantity, v.stock_quantity AS estoque, p.type
       FROM order_items oi
       INNER JOIN product_variants v ON v.id = oi.variant_id
       INNER JOIN products p ON p.id = v.product_id
       WHERE oi.order_id = ? FOR UPDATE`,
      [pagamento.order_id]
    );

    for (const item of linhasItens) {
      if (Number(item.quantity) > Number(item.estoque)) {
        await connection.execute("UPDATE payments SET status = 'failed' WHERE id = ?", [idPagamento]);
        await connection.execute("UPDATE orders SET status = 'cancelled' WHERE id = ?", [pagamento.order_id]);
        throw conflict('Estoque esgotado. Pedido cancelado.');
      }
    }

    await connection.execute(
      `UPDATE payments SET status = 'paid', paid_at = NOW(), transaction_id = ? WHERE id = ?`,
      [`SIM-${Date.now().toString(36).toUpperCase()}-${pagamento.id}`, idPagamento]
    );
    const tipos = new Set(linhasItens.map((item) => item.type));
    const soDigital = tipos.size === 1 && tipos.has('digital');
    await connection.execute(
      `UPDATE orders SET status = ?, payment_status = 'paid', payment_confirmed_at = NOW() WHERE id = ?`,
      [soDigital ? 'completed' : 'paid', pagamento.order_id]
    );

    for (const item of linhasItens) {
      await connection.execute(
        'UPDATE product_variants SET stock_quantity = stock_quantity - ? WHERE id = ?',
        [item.quantity, item.variant_id]
      );
      if (item.type === 'digital') {
        const [codigosLivre] = await connection.execute(
          'SELECT id FROM digital_codes WHERE variant_id = ? AND is_used = 0 ORDER BY id LIMIT ?',
          [item.variant_id, Number(item.quantity)]
        );
        if (codigosLivre.length < Number(item.quantity)) {
          await connection.execute("UPDATE payments SET status = 'failed' WHERE id = ?", [idPagamento]);
          await connection.execute(
            "UPDATE orders SET status = 'pending_payment', payment_status = 'pending', payment_confirmed_at = NULL WHERE id = ?",
            [pagamento.order_id]
          );
          await connection.execute(
            'UPDATE product_variants SET stock_quantity = stock_quantity + ? WHERE id = ?',
            [item.quantity, item.variant_id]
          );
          throw conflict('Codigos digitais indisponiveis. Compra nao efetivada.');
        }
        for (const codigo of codigosLivre) {
          await connection.execute(
            'UPDATE digital_codes SET is_used = 1, used_by_order_id = ?, used_at = NOW() WHERE id = ?',
            [pagamento.order_id, codigo.id]
          );
        }
      }
    }

    return { pagamentoId: Number(pagamento.id), status: 'paid', pedidoId: Number(pagamento.order_id) };
  });
}

async function agendarConfirmacao(idPagamento, metodo) {
  const atraso = ATRASOS_MS[metodo] || 5000;
  setTimeout(async () => {
    try {
      await confirmarPagamentoSimulado(idPagamento);
    } catch (err) {
      console.error(`[pagamento] Falha ao confirmar simulado ${idPagamento}: ${err.message}`);
    }
  }, atraso);
}

async function consultar(idUsuario, idPagamento) {
  const pagamento = await db.queryOne(
    `SELECT pm.id, pm.order_id, pm.method, pm.amount, pm.status, pm.paid_at,
            o.user_id, o.status AS pedido_status
     FROM payments pm
     INNER JOIN orders o ON o.id = pm.order_id
     WHERE pm.id = ?`,
    [idPagamento]
  );
  if (!pagamento) {
    throw notFound('Pagamento nao encontrado.');
  }
  if (Number(pagamento.user_id) !== Number(idUsuario)) {
    throw forbidden('Este pagamento pertence a outra conta.');
  }

  return {
    pagamentoId: Number(pagamento.id),
    pedidoId: Number(pagamento.order_id),
    metodo: pagamento.method,
    valor: Number(pagamento.amount),
    status: pagamento.status,
    pagoEm: pagamento.paid_at,
    statusPedido: pagamento.pedido_status
  };
}

module.exports = { criarPix, criarBoleto, pagarCartao, agendarConfirmacao, consultar, confirmarPagamentoSimulado };

