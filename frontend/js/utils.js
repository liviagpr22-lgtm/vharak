/*
 * VHARAK | utils.js
 * Nucleo compartilhado por todas as paginas: formatacao, badges, o card de
 * produto, o cabecalho, os avisos (toast) e o menu do celular.
 *
 * Nenhuma regra de negocio mora aqui: este arquivo le o catalogo
 * (dados-catalogo.js), os precos (precos.js) e a configuracao
 * (configuracao.js), e desenha o que cada pagina precisa.
 */
(function (global) {
  'use strict';

  var VH = global.VH || (global.VH = {});

  /* ------------------------------------------------------------------ *
   * Formatacao
   * ------------------------------------------------------------------ */

  function formatarMoeda(valor) {
    return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(valor || 0);
  }

  function formatarData(data) {
    return data ? new Date(data).toLocaleDateString('pt-BR') : '—';
  }

  function formatarDataHora(data) {
    return data ? new Date(data).toLocaleString('pt-BR') : '—';
  }

  function formatarNumero(valor) {
    return new Intl.NumberFormat('pt-BR').format(valor || 0);
  }

  /* Escapa texto que vai para dentro de HTML ou de atributo. */
  function escapar(texto) {
    return String(texto === null || texto === undefined ? '' : texto)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  /* ------------------------------------------------------------------ *
   * Badges
   * ------------------------------------------------------------------ */

  /* Classificacao indicativa (ClassInd): 7 quadradinhos de 30x30. */
  var CLASSES = {
    'livre': { fundo: 'var(--class-livre-fundo)', texto: '#fff', badge: 'L', titulo: 'Classificação indicativa: livre para todas as idades' },
    '10': { fundo: 'var(--class-10-fundo)', texto: '#fff', badge: '10', titulo: 'Classificação indicativa: 10 anos' },
    '12': { fundo: 'var(--class-12-fundo)', texto: '#111', badge: '12', titulo: 'Classificação indicativa: 12 anos' },
    '14': { fundo: 'var(--class-14-fundo)', texto: '#fff', badge: '14', titulo: 'Classificação indicativa: 14 anos' },
    '16': { fundo: 'var(--class-16-fundo)', texto: '#fff', badge: '16', titulo: 'Classificação indicativa: 16 anos' },
    '18': { fundo: 'var(--class-18-fundo)', texto: '#fff', badge: '18', titulo: 'Classificação indicativa: 18 anos' }
  };

  function badgeClassificacao(produto) {
    if (!produto || produto.tipo === 'console') return '';
    var dados = CLASSES[String(produto.classificacao || '').toLowerCase()];
    if (!dados) return '';
    return '<span class="badge-class" style="background:' + dados.fundo + ';color:' + dados.texto + '" title="'
      + escapar(dados.titulo) + '">' + dados.badge + '</span>';
  }

  /* Tipo do produto: jogo, console ou acessorio. */
  var TIPOS = {
    jogo: { rotulo: 'Jogo', classe: 'jogo' },
    console: { rotulo: 'Console', classe: 'console' },
    acessorio: { rotulo: 'Acessório', classe: 'acessorio' }
  };

  function tipoDoProduto(produto) {
    return TIPOS[produto && produto.tipo] || TIPOS.jogo;
  }

  function badgeTipo(produto) {
    var tipo = tipoDoProduto(produto);
    return '<span class="badge-tipo ' + tipo.classe + '">' + tipo.rotulo + '</span>';
  }

  /* ------------------------------------------------------------------ *
   * Preco
   * ------------------------------------------------------------------ */

  function precoDe(produto) {
    if (!produto || !VH.precos) return null;
    return VH.precos.precoDe(produto.id);
  }

  function precoDeAnterior(produto) {
    if (!produto || !VH.precos) return null;
    return VH.precos.precoDeAnterior(produto.id);
  }

  function descontoDe(produto) {
    if (!produto || !VH.precos) return null;
    return VH.precos.desconto(produto.id);
  }

  /* Sem preco publicado, a venda acontece na conversa: o botao principal
     do produto vira "Consultar no WhatsApp". */
  function precoPublicado(produto) {
    return precoDe(produto) !== null;
  }

  /* ------------------------------------------------------------------ *
   * Card de produto
   * ------------------------------------------------------------------ */

  function linkDoProduto(produto) {
    return '/pages/produto.html?id=' + encodeURIComponent(produto.id);
  }

  function linhaDeMeta(produto) {
    var partes = [];
    if (produto.tipo === 'console') {
      partes.push(produto.fabricante ? formatarFabricante(produto.fabricante) : '');
      if (produto.geracaoRotulo) partes.push(produto.geracaoRotulo);
    } else {
      partes.push(produto.generoRotulo || '');
      if (produto.ano) partes.push(String(produto.ano));
      if (produto.desenvolvedora) partes.push(produto.desenvolvedora);
    }
    return partes.filter(Boolean).join(' • ');
  }

  function formatarFabricante(id) {
    var mapa = { playstation: 'PlayStation', xbox: 'Xbox', nintendo: 'Nintendo' };
    return mapa[id] || id;
  }

  function tagsDoCard(produto) {
    var tags = [];
    if (produto.novo) tags.push('<span class="mini-tag tag-novo">Novo</span>');
    if (typeof produto.popularidade === 'number' && produto.popularidade >= 92) {
      tags.push('<span class="mini-tag tag-vendido">Mais vendido</span>');
    }
    if (typeof produto.nota === 'number' && produto.nota > 0) {
      tags.push('<span class="mini-tag tag-nota">★ ' + String(produto.nota).replace('.', ',') + '</span>');
    }
    return tags.length ? '<div class="card-tags">' + tags.join('') + '</div>' : '';
  }

  function blocoDePreco(produto) {
    var preco = precoDe(produto);
    var anterior = precoDeAnterior(produto);
    var desconto = descontoDe(produto);

    if (preco === null) {
      return '<div class="precos preco-a-anunciar">'
        + '<span class="sem-preco">Preco a anunciar</span>'
        + '</div>';
    }

    var html = '<div class="precos">';
    if (desconto) {
      html += '<span class="de">R$ ' + (anterior / 100).toFixed(2).replace('.', ',') + '</span>';
    }
    html += '<span class="valor">R$ ' + (preco / 100).toFixed(2).replace('.', ',') + '</span>';
    html += '</div>';
    return html;
  }

  function seloDeDesconto(produto) {
    var desconto = descontoDe(produto);
    if (!desconto) return '';
    return '<span class="badge-desconto">-' + desconto + '%</span>';
  }

  function acoesDoCard(produto) {
    var id = escapar(produto.id);
    var nome = escapar(produto.nome);
    var zap = VH.configuracao.linkProduto(produto);

    if (!precoPublicado(produto)) {
      return '<div class="acoes">'
        + '<a class="btn btn-whatsapp btn-sm acoes-zap" href="' + escapar(zap) + '" target="_blank" rel="noopener">'
        + '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23a8.2 8.2 0 0 1 5.83 2.42 8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.8-.78.97-.15.16-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.16 0-.43.06-.65.31-.23.25-.86.84-.86 2.05 0 1.21.88 2.38 1 2.54.13.17 1.74 2.65 4.21 3.71.59.26 1.05.41 1.4.52.59.19 1.13.16 1.55.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.47-.29Z"/></svg>'
        + 'Falar no Zap</a>'
        + '</div>';
    }

    return '<div class="acoes">'
      + '<button class="btn btn-primary btn-sm acoes-comprar" type="button" data-comprar="' + id + '" data-nome="' + nome + '">Comprar</button>'
      + '<a class="btn btn-secondary btn-sm acoes-zap" href="' + escapar(zap) + '" target="_blank" rel="noopener" aria-label="Falar sobre ' + nome + ' no WhatsApp">'
      + '<svg viewBox="0 0 24 24" fill="currentColor" aria-hidden="true"><path d="M12.04 2C6.58 2 2.13 6.45 2.13 11.91c0 1.75.46 3.46 1.32 4.96L2 22l5.25-1.38a9.9 9.9 0 0 0 4.79 1.22h.01c5.46 0 9.91-4.45 9.91-9.91 0-2.65-1.03-5.14-2.9-7.01A9.82 9.82 0 0 0 12.04 2Zm0 18.15h-.01a8.2 8.2 0 0 1-4.19-1.15l-.3-.18-3.12.82.83-3.04-.2-.31a8.19 8.19 0 0 1-1.26-4.38c0-4.54 3.7-8.23 8.25-8.23a8.2 8.2 0 0 1 5.83 2.42 8.18 8.18 0 0 1 2.41 5.82c0 4.54-3.7 8.23-8.24 8.23Zm4.52-6.16c-.25-.12-1.47-.72-1.69-.81-.23-.08-.39-.12-.56.13-.16.25-.64.8-.78.97-.15.16-.29.19-.54.06-.25-.12-1.05-.39-2-1.23-.74-.66-1.24-1.47-1.38-1.72-.15-.25-.02-.39.11-.51.11-.11.25-.29.37-.43.13-.15.17-.25.25-.41.08-.17.04-.31-.02-.44-.06-.12-.56-1.34-.76-1.84-.2-.48-.4-.42-.56-.43h-.47c-.16 0-.43.06-.65.31-.23.25-.86.84-.86 2.05 0 1.21.88 2.38 1 2.54.13.17 1.74 2.65 4.21 3.71.59.26 1.05.41 1.4.52.59.19 1.13.16 1.55.1.47-.07 1.47-.6 1.67-1.18.21-.58.21-1.07.15-1.18-.06-.11-.22-.17-.47-.29Z"/></svg>'
      + '</a>'
      + '</div>';
  }

  /* Monta o card. O link principal e o titulo, com uma area esticada que
     torna o card inteiro clicavel sem tirar o botao de compra. */
  function criarCardProduto(produto) {
    if (!produto) return '';
    var link = linkDoProduto(produto);
    var capa = produto.capa ? '/' + produto.capa : '/assets/no-boxart.svg';
    var classeCapa = produto.tipo === 'console' ? 'capa-console' : 'capa-jogo';

    return '<article class="card-produto">'
      + '<div class="capa ' + classeCapa + '">'
      + '<img src="' + escapar(capa) + '" alt="Capa de ' + escapar(produto.nome) + '" loading="lazy" onerror="this.onerror=null;this.src=\'/assets/no-boxart.svg\'">'
      + badgeTipo(produto)
      + badgeClassificacao(produto)
      + seloDeDesconto(produto)
      + '</div>'
      + '<div class="corpo">'
      + '<h3><a href="' + link + '">' + escapar(produto.nome) + '</a></h3>'
      + '<p class="meta">' + escapar(linhaDeMeta(produto)) + '</p>'
      + tagsDoCard(produto)
      + blocoDePreco(produto)
      + '</div>'
      + acoesDoCard(produto)
      + '</article>';
  }

  /* ------------------------------------------------------------------ *
   * Aviso (toast)
   * ------------------------------------------------------------------ */

  function mostrarAviso(mensagem, tipo) {
    var existente = document.querySelector('.toast');
    if (existente) existente.remove();
    var aviso = document.createElement('div');
    aviso.className = 'toast ' + (tipo === 'erro' ? 'error-msg' : 'success-msg');
    aviso.textContent = mensagem;
    document.body.appendChild(aviso);
    setTimeout(function () { aviso.remove(); }, 3200);
  }

  /* ------------------------------------------------------------------ *
   * Cabecalho: link ativo, menu de conta e comportamento do mobile
   * ------------------------------------------------------------------ */

  function marcarLinkAtivo() {
    var links = document.querySelectorAll('.nav-links a');
    if (!links.length) return;
    var caminho = window.location.pathname;
    var busca = window.location.search;

    links.forEach(function (link) {
      var href = link.getAttribute('href') || '';
      link.classList.remove('active');
      link.removeAttribute('aria-current');

      var ativo = false;
      if (href === '/' || href === '/index.html') {
        ativo = caminho === '/' || caminho.endsWith('/index.html');
      } else if (caminho.indexOf('produto') !== -1) {
        ativo = href.indexOf('catalogo') !== -1;
      } else if (caminho.indexOf('catalogo') !== -1) {
        ativo = href.indexOf('catalogo') !== -1;
        if (ativo && href.indexOf('tipo=') !== -1) {
          var tipoHref = href.split('tipo=')[1];
          var tipoAtual = busca.indexOf('tipo=') !== -1 ? busca.split('tipo=')[1].split('&')[0] : '';
          ativo = tipoHref === tipoAtual;
        }
      } else if (caminho.indexOf('consoles') !== -1) {
        ativo = href.indexOf('consoles') !== -1;
      }

      if (ativo) {
        link.classList.add('active');
        link.setAttribute('aria-current', 'page');
      }
    });
  }

  function montarMenuConta() {
    var caixa = document.getElementById('user-menu');
    if (!caixa) return;
    var sessao = VH.auth && VH.auth.sessao ? VH.auth.sessao() : null;

    if (!sessao) {
      caixa.innerHTML = '<a href="/pages/login.html" class="btn btn-secondary btn-sm">Entrar</a>';
      return;
    }

    var iniciais = (sessao.nome || 'V')
      .split(' ').filter(Boolean).slice(0, 2)
      .map(function (parte) { return parte.charAt(0).toUpperCase(); }).join('');

    caixa.innerHTML = '<div class="user-wrapper">'
      + '<button class="user-btn" type="button" aria-haspopup="true" aria-expanded="false" onclick="alternarMenuConta()" title="' + escapar(sessao.nome) + '">' + escapar(iniciais) + '</button>'
      + '<div class="user-dropdown" id="user-dropdown">'
      + '<a href="/pages/perfil.html">Meu perfil</a>'
      + '<a href="/pages/perfil.html#pedidos">Meus pedidos</a>'
      + '<a href="/pages/ajuda.html">Ajuda</a>'
      + '<button type="button" onclick="VH.auth.sair()">Sair</button>'
      + '</div>'
      + '</div>';
  }

  function alternarMenuConta() {
    var menu = document.getElementById('user-dropdown');
    if (!menu) return;
    var aberto = menu.classList.toggle('show');
    var botao = document.querySelector('.user-btn');
    if (botao) botao.setAttribute('aria-expanded', aberto ? 'true' : 'false');
  }

  function inicializarMenuCelular() {
    var botao = document.querySelector('.nav-toggle');
    var lista = document.querySelector('.nav .nav-links');
    if (!botao || !lista) return;
    botao.addEventListener('click', function () {
      var aberto = lista.classList.toggle('show');
      botao.setAttribute('aria-expanded', aberto ? 'true' : 'false');
    });
  }

  function aoRolar() {
    var cabecalho = document.querySelector('.header');
    if (!cabecalho) return;
    cabecalho.classList.toggle('scrolled', window.scrollY > 10);
  }

  function renderizarCabecalho() {
    if (document.querySelector('.admin-layout')) return;
    aplicarLinksDeContato();
    marcarLinkAtivo();
    montarMenuConta();
    inicializarMenuCelular();
    window.addEventListener('scroll', aoRolar, { passive: true });
    aoRolar();
    if (VH.carrinho) VH.carrinho.atualizarContador();
  }

  document.addEventListener('click', function (evento) {
    var menu = document.getElementById('user-dropdown');
    if (menu && !evento.target.closest('.user-wrapper')) {
      menu.classList.remove('show');
      var botao = document.querySelector('.user-btn');
      if (botao) botao.setAttribute('aria-expanded', 'false');
    }
  });

  /* ------------------------------------------------------------------ *
   * Links de contato
   *
   * O numero, o e-mail e as redes vivem so em configuracao.js. Os links
   * sao marcados no HTML com data-zap, data-telefone e data-email, e sao
   * preenchidos aqui: nenhum HTML repete o numero da loja.
   * ------------------------------------------------------------------ */

  function aplicarLinksDeContato() {
    var config = VH.configuracao;
    if (!config) return;

    document.querySelectorAll('[data-zap]').forEach(function (elemento) {
      var mensagem = elemento.getAttribute('data-zap-mensagem') || '';
      var link = config.linkWhatsapp(mensagem);
      if (!link) {
        /* Sem numero publicado: o botao avisa em vez de abrir conversa
           invalida. */
        elemento.setAttribute('aria-disabled', 'true');
        elemento.addEventListener('click', function (evento) {
          evento.preventDefault();
          mostrarAviso('O canal de WhatsApp sera publicado em breve.', 'erro');
        });
        return;
      }
      elemento.setAttribute('href', link);
      elemento.setAttribute('target', '_blank');
      elemento.setAttribute('rel', 'noopener');
    });

    document.querySelectorAll('[data-telefone]').forEach(function (elemento) {
      var link = config.linkTelefone();
      if (link) {
        elemento.setAttribute('href', link);
      } else {
        elemento.textContent = config.numeroFormatado();
      }
    });

    document.querySelectorAll('[data-email]').forEach(function (elemento) {
      var email = config.contato && config.contato.email;
      if (email) {
        elemento.setAttribute('href', 'mailto:' + email);
        elemento.textContent = email;
      }
    });

    document.querySelectorAll('[data-instagram]').forEach(function (elemento) {
      var link = config.linkInstagram();
      if (link) {
        elemento.setAttribute('href', link);
      }
    });
  }

  /* ------------------------------------------------------------------ *
   * Exportacao
   * ------------------------------------------------------------------ */

  VH.utils = {
    formatarMoeda: formatarMoeda,
    formatarData: formatarData,
    formatarDataHora: formatarDataHora,
    formatarNumero: formatarNumero,
    formatarFabricante: formatarFabricante,
    escapar: escapar,
    badgeClassificacao: badgeClassificacao,
    badgeTipo: badgeTipo,
    tipoDoProduto: tipoDoProduto,
    precoDe: precoDe,
    precoDeAnterior: precoDeAnterior,
    descontoDe: descontoDe,
    precoPublicado: precoPublicado,
    linkDoProduto: linkDoProduto,
    linhaDeMeta: linhaDeMeta,
    criarCardProduto: criarCardProduto,
    mostrarAviso: mostrarAviso,
    aplicarLinksDeContato: aplicarLinksDeContato,
    renderizarCabecalho: renderizarCabecalho,
    alternarMenuConta: alternarMenuConta
  };

  global.alternarMenuConta = alternarMenuConta;

  document.addEventListener('DOMContentLoaded', function () {
    renderizarCabecalho();
  });
}(window));
