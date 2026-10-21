/*
 * VHARAK | tools/ver-cabecalho.js
 * Mostra as primeiras linhas do que o servidor entrega, com os pontos de
 * codigo de cada caractere fora do ASCII. Serve para caçar texto
 * corrompido no que chega no navegador.
 *
 * Uso: node tools/ver-cabecalho.js [url] [linhas]
 */
const http = require('http');
const https = require('https');

const URL = process.argv[2] || 'http://localhost:3000/';
const LINHAS = Number(process.argv[3]) || 14;

const cliente = URL.startsWith('https') ? https : http;

cliente.get(URL, (resposta) => {
  const partes = [];
  resposta.on('data', (c) => partes.push(c));
  resposta.on('end', () => {
    const buffer = Buffer.concat(partes);
    const texto = buffer.toString('utf8');

    console.log(`\n${URL}`);
    console.log(`  status: ${resposta.statusCode}`);
    console.log(`  content-type: ${resposta.headers['content-type']}`);
    console.log(`  bytes: ${buffer.length}\n`);

    texto.split('\n').slice(0, LINHAS).forEach((linha, indice) => {
      const fora = [...linha]
        .filter((c) => c.charCodeAt(0) > 127)
        .map((c) => `${c}/U+${c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}`);

      const recorte = linha.trim().slice(0, 96);
      console.log(`  ${String(indice + 1).padStart(3)}: ${recorte}`);
      if (fora.length) console.log(`       fora do ASCII: ${fora.join(' ')}`);
    });

    /* Resumo de tudo que nao for ASCII na pagina inteira. */
    const contagem = new Map();
    for (const c of texto) {
      if (c.charCodeAt(0) <= 127) continue;
      contagem.set(c, (contagem.get(c) || 0) + 1);
    }
    const lista = [...contagem.entries()].sort((a, b) => b[1] - a[1]);
    console.log('\n  caracteres nao-ASCII na pagina inteira:');
    if (!lista.length) console.log('    nenhum');
    else lista.forEach(([c, n]) => {
      console.log(`    ${c}  U+${c.charCodeAt(0).toString(16).toUpperCase().padStart(4, '0')}  x${n}`);
    });
    console.log();
  });
});
