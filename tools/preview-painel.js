/*
 * Captura do painel com a lista de precos aplicada.
 * Uso: node tools/preview-painel.js [porta] [saida.png]
 */
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');
const { garantirServidor } = require('./garantir-servidor');

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const PORTA_SITE = Number(process.argv[2]) || 8000;
const SAIDA = process.argv[3] || path.join(os.tmpdir(), 'painel.png');
const PORTA = 9801 + Math.floor(Math.random() * 150);
const BASE = `http://localhost:${PORTA_SITE}`;

const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-painel-shot-'));

function esperarPor(chave, limite = 15000) {
  const inicio = Date.now();
  return new Promise((resolve, reject) => {
    const intervalo = setInterval(async () => {
      try {
        const r = await fetch(`http://127.0.0.1:${PORTA}${chave}`);
        if (r.ok) { clearInterval(intervalo); resolve(await r.json()); }
      } catch (e) {
        if (Date.now() - inicio > limite) { clearInterval(intervalo); reject(new Error('sem resposta')); }
      }
    }, 200);
  });
}

(async () => {
  const servidor = await garantirServidor(PORTA_SITE);
  const nav = spawn(EDGE, ['--headless=new', '--disable-gpu', '--no-sandbox', '--hide-scrollbars',
    `--remote-debugging-port=${PORTA}`, `--user-data-dir=${perfil}`, 'about:blank'], { stdio: 'ignore' });

  try {
    const alvos = await esperarPor('/json/list');
    const alvo = alvos.find((a) => a.type === 'page') || alvos[0];
    const socket = new WebSocket(alvo.webSocketDebuggerUrl);

    let id = 0;
    const pendentes = new Map();
    const enviar = (m, p = {}) => new Promise((res, rej) => {
      const i = ++id;
      pendentes.set(i, { res, rej });
      socket.send(JSON.stringify({ id: i, method: m, params: p }));
    });

    await new Promise((r) => { socket.onopen = r; });
    socket.onmessage = (e) => {
      const d = JSON.parse(e.data);
      if (d.id && pendentes.has(d.id)) {
        const { res, rej } = pendentes.get(d.id);
        pendentes.delete(d.id);
        if (d.error) rej(new Error(d.error.message)); else res(d.result);
      }
    };

    await enviar('Page.enable');
    await enviar('Runtime.enable');
    await enviar('Emulation.setDeviceMetricsOverride', { width: 1440, height: 1080, deviceScaleFactor: 1, mobile: false });

    const avaliar = async (expr) => (await enviar('Runtime.evaluate', { expression: expr, returnByValue: true })).result.value;

    await enviar('Page.navigate', { url: BASE + '/pages/admin/login.html' });
    await new Promise((r) => setTimeout(r, 1500));
    await avaliar(`document.getElementById('senha-admin').value='vharak';document.getElementById('formulario-admin').requestSubmit();1`);
    await new Promise((r) => setTimeout(r, 1500));

    await enviar('Page.navigate', { url: BASE + '/pages/admin/produtos.html' });
    await new Promise((r) => setTimeout(r, 1800));

    const lista = [
      'Elden Ring; 299,90; 399,90',
      'God of War Ragnarök; R$ 249,90',
      'Spider-Man 2; 299,90',
      'Hollow Knight; 74,90',
      'PlayStation 5; 3499,00; 3999,00',
      'Nintendo Switch 2; 3899,00',
      'Bloodborne; 199,90',
      'Zelda Breath of the Wild; 299,90',
    ].join('\n');

    await avaliar(`document.getElementById('lista-precos').value=${JSON.stringify(lista)};
      document.getElementById('aplicar-lista').click();1`);
    await new Promise((r) => setTimeout(r, 900));

    await avaliar(`document.querySelector('.admin-conteudo').scrollTop=0; window.scrollTo(0,0);1`);

    const cap = await enviar('Page.captureScreenshot', { format: 'png' });
    fs.writeFileSync(SAIDA, Buffer.from(cap.data, 'base64'));
    console.log('print salvo em ' + SAIDA);
    socket.close();
  } finally {
    nav.kill();
    await servidor.fechar();
    setTimeout(() => { try { fs.rmSync(perfil, { recursive: true, force: true }); } catch (e) { /* ignora */ } }, 1200);
  }
})().catch((e) => { console.error(e.message); process.exit(1); });
