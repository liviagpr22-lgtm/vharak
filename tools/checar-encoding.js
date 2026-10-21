/*
 * VHARAK | tools/checar-encoding.js
 * Confere se os arquivos gerados estao em UTF-8 valido, sem caracteres
 * de substituicao (U+FFFD) e com os acentos intactos.
 *
 * Uso: node tools/checar-encoding.js
 */
const fs = require('fs');
const path = require('path');

const alvos = process.argv.slice(2);
const arquivos = alvos.length
  ? alvos
  : [
    path.join(__dirname, '..', 'frontend', 'js', 'dados-catalogo.js'),
    path.join(__dirname, '..', 'frontend', 'js', 'precos.js'),
    path.join(__dirname, '..', 'frontend', 'css', 'global.css'),
    path.join(__dirname, '..', 'frontend', 'css', 'header.css'),
    path.join(__dirname, '..', 'frontend', 'css', 'footer.css'),
  ];

let problemas = 0;
for (const arquivo of arquivos) {
  if (!fs.existsSync(arquivo)) {
    console.log(`  ?  ${arquivo} (nao existe)`);
    continue;
  }
  const buffer = fs.readFileSync(arquivo);
  const texto = buffer.toString('utf8');
  const substituicoes = (texto.match(/\uFFFD/g) || []).length;
  const temBOM = buffer.length >= 3 && buffer[0] === 0xef && buffer[1] === 0xbb && buffer[2] === 0xbf;
  const acentos = (texto.match(/[áàâãéêíóôõúçÁÀÂÃÉÊÍÓÔÕÚÇ]/g) || []).length;
  const marca = substituicoes > 0 ? 'X' : 'ok';
  if (substituicoes > 0) problemas += 1;
  console.log(`  ${marca} ${path.basename(arquivo).padEnd(22)} ${String(buffer.length).padStart(7)} bytes | acentos: ${acentos} | U+FFFD: ${substituicoes} | BOM: ${temBOM ? 'sim' : 'nao'}`);
}
console.log(problemas === 0 ? '\nTodos os arquivos estao em UTF-8 valido.' : `\n${problemas} arquivo(s) com problema de encoding.`);
