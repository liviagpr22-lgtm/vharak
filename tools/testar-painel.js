/*
 * VHARAK | tools/testar-painel.js
 * Testa o fluxo do painel de ponta a ponta num navegador de verdade:
 * entrar, colar a lista de precos, conferir a tabela e gerar o
 * precos.js que sera publicado.
 *
 * Uso: node tools/testar-painel.js [porta]
 */
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { garantirServidor } = require('./garantir-servidor');

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORTA_SITE = Number(process.argv[2]) || 8000;
const PORTA_CDP = 9711 + Math.floor(Math.random() * 200);
const BASE = `http://localhost:${PORTA_SITE}`;

const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-painel-'));

let falhas = 0;
function conferir(condicao, mensagem) {
  if (condicao) console.log('  ok ' + mensagem);
  else { falhas += 1; console.log('  X  ' + mensagem); }
}

function esperarPor(chave, tempoMaximo = 15000) {
  const inicio = Date.now();
  return new Promise((resolve, reject) => {
    const intervalo = setInterval(async () => {
      try {
        const resposta = await fetch(`http://127.0.0.1:${PORTA_CDP}${chave}`);
        if (resposta.ok) { clearInterval(intervalo); resolve(await resposta.json()); }
      } catch (erro) {
        if (Date.now() - inicio > tempoMaximo) { clearInterval(intervalo); reject(new Error('Edge nao respondeu')); }
      }
    }, 200);
  });
}

(async () => {
  /* O servidor sobe junto com o teste. */
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
      pendentes.set(meuId, { resolve, reject });
      socket.send(JSON.stringify({ id: meuId, method, params }));
    });

    await new Promise((resolve) => { socket.onopen = resolve; });

    /* Carregamentos pendentes: sem esperar o evento de carga, uma
       avaliacao logo apos navegar roda no contexto antigo e devolve
       "elemento nao encontrado" para tudo. */
    let carregamentos = [];

    socket.onmessage = (evento) => {
      const dados = JSON.parse(evento.data);
      if (dados.id && pendentes.has(dados.id)) {
        const { resolve, reject } = pendentes.get(dados.id);
        pendentes.delete(dados.id);
        if (dados.error) reject(new Error(dados.error.message));
        else resolve(dados.result);
        return;
      }
      if (dados.method === 'Page.loadEventFired') {
        const pendentes = carregamentos;
        carregamentos = [];
        pendentes.forEach((resolver) => resolver());
      }
    };

    const esperarCarga = async (limite = 12000) => {
      await Promise.race([
        new Promise((resolver) => { carregamentos.push(resolver); }),
        new Promise((resolver) => setTimeout(resolver, limite)),
      ]);
    };

    const avaliar = async (expressao) => {
      /* Avaliar durante uma navegacao pode ficar pendurado: um tempo
         maximo evita que o teste trave ali. */
      const promessa = enviar('Runtime.evaluate', { expression: expressao, returnByValue: true, awaitPromise: true });
      const relogio = new Promise((_, rejeita) => setTimeout(() => rejeita(new Error('tempo esgotado ao avaliar')), 8000));
      const r = await Promise.race([promessa, relogio]);
      if (r.exceptionDetails) throw new Error(r.exceptionDetails.text + ' ' + JSON.stringify(r.exceptionDetails.exception));
      return r.result.value;
    };

    await enviar('Page.enable');
    await enviar('Runtime.enable');

    const esperarPorElemento = async (seletor, tentativas = 40) => {
      for (let i = 0; i < tentativas; i += 1) {
        const achou = await avaliar(`!!document.querySelector(${JSON.stringify(seletor)})`);
        if (achou) return true;
        await new Promise((r) => setTimeout(r, 150));
      }
      return false;
    };

    console.log('\n[1] Entrar no painel');
    await enviar('Page.navigate', { url: BASE + '/pages/admin/login.html' });
    await esperarCarga();
    const achouCampo = await esperarPorElemento('#senha-admin');
    conferir(achouCampo, 'a tela de login do painel carregou');

    await avaliar(`document.getElementById('senha-admin').value = 'vharak';
      document.getElementById('formulario-admin').requestSubmit();
      'enviado'`);
    await new Promise((r) => setTimeout(r, 1800));

    conferir((await avaliar('location.pathname')).indexOf('dashboard') !== -1,
      'o login leva ao painel');

    console.log('\n[2] Colar a lista de precos');
    await enviar('Page.navigate', { url: BASE + '/pages/admin/produtos.html' });
    await esperarCarga();
    const chegouNaTabela = await esperarPorElemento('#tabela-produtos [data-produto]');
    conferir(chegouNaTabela, 'a pagina de produtos carregou a tabela');

    const lista = [
      'Elden Ring; 299,90',
      'ps-elden-ring; 299,90; 399,90',
      'ps-god-of-war-ragnarok; R$ 249,90',
      'console-playstation-5; 3499.00',
      'Spider-Man 2; 299,90',
      'Zelda Breath of the Wild; 299,90',
      'produto-que-nao-existe; 10,00',
      'ps-hollow-knight; abc',
    ].join('\n');

    const relatorio = await avaliar(`(function () {
      document.getElementById('lista-precos').value = ${JSON.stringify(lista)};
      document.getElementById('aplicar-lista').click();
      var r = VH.admin.aplicarListaDePrecos(${JSON.stringify(lista)});
      return { aplicados: r.aplicados, ignorados: r.ignorados };
    })()`);

    conferir(relatorio.aplicados.length === 6, 'seis precos foram aplicados (' + relatorio.aplicados.length + ')');
    conferir(relatorio.ignorados.length === 2, 'duas linhas foram recusadas (' + relatorio.ignorados.length + ')');
    conferir(relatorio.aplicados.some((l) => l.indexOf('Spider-Man 2') !== -1),
      'nome abreviado encontra "Marvel\'s Spider-Man 2"');
    conferir(relatorio.aplicados.some((l) => l.indexOf('Zelda') !== -1),
      'nome abreviado encontra "The Legend of Zelda: Breath of the Wild"');
    conferir(relatorio.ignorados.some((l) => l.indexOf('não encontrado') !== -1),
      'produto inexistente foi recusado com aviso');
    conferir(relatorio.ignorados.some((l) => l.indexOf('inválido') !== -1),
      'preco invalido foi recusado com aviso');

    console.log('\n[3] A tabela mostra os precos');
    const diagnose = await avaliar(`(function () {
      var linhas = document.querySelectorAll('[data-produto]');
      var ids = [];
      for (var i = 0; i < Math.min(3, linhas.length); i += 1) ids.push(linhas[i].getAttribute('data-produto'));
      var alvo = document.querySelector('[data-produto="ps-elden-ring"]');
      return {
        total: linhas.length,
        ids: ids,
        achou: !!alvo,
        html: alvo ? alvo.outerHTML.slice(0, 300) : null
      };
    })()`);
    if (!diagnose.achou) {
      console.log('      diagnostico: ' + JSON.stringify(diagnose));
    }

    const tabela = await avaliar(`(function () {
      var linha = document.querySelector('[data-produto="ps-elden-ring"]');
      if (!linha) return { preco: null, de: null };
      return {
        preco: linha.querySelector('[data-preco]').value,
        de: linha.querySelector('[data-preco-de]').value
      };
    })()`);
    conferir(tabela.preco === '29990', 'a tabela mostra o preco em centavos (' + tabela.preco + ')');
    conferir(tabela.de === '39990', 'a tabela mostra o preco cheio (' + tabela.de + ')');

    console.log('\n[4] Gerar o precos.js');
    const conteudo = await avaliar('VH.admin.gerarConteudoDePrecos()');
    conferir(conteudo.indexOf("'ps-elden-ring': { preco: 29990, de: 39990 }") !== -1,
      'o arquivo gerado tem o preco do Elden Ring');
    conferir(conteudo.indexOf("'ps-god-of-war-ragnarok': { preco: 24990, de: null }") !== -1,
      'o arquivo gerado tem o preco do God of War');
    conferir(conteudo.indexOf("'console-playstation-5': { preco: 349900, de: null }") !== -1,
      'o arquivo gerado tem o preco do PS5');
    conferir(conteudo.indexOf('VH.precos = {') !== -1, 'o arquivo gerado expoe VH.precos');
    conferir(conteudo.indexOf('ps-elden-ring') !== -1, 'o arquivo gerado tem entradas');

    console.log('\n[5] O modelo em branco');
    const modelo = await avaliar('VH.admin.gerarModeloDePrecos()');
    const total = await avaliar('VH.PRODUTOS.length');
    const linhas = modelo.split('\n');
    conferir(linhas.length === total + 1, 'o modelo tem uma linha por produto (' + (linhas.length - 1) + ' de ' + total + ')');
    conferir(/^[a-z0-9-]+;/.test(linhas[1]), 'a primeira linha traz o id e o nome do produto');

    console.log('\n[6] O preco aparece na vitrine');
    await enviar('Page.navigate', { url: BASE + '/pages/produto.html?id=ps-elden-ring' });
    await esperarCarga();
    await new Promise((r) => setTimeout(r, 600));
    const textoDetalhe = await avaliar('document.body.innerText');
    conferir(textoDetalhe.indexOf('R$ 299,90') !== -1, 'o detalhe mostra o preco publicado');
    conferir(textoDetalhe.indexOf('R$ 399,90') !== -1, 'o detalhe mostra o preco cheio');
    conferir(textoDetalhe.indexOf('Adicionar ao carrinho') !== -1,
      'com preco publicado, o botao vira compra em vez de WhatsApp');
  } finally {
    if (socket) socket.close();
    navegador.kill();
    await servidor.fechar();
    setTimeout(() => { try { fs.rmSync(perfil, { recursive: true, force: true }); } catch (e) { /* ignora */ } }, 1500);
  }

  console.log('\n' + '='.repeat(52));
  console.log(falhas === 0 ? 'O fluxo do painel funciona de ponta a ponta.' : `${falhas} verificacao(oes) falharam.`);
  process.exit(falhas === 0 ? 0 : 1);
})().catch((erro) => {
  console.error('Falha no teste:', erro.message);
  process.exit(1);
});
