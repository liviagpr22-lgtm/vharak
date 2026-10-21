const { spawn } = require('child_process');
const path = require('path');

const PORTA = 3012;
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
  const servidor = spawn(process.execPath, ['server.js'], {
    cwd: path.join(__dirname, '..'),
    env: process.env,
    stdio: 'ignore'
  });

  const sufixo = Date.now() % 100000;
  const email = `teste${sufixo}@vharak.local`;

  try {
    if (!await esperarServidor()) {
      console.log('FALHOU | servidor nao subiu');
      return;
    }
    console.log('PASSOU | servidor respondeu /api/health');

    let r = await api('/api/auth/cadastro', {
      metodo: 'POST',
      corpo: { nome: 'Cliente Teste', email, senha: 'senhaSegura123', nascimento: '1990-05-10' }
    });
    resultado('cadastro', r.status === 201 && r.corpo?.usuario?.id >= 1, `status=${r.status} id=${r.corpo?.usuario?.id}`);

    const token = r.corpo.token;

    r = await api('/api/auth/cadastro', { metodo: 'POST', corpo: { nome: 'Duplicado Teste', email, senha: 'senhaSegura123' } });
    resultado('cadastro duplicado -> 409', r.status === 409, `status=${r.status}`);

    r = await api('/api/auth/cadastro', { metodo: 'POST', corpo: { nome: 'x', email: 'email-invalido', senha: '123' } });
    resultado('validacao cadastro -> 400', r.status === 400, `status=${r.status} erro=${r.corpo?.erro}`);

    r = await api('/api/auth/login', { metodo: 'POST', corpo: { email, senha: 'errada_invalida' } });
    resultado('login senha errada -> 401', r.status === 401, `status=${r.status}`);

    r = await api('/api/auth/login', { metodo: 'POST', corpo: { email, senha: 'senhaSegura123' } });
    resultado('login ok', r.status === 200 && r.corpo?.token, `status=${r.status} role=${r.corpo?.usuario?.role}`);

    r = await api('/api/clientes/perfil');
    resultado('perfil sem token -> 401', r.status === 401, `status=${r.status}`);

    r = await api('/api/clientes/perfil', { token });
    resultado('perfil com token', r.status === 200 && r.corpo?.email === email, `status=${r.status} nome=${r.corpo?.nome}`);

    r = await api('/api/clientes/perfil', { metodo: 'PATCH', token, corpo: { nome: 'Cliente Teste Atualizado' } });
    resultado('atualizar perfil', r.status === 200 && r.corpo?.nome === 'Cliente Teste Atualizado', `status=${r.status}`);

    r = await api('/api/clientes/senha', { metodo: 'PATCH', token, corpo: { senha_atual: 'senha_errada_x', senha_nova: 'novaSenhaSegura123' } });
    resultado('trocar senha errada -> 401', r.status === 401, `status=${r.status}`);

    r = await api('/api/clientes/senha', { metodo: 'PATCH', token, corpo: { senha_atual: 'senhaSegura123', senha_nova: 'novaSenhaSegura123' } });
    resultado('trocar senha ok', r.status === 204, `status=${r.status}`);

    r = await api('/api/auth/login', { metodo: 'POST', corpo: { email, senha: 'novaSenhaSegura123' } });
    resultado('login senha nova', r.status === 200 && Boolean(r.corpo?.token), `status=${r.status}`);

    r = await api('/api/clientes/enderecos', { token });
    resultado('listar enderecos vazio', r.status === 200 && r.corpo.length === 0, `status=${r.status} total=${r.corpo?.length}`);

    r = await api('/api/clientes/enderecos', {
      metodo: 'POST', token,
      corpo: { rua: 'Av das Gamers', numero: '10', bairro: 'Centro', cidade: 'Sao Paulo', uf: 'sp', cep: '01311-000' }
    });
    resultado('criar endereco (padrao automatico)', r.status === 201 && r.corpo?.padrao === true, `status=${r.status} id=${r.corpo?.id}`);
    const idEndereco = r.corpo?.id;

    r = await api('/api/clientes/enderecos', {
      metodo: 'POST', token,
      corpo: { rua: 'Rua Segunda', numero: '22', bairro: 'Bairro', cidade: 'Campinas', uf: 'MG', cep: '13010100' }
    });
    resultado('cep sujo normalizado + uf validada', r.status === 201, `status=${r.status}`);
    const idEndereco2 = r.corpo?.id;

    r = await api('/api/clientes/enderecos', {
      metodo: 'POST', token,
      corpo: { rua: 'Erro UF', numero: '1', bairro: 'b', cidade: 'c', uf: 'SPP', cep: '12345678' }
    });
    resultado('UF invalida -> 400', r.status === 400, `status=${r.status}`);

    r = await api(`/api/clientes/enderecos/${idEndereco2}`, { metodo: 'PATCH', token, corpo: { padrao: true } });
    resultado('trocar endereco padrao', r.status === 200 && r.corpo?.padrao === true, `status=${r.status} id=${r.corpo?.id}`);

    r = await api('/api/clientes/enderecos', { token });
    const padrao = r.corpo.find((e) => e.padrao);
    const outros = r.corpo.filter((e) => !e.padrao);
    resultado('so um endereco padrao', r.status === 200 && r.corpo.length === 2 && Boolean(padrao) && outros.length === 1, `padrao=${padrao?.id}`);

    r = await api(`/api/clientes/enderecos/${idEndereco2}`, { metodo: 'DELETE', token });
    resultado('excluir endereco', r.status === 204, `status=${r.status}`);

    r = await api(`/api/clientes/enderecos/${idEndereco2}`, { metodo: 'DELETE', token });
    resultado('excluir endereco inexistente -> 404', r.status === 404, `status=${r.status}`);

    r = await api('/api/clientes/enderecos', {
      metodo: 'POST',
      token: 'token-fabricado-que-nao-existe',
      corpo: { rua: 'x', numero: '1', bairro: 'b', cidade: 'c', uf: 'SP', cep: '12345678' }
    });
    resultado('token invalido -> 401', r.status === 401, `status=${r.status}`);
  } finally {
    servidor.kill();
    await esperar(300);
  }
}

main()
  .then(() => console.log('Fim do teste de fumaca auth.'))
  .catch((err) => {
    console.error('Falha inesperada no teste:', err);
    process.exit(1);
  });
