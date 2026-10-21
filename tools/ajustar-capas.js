/*
 * VHARAK | tools/ajustar-capas.js
 * Ajusta o campo "capa" do catalogo depois da otimizacao das imagens.
 *
 * As PNGs viraram JPG: o catalogo continua apontando para o nome antigo e
 * a imagem some. Aqui cada capa e conferida no disco e, se o arquivo
 * nao existir mas a versao JPG existir, o nome e corrigido.
 *
 * Tambem aponta as imagens da pasta que nenhum produto usa.
 *
 * Uso: node tools/ajustar-capas.js
 */
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const CATALOGO = path.join(RAIZ, 'frontend', 'js', 'dados-catalogo.js');
const FRONTEND = path.join(RAIZ, 'frontend');
const ASSETS = path.join(FRONTEND, 'assets');

let conteudo = fs.readFileSync(CATALOGO, 'utf8');
let corrigidas = 0;
let quebradas = 0;
const usadas = new Set();

/* Cada "capa": "..." do arquivo, com a posicao no texto. */
const REGEX = /("capa":\s*")([^"]+)(")/g;
let achado;

while ((achado = REGEX.exec(conteudo)) !== null) {
  const caminho = achado[2];
  const absoluto = path.join(FRONTEND, caminho);

  if (fs.existsSync(absoluto)) {
    usadas.add(path.normalize(caminho));
    continue;
  }

  const semExtensao = caminho.replace(/\.(png|jpg|jpeg)$/i, '');
  let substituta = null;
  for (const extensao of ['.jpg', '.jpeg', '.png']) {
    const candidata = semExtensao + extensao;
    if (fs.existsSync(path.join(FRONTEND, candidata))) { substituta = candidata; break; }
  }

  if (!substituta) {
    console.log(`  X capa nao encontrada: ${caminho}`);
    quebradas += 1;
    continue;
  }

  const inicio = achado.index + achado[1].length;
  const fim = inicio + caminho.length;
  conteudo = conteudo.slice(0, inicio) + substituta + conteudo.slice(fim);
  usadas.add(path.normalize(substituta));
  corrigidas += 1;
  REGEX.lastIndex = fim + substituta.length;
}

if (corrigidas) {
  fs.writeFileSync(CATALOGO, conteudo, 'utf8');
}

function listar(raiz) {
  const saida = [];
  for (const entrada of fs.readdirSync(raiz, { withFileTypes: true })) {
    const caminho = path.join(raiz, entrada.name);
    if (entrada.isDirectory()) saida.push(...listar(caminho));
    else saida.push(caminho);
  }
  return saida;
}

const orfaos = listar(ASSETS)
  .filter((arquivo) => /\.(png|jpg|jpeg|webp)$/i.test(arquivo))
  .filter((arquivo) => !usadas.has(path.normalize(path.relative(FRONTEND, arquivo))));

console.log(`\n  capas corrigidas: ${corrigidas} | sem arquivo: ${quebradas}`);
if (orfaos.length) {
  console.log(`  ${orfaos.length} imagem(ns) sem uso na pasta:`);
  orfaos.slice(0, 12).forEach((o) => console.log('    ' + path.relative(ASSETS, o)));
}
console.log();
