/*
 * VHARAK | tools/medir-capas.js
 * Mede as dimensoes das capas de jogos e consoles para escolher a
 * proporcao do card de produto (que precisa de um unico corte para todos).
 *
 * Uso: node tools/medir-capas.js
 */
const fs = require('fs');
const path = require('path');

function dimensoes(arquivo) {
  const buf = fs.readFileSync(arquivo);
  // JPEG: procura o marcador SOF e le a altura/largura.
  let i = 2;
  while (i < buf.length) {
    if (buf[i] !== 0xff) { i += 1; continue; }
    const marcador = buf[i + 1];
    if (marcador >= 0xc0 && marcador <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marcador)) {
      return { altura: buf.readUInt16BE(i + 5), largura: buf.readUInt16BE(i + 7) };
    }
    i += 2 + buf.readUInt16BE(i + 2);
  }
  // PNG:IHDR
  if (buf.slice(1, 4).toString() === 'PNG') {
    return { altura: buf.readUInt32BE(20), largura: buf.readUInt32BE(16) };
  }
  return null;
}

function listar(raiz) {
  const saida = [];
  for (const entrada of fs.readdirSync(raiz, { withFileTypes: true })) {
    const caminho = path.join(raiz, entrada.name);
    if (entrada.isDirectory()) {
      saida.push(...listar(caminho));
    } else if (/\.(jpg|jpeg|png)$/i.test(entrada.name) && !entrada.name.startsWith('.')) {
      saida.push(caminho);
    }
  }
  return saida;
}

for (const [rotulo, pasta] of [['JOGOS', 'assets/jogos'], ['CONSOLES', 'assets/consoles']]) {
  const arquivos = listar(path.join(__dirname, '..', 'frontend', pasta));
  const contas = new Map();
  let ignoradas = 0;
  let ignorados = 0;
  for (const arquivo of arquivos) {
    const d = dimensoes(arquivo);
    if (!d || !d.altura || !d.largura) { ignorados += 1; continue; }
    const r = d.largura / d.altura;
    let faixa;
    if (r > 1.15) faixa = 'paisagem (>1.15)';
    else if (r > 0.92) faixa = 'quadrado (0.92-1.15)';
    else if (r > 0.68) faixa = 'retrato 3:4 (0.68-0.92)';
    else if (r > 0.5) faixa = 'retrato 2:3 (0.5-0.68)';
    else faixa = 'vertical estreito (<0.5)';
    contas.set(faixa, (contas.get(faixa) || 0) + 1);
  }
  console.log(`\n${rotulo}: ${arquivos.length} arquivos (${ignorados} ilegiveis)`);
  [...contas.entries()].sort((a, b) => b[1] - a[1]).forEach(([f, n]) => console.log(`  ${String(n).padStart(3)}  ${f}`));
}
