const { spawn } = require('child_process');
const path = require('path');

const PORTA = 3011;
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
    if (!await esperarServidor()) {
      console.log('FALHOU | servidor nao subiu');
      return;
    }
    console.log('PASSOU | servidor respondeu /api/health');

    let r = await get('/api/igdb/estado');
    resultado('estado igdb', r.status === 200 && typeof r.corpo.configurada === 'boolean', `configurada=${r.corpo?.configurada}`);

    r = await get('/api/igdb/jogos?busca=zelda');
    resultado(
      'busca sem credenciais -> 503 amigavel (e segredo nunca sai)',
      r.status === 503 && r.corpo?.erro === 'igdb_nao_configurada',
      `status=${r.status} erro=${r.corpo?.erro}`
    );

    r = await get('/api/igdb/jogos/1070');
    resultado(
      'detalhe sem credenciais -> 503 amigavel',
      r.status === 503 && r.corpo?.erro === 'igdb_nao_configurada',
      `status=${r.status} erro=${r.corpo?.erro}`
    );
  } finally {
    servidor.kill();
    await esperar(300);
  }
}

main()
  .then(() => console.log('Fim do teste de fumaca IGDB.'))
  .catch((err) => {
    console.error('Falha inesperada no teste:', err);
    process.exit(1);
  });
