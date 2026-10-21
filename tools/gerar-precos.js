/*
 * VHARAK | tools/gerar-precos.js
 * Gera frontend/js/precos.js a partir do catalogo: um lugar unico para
 * os precos, com uma linha por produto. Roda de novo sempre que entrar
 * um produto novo no catalogo.
 *
 * Uso: node tools/gerar-precos.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const CATALOGO = path.join(RAIZ, 'frontend', 'js', 'dados-catalogo.js');
const DESTINO = path.join(RAIZ, 'frontend', 'js', 'precos.js');

const contexto = { window: {} };
vm.createContext(contexto);
vm.runInContext(fs.readFileSync(CATALOGO, 'utf8'), contexto);
const produtos = contexto.window.VH.PRODUTOS;

/* Os precos que ja existem sao preservados: regerar o arquivo por causa
   de um produto novo nao pode apagar os outros 127. O cabecalho tambem
   e preservado -- e nele que fica o aviso de valores provisorios. */
const existentes = {};
let cabecalho = null;
if (fs.existsSync(DESTINO)) {
  try {
    const bruto = fs.readFileSync(DESTINO, 'utf8');
    const contextoPrecos = { window: {} };
    vm.createContext(contextoPrecos);
    vm.runInContext(bruto, contextoPrecos);
    Object.assign(existentes, contextoPrecos.window.VH.precos.todos);

    /* O comentario de abertura do arquivo. */
    const abertura = bruto.match(/^\/\*[\s\S]*?\*\//);
    if (abertura) cabecalho = abertura[0];
  } catch (erro) {
    console.log('  ! o precos.js atual nao pode ser lido; sera regerado vazio.');
  }
}

const porTipo = (tipo) => produtos
  .filter((p) => p.tipo === tipo)
  .map((p) => {
    const atual = existentes[p.id];
    const preco = atual && typeof atual.preco === 'number' ? atual.preco : null;
    const de = atual && typeof atual.de === 'number' ? atual.de : null;
    return `  '${p.id}': { preco: ${preco}, de: ${de} },`;
  });

const conteudo = `${cabecalho || `/*
 * VHARAK | precos.js
 * Precos da loja, em centavos. Este e o UNICO lugar do projeto onde um
 * valor aparece: nenhuma pagina, nenhum modulo e nenhum texto escreve
 * numero de preco por conta propria.
 *
 * Como preencher:
 *   preco  = valor a venda, em centavos. Ex.: 29990 = R$ 299,90
 *   de     = valor "de" (preco cheio), usado quando ha desconto. null = sem desconto
 *
 * enquanto 'preco' for null, a vitrine mostra "Preco a anunciar" e o botao
 * principal do produto vira "Consultar no WhatsApp" -- a venda acontece
 * na conversa, com o valor combinado por la.
 *
 * Este arquivo foi gerado por tools/gerar-precos.js.
 */`}
(function (global) {
  'use strict';

  var VH = global.VH || (global.VH = {});

  var PRECOS = {
    // ---- Jogos ----------------------------------------------------------
${porTipo('jogo').join('\n')}

    // ---- Consoles -------------------------------------------------------
${porTipo('console').join('\n')}
  };

  VH.precos = {
    todos: PRECOS,

    /* Preco de venda em centavos, ou null quando ainda nao publicado. */
    precoDe: function (id) {
      var entrada = PRECOS[id];
      return entrada && typeof entrada.preco === 'number' ? entrada.preco : null;
    },

    /* Preco cheio, ou null. */
    precoDeAnterior: function (id) {
      var entrada = PRECOS[id];
      return entrada && typeof entrada.de === 'number' ? entrada.de : null;
    },

    /* Percentual de desconto inteiro, ou null. */
    desconto: function (id) {
      var entrada = PRECOS[id];
      if (!entrada || typeof entrada.de !== 'number' || typeof entrada.preco !== 'number') return null;
      if (entrada.de <= entrada.preco) return null;
      return Math.round((1 - entrada.preco / entrada.de) * 100);
    },

    /* true quando o produto ja tem preco publicado. */
    publicado: function (id) {
      return VH.precos.precoDe(id) !== null;
    }
  };
}(window));
`;

fs.writeFileSync(DESTINO, conteudo, 'utf8');
const mantidos = produtos.filter((p) => {
  const atual = existentes[p.id];
  return atual && typeof atual.preco === 'number';
}).length;
console.log(`precos.js regerado com ${produtos.length} produtos (${mantidos} com preco preservado).`);
