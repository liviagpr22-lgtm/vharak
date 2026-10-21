const { spawn } = require('child_process');
const path = require('path');
const mysql = require('mysql2/promise');
require('dotenv').config({ path: path.join(__dirname, '..', '.env') });

const PORTA = 3014;
const BASE = `http://127.0.0.1:${PORTA}`;
process.env.PORT = String(PORTA);

const PRODUTO_BASE = 1;
const VARIANTE_BASE = 1;

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

  const criados = { usuarios: [], ordens: [] };

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

    const sufixo = Date.now() % 100000;
    const emailComprador = `comprador${sufixo}@vharak.local`;
    const emailVisitante = `visitante${sufixo}@vharak.local`;

    let r = await api('/api/auth/cadastro', {
      metodo: 'POST',
      corpo: { nome: 'Comprador Vitrine', email: emailComprador, senha: 'senhaSegura123' }
    });
    const tokenComprador = r.corpo?.token;
    const idComprador = r.corpo?.usuario?.id;
    criados.usuarios.push(idComprador);
    resultado('cadastro comprador', r.status === 201, `id=${idComprador}`);

    r = await api('/api/auth/cadastro', {
      metodo: 'POST',
      corpo: { nome: 'Visitante Sem Compra', email: emailVisitante, senha: 'senhaSegura123' }
    });
    const tokenVisitante = r.corpo?.token;
    const idVisitante = r.corpo?.usuario?.id;
    criados.usuarios.push(idVisitante);
    resultado('cadastro visitante', r.status === 201, `id=${idVisitante}`);

    // Compra paga do comprador no produto base
    const [ordem] = await conexao.execute(
      `INSERT INTO orders (user_id, status, subtotal, shipping_cost, total, payment_method, payment_status, payment_confirmed_at)
       VALUES (?, 'completed', 199.90, 0, 199.90, 'pix', 'paid', NOW())`,
      [idComprador]
    );
    criados.ordens.push(ordem.insertId);

    const [ordemItem] = await conexao.execute(
      `INSERT INTO order_items (order_id, variant_id, product_name_snapshot, price_snapshot, quantity, subtotal_snapshot)
       VALUES (?, ?, 'Jogo Base Teste', 199.90, 1, 199.90)`,
      [ordem.insertId, VARIANTE_BASE]
    );

    /* ---------------- AVALIACOES ---------------- */

    r = await api(`/api/avaliacoes/${PRODUTO_BASE}`, {
      metodo: 'PUT',
      token: tokenVisitante,
      corpo: { nota: 5, comentario: 'Sem compra' }
    });
    resultado('avaliacao sem compra -> 403', r.status === 403, `status=${r.status}`);

    r = await api(`/api/avaliacoes/${PRODUTO_BASE}`, {
      metodo: 'PUT',
      token: tokenComprador,
      corpo: { nota: 7 }
    });
    resultado('nota invalida -> 400', r.status === 400, `status=${r.status}`);

    r = await api(`/api/avaliacoes/${PRODUTO_BASE}`, {
      metodo: 'PUT',
      token: tokenComprador,
      corpo: { nota: 5, comentario: 'Excelente jogo, chegou rapido.' }
    });
    resultado('avaliacao com compra paga -> 201', r.status === 201 && r.corpo?.nota === 5, `status=${r.status}`);

    r = await api(`/api/avaliacoes/${PRODUTO_BASE}`, {
      metodo: 'PUT',
      token: tokenComprador,
      corpo: { nota: 4, comentario: 'Atualizei para 4.' }
    });
    resultado('atualizar propria avaliacao', r.status === 201 && r.corpo?.nota === 4, `status=${r.status}`);

    r = await api(`/api/catalogo/produtos/${PRODUTO_BASE}`);
    const rAvals = await api(`/api/avaliacoes/${PRODUTO_BASE}`);
    resultado(
      'media/total recalculados consistentes',
      r.status === 200 && Number(r.corpo.totalAvaliacoes) === Number(rAvals.corpo.total),
      `totalProduto=${r.corpo?.totalAvaliacoes} totalLista=${rAvals.corpo?.total}`
    );

    r = rAvals;
    resultado('listar avaliacoes (publico)', r.status === 200 && r.corpo.total >= 1 && r.corpo.itens[0].autor, `total=${r.corpo?.total} autor=${r.corpo?.itens?.[0]?.autor}`);

    r = await api('/api/avaliacoes/minhas/vinculadas', { token: tokenComprador });
    resultado('minhas avaliacoes', r.status === 200 && r.corpo.length === 1 && Number(r.corpo[0].produtoId) === PRODUTO_BASE, `total=${r.corpo?.length}`);

    /* ---------------- FAVORITOS ---------------- */

    r = await api(`/api/favoritos/${PRODUTO_BASE}`, { metodo: 'POST', token: tokenComprador });
    resultado('favoritar', r.status === 201, `status=${r.status}`);

    r = await api(`/api/favoritos/${PRODUTO_BASE}`, { metodo: 'POST', token: tokenComprador });
    resultado('favoritar duplicado -> 409', r.status === 409, `status=${r.status}`);

    r = await api('/api/favoritos', { token: tokenComprador });
    resultado('listar favoritos', r.status === 200 && r.corpo.length === 1 && Number(r.corpo[0].id) === PRODUTO_BASE, `total=${r.corpo?.length}`);

    r = await api(`/api/favoritos/${PRODUTO_BASE}`, { metodo: 'DELETE', token: tokenComprador });
    resultado('desfavoritar', r.status === 200, `status=${r.status}`);

    r = await api('/api/favoritos', { token: tokenComprador });
    resultado('favoritos vazios', r.status === 200 && r.corpo.length === 0, `total=${r.corpo?.length}`);

    /* ---------------- PERGUNTAS ---------------- */

    r = await api(`/api/perguntas/${PRODUTO_BASE}`, { metodo: 'POST', token: tokenComprador, corpo: { pergunta: 'Este jogo roda no PS4 Pro?' } });
    resultado('criar pergunta', r.status === 201 && r.corpo?.id >= 1, `status=${r.status} id=${r.corpo?.id}`);

    r = await api(`/api/perguntas/${PRODUTO_BASE}`, { metodo: 'POST', token: tokenComprador, corpo: { pergunta: 'curta' } });
    resultado('pergunta curta -> 400', r.status === 400, `status=${r.status}`);

    r = await api(`/api/perguntas/${PRODUTO_BASE}`);
    const minhaPergunta = r.corpo?.itens?.find((p) => p.pergunta === 'Este jogo roda no PS4 Pro?');
    resultado('listar perguntas (publico, sem resposta)', r.status === 200 && r.corpo.total >= 1 && Boolean(minhaPergunta) && minhaPergunta.resposta === null, `total=${r.corpo?.total} minha=${Boolean(minhaPergunta)}`);

    /* ---------------- LIMPEZA ---------------- */

    for (const idOrdem of criados.ordens) {
      await conexao.execute('DELETE FROM orders WHERE id = ?', [idOrdem]);
    }
    for (const idUsuario of criados.usuarios) {
      await conexao.execute('DELETE FROM users WHERE id = ?', [idUsuario]);
    }
    await conexao.execute('UPDATE products SET average_rating = 0, reviews_count = 0 WHERE id = ?', [PRODUTO_BASE]);
  } finally {
    servidor.kill();
    await esperar(300);
    await conexao.end();
  }
}

main()
  .then(() => console.log('Fim do teste de fumaca vitrine.'))
  .catch((err) => {
    console.error('Falha inesperada no teste:', err);
    process.exit(1);
  });
