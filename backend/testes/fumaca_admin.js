const { spawn } = require('child_process');
const path = require('path');
const mysql = require('mysql2/promise');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const PORTA = 3017;
const BASE = `http://127.0.0.1:${PORTA}`;
process.env.PORT = String(PORTA);

function esperar(ms) {
  return new Promise((r) => setTimeout(r, ms));
}

async function esperarServidor() {
  for (let i = 0; i < 20; i += 1) {
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

  const sufixo = Date.now() % 100000;
  const idAdmin = null;

  const [linhaAdmin] = await conexao.execute(
    "INSERT INTO users (name, email, password_hash, role) VALUES ('Staff VHARAK', ?, ?, 'admin')",
    [`staffi${sufixo}@vharak.local`, bcrypt.hashSync('adminSenha9', 10)]
  );
  const ADMIN_ID = Number(linhaAdmin.insertId);

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

    /* estoque seguro para o teste; valor original restaurado no fim */
    const [linhaStock0] = await conexao.execute('SELECT stock_quantity FROM product_variants WHERE id = ?', [1]);
    const estoqueOriginal = Number(linhaStock0[0].stock_quantity);
    await conexao.execute('UPDATE product_variants SET stock_quantity = 100 WHERE id = ?', [1]);

    let r = await api('/api/auth/cadastro', { metodo: 'POST', corpo: { nome: 'Cliente Teste I', email: `clienteI${sufixo}@vharak.local`, senha: 'senhaSegura123' } });
    const tokenCliente = r.corpo?.token;
    const idCliente = r.corpo?.usuario?.id;
    resultado('cadastro cliente', r.status === 201, `id=${idCliente}`);

    r = await api('/api/auth/login', { metodo: 'POST', corpo: { email: `staffi${sufixo}@vharak.local`, senha: 'adminSenha9' } });
    const tokenAdmin = r.corpo?.token;
    resultado('login admin', r.status === 200 && r.corpo?.usuario?.role === 'admin', `status=${r.status}`);

    r = await api('/api/admin/produtos', { token: tokenCliente });
    resultado('admin produtos com cliente -> 403', r.status === 403, `status=${r.status}`);

    r = await api('/api/admin/produtos', { token: 'falso' });
    resultado('admin produtos sem credencial -> 401', r.status === 401, `status=${r.status}`);

    r = await api('/api/admin/produtos', {
      metodo: 'POST', token: tokenAdmin,
      corpo: {
        nome: 'Produto Admin Teste', descricao: 'Para validacao admin', tipo: 'physical',
        precoBase: 149.9, categoriaId: 3, plataformas: [{ id: 1 }], generos: [{ id: 1 }],
        imagens: ['https://exemplo.vharak.local/1.png']
      }
    });
    resultado('admin criar produto', r.status === 201 && Boolean(r.corpo?.id), `id=${r.corpo?.id}`);
    const idProdutoNovo = r.corpo?.id;

    r = await api(`/api/admin/produtos/${idProdutoNovo}/variantes`, {
      metodo: 'POST', token: tokenAdmin,
      corpo: { sku: `ADM-${sufixo}`, preco: 149.9, estoque: 7, plataformaId: 1 }
    });
    resultado('admin criar variante', r.status === 201, `id=${r.corpo?.id}`);
    const idVarianteNova = r.corpo?.id;

    r = await api(`/api/admin/variantes/${idVarianteNova}`, {
      metodo: 'PATCH', token: tokenAdmin,
      corpo: { estoque: 4, preco: 139.9 }
    });
    resultado('admin atualizar variante', r.status === 200 && r.corpo?.estoque === 4 && r.corpo?.preco === 139.9, `preco=${r.corpo?.preco}`);

    r = await api(`/api/admin/produtos/${idProdutoNovo}`, { metodo: 'PATCH', token: tokenAdmin, corpo: { destaque: true } });
    resultado('admin destaque', r.status === 200 && r.corpo?.destaque === true, `destaque=${r.corpo?.destaque}`);

    r = await api(`/api/admin/produtos/${idProdutoNovo}`, { metodo: 'DELETE', token: tokenAdmin });
    resultado('admin desativar produto', r.status === 200 && r.corpo?.ativo === false, `ativo=${r.corpo?.ativo}`);

    r = await api(`/api/catalogo/produtos/${idProdutoNovo}`);
    resultado('produto desativado fora do catalogo', r.status === 404, `status=${r.status}`);

    r = await api('/api/admin/pedidos', { token: tokenCliente });
    resultado('admin pedidos com cliente -> 403', r.status === 403, `status=${r.status}`);

    /* fluxo pedido e devolucao */
    r = await api('/api/clientes/enderecos', { metodo: 'POST', token: tokenCliente, corpo: { rua: 'Av Dev', numero: '9', bairro: 'B', cidade: 'C', uf: 'SP', cep: '01001000' } });
    const idEndereco = r.corpo?.id;
    r = await api('/api/carrinho/itens', { metodo: 'POST', token: tokenCliente, corpo: { varianteId: 1, quantidade: 1 } });
    r = await api('/api/pedidos', { metodo: 'POST', token: tokenCliente, corpo: { enderecoId: idEndereco } });
    const idOrdem = r.corpo?.pedidoId;
    r = await api('/api/pagamentos', { metodo: 'POST', token: tokenCliente, corpo: { pedidoId: idOrdem, metodo: 'credit_card', cartao: { numero: '5555555555554444', cvv: '123', validade: '12/2030', titular: 'Dev' } } });
    resultado('pagamento pedido devolucao', r.status === 201 && r.corpo?.status === 'paid', `pg=${r.corpo?.pagamentoId}`);

    r = await api('/api/devolucoes', { metodo: 'POST', token: tokenCliente, corpo: { pedidoId: idOrdem, motivo: 'Chegou com a caixa amassada.' } });
    resultado('solicitar devolucao', r.status === 201 && r.corpo?.status === 'pending', `id=${r.corpo?.id}`);
    const idDevolucao = r.corpo?.id;

    r = await api('/api/admin/devolucoes', { token: tokenAdmin });
    resultado('admin listar devolucoes', r.status === 200 && Array.isArray(r.corpo) && r.corpo.length >= 1, `total=${r.corpo?.length}`);

    r = await api(`/api/admin/devolucoes/${idDevolucao}/decisao`, { metodo: 'PATCH', token: tokenAdmin, corpo: { status: 'approved', decisao: 'Aprovada.' } });
    resultado('admin aprovar devolucao', r.status === 200 && r.corpo?.status === 'approved', `status=${r.corpo?.status}`);

    const [linhasOrdem] = await conexao.execute('SELECT status, payment_status FROM orders WHERE id = ?', [idOrdem]);
    resultado('pedido ficou cancelado+refunded', linhasOrdem[0].status === 'cancelled' && linhasOrdem[0].payment_status === 'refunded', `status=${linhasOrdem[0].status}/${linhasOrdem[0].payment_status}`);

    /* suporte */
    r = await api('/api/suporte', { metodo: 'POST', token: tokenCliente, corpo: { assunto: 'Problema com pagamento', categoria: 'payment', mensagem: 'Meu pagamento caiu duas vezes no cartao.' } });
    const idTicket = r.corpo?.id;
    resultado('abrir ticket', r.status === 201 && r.corpo?.status === 'open', `id=${idTicket}`);

    r = await api(`/api/suporte/${idTicket}`, { token: tokenCliente });
    resultado('consultar proprio ticket', r.status === 200 && r.corpo?.mensagens?.length === 1, `msgs=${r.corpo?.mensagens?.length}`);

    r = await api('/api/admin/suporte/tickets', { token: tokenAdmin });
    resultado('admin listar tickets', r.status === 200 && r.corpo?.total >= 1, `total=${r.corpo?.total}`);

    r = await api(`/api/admin/suporte/tickets/${idTicket}/respostas`, { metodo: 'POST', token: tokenAdmin, corpo: { mensagem: 'Vamos analisar e reembolsar o valor.' } });
    resultado('admin responder', r.status === 201 && r.corpo?.status === 'in_progress', `status=${r.corpo?.status}`);

    r = await api(`/api/admin/suporte/tickets/${idTicket}/status`, { metodo: 'PATCH', token: tokenAdmin, corpo: { status: 'resolved' } });
    resultado('admin encerrar ticket', r.status === 200 && r.corpo?.status === 'resolved', `status=${r.corpo?.status}`);

    r = await api(`/api/suporte/${idTicket}`, { token: tokenCliente });
    resultado('cliente ve resposta do admin', r.status === 200 && r.corpo?.mensagens?.some((m) => m.tipoRemetente === 'admin'), `msgs=${r.corpo?.mensagens?.length}`);

    r = await api('/api/admin/auditoria', { token: tokenAdmin });
    resultado('auditoria', r.status === 200 && r.corpo?.length >= 1, `regs=${r.corpo?.length}`);

    r = await api('/api/admin/auditoria', { token: tokenCliente });
    resultado('auditoria com cliente -> 403', r.status === 403, `status=${r.status}`);

    /* limpeza */
    await conexao.execute('DELETE FROM orders WHERE id = ?', [idOrdem]);
    await conexao.execute('DELETE FROM products WHERE id = ?', [idProdutoNovo]);
    await conexao.execute('DELETE FROM support_tickets WHERE id = ?', [idTicket]);
    await conexao.execute('DELETE FROM users WHERE id = ?', [idCliente]);
    await conexao.execute('DELETE FROM users WHERE id = ?', [ADMIN_ID]);
    await conexao.execute('UPDATE product_variants SET stock_quantity = ? WHERE id = ?', [estoqueOriginal, 1]);
  } finally {
    servidor.kill();
    await esperar(300);
    await conexao.end();
  }
}

main()
  .then(() => console.log('Fim do teste de fumaca admin.'))
  .catch((err) => {
    console.error('Falha inesperada no teste:', err);
    process.exit(1);
  });
