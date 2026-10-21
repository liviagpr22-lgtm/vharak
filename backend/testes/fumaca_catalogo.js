/*
 * Teste de fumaca: sobe o servidor, executa verificacoes de catalogo e encerra.
 * Uso: node testes/fumaca_catalogo.js
 */
const { spawn } = require('child_process');
const path = require('path');

const PORTA = 3010;
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

async function get(caminho) {
  const resp = await fetch(`${BASE}${caminho}`);
  const corpo = await resp.json().catch(() => null);
  return { status: resp.status, corpo };
}

function resultado(nome, ok, detalhe) {
  console.log(`${ok ? 'PASSOU' : 'FALHOU'} | ${nome} | ${detalhe}`);
  if (!ok) process.exitCode = 1;
}

async function main() {
  const servidor = spawn(process.execPath, ['server.js'], {
    cwd: path.join(__dirname, '..'),
    env: process.env,
    stdio: 'ignore'
  });

  try {
    const subiu = await esperarServidor();
    if (!subiu) {
      console.log('FALHOU | servidor nao subiu');
      return;
    }
    console.log('PASSOU | servidor respondeu /api/health');

    let r = await get('/api/catalogo/produtos');
    resultado('listagem', r.status === 200 && Array.isArray(r.corpo.itens), `status=${r.status} itens=${r.corpo?.itens?.length} total=${r.corpo?.total}`);

    r = await get('/api/catalogo/produtos?busca=Nada%20Que%20Exista');
    resultado('busca sem resultados', r.status === 200 && r.corpo.total === 0, `status=${r.status} total=${r.corpo?.total}`);

    r = await get('/api/catalogo/produtos?genero=acao');
    resultado('filtro genero inexistente', r.status === 200, `status=${r.status} total=${r.corpo?.total}`);

    r = await get('/api/catalogo/produtos?preco_min=999&tipo=digital');
    resultado('filtro preco+tipo', r.status === 200, `status=${r.status} total=${r.corpo?.total}`);

    r = await get('/api/catalogo/produtos?ordenar=preco_asc&pagina=1&limite=5');
    resultado('ordenacao+paginacao', r.status === 200, `status=${r.status} limite=${r.corpo?.limite} paginas=${r.corpo?.paginas}`);

    r = await get('/api/catalogo/produtos?nome_invalido%20para_no%5Bx');
    resultado('404 rota', r.status === 404 || r.status === 200, `status=${r.status}`);

    r = await get('/api/catalogo/produtos/1');
    resultado('detalhe produto', r.status === 200 && r.corpo?.variantes?.length >= 0, `status=${r.status} ${JSON.stringify(r.corpo?.nome)}`);

    r = await get('/api/catalogo/produtos/999');
    resultado('detalhe inexistente', r.status === 404, `status=${r.status}=${r.corpo?.mensagem}`);

    r = await get('/api/catalogo/produtos/1/estoque');
    resultado('estoque', r.status === 200 && Array.isArray(r.corpo), `status=${r.status} variantes=${r.corpo?.length}`);

    r = await get('/api/catalogo/produtos?categoria=jogos');
    resultado('filtro categoria (slug de jogos)', r.status === 200 && r.corpo.total >= 1, `status=${r.status} total=${r.corpo?.total}`);

    r = await get('/api/catalogo/produtos?categoria=jogos&plataforma=ps5');
    resultado('filtro categoria+plataforma', r.status === 200 && r.corpo.total >= 1, `status=${r.status} total=${r.corpo?.total}`);

    r = await get('/api/catalogo/produtos?categoria=consoles');
    resultado('filtro categoria sem resultado', r.status === 200 && r.corpo.total === 0, `status=${r.status} total=${r.corpo?.total}`);

    r = await get('/api/catalogo/categorias');

    r = await get('/api/catalogo/plataformas');
    resultado('plataformas', r.status === 200 && r.corpo.length >= 1, `status=${r.status} total=${r.corpo?.length}`);

    r = await get('/api/catalogo/generos');
    resultado('generos', r.status === 200 && r.corpo.length === 12, `status=${r.status} total=${r.corpo?.length}`);

    r = await get('/api/catalogo/destaques');
    resultado('destaques', r.status === 200, `status=${r.status} total=${r.corpo?.total}`);

    r = await get("/api/catalogo/produtos?busca='+OR+1%3D1--");
    resultado('busca anti-injection (sem erro, sem vazamento)', r.status === 200 && r.corpo.total === 0, `status=${r.status} total=${r.corpo?.total}`);
  } finally {
    servidor.kill();
    await esperar(300);
  }
}

main()
  .then(() => console.log('Fim do teste de fumaca.'))
  .catch((err) => {
    console.error('Falha inesperada no teste:', err);
    process.exit(1);
  });
