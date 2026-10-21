/*
 * VHARAK | tools/preview.js
 * Tira print de uma pagina em varios tamanhos, com emulacao de
 * dispositivo de verdade (o headless do Windows nao desce de 500px).
 *
 * Uso: node tools/preview.js <url> <saida.png> [largura] [altura] [opcoes]
 *
 * Opcoes (separadas por virgula): "completo" captura a pagina inteira,
 * "login" entra no painel antes de capturar.
 */
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { garantirServidor } = require('./garantir-servidor');

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';

const url = process.argv[2] || 'http://localhost:8000/';
const saida = process.argv[3] || path.join(os.tmpdir(), 'preview.png');
/* A porta vem da URL, para o servidor subir na mesma porta. */
const PORTA_SITE = Number((url.match(/localhost:(\d+)/) || [])[1]) || 8000;
const LARGURA = Number(process.argv[4]) || 390;
const ALTURA = Number(process.argv[5]) || 1600;
const OPCOES = String(process.argv[6] || '').split(',').map((o) => o.trim());
const PORTA = 9222 + Math.floor(Math.random() * 400);

const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-preview-'));

function esperarPor(chave, tempoMaximo = 15000) {
  const inicio = Date.now();
  return new Promise((resolve, reject) => {
    const intervalo = setInterval(async () => {
      try {
        const resposta = await fetch(`http://127.0.0.1:${PORTA}${chave}`);
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
  /* O servidor sobe junto com a captura: nao depende de outro terminal. */
  const servidor = await garantirServidor(PORTA_SITE);

  const navegador = spawn(EDGE, [
    '--headless=new',
    '--disable-gpu',
    '--no-sandbox',
    '--hide-scrollbars',
    `--remote-debugging-port=${PORTA}`,
    `--user-data-dir=${perfil}`,
    'about:blank',
  ], { stdio: 'ignore' });

  try {
    const alvos = await esperarPor('/json/list');
    const pagina = alvos.find((a) => a.type === 'page') || alvos[0];
    const socket = new WebSocket(pagina.webSocketDebuggerUrl);

    let id = 0;
    const pendentes = new Map();

    const enviar = (method, params = {}) => new Promise((resolve, reject) => {
      const meuId = ++id;
      pendentes.set(meuId, { resolve, reject });
      socket.send(JSON.stringify({ id: meuId, method, params }));
    });

    await new Promise((resolve) => { socket.onopen = resolve; });

    socket.onmessage = (evento) => {
      const dados = JSON.parse(evento.data);
      if (dados.id && pendentes.has(dados.id)) {
        const { resolve, reject } = pendentes.get(dados.id);
        pendentes.delete(dados.id);
        if (dados.error) reject(new Error(dados.error.message));
        else resolve(dados.result);
      }
    };

    /* Emulacao de dispositivo: viewport real, escala de 1. */
    await enviar('Emulation.setDeviceMetricsOverride', {
      width: LARGURA,
      height: ALTURA,
      deviceScaleFactor: 1,
      mobile: LARGURA < 900,
    });

    await enviar('Page.enable');
    await enviar('Runtime.enable');
    await enviar('Page.navigate', { url });
    await new Promise((r) => setTimeout(r, 2500));

    /* Com o argumento "login", entra no painel antes de capturar. */
    if (OPCOES.indexOf('login') !== -1) {
      await enviar('Page.navigate', { url: url.replace(/\/pages\/admin\/.+/, '/pages/admin/login.html') });
      await new Promise((r) => setTimeout(r, 1200));
      await enviar('Runtime.evaluate', {
        expression: `document.getElementById('senha-admin').value = 'vharak';
          document.getElementById('formulario-admin').requestSubmit(); 'ok'`,
        returnByValue: true,
      });
      await new Promise((r) => setTimeout(r, 1500));
      await enviar('Page.navigate', { url });
      await new Promise((r) => setTimeout(r, 1800));
    }

    /* Mede o quanto a pagina estourou na horizontal. */
    const medidas = await enviar('Runtime.evaluate', {
      expression: `JSON.stringify({
        innerWidth: window.innerWidth,
        scrollWidth: document.documentElement.scrollWidth,
        bodyScrollWidth: document.body.scrollWidth,
        overflow: document.documentElement.scrollWidth - window.innerWidth
      })`,
      returnByValue: true,
    });
    const dados = JSON.parse(medidas.result.value);
    console.log(`viewport ${dados.innerWidth}px | conteudo ${dados.scrollWidth}px | `
      + (dados.overflow > 0 ? `ESTOURO HORIZONTAL DE ${dados.overflow}px` : 'sem estouro horizontal'));

    const captura = await enviar('Page.captureScreenshot', {
      format: 'png',
      captureBeyondViewport: OPCOES.indexOf('completo') !== -1,
    });
    fs.writeFileSync(saida, Buffer.from(captura.data, 'base64'));
    console.log(`print salvo em ${saida}`);

    socket.close();
  } finally {
    navegador.kill();
    await servidor.fechar();
    /* O Edge ainda segura o perfil por um instante: a limpeza e opcional. */
    setTimeout(() => {
      try { fs.rmSync(perfil, { recursive: true, force: true }); } catch (erro) { /* ignora */ }
    }, 1500);
  }
})().catch((erro) => {
  console.error('Falha na captura:', erro.message);
  process.exit(1);
});
