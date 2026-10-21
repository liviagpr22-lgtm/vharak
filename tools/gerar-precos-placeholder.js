/*
 * VHARAK | tools/gerar-precos-placeholder.js
 *
 * Preenche o precos.js com valores PROVISORIOS, enquanto a loja nao
 * publica os valores de verdade.
 *
 * O gerador usa semente fixa: rodar de novo produz os mesmos numeros.
 * Importante para nao trocar o preco de um produto sem querer.
 *
 * As faixas acompanham o tipo de produto, para o catalogo nao ficar
 * absurdo: um console de 9a geracao nao custa o mesmo que um jogo de
 * 2017. Todo valor fica acima de R$ 50,00.
 *
 * Uso: node tools/gerar-precos-placeholder.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const CATALOGO = path.join(RAIZ, 'frontend', 'js', 'dados-catalogo.js');
const DESTINO = path.join(RAIZ, 'frontend', 'js', 'precos.js');

/* Semente fixa: os mesmos numeros em toda execucao. */
let semente = 20261019;
function aleatorio() {
  /* Gerador linear congruente: simples, rapido e reproduzivel. */
  semente = (semente * 1103515245 + 12345) % 2147483648;
  return semente / 2147483648;
}

function entre(minimo, maximo) {
  return minimo + aleatorio() * (maximo - minimo);
}

/* Preco de loja: termina em ,00 ou ,90. */
function arredondar(valor) {
  var reais = Math.round(valor);
  var centavos = aleatorio() < 0.55 ? 90 : 0;
  return reais * 100 + centavos;
}

/* Faixas por console, pelo nome do modelo. */
var FAIXAS_CONSOLE = [
  [/PlayStation 5|Switch 2|Xbox Series/, 2800, 4200],
  [/PlayStation 4 Pro/, 1800, 2600],
  [/PlayStation 4$|Switch OLED|PS Vita/, 1200, 2000],
  [/Xbox One X/, 1100, 1700],
  [/Xbox One S|Switch Lite/, 900, 1600],
  [/Nintendo Switch \(modelo/, 1000, 1600],
  [/PlayStation 3|Wii/, 600, 1200],
  [/Xbox 360/, 450, 950],
  [/PSP|Nintendo 64|PlayStation 2/, 300, 800],
  [/Nintendo DS|3DS/, 350, 900],
  [/Xbox \(Original\)|PlayStation \(PS1\)|Super Nintendo/, 130, 600],
];

/* Faixas por jogo, conforme a popularidade. */
function faixaDoJogo(produto) {
  if (produto.novo) return [200, 380];
  if (typeof produto.popularidade === 'number' && produto.popularidade >= 95) return [220, 400];
  if (typeof produto.popularidade === 'number' && produto.popularidade >= 85) return [140, 280];
  if (produto.destaque) return [120, 260];
  return [50, 160];
}

function faixaDoConsole(produto) {
  for (var i = 0; i < FAIXAS_CONSOLE.length; i += 1) {
    if (FAIXAS_CONSOLE[i][0].test(produto.nome)) {
      return [FAIXAS_CONSOLE[i][1], FAIXAS_CONSOLE[i][2]];
    }
  }
  return [150, 1200];
}

const contexto = { window: {} };
vm.createContext(contexto);
vm.runInContext(fs.readFileSync(CATALOGO, 'utf8'), contexto);
const produtos = contexto.window.VH.PRODUTOS;

const precos = [];
const jogos = [];
const consoles = [];

for (const produto of produtos) {
  const faixa = produto.tipo === 'console' ? faixaDoConsole(produto) : faixaDoJogo(produto);

  /* Teto: 15% dos produtos recebem preco cheio (desconto). */
  const temDesconto = aleatorio() < 0.15;
  const valor = arredondar(entre(faixa[0], faixa[1]));

  const entrada = { preco: valor, de: null };
  if (temDesconto && valor > 9000) {
    /* "valor" ja esta em centavos: a multiplicacao acontece em reais,
       porque arredondar() converte de reais para centavos. */
    entrada.de = arredondar((valor / 100) * entre(1.25, 1.6));
    /* O preco cheio nunca pode ser menor que o de venda. */
    if (entrada.de <= valor) entrada.de = null;
  }

  const linha = "  '" + produto.id + "': { preco: " + entrada.preco + ', de: ' + entrada.de + ' },';
  (produto.tipo === 'console' ? consoles : jogos).push(linha);
}

const conteudo = `/*
 * VHARAK | precos.js
 * Precos da loja, em centavos.
 *
 * ####################################################################
 * #  ATENCAO: ESTES VALORES SAO PROVISORIOS.                    #
 * #  Foram sorteados para a vitrine ficar completa enquanto a    #
 * #  loja nao publica os precos de verdade. Substitua pelos      #
 * #  valores reais antes de divulgar a loja.                    #
 * #                                                                #
 * #  Para trocar: use o painel (Produtos e precos) e exporte o   #
 * #  arquivo, ou edite este arquivo direto.                      #
 * ####################################################################
 *
 * Gerado por tools/gerar-precos-placeholder.js (semente fixa:
 * rodar de novo produz os mesmos numeros).
 */
(function (global) {
  'use strict';

  var VH = global.VH || (global.VH = {});

  var PRECOS = {
    // ---- Jogos ----------------------------------------------------------
${jogos.join('\n')}

    // ---- Consoles -------------------------------------------------------
${consoles.join('\n')}
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

const conteudoFinal = conteudo;

const todos = [...jogos, ...consoles];
const valores = produtos.map((p) => {
  const entrada = new RegExp("'" + p.id + "': \\{ preco: (\\d+)").exec(conteudoFinal);
  return entrada ? Number(entrada[1]) / 100 : 0;
});
const comDesconto = produtos.filter((p) => {
  const entrada = new RegExp("'" + p.id + "': \\{ preco: \\d+, de: (null|\\d+)").exec(conteudoFinal);
  return entrada && entrada[1] !== 'null' && Number(entrada[1]) > 0;
}).length;

/* Conferenca: nenhum preco cheio pode ser menor que o de venda, e todo
   valor tem de estar acima de R$ 50. */
let problemas = 0;
for (const p of produtos) {
  const entrada = new RegExp("'" + p.id + "': \\{ preco: (\\d+), de: (null|\\d+)").exec(conteudoFinal);
  if (!entrada) { console.log('  X sem preco: ' + p.id); problemas += 1; continue; }
  const preco = Number(entrada[1]);
  const de = entrada[2] === 'null' ? null : Number(entrada[2]);
  if (preco <= 5000) { console.log('  X preco abaixo de R$ 50: ' + p.id); problemas += 1; }
  if (de !== null && de <= preco) { console.log('  X preco cheio menor que o de venda: ' + p.id); problemas += 1; }
}

console.log(`precos.js gerado com ${todos.length} precos provisorios.`);
console.log(`  menor: R$ ${Math.min(...valores).toFixed(2)} | maior: R$ ${Math.max(...valores).toFixed(2)}`);
console.log(`  com preco cheio: ${comDesconto} | jogos: ${jogos.length} | consoles: ${consoles.length}`);
if (problemas) {
  console.log(`\n${problemas} problema(s) nos valores gerados.`);
  process.exit(1);
}
