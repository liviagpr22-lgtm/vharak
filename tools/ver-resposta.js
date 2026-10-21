/*
 * VHARAK | tools/ver-resposta.js
 * Mostra o começo da resposta HTTP, sem cortar.
 *
 * Uso: node tools/ver-resposta.js [url] [caracteres]
 */
const http = require('http');

const URL = process.argv[2] || 'http://localhost:3000/';
const TAMANHO = Number(process.argv[3]) || 1200;

http.get(URL, (resposta) => {
  const partes = [];
  resposta.on('data', (c) => partes.push(c));
  resposta.on('end', () => {
    const texto = Buffer.concat(partes).toString('utf8');
    console.log('\n--- ' + URL + ' ---');
    console.log('server: ' + resposta.headers['x-powered-by'] + ' | type: ' + resposta.headers['content-type']);
    console.log(texto.slice(0, TAMANHO));
    console.log('\n[total ' + texto.length + ' caracteres]\n');
  });
});
