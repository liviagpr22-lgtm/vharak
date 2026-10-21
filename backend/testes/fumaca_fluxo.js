const { spawn } = require('child_process');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const PORTA = 3015;
const BASE = `http://127.0.0.1:${PORTA}`;
process.env.PORT = String(PORTA);

function esperar(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function esperarServidor(tentativas = 20) {
  for (let i = 0; i < tentativas; i += 1) {
    try {
      const resp = await fetch(`${BASE}/api/health`);
      if (resp.ok) return true;
    } catch (err) {
      await esperar(500);
    }
  }
  return false;
}

async function api(caminho, { metodo = 'GET', corpo, token } = {}) {
  const resp = await fetch(`${BASE}${caminho}`, {
    method: metodo,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {})
    },
    body: corpo ? JSON.stringify(corpo) : undefined
  });
  let dados = null;
  try {
    dados = await resp.json();
  } catch (err) {
    dados = null;
  }
  return { status: resp.status, corpo: dados };
}

function resultado(nome, ok, detalhe) {
  console.log(`${ok ? 'PASSOU' : 'FALHOU'} | ${nome} | ${detalhe}`);
  if (!ok) process.exitCode = 1;
}

async function main() {
  const conexao = await mysql.createConnection({
    host: process.env.DB_HOST,
    port: Number(process.env.DB_PORT || 3306),
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
  });

  let idUsuario = null;
  let idOrdem = null;

  const servidor = spawn(process.execPath, ['server.js'], {
    cwd: path.join(__dirname, '..'),
    env: process.env,
    stdio: 'ignore'
  });

  try {
    if (!await esperarServidor()) {
      console.log('FALHOU | servidor nao subiu');
      return;
    }
    console.log('PASSOU | servidor respondeu /api/health');

    /* estoque seguro para o teste, guardando o valor original */
    const [linhaStock0] = await conexao.execute('SELECT stock_quantity FROM product_variants WHERE id = ?', [1]);
    const estoqueOriginal = Number(linhaStock0[0].stock_quantity);
    await conexao.execute('UPDATE product_variants SET stock_quantity = 7 WHERE id = ?', [1]);

    const sufixo = Date.now() % 100000;
    const email = `shoper${sufixo}@vharak.local`;

    let r = await api('/api/auth/cadastro', {
      metodo: 'POST',
      corpo: { nome: 'Shopper Fluxo', email, senha: 'senhaSegura123' }
    });
    const token = r.corpo?.token;
    idUsuario = r.corpo?.usuario?.id;
    resultado('cadastro shopper', r.status === 201, `id=${idUsuario}`);

    // Endereco para produto fisico
    r = await api('/api/clientes/enderecos', {
      metodo: 'POST', token,
      corpo: { rua: 'Av do Fluxo', numero: '100', bairro: 'Centro', cidade: 'Sao Paulo', uf: 'SP', cep: '01001-000' }
    });
    const idEndereco = r.corpo?.id;
    resultado('endereco criado', r.status === 201, `id=${idEndereco}`);

    /* ---------- CARRINHO ---------- */

    r = await api('/api/carrinho', { token });
    resultado('carrinho vazio', r.status === 200 && r.corpo.quantidadeItens === 0, `itens=${r.corpo?.quantidadeItens}`);

    r = await api('/api/carrinho/itens', { metodo: 'POST', token, corpo: { varianteId: 1, quantidade: 2 } });
    resultado('adicionar item (subtotal no servidor)', r.status === 201 && r.corpo.subtotal === 399.8, `subtotal=${r.corpo?.subtotal}`);

    r = await api('/api/carrinho/itens', { metodo: 'POST', token, corpo: { varianteId: 1, quantidade: 9 } });
    resultado('ultrapassa estoque -> 400', r.status === 400, `status=${r.status} msg=${r.corpo?.mensagem}`);

    r = await api('/api/carrinho/itens', { metodo: 'POST', token, corpo: { varianteId: 99999 } });
    resultado('variante inexistente -> 404', r.status === 404, `status=${r.status}`);

    const idItemCarrinho = r = await api('/api/carrinho', { token });
    const primeiroItem = idItemCarrinho.corpo.itens[0]?.id;

    r = await api(`/api/carrinho/itens/${primeiroItem}`, { metodo: 'PATCH', token, corpo: { quantidade: 3 } });
    resultado('alterar quantidade', r.status === 200 && r.corpo.itens[0].quantidade === 3, `qtd=${r.corpo?.itens?.[0]?.quantidade}`);

    r = await api('/api/carrinho/itens', { metodo: 'POST', token, corpo: { varianteId: 1, quantidade: 2 } });
    resultado('adicao acumulativa', r.status === 201 && r.corpo.itens[0].quantidade === 5, `qtd=${r.corpo?.itens?.[0]?.quantidade}`);

    /* ---------- CHECKOUT ---------- */

    let precoOrigem = null;
    const [linhasPreco] = await conexao.execute('SELECT price, stock_quantity FROM product_variants WHERE id = ?', [1]);
    precoOrigem = Number(linhasPreco[0].price);
    const stockInicial = 7;

    // manipula preco no servidor? nao ha como: cliente nao envia precos.
    r = await api('/api/pedidos', { metodo: 'POST', token, corpo: {} });
    resultado('checkout sem endereco (fisico) -> 400', r.status === 400, `status=${r.status}`);

    r = await api('/api/pedidos', { metodo: 'POST', token, corpo: { enderecoId: idEndereco } });
    resultado('checkout com endereco -> 201', r.status === 201 && r.corpo?.pedidoId >= 1, `pedido=${r.corpo?.pedidoId} subtotal=${r.corpo?.subtotal}`);
    idOrdem = r.corpo?.pedidoId;
    const totalServidor = r.corpo?.total;

    // o total tem que vir do preco do banco, nao do navegador (nao enviamos preco algum)
    resultado('total confere preco do banco', totalServidor === Math.round(precoOrigem * 5 * 100) / 100, `total=${totalServidor} esperado=${precoOrigem * 5}`);

    r = await api('/api/carrinho', { token });
    resultado('carrinho esvazia apos checkout', r.status === 200 && r.corpo.quantidadeItens === 0, `itens=${r.corpo?.quantidadeItens}`);

    const [linhasStock] = await conexao.execute('SELECT stock_quantity FROM product_variants WHERE id = ?', [1]);
    resultado('estoque intacto pre-pagamento', Number(linhasStock[0].stock_quantity) === stockInicial, `antes=${stockInicial} agora=${linhasStock[0].stock_quantity}`);

    /* ---------- PAGAMENTO CARTAO SIMULADO ---------- */

    r = await api('/api/pagamentos', {
      metodo: 'POST', token,
      corpo: { pedidoId: idOrdem, metodo: 'credit_card', cartao: { numero: '4111111111111112', cvv: '123', validade: '12/2030', titular: 'T' } }
    });
    resultado('cartao com numero invalido -> 400', r.status === 400, `status=${r.status}`);

    r = await api('/api/pagamentos', {
      metodo: 'POST', token,
      corpo: { pedidoId: idOrdem, metodo: 'credit_card', cartao: { numero: '4111111111111111', cvv: '123', validade: '12/2030', titular: 'Shopper Fluxo' } }
    });
    resultado('pagamento cartao aprovado na hora', r.status === 201 && r.corpo?.status === 'paid', `status=${r.corpo?.status}`);
    const idPagamento = r.corpo?.pagamentoId;

    /* ---------- POS-PAGAMENTO ---------- */

    r = await api(`/api/pagamentos/${idPagamento}`, { token });
    resultado('consulta pagamento', r.status === 200 && r.corpo.status === 'paid' && r.corpo.pedidoId === idOrdem, `status=${r.corpo?.status}`);

    r = await api(`/api/pedidos/${idOrdem}`, { token });
    resultado('pedido pago no detalhe', r.status === 200 && r.corpo.statusPagamento === 'paid' && r.corpo.status === 'paid', `pedidoStatus=${r.corpo?.status}`);

    const [linhasStock2] = await conexao.execute('SELECT stock_quantity FROM product_variants WHERE id = ?', [1]);
    resultado('estoque debitado pos-pagamento', Number(linhasStock2[0].stock_quantity) === stockInicial - 5, `antes=${stockInicial} agora=${linhasStock2[0].stock_quantity}`);

    r = await api('/api/pagamentos', {
      metodo: 'POST', token,
      corpo: { pedidoId: idOrdem, metodo: 'credit_card', cartao: { numero: '4111111111111111', cvv: '123', validade: '12/2030', titular: 'X' } }
    });
    resultado('pagar pedido ja pago -> 409', r.status === 409, `status=${r.status}`);

    /* ---------- PIX SIMULADO ( segundo pedido pequeno ) ---------- */

    r = await api('/api/carrinho/itens', { metodo: 'POST', token, corpo: { varianteId: 1, quantidade: 1 } });
    r = await api('/api/pedidos', { metodo: 'POST', token, corpo: { enderecoId: idEndereco } });
    const idOrdem2 = r.corpo?.pedidoId;
    r = await api('/api/pagamentos', { metodo: 'POST', token, corpo: { pedidoId: idOrdem2, metodo: 'pix' } });
    resultado('pix simulado pendente', r.status === 201 && r.corpo?.status === 'pending' && r.corpo?.codigoSimulado, `idPgto=${r.corpo?.pagamentoId}`);
    const idPagamentoPix = r.corpo?.pagamentoId;

    await esperar(4500);

    r = await api(`/api/pagamentos/${idPagamentoPix}`, { token });
    resultado('pix confirma automaticamente (server-side)', r.status === 200 && r.corpo.status === 'paid', `status=${r.corpo?.status}`);

    /* ---------- CODIGOS DIGITAis (produto fisico: 409 liberado) ---------- */

    r = await api(`/api/pedidos/${idOrdem2}/codigos`, { token });
    resultado('codigos: pedido fisico sem codigo', r.status === 200 && Array.isArray(r.corpo) && r.corpo.length === 0, `total=${r.corpo?.length}`);

    /* ---------- LIMPEZA ---------- */

    for (const idOrdemDe of [idOrdem, idOrdem2]) {
      if (idOrdemDe) {
        await conexao.execute('DELETE FROM orders WHERE id = ?', [idOrdemDe]);
      }
    }
    await conexao.execute('UPDATE product_variants SET stock_quantity = ? WHERE id = ?', [estoqueOriginal, 1]);
  } finally {
    servidor.kill();
    await esperar(300);
    if (idUsuario) {
      try {
        await conexao.execute('DELETE FROM users WHERE id = ?', [idUsuario]);
      } catch (err) {
        console.error('[limpeza] usuario nao removido:', err.message);
      }
    }
    try {
      await conexao.end();
    } catch (err) {
      /* conexao ja fechada */
    }
  }
}

main()
  .then(() => console.log('Fim do teste de fumaca fluxo.'))
  .catch((err) => {
    console.error('Falha inesperada no teste:', err);
    process.exit(1);
  });

