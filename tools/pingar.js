/*
 * VHARAK | tools/pingar.js
 * Pede cada rota do site para o servidor de preview e confere o status.
 *
 * Uso: node tools/pingar.js [porta]
 */
const http = require('http');
const { garantirServidor } = require('./garantir-servidor');

const PORTA = Number(process.argv[2]) || 8000;

const ROTAS = [
  '/',
  '/index.html',
  '/pages/catalogo.html',
  '/pages/consoles.html',
  '/pages/produto.html?id=ps-elden-ring',
  '/pages/carrinho.html',
  '/pages/login.html',
  '/pages/cadastro.html',
  '/pages/perfil.html',
  '/pages/ajuda.html',
  '/pages/admin/login.html',
  '/pages/admin/dashboard.html',
  '/pages/admin/produtos.html',
  '/pages/admin/pedidos.html',
  '/pages/admin/clientes.html',
  '/css/global.css',
  '/css/header.css',
  '/css/footer.css',
  '/css/product-card.css',
  '/css/home.css',
  '/css/catalog.css',
  '/css/product-detail.css',
  '/css/cart.css',
  '/css/auth.css',
  '/css/profile.css',
  '/css/help.css',
  '/js/configuracao.js',
  '/js/dados-catalogo.js',
  '/js/precos.js',
  '/js/precos-local.js',
  '/js/auth.js',
  '/js/cart.js',
  '/js/utils.js',
  '/js/home.js',
  '/js/catalog.js',
  '/js/product.js',
  '/js/cart-page.js',
  '/js/auth-page.js',
  '/js/profile.js',
  '/js/help.js',
  '/js/dados-ajuda.js',
  '/assets/favicon.svg',
  '/assets/logo.svg',
  '/assets/no-boxart.svg',
];

function pedir(rota) {
  return new Promise((resolve) => {
    http.get({ host: 'localhost', port: PORTA, path: rota }, (resposta) => {
      let tamanho = 0;
      resposta.on('data', (pedaco) => { tamanho += pedaco.length; });
      resposta.on('end', () => resolve({ rota, status: resposta.statusCode, tamanho }));
    }).on('error', (erro) => resolve({ rota, status: 0, tamanho: 0, erro: erro.message }));
  });
}

(async () => {
  /* O servidor sobe junto com o teste, se ja nao houver um no ar. */
  const servidor = await garantirServidor(PORTA);

  console.log(`\nPing em localhost:${PORTA}\n`);
  let falhas = 0;
  for (const rota of ROTAS) {
    const r = await pedir(rota);
    const marca = r.status === 200 ? 'ok ' : 'X ';
    if (r.status !== 200) falhas += 1;
    console.log(`  ${marca}${String(r.status).padStart(3)}  ${String(r.tamanho).padStart(7)} bytes  ${rota}`);
  }
  console.log('\n' + '='.repeat(56));
  console.log(falhas === 0 ? `Todas as ${ROTAS.length} rotas responderam 200.` : `${falhas} rota(s) com problema.`);
  await servidor.fechar();
  process.exit(falhas === 0 ? 0 : 1);
})();
