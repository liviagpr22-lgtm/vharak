/*
 * VHARAK | tools/inspecionar.js
 * Avalia uma expressao no navegador, em uma pagina, e imprime o
 * resultado. Serve para depurar de dentro da pagina.
 *
 * Uso: node tools/inspecionar.js <url> "<expressao js>"
 */
const { spawn } = require('child_process');
const fs = require('fs');
const os = require('os');
const path = require('path');

const EDGE = 'C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe';
const url = process.argv[2];
const expressao = process.argv[3];
const PORTA = 9666 + Math.floor(Math.random() * 200);

const perfil = fs.mkdtempSync(path.join(os.tmpdir(), 'edge-inspect-'));

function esperarPor(chave, tempoMaximo = 15000) {
  const inicio = Date.now();
  return new Promise((resolve, reject) => {
    const intervalo = setInterval(async () => {
      try {
        const resposta = await fetch(`http://127.0.0.1:${PORTA}${chave}`);
        if (resposta.ok) { clearInterval(intervalo); resolve(await resposta.json()); }
      } catch (erro) {
        if (Date.now() - inicio > tempoMaximo) { clearInterval(intervalo); reject(new Error('Edge nao respondeu')); }
      }
    }, 200);
  });
}

(async () => {
  const navegador = spawn(EDGE, [
    '--headless=new', '--disable-gpu', '--no-sandbox',
    `--remote-debugging-port=${PORTA}`, `--user-data-dir=${perfil}`, 'about:blank',
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

    await enviar('Page.enable');
    await enviar('Runtime.enable');
    await enviar('Page.navigate', { url });
    await new Promise((r) => setTimeout(r, 2000));

    const resultado = await enviar('Runtime.evaluate', {
      expression: `JSON.stringify((() => { try { return ${expressao}; } catch (e) { return { erro: e.message }; } })())`,
      returnByValue: true,
    });

    console.log(resultado.exceptionDetails
      ? 'ERRO: ' + resultado.exceptionDetails.text
      : JSON.stringify(resultado.result.value, null, 2));

    socket.close();
  } finally {
    navegador.kill();
    setTimeout(() => { try { fs.rmSync(perfil, { recursive: true, force: true }); } catch (e) { /* ignora */ } }, 1200);
  }
})().catch((erro) => { console.error(erro.message); process.exit(1); });
