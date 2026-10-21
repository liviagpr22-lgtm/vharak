/*
 * VHARAK | tools/reparar-codificacao.js
 * Repara texto com codificacao dupla: quando um arquivo UTF-8 e lido
 * como Latin-1 e regravado, cada caractere acentuado vira dois.
 *
 * A correcao e a inversa exata: pegar os bytes do trecho corrompido e
 * decodificar como UTF-8. Trechos que nao formam UTF-8 valido ficam
 * como estavam.
 *
 * Uso: node tools/reparar-codificacao.js <arquivo> [arquivo...]
 */
const fs = require('fs');

/* O inverso da corrupcao: o trecho corrompido, convertido de volta para
   bytes (Latin-1) e lido como UTF-8. */
const decodificador = new TextDecoder('utf-8', { fatal: true });

/* Trechos corrompidos sao sequencias de caracteres no intervalo
   Latin-1 suplementar, mais os tres caracteres que o cp1252 usa para
   os sinais de pontuacao (U+02C6, U+02DC, U+2013..U+2122). */
const TRECHO = /[\u0080-\u00ff\u02c6\u02dc\u2013-\u2122]+/g;

function reparar(texto) {
  let mudancas = 0;

  const novo = texto.replace(TRECHO, (trecho) => {
    /* O trecho precisa ser UTF-8 valido para valer a correcao. */
    const bytes = Buffer.from(trecho, 'latin1');
    try {
      const corrigido = decodificador.decode(bytes);
      /* Confere que a correcao valeu: precisa ter menos caracteres e
         nao pode continuar com a marca de corrupcao. */
      if (corrigido !== trecho && !/[\u0080-\u00ff]{2,}/.test(corrigido)) {
        mudancas += 1;
        return corrigido;
      }
    } catch (erro) {
      /* Trecho que nao e UTF-8: era texto legitimo, deixa como esta. */
    }
    return trecho;
  });

  return { novo, mudancas };
}

const arquivos = process.argv.slice(2);
if (!arquivos.length) {
  console.log('Uso: node tools/reparar-codificacao.js <arquivo> [arquivo...]');
  process.exit(1);
}

for (const arquivo of arquivos) {
  const original = fs.readFileSync(arquivo, 'utf8');
  const { novo, mudancas } = reparar(original);

  if (!mudancas) {
    console.log(`  = ${arquivo}: nada a reparar`);
    continue;
  }

  fs.writeFileSync(arquivo, novo, 'utf8');
  console.log(`  ok ${arquivo}: ${mudancas} trecho(s) reparado(s)`);
}
