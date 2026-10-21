/*
 * VHARAK | tools/checar-codificacao.js
 * Detecta texto com codificacao dupla olhando os BYTES, sem depender de
 * como o console renderiza.
 *
 * Sinais de UTF-8 lido como Latin-1 e regravado:
 *   C3 83  -> "Ã" seguido de outra letra acentuada
 *   C3 82  -> "Â" (comum em "â€™", "â€œ")
 *   C2 A0+ -> "Â" seguido de espaco ou pontuacao
 *
 * Nenhum texto em portugues legitimately escrito em UTF-8 contem esses
 * bytes.
 *
 * Uso: node tools/checar-codificacao.js
 */
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');

const PADROES = [
  { nome: 'Ã seguido de acento (C3 83)', re: /\xc3\x83[\xc0-\xfd]/g },
  { nome: 'Â (C3 82)', re: /\xc3\x82/g },
  { nome: 'Â seguido de espaço ou pontuação', re: /\xc3\x82[\x20-\x7e]/g },
  { nome: 'C2 A0 (espaço não separável)', re: /\xc2\xa0/g },
];

function listar(raiz, extensao) {
  const saida = [];
  for (const entrada of fs.readdirSync(raiz, { withFileTypes: true })) {
    const caminho = path.join(raiz, entrada.name);
    if (entrada.isDirectory()) {
      if (['node_modules', '.next'].includes(entrada.name)) continue;
      saida.push(...listar(caminho, extensao));
    } else if (extensao.test(entrada.name)) {
      saida.push(caminho);
    }
  }
  return saida;
}

const alvos = [
  ...listar(path.join(RAIZ, 'frontend'), /\.(html|js|css|svg|xml|txt)$/),
  ...listar(path.join(RAIZ, 'tools'), /\.js$/),
  path.join(RAIZ, 'README.md'),
  path.join(RAIZ, 'frontend', 'README.md'),
].filter((arquivo) => fs.existsSync(arquivo));

let problemas = 0;
for (const arquivo of alvos) {
  const buffer = fs.readFileSync(arquivo);
  const texto = buffer.toString('latin1'); /* para ver os bytes crus */

  const achados = [];
  for (const padrao of PADROES) {
    const re = new RegExp(padrao.re.source, 'g');
    let m;
    while ((m = re.exec(texto)) !== null) {
      const inicio = Math.max(0, m.index - 40);
      const contexto = texto.slice(inicio, m.index + 40);
      achados.push({
        tipo: padrao.nome,
        linha: texto.slice(0, m.index).split('\n').length,
        hex: Buffer.from(m[0], 'latin1').toString('hex'),
        contexto: contexto.replace(/[^\x20-\x7e]/g, '.'),
      });
    }
  }

  if (!achados.length) continue;
  problemas += 1;
  console.log(`  X ${path.relative(RAIZ, arquivo)}  (${achados.length} ocorrencia(s))`);
  const vistos = new Set();
  for (const a of achados) {
    const chave = a.tipo + '|' + a.linha;
    if (vistos.has(chave)) continue;
    vistos.add(chave);
    console.log(`      ${a.tipo} | linha ${a.linha} | bytes ${a.hex}`);
    console.log(`        ${a.contexto}`);
    if (vistos.size >= 5) break;
  }
}

console.log(problemas === 0
  ? '\nNenhum byte de codificacao dupla encontrado.'
  : `\n${problemas} arquivo(s) com codificacao dupla.`);
process.exit(problemas === 0 ? 0 : 1);
