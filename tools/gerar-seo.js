/*
 * VHARAK | tools/gerar-seo.js
 * Gera o sitemap.xml e o robots.txt da vitrine.
 *
 * Uso: node tools/gerar-seo.js [dominio]
 */
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const FRONTEND = path.join(RAIZ, 'frontend');
const DOMINIO = (process.argv[2] || 'https://vharak.com.br').replace(/\/$/, '');

const PAGINAS = [
  { caminho: '/', prioridade: '1.0', frequencia: 'daily' },
  { caminho: '/pages/catalogo.html', prioridade: '0.9', frequencia: 'daily' },
  { caminho: '/pages/consoles.html', prioridade: '0.8', frequencia: 'weekly' },
  { caminho: '/pages/ajuda.html', prioridade: '0.6', frequencia: 'monthly' },
  { caminho: '/pages/carrinho.html', prioridade: '0.5', frequencia: 'monthly' },
  { caminho: '/pages/login.html', prioridade: '0.3', frequencia: 'yearly' },
  { caminho: '/pages/cadastro.html', prioridade: '0.4', frequencia: 'yearly' },
  { caminho: '/pages/perfil.html', prioridade: '0.3', frequencia: 'yearly' },
];

/* As paginas de detalhe entram pela URL de produto, com o catalogo. */
function catalogo() {
  const vm = require('vm');
  const contexto = { window: {} };
  vm.createContext(contexto);
  vm.runInContext(fs.readFileSync(path.join(FRONTEND, 'js', 'dados-catalogo.js'), 'utf8'), contexto);
  return contexto.window.VH.PRODUTOS;
}

const urls = PAGINAS.map((pagina) => ({ ...pagina, data: null }));

catalogo().forEach((produto) => {
  urls.push({
    caminho: `/pages/produto.html?id=${encodeURIComponent(produto.id)}`,
    prioridade: produto.destaque ? '0.7' : '0.6',
    frequencia: 'weekly',
    data: produto.ano ? `${produto.ano}-01-01` : null,
  });
});

const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${urls.map((url) => `  <url>
    <loc>${DOMINIO}${url.caminho.replace(/&/g, '&amp;')}</loc>${url.data ? `\n    <lastmod>${url.data}</lastmod>` : ''}
    <changefreq>${url.frequencia}</changefreq>
    <priority>${url.prioridade}</priority>
  </url>`).join('\n')}
</urlset>
`;

const robots = `User-agent: *
Allow: /
Disallow: /pages/admin/

Sitemap: ${DOMINIO}/sitemap.xml
`;

fs.writeFileSync(path.join(FRONTEND, 'sitemap.xml'), sitemap, 'utf8');
fs.writeFileSync(path.join(FRONTEND, 'robots.txt'), robots, 'utf8');

console.log(`sitemap.xml com ${urls.length} URLs e robots.txt gerados para ${DOMINIO}.`);
