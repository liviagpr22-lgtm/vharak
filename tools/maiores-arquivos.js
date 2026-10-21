/*
 * VHARAK | tools/maiores-arquivos.js
 * Lista os arquivos mais pesados de uma pasta, com o tamanho.
 *
 * Uso: node tools/maiores-arquivos.js [pasta] [quantidade]
 */
const fs = require('fs');
const path = require('path');

const ALVO = process.argv[2] || path.join(__dirname, '..', 'frontend', 'assets');
const LIMITE = Number(process.argv[3]) || 15;

const arquivos = [];
let total = 0;

function percorrer(raiz) {
  for (const entrada of fs.readdirSync(raiz, { withFileTypes: true })) {
    const caminho = path.join(raiz, entrada.name);
    if (entrada.isDirectory()) percorrer(caminho);
    else {
      const tamanho = fs.statSync(caminho).size;
      total += tamanho;
      arquivos.push({ caminho: caminho.replace(ALVO + path.sep, ''), tamanho });
    }
  }
}

percorrer(ALVO);
arquivos.sort((a, b) => b.tamanho - a.tamanho);

console.log(`\n${arquivos.length} arquivos, ${(total / 1048576).toFixed(1)} MB no total\n`);
for (const arquivo of arquivos.slice(0, LIMITE)) {
  console.log(`  ${(arquivo.tamanho / 1024).toFixed(0).padStart(7)} KB  ${arquivo.caminho}`);
}

/* Quanto do total vem das imagens grandes. */
const grandes = arquivos.filter((a) => a.tamanho > 300 * 1024);
const pesoGrandes = grandes.reduce((s, a) => s + a.tamanho, 0);
console.log(`\n  ${grandes.length} arquivo(s) acima de 300 KB somam ${(pesoGrandes / 1048576).toFixed(1)} MB `
  + `(${(pesoGrandes / total * 100).toFixed(0)}% do peso)`);
console.log();
