/*
 * VHARAK | tools/diagnostico-texto.js
 * Compara os bytes de um trecho entre o arquivo em disco e o que chega
 * pelo HTTP. Descobre em qual dos dois passos o texto foi corrompido.
 *
 * Uso: node tools/diagnostico-texto.js "Início"
 */
const fs = require('fs');
const path = require('path');

const FRONTEND = path.join(__dirname, '..', 'frontend');
const TRECHO = process.argv[2] || 'Início';

function hexDe(texto) {
  return Buffer.from(texto, 'utf8').toString('hex').replace(/(..)/g, '$1 ').trim();
}

function procurar(rotulo, buffer) {
  const texto = buffer.toString('utf8');
  const indice = texto.indexOf('menu-principal');
  const trecho = indice !== -1 ? texto.slice(indice, indice + 400) : texto.slice(0, 200);
  const temCerto = trecho.includes(TRECHO);
  const temErrado = /InÃ|InÂ/.test(trecho);

  console.log(`\n${rotulo}:`);
  console.log('  trecho decodificado: ' + trecho.replace(/\s+/g, ' ').slice(0, 120));
  console.log('  contem o texto certo: ' + (temCerto ? 'SIM' : 'nao'));
  console.log('  contem mojibake:     ' + (temErrado ? 'SIM' : 'nao'));
  console.log('  bytes: ' + hexDe(trecho.replace(/\s+/g, ' ').slice(0, 20)));
}

async function main() {
  const emDisco = fs.readFileSync(path.join(FRONTEND, 'index.html'));
  procurar('ARQUIVO EM DISCO', emDisco);

  try {
    const resposta = await fetch('http://localhost:3000/');
    const pelaRede = Buffer.from(await resposta.arrayBuffer());
    procurar('PELO HTTP (:3000)', pelaRede);
  } catch (erro) {
    console.log('\nPELO HTTP: nao deu para ler (' + erro.message + ')');
  }
}

main();
