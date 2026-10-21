/*
 * VHARAK | tools/checar-mojibake.js
 * Procura a sequencia classica de codificacao dupla: um caractere
 * acentuado gravado como UTF-8 e lido como Latin-1 (e vice-versa).
 *
 * "Início" gravado errado vira "InÃ­cio" -- e o navegador mostra isso
 * na tela.
 *
 * Uso: node tools/checar-mojibake.js
 */
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const FRONTEND = path.join(RAIZ, 'frontend');

/* Marcas tipicas de texto que passou pelo Latin-1. */
const MARCAS = [
  'Ã', 'Â', 'â€', 'Ã©', 'Ã£', 'Ã§', 'Ã¡', 'Ãº', 'Ã­', 'Ãµ', 'Ãº', 'Ã­',
  'ï»¿', 'â€™', 'â€œ', 'â€', 'Ãƒ',
];

function listar(raiz, extensao) {
  const saida = [];
  for (const entrada of fs.readdirSync(raiz, { withFileTypes: true })) {
    const caminho = path.join(raiz, entrada.name);
    if (entrada.isDirectory()) {
      if (['node_modules'].includes(entrada.name)) continue;
      saida.push(...listar(caminho, extensao));
    } else if (extensao.test(entrada.name)) {
      saida.push(caminho);
    }
  }
  return saida;
}

const arquivos = [
  ...listar(FRONTEND, /\.(html|js|css|svg|xml|txt|md)$/),
  path.join(RAIZ, 'README.md'),
];

let problemas = 0;
for (const arquivo of arquivos) {
  if (!fs.existsSync(arquivo)) continue;
  const texto = fs.readFileSync(arquivo, 'utf8');
  const encontradas = MARCAS.filter((marca) => texto.includes(marca));
  if (!encontradas.length) continue;

  const linhas = [];
  texto.split('\n').forEach((linha, indice) => {
    if (encontradas.some((marca) => linha.includes(marca))) {
      linhas.push((indice + 1) + ': ' + linha.trim().slice(0, 90));
    }
  });

  problemas += 1;
  console.log(`  X ${path.relative(RAIZ, arquivo)}`);
  console.log(`      marcas: ${encontradas.join(' ')}`);
  linhas.slice(0, 6).forEach((l) => console.log('      ' + l));
  if (linhas.length > 6) console.log(`      ... e mais ${linhas.length - 6} linha(s)`);
}

console.log(problemas === 0
  ? '\nNenhum texto com codificacao dupla.'
  : `\n${problemas} arquivo(s) com texto corrompido.`);
process.exit(problemas === 0 ? 0 : 1);
