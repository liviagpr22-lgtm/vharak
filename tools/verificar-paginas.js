/*
 * VHARAK | tools/verificar-paginas.js
 * Abre cada pagina em um navegador de verdade e reporta erro de JavaScript,
 * requisicao quebrada e aviso de acessibilidade do console.
 *
 * E o unico jeito de pegar erro que so acontece em tempo de execucao --
 * o verificador de arquivos ve a sintaxe, nao o comportamento.
 *
 * Uso: node tools/verificar-paginas.js [porta]
 */
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { garantirServidor } = require('./garantir-servidor');

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORTA_SITE = Number(process.argv[2]) || 8000;
const PORTA_CDP = 9333 + Math.floor(Math.random() * 300);
const BASE = `http://localhost:${PORTA_SITE}`;

const PAGINAS = [
  '/',
  '/pages/catalogo.html',
  '/pages/catalogo.html?tipo=jogo&genero=rpg',
  '/pages/consoles.html',
  '/pages/produto.html?id=ps-elden-ring',
  '/pages/produto.html?id=console-playstation-5',
  '/pages/produto.html?id=inexistente',
  '/pages/carrinho.html',
  '/pages/login.html',
  '/pages/cadastro.html',
  '/pages/perfil.html',
  '/pages/ajuda.html',
  '/pages/admin/login.html',
  '/pages/admin/dashboard.html',
];

const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-check-'));

function esperarPor(chave, tempoMaximo = 15000) {
  const inicio = Date.now();
  return new Promise((resolve, reject) => {
    const intervalo = setInterval(async () => {
      try {
        const resposta = await fetch(`http://127.0.0.1:${PORTA_CDP}${chave}`);
        if (resposta.ok) {
          clearInterval(intervalo);
          resolve(await resposta.json());
        }
      } catch (erro) {
        if (Date.now() - inicio > tempoMaximo) {
          clearInterval(intervalo);
          reject(new Error('Edge nao respondeu a tempo'));
        }
      }
    }, 200);
  });
}

(async () => {
  /* O servidor sobe junto com a verificacao. */
  const servidor = await garantirServidor(PORTA_SITE);

  const navegador = spawn(EDGE, [
    '--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
    `--remote-debugging-port=${PORTA_CDP}`, `--user-data-dir=${perfil}`, 'about:blank',
  ], { stdio: 'ignore' });

  let socket;

  try {
    const alvos = await esperarPor('/json/list');
    const pagina = alvos.find((a) => a.type === 'page') || alvos[0];
    socket = new WebSocket(pagina.webSocketDebuggerUrl);

    let id = 0;
    const pendentes = new Map();
    const enviar = (method, params = {}) => new Promise((resolve, reject) => {
      const meuId = ++id;
      /* Sem tempo maximo, uma resposta que nunca chega trava o script
         inteiro: melhor falhar aqui e continuar na proxima pagina. */
      const relogio = setTimeout(() => {
        if (pendentes.has(meuId)) {
          pendentes.delete(meuId);
          reject(new Error(`sem resposta para ${method}`));
        }
      }, 12000);
      pendentes.set(meuId, {
        resolve: (v) => { clearTimeout(relogio); resolve(v); },
        reject: (e) => { clearTimeout(relogio); reject(e); },
      });
      socket.send(JSON.stringify({ id: meuId, method, params }));
    });

    await new Promise((resolve) => { socket.onopen = resolve; });

    /* O ouvinte precisa estar pronto ANTES da primeira chamada: a resposta
       chega na hora e, sem ouvinte, se perde. */
    socket.onmessage = (evento) => {
      const dados = JSON.parse(evento.data);

      /* Resposta de uma chamada: primeiro se resolve a promessa. */
      if (dados.id && pendentes.has(dados.id)) {
        const { resolve, reject } = pendentes.get(dados.id);
        pendentes.delete(dados.id);
        if (dados.error) reject(new Error(dados.error.message));
        else resolve(dados.result);
        return;
      }

      if (dados.method === 'Runtime.exceptionThrown') {
        const texto = dados.params.exceptionDetails.text;
        const excecao = dados.params.exceptionDetails.exception;
        problemas.push(`erro: ${excecao ? excecao.description : texto}`);
      }

      if (dados.method === 'Runtime.consoleAPICalled' && dados.params.type === 'error') {
        problemas.push('console.error: ' + dados.params.args.map((a) => a.value || a.description || '').join(' '));
      }

      if (dados.method === 'Log.entryAdded') {
        const entrada = dados.params.entry;
        if (entrada.level === 'error') {
          problemas.push(`log: ${entrada.text} (${entrada.url || ''})`);
        }
      }

      if (dados.method === 'Network.loadingFailed') {
        problemas.push(`requisicao falhou: ${dados.params.errorText}`);
      }
    };

    await enviar('Page.enable');
    await enviar('Runtime.enable');
    await enviar('Log.enable');
    await enviar('Network.enable');

    let problemas = [];
    let paginaAtual = '';

    console.log(`\nAbrindo ${PAGINAS.length} paginas em ${BASE}\n`);

    for (const rota of PAGINAS) {
      paginaAtual = rota;
      problemas = [];

      try {
        await enviar('Page.navigate', { url: BASE + rota });
      } catch (erro) {
        console.log(`  X ${rota}\n      -> ${erro.message}`);
        continue;
      }
      await new Promise((r) => setTimeout(r, 1500));

      /* Confere se a pagina montou alguma coisa, e nao ficou no estado
         "carregando" por causa de um script quebrado. */
      let dados;
      try {
        const estado = await enviar('Runtime.evaluate', {
          expression: `JSON.stringify({
            titulo: document.title,
            vazio: document.body.innerText.trim().length,
            carregando: !!document.querySelector('.loading'),
            cartoes: document.querySelectorAll('.card-produto').length
          })`,
          returnByValue: true,
        });
        dados = JSON.parse(estado.result.value);
      } catch (erro) {
        console.log(`  X ${rota}\n      -> nao foi possivel ler a pagina: ${erro.message}`);
        continue;
      }

      const erros = problemas.filter((p) => !/favicon/i.test(p));
      const marca = erros.length ? 'X ' : 'ok';
      if (erros.length) problemas = erros;

      console.log(`  ${marca} ${rota}`);
      console.log(`      titulo: ${dados.titulo}`);
      console.log(`      texto: ${dados.vazio} chars | cartoes: ${dados.cartoes}${dados.carregando ? ' | PRESO EM CARREGANDO' : ''}`);
      erros.forEach((p) => console.log(`      -> ${p}`));

      if (dados.carregando) problemas.push('a pagina ficou presa no estado de carregamento');
      if (dados.vazio < 80) problemas.push('a pagina renderizou quase nada');
    }
  } finally {
    if (socket) socket.close();
    navegador.kill();
    await servidor.fechar();
    setTimeout(() => {
      try { fs.rmSync(perfil, { recursive: true, force: true }); } catch (erro) { /* ignora */ }
    }, 1500);
  }
})().catch((erro) => {
  console.error('Falha na verificacao:', erro.message);
  process.exit(1);
});
