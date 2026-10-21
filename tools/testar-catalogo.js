/*
 * VHARAK | tools/testar-catalogo.js
 * Teste de fumaca do cartao de produto e dos filtros, sem navegador.
 *
 * Carrega os modulos num contexto com um documento falso e confere se o
 * HTML gerado tem o que a vitrine precisa: capa, titulo, selo de tipo,
 * selo de classificacao, preco e acoes.
 *
 * Uso: node tools/testar-catalogo.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const FRONTEND = path.join(__dirname, '..', 'frontend');

/* Documento falso: os modulos so precisam que addEventListener exista e
   que querySelectorAll devolva lista vazia. */
const documentoFalso = {
  addEventListener() {},
  querySelectorAll() { return []; },
  querySelector() { return null; },
  createElement() {
    return { className: '', textContent: '', style: {}, remove() {}, appendChild() {} };
  },
  body: { appendChild() {} },
  readyState: 'complete',
};

const contexto = {
  window: {},
  document: documentoFalso,
  localStorage: {
    _dados: {},
    getItem(chave) { return this._dados[chave] || null; },
    setItem(chave, valor) { this._dados[chave] = valor; },
    removeItem(chave) { delete this._dados[chave]; },
  },
  console,
  setTimeout,
  clearTimeout,
  Intl,
  URLSearchParams,
  Date,
  Math,
  JSON,
};
contexto.window = contexto;
contexto.global = contexto;
vm.createContext(contexto);

for (const nome of ['configuracao', 'dados-catalogo', 'precos', 'utils']) {
  vm.runInContext(fs.readFileSync(path.join(FRONTEND, 'js', nome + '.js'), 'utf8'), contexto);
}

const VH = contexto.window.VH;
const utils = VH.utils;

let falhas = 0;
function conferir(condicao, mensagem) {
  if (!condicao) {
    falhas += 1;
    console.log('  X ' + mensagem);
  }
}

console.log('\n[Card de jogo]');
const jogo = VH.buscarPorId('ps-elden-ring');
conferir(!!jogo, 'Elden Ring nao foi encontrado no catalogo');
const html = utils.criarCardProduto(jogo);

conferir(html.includes('Elden Ring'), 'o titulo nao aparece no card');
conferir(html.includes('/assets/jogos/'), 'a capa nao aponta para /assets/jogos/');
conferir(html.includes('badge-tipo jogo'), 'falta o selo de tipo JOGO');
conferir(html.includes('badge-class'), 'falta o selo de classificacao');
conferir(html.includes('/pages/produto.html?id=ps-elden-ring'), 'o link do card nao leva ao detalhe');
conferir(html.includes('href="https://wa.me/'), 'falta o link de WhatsApp com mensagem do produto');
conferir(html.includes('FromSoftware'), 'o estudio deveria aparecer na meta');

console.log('\n[Card sem preco publicado]');
/* O estado "sem preco" e o que a loja mostra ate publicar os valores:
   o aviso no lugar do preco e o WhatsApp no lugar da compra. */
const precoSalvo = VH.precos.todos['ps-elden-ring'];
VH.precos.todos['ps-elden-ring'] = { preco: null, de: null };
const htmlSemPreco = utils.criarCardProduto(jogo);

conferir(htmlSemPreco.includes('Falar no Zap'), 'sem preco, o botao principal deveria ser o WhatsApp');
conferir(!htmlSemPreco.includes('data-comprar'), 'sem preco, o card nao deveria oferecer compra direta');
conferir(htmlSemPreco.includes('Preco a anunciar'), 'sem preco, o card deveria avisar que o preco nao foi publicado');
conferir(!htmlSemPreco.includes('R$'), 'sem preco, o card nao deveria mostrar valor em reais');
VH.precos.todos['ps-elden-ring'] = precoSalvo;

console.log('\n[Card de console]');
const console_ = VH.buscarPorId('console-playstation-5');
conferir(!!console_, 'PlayStation 5 nao foi encontrado no catalogo');
if (console_) {
  const htmlConsole = utils.criarCardProduto(console_);
  conferir(htmlConsole.includes('badge-tipo console'), 'falta o selo de tipo CONSOLE');
  conferir(htmlConsole.includes('capa-console'), 'a foto do console deveria usar o encaixe sem corte');
  conferir(!htmlConsole.includes('badge-class'), 'console nao tem classificacao indicativa');
}

console.log('\n[Preco publicado]');
const comPreco = utils.criarCardProduto(jogo);
conferir(comPreco.includes('R$'), 'com preco publicado, o card mostra o valor');
conferir(comPreco.includes('data-comprar'), 'com preco, o botao de comprar aparece');
conferir(!comPreco.includes('Preco a anunciar'), 'com preco publicado, o aviso some');

console.log('\n[Escapamento]');
const nomeComAspas = { id: 'teste', nome: 'Jogo "X" & Cia <script>', tipo: 'jogo', generoRotulo: 'RPG', classificacao: '16', capa: 'assets/x.jpg', ano: 2020 };
const htmlCru = utils.criarCardProduto(nomeComAspas);
conferir(!htmlCru.includes('<script>'), 'o nome do produto deveria ser escapado');
conferir(htmlCru.includes('&lt;script&gt;'), 'o nome do produto deveria aparecer escapado');

console.log('\n[Busca do catalogo]');
conferir(VH.buscar('elden').length >= 1, 'a busca por "elden" deveria achar o jogo');
conferir(VH.buscar('playstation').length >= 1, 'a busca por plataforma deveria achar resultados');
conferir(VH.buscar('xyz-inexistente').length === 0, 'a busca por termo inexistente deveria devolver zero');
conferir(VH.destaques().length >= 10, 'deveria haver destaques suficientes para a home');
conferir(VH.maisVendidos().length >= 10, 'deveria haver titulospopulares suficientes para o Top 10');
conferir(VH.consoles().length === 23, 'deveriam existir 23 consoles');
conferir(VH.jogos().length === 105, 'deveriam existir 105 jogos');

console.log('\n[Precos publicados]');
/* Todo preco tem de ser um numero positivo, e o preco cheio nunca pode
   ser menor que o de venda. */
let precoInvalido = 0;
let precoBaixo = 0;
VH.PRODUTOS.forEach((produto) => {
  const preco = VH.precos.precoDe(produto.id);
  const de = VH.precos.precoDeAnterior(produto.id);
  if (preco === null) return;
  if (typeof preco !== 'number' || !isFinite(preco) || preco < 0) { precoInvalido += 1; }
  if (preco < 5000) precoBaixo += 1;
  if (de !== null && de <= preco) precoInvalido += 1;
});
conferir(precoInvalido === 0, 'nenhum preco invalido ou preco cheio menor que o de venda');
conferir(precoBaixo === 0, 'nenhum preco abaixo de R$ 50,00 (' + precoBaixo + ')');

console.log('\n[WhatsApp]');
const link = VH.configuracao.linkProduto(jogo);
conferir(link.startsWith('https://wa.me/55'), 'o link do WhatsApp deveria ter o codigo do pais');
conferir(decodeURIComponent(link).includes('Elden Ring'), 'a mensagem do WhatsApp deveria citar o produto');

console.log('\n' + '='.repeat(52));
console.log(falhas === 0 ? 'Todos os testes passaram.' : `${falhas} teste(s) falharam.`);
process.exit(falhas === 0 ? 0 : 1);
