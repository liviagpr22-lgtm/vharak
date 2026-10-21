/*
 * VHARAK | tools/gerar-paginas.js
 *
 * Monta as paginas publicas a partir de um gabarito unico de cabecalho e
 * rodape. O resultado e HTML puro, servido sem build; o gerador existe
 * so para o cabecalho e o rodape nao ficarem em dez lugares diferentes.
 *
 * Uso:
 *   node tools/gerar-paginas.js
 *
 * Cada fonte em frontend/pages/src/ vira um HTML em frontend/pages/.
 * A home vira frontend/index.html (o backend serve a raiz do frontend).
 */
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const SRC = path.join(RAIZ, 'frontend', 'pages', 'src');
const DESTINO = path.join(RAIZ, 'frontend', 'pages');

const ICONE_ZAP = '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23a8.2 8.2 0 0 1 5.83 2.42 8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.8-.78.97-.15.16-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.16 0-.43.06-.65.31-.23.25-.86.84-.86 2.05 0 1.21.88 2.38 1 2.54.13.17 1.74 2.65 4.21 3.71.59.26 1.05.41 1.4.52.59.19 1.13.16 1.55.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.47-.29Z"/></svg>';

const ICONE_LOGO = '<svg class="logo-icon" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M21 6H3C1.9 6 1 6.9 1 8v8c0 1.1.9 2 2 2h3l2-2h8l2 2h3c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2zm-8 3.5h-2V12H9.5v-2.5h-2v-2h2V5h2v2.5h2v2zM17.5 12c-.83 0-1.5-.67-1.5-1.5S16.67 9 17.5 9s1.5.67 1.5 1.5S18.33 12 17.5 12zm3 0c-.83 0-1.5-.67-1.5-1.5S19.67 9 20.5 9s1.5.67 1.5 1.5-.67 1.5-1.5 1.5z"/></svg>';

const ICONE_CARRINHO = '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>';

function cabecalho(ativo) {
  const item = (href, rotulo, chave) => {
    const classe = ativo === chave ? ' class="active" aria-current="page"' : '';
    return `<li><a href="${href}"${classe}>${rotulo}</a></li>`;
  };

  return `<header class="header">
  <nav class="nav container-largo">
    <a href="/" class="logo">
      ${ICONE_LOGO}
      <span><span class="marca-a">V</span><span class="marca-b">HARAK</span></span>
    </a>
    <button class="nav-toggle" type="button" aria-label="Abrir menu" aria-expanded="false" aria-controls="menu-principal">☰</button>
    <ul class="nav-links" id="menu-principal">
      ${item('/', 'Início', 'inicio')}
      ${item('/pages/catalogo.html?tipo=jogo', 'Jogos', 'jogos')}
      ${item('/pages/consoles.html', 'Consoles', 'consoles')}
      ${item('/pages/ajuda.html', 'Ajuda', 'ajuda')}
    </ul>
    <div class="nav-right">
      <a class="zap-header" data-zap data-zap-mensagem="Olá! Quero saber os preços dos jogos e consoles da VHARAK." href="#">
        ${ICONE_ZAP}
        <span>WhatsApp</span>
      </a>
      <a href="/pages/carrinho.html" class="cart-btn" aria-label="Carrinho">
        ${ICONE_CARRINHO}
        <span class="cart-count" id="contador-carrinho"></span>
      </a>
      <div class="user-menu" id="user-menu"></div>
    </div>
  </nav>
</header>`;
}

function rodape() {
  const link = (href, rotulo) => `<a href="${href}">${rotulo}</a>`;

  return `<footer class="footer">
  <div class="footer-inner">
    <div class="footer-grid">
      <div>
        <div class="footer-brand">
          ${ICONE_LOGO}
          <span><span class="marca-a">V</span><span class="marca-b">HARAK</span></span>
        </div>
        <p class="footer-about">Loja de jogos, consoles e acessórios. Curadoria de título, informação completa e entrega para todo o Brasil.</p>
      </div>
      <div>
        <h4>Loja</h4>
        <div class="footer-links">
          ${link('/pages/catalogo.html?tipo=jogo', 'Jogos')}
          ${link('/pages/consoles.html', 'Consoles')}
          ${link('/pages/catalogo.html?ordenar=novidades', 'Lançamentos')}
          ${link('/pages/catalogo.html?ordenar=vendidos', 'Mais vendidos')}
          ${link('/pages/carrinho.html', 'Carrinho')}
        </div>
      </div>
      <div>
        <h4>Conta</h4>
        <div class="footer-links">
          ${link('/pages/login.html', 'Entrar')}
          ${link('/pages/cadastro.html', 'Criar conta')}
          ${link('/pages/perfil.html', 'Meu perfil')}
          ${link('/pages/perfil.html#pedidos', 'Meus pedidos')}
          ${link('/pages/ajuda.html', 'Central de ajuda')}
        </div>
      </div>
      <div>
        <h4>Fale conosco</h4>
        <div class="footer-contato">
          <a class="btn btn-whatsapp btn-sm" data-zap data-zap-mensagem="Olá! Preciso de ajuda com a VHARAK." href="#">
            ${ICONE_ZAP}
            Chamar no WhatsApp
          </a>
          <a class="telefone" data-telefone href="#">(12) 98188-3097</a>
          <a data-email href="mailto:contato@vharak.com.br">contato@vharak.com.br</a>
        </div>
      </div>
    </div>
    <div class="footer-bottom">
      <p>&copy; 2026 VHARAK - Loja de jogos e consoles. Todos os direitos reservados.</p>
      <div class="footer-legal">
        ${link('/pages/ajuda.html#privacidade', 'Política de privacidade')}
        ${link('/pages/ajuda.html#termos', 'Termos de uso')}
        ${link('/pages/ajuda.html', 'Ajuda')}
      </div>
    </div>
  </div>
</footer>

<a class="zap-flutuante" data-zap data-zap-mensagem="Olá! Vim pelo site da VHARAK." href="#" aria-label="Falar no WhatsApp">
  ${ICONE_ZAP}
  <span>Falar no Zap</span>
</a>`;
}

/* ---- Area administrativa ------------------------------------------------------ *
 * O painel nao usa o cabecalho da loja: quem administra nao e cliente.
 * Ele tem uma barra lateral propria e um conteudo que comeca depois
 * dela.                                                                       */
const ICONES_ADMIN = {
  painel: '<path d="M3 3h8v8H3zM13 3h8v5h-8zM13 10h8v11h-8zM3 13h8v8H3z"/>',
  produtos: '<path d="M20 7h-3V5a2 2 0 0 0-2-2H9a2 2 0 0 0-2 2v2H4a1 1 0 0 0-1 1v11a1 1 0 0 0 1 1h16a1 1 0 0 0 1-1V8a1 1 0 0 0-1-1zM9 5h6v2H9z"/>',
  pedidos: '<path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0z"/>',
  clientes: '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2M9 11a4 4 0 0 0 0-8 4 4 0 0 0 0 8zM22 21v-2a4 4 0 0 0-3-3.9"/>',
};

function iconeAdmin(nome) {
  return `<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" aria-hidden="true">${ICONES_ADMIN[nome] || ''}</svg>`;
}

function lateralAdmin(ativo) {
  const item = (chave, href, rotulo, icone) => {
    const classe = ativo === chave ? ' class="active" aria-current="page"' : '';
    return `<a href="${href}"${classe}>${iconeAdmin(icone)}<span>${rotulo}</span></a>`;
  };

  return `<aside class="admin-lateral">
  <div class="admin-marca">
    ${ICONE_LOGO}
    <span><span class="marca-a">V</span><span class="marca-b">HARAK</span></span>
  </div>
  <nav class="admin-menu">
    ${item('painel', '/pages/admin/dashboard.html', 'Painel', 'painel')}
    ${item('produtos', '/pages/admin/produtos.html', 'Produtos e precos', 'produtos')}
    ${item('pedidos', '/pages/admin/pedidos.html', 'Pedidos', 'pedidos')}
    ${item('clientes', '/pages/admin/clientes.html', 'Clientes', 'clientes')}
  </nav>
  <div class="admin-sair">
    <button class="btn btn-secondary btn-sm" type="button" data-sair>Sair do painel</button>
  </div>
</aside>`;
}

function montarAdmin({ titulo, descricao, ativo, css = [], js = [] }) {
  const linksCss = css.map((nome) => `  <link rel="stylesheet" href="/css/${nome}.css">`).join('\n');

  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titulo} | VHARAK Painel</title>
  <meta name="description" content="${descricao}">
  <meta name="robots" content="noindex, nofollow">
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
${linksCss}
</head>
<body>
<div class="admin-layout">
${lateralAdmin(ativo)}
<main class="admin-conteudo" id="conteudo">
{{CONTEUDO}}
</main>
</div>
<script src="/js/configuracao.js"></script>
<script src="/js/dados-catalogo.js"></script>
<script src="/js/precos.js"></script>
<script src="/js/precos-local.js"></script>
<script src="/js/auth.js"></script>
<script src="/js/cart.js"></script>
<script src="/js/utils.js"></script>
<script src="/js/admin.js"></script>
</body>
</html>
`;
}

const DOMINIO = 'https://vharak.com.br';

/* Monta o <head> a partir das listas de CSS e JS da fonte. */
function montarHead({ titulo, descricao, css = [], og = '', canonico = '' }) {
  const linksCss = css.map((nome) => `  <link rel="stylesheet" href="/css/${nome}.css">`).join('\n');
  const linkCanonico = canonico ? `\n  <link rel="canonical" href="${DOMINIO}${canonico}">` : '';
  return `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${titulo}</title>
  <meta name="description" content="${descricao}">
  <meta name="theme-color" content="#0a0a0a">
  <meta name="author" content="VHARAK">
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">${linkCanonico}
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
${linksCss}
  <meta property="og:type" content="website">
  <meta property="og:site_name" content="VHARAK">
  <meta property="og:title" content="${titulo}">
  <meta property="og:description" content="${descricao}">
  <meta property="og:url" content="${DOMINIO}${canonico}">${og}
  <script type="application/ld+json">
  {
    "@context": "https://schema.org",
    "@type": "OnlineStore",
    "name": "VHARAK",
    "description": "Loja de jogos, consoles e acessórios.",
    "url": "${DOMINIO}",
    "email": "contato@vharak.com.br",
    "telephone": "+55${'12'}981883097",
    "currenciesAccepted": "BRL",
    "paymentAccepted": "WhatsApp, Pix, cartao de credito"
  }
  </script>
</head>
<body>
<a class="pular-para-conteudo" href="#conteudo">Pular para o conteúdo</a>`;
}

/* A ordem dos scripts importa: configuracao -> catalogo -> precos ->
   sessao -> carrinho -> utilitarios -> modulo da pagina. */
function montarScripts(js) {
  const base = ['configuracao', 'dados-catalogo', 'precos', 'precos-local', 'auth', 'cart', 'utils'];
  const todos = base.concat(js);
  return todos.map((nome) => `<script src="/js/${nome}.js"></script>`).join('\n');
}

/* ---- Le as fontes --------------------------------------------------------- */
const fontes = fs.readdirSync(SRC).filter((nome) => nome.endsWith('.html') && !nome.startsWith('_'));

/* As paginas do painel ficam em src/admin/ e usam o layout proprio. */
const SRC_ADMIN = path.join(SRC, 'admin');
const fontesAdmin = fs.existsSync(SRC_ADMIN)
  ? fs.readdirSync(SRC_ADMIN).filter((nome) => nome.endsWith('.html') && !nome.startsWith('_'))
  : [];

/* Remove o bloco de scripts do admin: ele ja vem no gabarito. */
function limparScripts(corpo) {
  return corpo.replace(/<script[\s\S]*?<\/script>/g, '').trim();
}

function montarPaginaAdmin(nome) {
  const bruto = fs.readFileSync(path.join(SRC_ADMIN, nome), 'utf8');

  const meta = {
    titulo: (bruto.match(/<!--\s*titulo:\s*(.+?)\s*-->/) || [])[1],
    descricao: (bruto.match(/<!--\s*descricao:\s*(.+?)\s*-->/) || [])[1],
    ativo: (bruto.match(/<!--\s*ativo:\s*(.+?)\s*-->/) || [])[1] || '',
    css: (bruto.match(/<!--\s*css:\s*(.+?)\s*-->/) || [])[1] || '',
  };

  if (!meta.titulo || !meta.descricao) {
    console.log(`  ! admin/${nome}: falta <!-- titulo: --> ou <!-- descricao: -->`);
    return;
  }

  const corpo = limparScripts(bruto.replace(/<!--[\s\S]*?-->/g, '').trim());

  /* A pagina de login do painel nao tem lateral: e uma tela sozinha. */
  let saida;
  if (nome === 'login.html') {
    saida = `<!DOCTYPE html>
<html lang="pt-BR">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${meta.titulo} | VHARAK Painel</title>
  <meta name="description" content="${meta.descricao}">
  <meta name="robots" content="noindex, nofollow">
  <link rel="icon" href="/assets/favicon.svg" type="image/svg+xml">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800;900&display=swap" rel="stylesheet">
${meta.css.split(',').map((c) => `  <link rel="stylesheet" href="/css/${c.trim()}.css">`).join('\n')}
</head>
<body>
<main id="conteudo">
${corpo}
</main>
<script src="/js/configuracao.js"></script>
<script src="/js/dados-catalogo.js"></script>
<script src="/js/precos.js"></script>
<script src="/js/precos-local.js"></script>
<script src="/js/auth.js"></script>
<script src="/js/cart.js"></script>
<script src="/js/utils.js"></script>
<script src="/js/admin.js"></script>
</body>
</html>
`;
  } else {
    saida = montarAdmin({
      titulo: meta.titulo,
      descricao: meta.descricao,
      ativo: meta.ativo,
      css: meta.css.split(',').map((c) => c.trim()).filter(Boolean),
    }).replace('{{CONTEUDO}}', corpo);
  }

  const destino = path.join(DESTINO, 'admin', nome);
  fs.mkdirSync(path.dirname(destino), { recursive: true });
  fs.writeFileSync(destino, saida, 'utf8');
  console.log(`  ok ${path.relative(RAIZ, destino)}`);
}

let geradas = 0;
for (const nome of fontesAdmin) {
  montarPaginaAdmin(nome);
  geradas += 1;
}
for (const nome of fontes) {
  const bruto = fs.readFileSync(path.join(SRC, nome), 'utf8');

  const meta = {
    titulo: (bruto.match(/<!--\s*titulo:\s*(.+?)\s*-->/) || [])[1],
    descricao: (bruto.match(/<!--\s*descricao:\s*(.+?)\s*-->/) || [])[1],
    ativo: (bruto.match(/<!--\s*ativo:\s*(.+?)\s*-->/) || [])[1] || '',
    css: (bruto.match(/<!--\s*css:\s*(.+?)\s*-->/) || [])[1] || '',
    js: (bruto.match(/<!--\s*js:\s*(.+?)\s*-->/) || [])[1] || '',
    og: (bruto.match(/<!--\s*og:\s*(.+?)\s*-->/) || [])[1] || '',
  };

  if (!meta.titulo || !meta.descricao) {
    console.log(`  ! ${nome}: falta <!-- titulo: --> ou <!-- descricao: -->`);
    continue;
  }

  const listaCss = meta.css.split(',').map((s) => s.trim()).filter(Boolean);
  const listaJs = meta.js.split(',').map((s) => s.trim()).filter(Boolean);

  /* O corpo vem entre os marcadores. */
  const corpo = bruto
    .replace(/<!--[\s\S]*?-->/g, '')
    .replace(/<main class="main-content([^"]*)"/, '<main class="main-content$1" id="conteudo"')
    .trim();

  const canonico = nome === 'index.html' ? '/' : '/pages/' + nome;

  let saida = montarHead({
    titulo: meta.titulo,
    descricao: meta.descricao,
    css: listaCss,
    canonico: canonico,
    og: meta.og ? `\n  ${meta.og}` : '',
  });

  saida += '\n\n' + cabecalho(meta.ativo) + '\n\n' + corpo + '\n\n' + rodape() + '\n\n'
    + montarScripts(listaJs) + '\n</body>\n</html>\n';

  const destino = nome === 'index.html'
    ? path.join(RAIZ, 'frontend', 'index.html')
    : path.join(DESTINO, nome);

  fs.writeFileSync(destino, saida, 'utf8');
  geradas += 1;
  console.log(`  ok ${path.relative(RAIZ, destino)}`);
}

console.log(`\n${geradas} pagina(s) gerada(s).`);
