/*
 * VHARAK | tools/vocabulario.js
 * Lista todas as palavras distintas dos textos visiveis, com a frequencia.
 * Serve para revisar a ortografia de uma vez.
 *
 * Uso: node tools/vocabulario.js [filtro]
 */
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const FRONTEND = path.join(RAIZ, 'frontend');
const FILTRO = process.argv[2] || '';

function listar(raiz, extensao) {
  const saida = [];
  for (const entrada of fs.readdirSync(raiz, { withFileTypes: true })) {
    const caminho = path.join(raiz, entrada.name);
    if (entrada.isDirectory()) {
      if (['assets', 'node_modules'].includes(entrada.name)) continue;
      saida.push(...listar(caminho, extensao));
    } else if (extensao.test(entrada.name)) {
      saida.push(caminho);
    }
  }
  return saida;
}

function textosVisiveis(arquivo) {
  const texto = fs.readFileSync(arquivo, 'utf8');
  const achados = [];

  if (arquivo.endsWith('.html')) {
    const limpo = texto
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ');
    for (const m of limpo.matchAll(/>([^<>]+)</g)) achados.push(m[1]);
  }

  if (arquivo.endsWith('.js')) {
    /* Só as strings que viram texto na tela: sem urls, sem caminhos e
       sem identificadores de codigo. */
    for (const m of texto.matchAll(/'([^'\\\n]{4,})'/g)) {
      const s = m[1];
      if (/[/\\.]/.test(s)) continue;
      if (/^[a-zA-Z_$][\w$]*$/.test(s)) continue;
      achados.push(s);
    }
  }

  return achados;
}

const arquivos = [
  ...listar(path.join(FRONTEND, 'pages'), /\.html$/),
  ...listar(path.join(FRONTEND, 'js'), /\.js$/),
];

const contagem = new Map();
for (const arquivo of arquivos) {
  for (const texto of textosVisiveis(arquivo)) {
    for (const palavra of texto.split(/[^A-Za-zÀ-ÿ]+/)) {
      if (palavra.length < 3) continue;
      const chave = palavra.toLowerCase();
      contagem.set(chave, (contagem.get(chave) || 0) + 1);
    }
  }
}

const lista = [...contagem.entries()].sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]));
const filtrada = FILTRO ? lista.filter(([p]) => p.includes(FILTRO)) : lista;

console.log('\n' + filtrada.length + ' palavra(s):\n');
const colunas = 4;
const linhas = Math.ceil(filtrada.length / colunas);
for (let i = 0; i < linhas; i += 1) {
  const partes = [];
  for (let j = 0; j < colunas; j += 1) {
    const item = filtrada[i + j * linhas];
    partes.push(item ? (item[0] + ' (' + item[1] + ')').padEnd(28) : ''.padEnd(28));
  }
  console.log('  ' + partes.join('').trimEnd());
}
console.log();
