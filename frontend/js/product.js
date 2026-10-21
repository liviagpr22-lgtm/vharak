/*
 * VHARAK | product.js
 * Pagina de detalhe do produto.
 *
 * A pagina e a mesma para jogos e consoles: o que muda e o que existe no
 * catalogo. Tudo o que o cliente precisa saber fica na tela antes da
 * dobra: nome, plataformas, preco e o botao de compra ou de conversa.
 */
(function (global) {
  'use strict';

  var VH = global.VH || (global.VH = {});

  var CHAVE_AVALIACOES = 'vharak_avaliacoes';

  function produtoAtual() {
    var id = new URLSearchParams(global.location.search).get('id');
    return VH.buscarPorId(id);
  }

  function escapar(texto) {
    return VH.utils.escapar(texto);
  }

  /* ---- Meta: o que aparece em cima do titulo ---------------------------- */
  function linhaDeMeta(produto) {
    var itens = [];

    if (produto.tipo === 'console') {
      itens.push('<span class="meta-item">' + escapar(VH.utils.formatarFabricante(produto.fabricante)) + '</span>');
      if (produto.geracaoRotulo) itens.push('<span class="meta-item">' + escapar(produto.geracaoRotulo) + '</span>');
      if (produto.ano) itens.push('<span class="meta-item">' + escapar(String(produto.ano)) + '</span>');
    } else {
      if (produto.generoRotulo) itens.push('<span class="meta-item">' + escapar(produto.generoRotulo) + '</span>');
      if (produto.ano) itens.push('<span class="meta-item">' + escapar(String(produto.ano)) + '</span>');
      if (produto.desenvolvedora) itens.push('<span class="meta-item">' + escapar(produto.desenvolvedora) + '</span>');
    }

    if (typeof produto.nota === 'number' && produto.nota > 0) {
      itens.push('<span class="meta-item nota">★ ' + String(produto.nota).replace('.', ',')
        + (produto.avaliacoes ? ' (' + VH.utils.formatarNumero(produto.avaliacoes) + ' avaliações)' : '') + '</span>');
    }

    if (produto.tipo === 'jogo' && produto.classificacao) {
      itens.push(VH.utils.badgeClassificacao(produto));
    }

    return itens.join('');
  }

  /* ---- Preco --------------------------------------------------------------- */
  function blocoDePreco(produto) {
    var preco = VH.utils.precoDe(produto);
    var anterior = VH.utils.precoDeAnterior(produto);
    var desconto = VH.utils.descontoDe(produto);

    if (preco === null) {
      return '<div class="produto-preco"><span class="sem-preco">Preco a anunciar</span></div>'
        + '<p class="produto-preco-nota">O preco deste item ainda nao foi publicado. Fale com a gente eombinamos o valor e a entrega.</p>';
    }

    var html = '<div class="produto-preco">';
    if (desconto) {
      html += '<span class="de">R$ ' + (anterior / 100).toFixed(2).replace('.', ',') + '</span>';
      html += '<span class="produto-desconto">-' + desconto + '%</span>';
    }
    html += '<span class="valor">R$ ' + (preco / 100).toFixed(2).replace('.', ',') + '</span>';
    html += '</div>';
    html += '<p class="produto-preco-nota">Em ate 12x no cartao. Entrega para todo o Brasil.</p>';
    return html;
  }

  /* ---- Acoes ---------------------------------------------------------------- */
  function blocoDeAcoes(produto) {
    var zap = VH.configuracao.linkProduto(produto);
    var publicar = VH.utils.precoPublicado(produto);

    var botaoPrincipal = publicar
      ? '<button class="btn btn-primary" type="button" data-comprar="' + escapar(produto.id) + '" data-nome="' + escapar(produto.nome) + '">Adicionar ao carrinho</button>'
      : '<a class="btn btn-whatsapp" data-zap-produto="' + escapar(produto.id) + '" href="' + escapar(zap) + '" target="_blank" rel="noopener">Consultar no WhatsApp</a>';

    var botaoZap = publicar
      ? '<a class="btn btn-outline" data-zap-produto="' + escapar(produto.id) + '" href="' + escapar(zap) + '" target="_blank" rel="noopener">Falar no WhatsApp</a>'
      : '';

    var trailer = produto.trailerUrl
      ? '<button class="btn btn-outline" type="button" id="abrir-trailer">Trailer</button>'
      : '';

    return '<div class="produto-acoes">' + botaoPrincipal + botaoZap + trailer + '</div>'
      + '<div class="produto-garantias">'
      + '<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>Troca em ate 30 dias</span>'
      + '<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>Envio em ate 24h</span>'
      + '<span><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 6 9 17l-5-5"/></svg>Garantia do fabricante</span>'
      + '</div>';
  }

  /* ---- Ficha tecnica --------------------------------------------------------- */
  function blocoDeFicha(produto) {
    var itens = [];

    function item(rotulo, valor) {
      if (!valor) return;
      itens.push('<div class="item"><span class="rotulo">' + escapar(rotulo) + '</span>'
        + '<span class="valor">' + escapar(valor) + '</span></div>');
    }

    item('Gênero', produto.tipo === 'console' ? null : produto.generoRotulo);
    item('Desenvolvedora', produto.tipo === 'console' ? null : produto.desenvolvedora);
    item('Editora', produto.tipo === 'console' ? null : produto.editora);
    item('Plataformas', produto.tipo === 'console' ? null : produto.plataformas);
    item('Fabricante', produto.tipo === 'console' ? produto.fabricante : null);
    item('Geração', produto.tipo === 'console' ? produto.geracaoRotulo : null);
    item('Modelo', produto.modelo);
    item('Lançamento', produto.ano ? String(produto.ano) : null);
    item('Classificação', produto.tipo === 'jogo' && produto.classificacao !== 'pendente'
      ? (produto.classificacao === 'livre' ? 'Livre para todas as idades' : produto.classificacao + ' anos')
      : null);

    if (!itens.length) return '';
    return '<section class="produto-bloco"><h2>Ficha tecnica</h2><div class="ficha">' + itens.join('') + '</div></section>';
  }

  /* ---- Versoes (accordion) ------------------------------------------------------ */
  var VERSOES = [
    { nome: 'Versão digital', detalhe: 'Download direto para o seu console', preco: null },
    { nome: 'Versão física', detalhe: 'Caixa, manual e mídia', preco: null }
  ];

  function blocoDeVersoes(produto) {
    if (produto.tipo === 'console') return '';

    var corpo = VERSOES.map(function (versao) {
      return '<div class="versao">'
        + '<button type="button" class="versao-cabecalho" aria-expanded="false">'
        + '<span><span class="versao-nome">' + escapar(versao.nome) + '</span><br>'
        + '<span class="versao-detalhe">' + escapar(versao.detalhe) + '</span></span>'
        + '<span class="versao-seta">&#9662;</span>'
        + '</button>'
        + '<div class="versao-conteudo">'
        + 'Consulte a disponibilidade desta versão pelo WhatsApp antes de fechar o pedido: o estoque de cada formato varia.'
        + '</div>'
        + '</div>';
    }).join('');

    return '<section class="produto-bloco"><h2>Versões disponíveis</h2><div class="versoes">' + corpo + '</div></section>';
  }

  /* ---- Avaliacoes ---------------------------------------------------------------- */
  function lerAvaliacoes(produtoId) {
    try {
      var bruto = global.localStorage.getItem(CHAVE_AVALIACOES);
      var todas = bruto ? JSON.parse(bruto) : [];
      return todas.filter(function (a) { return a.produtoId === produtoId; });
    } catch (erro) {
      return [];
    }
  }

  function gravarAvaliacao(produtoId, nota, texto, nome) {
    try {
      var bruto = global.localStorage.getItem(CHAVE_AVALIACOES);
      var todas = bruto ? JSON.parse(bruto) : [];
      todas.push({
        produtoId: produtoId,
        nota: nota,
        texto: texto,
        nome: nome || 'Cliente VHARAK',
        quando: new Date().toISOString()
      });
      global.localStorage.setItem(CHAVE_AVALIACOES, JSON.stringify(todas));
    } catch (erro) {
      /* Sem armazenamento: a avaliacao vale so para esta pagina. */
    }
  }

  function listaDeAvaliacoes(produtoId) {
    return lerAvaliacoes(produtoId).sort(function (a, b) {
      return new Date(b.quando) - new Date(a.quando);
    });
  }

  function desenharAvaliacoes(produto) {
    var lista = listaDeAvaliacoes(produto.id);
    var alvo = document.getElementById('lista-avaliacoes');
    if (!alvo) return;

    if (!lista.length) {
      alvo.innerHTML = '<p class="vazio-faixa">Nenhuma avaliacao ainda. Se voce ja comprou, conte para os outros.</p>';
      return;
    }

    alvo.innerHTML = lista.map(function (avaliacao) {
      var estrelas = '';
      for (var i = 1; i <= 5; i += 1) {
        estrelas += '<span style="color:' + (i <= avaliacao.nota ? 'var(--accent)' : 'var(--text-muted)') + '">&#9733;</span>';
      }
      return '<article class="avaliacao">'
        + '<div class="topo"><span class="nome">' + escapar(avaliacao.nome) + '</span>'
        + '<span class="nota">' + estrelas + ' ' + avaliacao.nota + '/5</span>'
        + '<span class="quando">' + VH.utils.formatarData(avaliacao.quando) + '</span></div>'
        + '<p class="texto">' + escapar(avaliacao.texto) + '</p>'
        + '</article>';
    }).join('');
  }

  function iniciarFormularioDeAvaliacao(produto) {
    var formulario = document.getElementById('formulario-avaliacao');
    if (!formulario) return;

    var notaSelecionada = 5;

    var estrelas = formulario.querySelectorAll('.estrelas button');
    estrelas.forEach(function (estrela) {
      estrela.addEventListener('click', function () {
        notaSelecionada = Number(estrela.getAttribute('data-nota'));
        estrelas.forEach(function (outra) {
          outra.classList.toggle('lit', Number(outra.getAttribute('data-nota')) <= notaSelecionada);
        });
      });
    });

    formulario.addEventListener('submit', function (evento) {
      evento.preventDefault();
      var texto = formulario.querySelector('textarea').value.trim();
      if (texto.length < 4) {
        VH.utils.mostrarAviso('Escreva um pouco mais antes de enviar.', 'erro');
        return;
      }
      var sessao = VH.auth && VH.auth.sessao ? VH.auth.sessao() : null;
      gravarAvaliacao(produto.id, notaSelecionada, texto, sessao ? sessao.nome : null);
      formulario.reset();
      desenharAvaliacoes(produto);
      VH.utils.mostrarAviso('Avaliação enviada. Obrigado!');
    });
  }

  /* ---- Trailer ------------------------------------------------------------------- */
  function idDoYoutube(url) {
    if (!url) return '';
    var padrao = url.match(/(?:youtu\.be\/|v=|embed\/)([A-Za-z0-9_-]{6,})/);
    return padrao ? padrao[1] : '';
  }

  function abrirTrailer(produto) {
    var id = idDoYoutube(produto.trailerUrl);
    if (!id) return;

    var sobreposicao = document.createElement('div');
    sobreposicao.className = 'modal-overlay';
    sobreposicao.id = 'modal-trailer';
    sobreposicao.innerHTML = '<div class="modal" style="max-width:900px">'
      + '<h3>Trailer de ' + escapar(produto.nome) + '</h3>'
      + '<div class="video-wrap"><iframe src="https://www.youtube.com/embed/' + id
      + '?autoplay=1&rel=0" title="Trailer" allowfullscreen></iframe></div>'
      + '<div class="modal-actions"><button class="btn btn-secondary" type="button" data-fechar>Fechar</button></div>'
      + '</div>';

    document.body.appendChild(sobreposicao);
    sobreposicao.querySelector('[data-fechar]').addEventListener('click', function () {
      sobreposicao.remove();
    });
    sobreposicao.addEventListener('click', function (evento) {
      if (evento.target === sobreposicao) sobreposicao.remove();
    });
  }

  /* ---- Similares ------------------------------------------------------------------- */
  function desenharSimilares(produto) {
    var alvo = document.getElementById('grade-similares');
    if (!alvo) return;

    var similares = VH.todos().filter(function (outro) {
      if (outro.id === produto.id) return false;
      if (outro.tipo !== produto.tipo) return false;
      return outro.genero === produto.genero;
    });

    if (similares.length < 4) {
      similares = VH.todos().filter(function (outro) {
        return outro.id !== produto.id && outro.tipo === produto.tipo;
      });
    }

    alvo.innerHTML = similares.slice(0, 8).map(VH.utils.criarCardProduto).join('');
  }

  /* ---- Dados estruturados e redes sociais --------------------------------- */
  function aplicarSeo(produto, descricao) {
    var preco = VH.utils.precoDe(produto);
    var anterior = VH.utils.precoDeAnterior(produto);

    document.querySelectorAll('meta[property^="og:"]').forEach(function (meta) {
      var propriedade = meta.getAttribute('property');
      if (propriedade === 'og:title') meta.setAttribute('content', produto.nome + ' | VHARAK');
      if (propriedade === 'og:description') meta.setAttribute('content', descricao);
      if (propriedade === 'og:type') meta.setAttribute('content', 'product');
      if (propriedade === 'og:url') meta.setAttribute('content', global.location.href);
    });

    var ogImagem = document.createElement('meta');
    ogImagem.setAttribute('property', 'og:image');
    ogImagem.setAttribute('content', global.location.origin + '/' + produto.capa);
    document.head.appendChild(ogImagem);

    var dados = {
      '@context': 'https://schema.org',
      '@type': produto.tipo === 'console' ? 'Product' : 'VideoGame',
      name: produto.nome,
      image: global.location.origin + '/' + produto.capa,
      description: descricao,
      url: global.location.href,
      brand: { '@type': 'Brand', name: produto.desenvolvedora || produto.plataformas || 'VHARAK' },
      category: produto.generoRotulo,
      offers: {
        '@type': 'Offer',
        availability: preco === null ? 'https://schema.org/PreOrder' : 'https://schema.org/InStock',
        priceCurrency: 'BRL',
        url: global.location.href,
      }
    };

    if (preco !== null) {
      dados.offers.price = (preco / 100).toFixed(2);
      if (anterior !== null) dados.offers.highPrice = (anterior / 100).toFixed(2);
    }
    if (produto.ano) dados.releaseDate = String(produto.ano);
    if (typeof produto.nota === 'number' && produto.nota > 0) {
      dados.aggregateRating = {
        '@type': 'AggregateRating',
        ratingValue: String(produto.nota),
        bestRating: '10',
        ratingCount: String(produto.avaliacoes || 1)
      };
    }
    if (produto.tipo === 'jogo' && produto.classificacao && produto.classificacao !== 'pendente') {
      dados.contentRating = produto.classificacao === 'livre'
        ? 'https://schema.org/ContentRating.Livre'
        : `https://schema.org/ContentRating.${produto.classificacao}`;
    }

    var script = document.createElement('script');
    script.type = 'application/ld+json';
    script.textContent = JSON.stringify(dados);
    document.head.appendChild(script);
  }

  /* ---- Montagem da pagina ----------------------------------------------------------- */
  function montar() {
    var raiz = document.getElementById('produto-raiz');
    if (!raiz) return;

    var produto = produtoAtual();

    if (!produto) {
      raiz.innerHTML = '<div class="produto-inexistente">'
        + '<h1>Produto nao encontrado</h1>'
        + '<p>O item que voce procurou nao esta no catalogo ou o link está errado.</p>'
        + '<a class="btn btn-primary" href="/pages/catalogo.html">Ver o catalogo</a>'
        + '</div>';
      document.title = 'Produto nao encontrado | VHARAK';
      return;
    }

    document.title = produto.nome + ' | VHARAK';

    var descricao = produto.descricao
      || (produto.tipo === 'console'
        ? produto.nome + ' (' + VH.utils.formatarFabricante(produto.fabricante) + ') esta no catalogo da VHARAK'
          + (produto.geracaoRotulo ? ', ' + produto.geracaoRotulo.toLowerCase() : '') + '.'
        : produto.nome + ' (' + (produto.generoRotulo || 'jogo') + ') da VHARAK, disponivel para '
          + (produto.plataformas || 'as plataformas cadastradas') + '.');

    var metaDescricao = document.querySelector('meta[name="description"]');
    if (metaDescricao) metaDescricao.setAttribute('content', descricao);

    aplicarSeo(produto, descricao);

    var tipo = VH.utils.tipoDoProduto(produto);
    var capa = '/' + produto.capa;

    raiz.innerHTML = '<div class="produto-fundo" id="produto-fundo" style="--fundo-imagem:url(\'' + capa + '\')"></div>'
      + '<div class="produto-conteudo">'
      + '<div class="produto-topo">'
      + '<div class="produto-capa' + (produto.tipo === 'console' ? ' capa-console' : '') + '">'
      + '<img src="' + escapar(capa) + '" alt="Capa de ' + escapar(produto.nome) + '" onerror="this.onerror=null;this.src=\'/assets/no-boxart.svg\'">'
      + '</div>'
      + '<div class="produto-info">'
      + '<span class="produto-tipo ' + tipo.classe + '">' + tipo.rotulo + '</span>'
      + '<h1 class="produto-nome">' + escapar(produto.nome) + '</h1>'
      + '<div class="produto-meta">' + linhaDeMeta(produto) + '</div>'
      + blocoDePreco(produto)
      + blocoDeAcoes(produto)
      + '</div>'
      + '</div>'
      + '<section class="produto-bloco"><h2>Sobre</h2><p>' + escapar(descricao) + '</p></section>'
      + blocoDeFicha(produto)
      + blocoDeVersoes(produto)
      + '<section class="produto-bloco"><h2>Avaliacoes</h2>'
      + '<form class="avaliacao-form" id="formulario-avaliacao">'
      + '<h3>Deixe sua avaliacao</h3>'
      + '<div class="estrelas" role="group" aria-label="Nota">'
      + '<button type="button" data-nota="1" class="lit" aria-label="1 estrela">&#9733;</button>'
      + '<button type="button" data-nota="2" class="lit" aria-label="2 estrelas">&#9733;</button>'
      + '<button type="button" data-nota="3" class="lit" aria-label="3 estrelas">&#9733;</button>'
      + '<button type="button" data-nota="4" class="lit" aria-label="4 estrelas">&#9733;</button>'
      + '<button type="button" data-nota="5" class="lit" aria-label="5 estrelas">&#9733;</button>'
      + '</div>'
      + '<div class="form-group"><label for="texto-avaliacao">Seu comentario</label>'
      + '<textarea id="texto-avaliacao" rows="3" placeholder="O que voce achou do produto?"></textarea></div>'
      + '<button class="btn btn-primary" type="submit">Enviar avaliacao</button>'
      + '</form>'
      + '<div class="lista-avaliacoes" id="lista-avaliacoes"></div>'
      + '</section>'
      + '</div>'
      + '<section class="produto-secao">'
      + '<h2>Você também pode gostar</h2>'
      + '<div class="grid-produtos" id="grade-similares"></div>'
      + '</section>';

    /* O botao de trailer so existe quando o catalogo tem o endereco. */
    var botaoTrailer = document.getElementById('abrir-trailer');
    if (botaoTrailer) {
      botaoTrailer.addEventListener('click', function () { abrirTrailer(produto); });
    }

    /* Os links de WhatsApp do produto sao montados aqui, porque a mensagem
       depende do item. */
    document.querySelectorAll('[data-zap-produto]').forEach(function (elemento) {
      var id = elemento.getAttribute('data-zap-produto');
      var alvo = VH.buscarPorId(id);
      var link = VH.configuracao.linkProduto(alvo);
      if (link) {
        elemento.setAttribute('href', link);
        elemento.setAttribute('target', '_blank');
        elemento.setAttribute('rel', 'noopener');
      }
    });

    desenharAvaliacoes(produto);
    iniciarFormularioDeAvaliacao(produto);
    desenharSimilares(produto);
  }

  document.addEventListener('DOMContentLoaded', montar);
}(window));
