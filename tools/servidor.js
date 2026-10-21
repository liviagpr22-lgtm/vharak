/*
 * VHARAK | tools/servidor.js
 * Servidor estatico para developing a vitrine, sem depender do backend.
 *
 * Uso: node tools/servidor.js [porta]
 *
 * As outras ferramentas usam `criarServidor` para servir os arquivos
 * elas mesmas: assim nao dependem de um servidor no ar.
 */
const http = require('http');
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..', 'frontend');

const TIPOS = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.jfif': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon',
  '.json': 'application/json; charset=utf-8',
};

/* Cria o servidor. Devolve a instancia http, para quem quiser
   fechar depois. */
function criarServidor(porta) {
  const servidor = http.createServer((requisicao, resposta) => {
    let caminho = decodeURIComponent(requisicao.url.split('?')[0]);
    if (caminho === '/') caminho = '/index.html';

    const destino = path.join(RAIZ, path.normalize(caminho).replace(/^([/\\])+/, ''));
    if (!destino.startsWith(RAIZ)) {
      resposta.writeHead(403).end('Proibido');
      return;
    }

    fs.stat(destino, (erro, info) => {
      if (!erro && info.isDirectory()) {
        const indice = path.join(destino, 'index.html');
        if (fs.existsSync(indice)) {
          resposta.writeHead(200, { 'Content-Type': TIPOS['.html'] });
          fs.createReadStream(indice).pipe(resposta);
          return;
        }
      }
      if (erro) {
        resposta.writeHead(404, { 'Content-Type': 'text/html; charset=utf-8' });
        resposta.end('<h1>404</h1><p>Nao encontrado: ' + caminho + '</p>');
        return;
      }
      resposta.writeHead(200, { 'Content-Type': TIPOS[path.extname(destino).toLowerCase()] || 'application/octet-stream' });
      fs.createReadStream(destino).pipe(resposta);
    });
  });

  return new Promise((resolve, reject) => {
    servidor.once('error', reject);
    servidor.listen(porta, () => resolve(servidor));
  });
}

module.exports = { criarServidor, RAIZ };

if (require.main === module) {
  const porta = Number(process.argv[2]) || 8000;
  criarServidor(porta).then(() => {
    console.log(`VHARAK em http://localhost:${porta}`);
  });
}
