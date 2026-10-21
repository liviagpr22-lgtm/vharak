/*
 * VHARAK | home.js
 * Monta as faixas da home a partir do catalogo.
 *
 * Cada faixa e uma regra: um titulo, um link "Ver todos" e um filtro.
 * A ordem das faixas esta no objeto FAIXAS, e o HTML apenas guarda o
 * container onde cada uma entra.
 */
(function (global) {
  'use strict';

  var VH = global.VH || (global.VH = {});

  /* Cada faixa diz de onde vem o que aparece nela. */
  var FAIXAS = [
    {
      id: 'faixa-destaques',
      titulo: 'Destaques',
      sub: 'O que a equipe indica',
      link: '/pages/catalogo.html',
      filtro: function () { return VH.destaques(); }
    },
    {
      id: 'faixa-novidades',
      titulo: 'Lançamentos',
      sub: 'Chegaram recém',
      link: '/pages/catalogo.html?ordenar=novidades',
      filtro: function () { return VH.novidades(); }
    },
    {
      id: 'faixa-vendidos',
      titulo: 'Mais vendidos',
      link: '/pages/catalogo.html?ordenar=vendidos',
      filtro: function () { return VH.maisVendidos(); }
    },
    {
      id: 'faixa-jogos',
      titulo: 'Jogos populares',
      sub: 'O que mais sai da prateleira',
      link: '/pages/catalogo.html?tipo=jogo',
      filtro: function () { return VH.jogos().filter(function (p) { return p.popularidade; }); }
    },
    {
      id: 'faixa-consoles',
      titulo: 'Consoles e handhelds',
      sub: 'Da 3ª a 9ª geração',
      link: '/pages/consoles.html',
      filtro: function () { return VH.consoles(); }
    },
    {
      id: 'faixa-acao',
      titulo: 'Ação e aventura',
      link: '/pages/catalogo.html?genero=acao',
      filtro: function () { return VH.porGenero('acao'); }
    },
    {
      id: 'faixa-rpg',
      titulo: 'RPG',
      link: '/pages/catalogo.html?genero=rpg',
      filtro: function () { return VH.porGenero('rpg'); }
    },
    {
      id: 'faixa-corrida',
      titulo: 'Corrida',
      link: '/pages/catalogo.html?genero=corrida',
      filtro: function () { return VH.porGenero('corrida'); }
    },
    {
      id: 'faixa-tiro',
      titulo: 'Tiro',
      link: '/pages/catalogo.html?genero=tiro',
      filtro: function () { return VH.porGenero('tiro'); }
    },
    {
      id: 'faixa-estrategia',
      titulo: 'Estratégia',
      link: '/pages/catalogo.html?genero=estrategia',
      filtro: function () { return VH.porGenero('estrategia'); }
    }
  ];

  var LIMITE = 8;

  function desenharGrade(container, produtos) {
    if (!container) return;
    if (!produtos.length) {
      container.innerHTML = '<p class="vazio-faixa">Nada por aqui ainda.</p>';
      return;
    }
    container.innerHTML = produtos.slice(0, LIMITE).map(VH.utils.criarCardProduto).join('');
  }

  function montarFaixas() {
    FAIXAS.forEach(function (faixa) {
      var container = document.getElementById(faixa.id);
      if (!container) return;
      desenharGrade(container, faixa.filtro());

      var secao = container.closest('.section');
      if (secao) {
        var link = secao.querySelector('.see-all');
        if (link && faixa.link) link.setAttribute('href', faixa.link);
      }
    });
  }

  /* O Top 10 usa o numeral vazado atravessando o card. */
  function montarTop10() {
    var container = document.getElementById('faixa-top10');
    if (!container) return;

    var lista = VH.maisVendidos().slice(0, 10);
    if (!lista.length) return;

    container.innerHTML = lista.map(function (produto, indice) {
      return '<div class="top10-item">'
        + '<span class="top10-num">' + (indice + 1) + '</span>'
        + '<div class="top10-card">' + VH.utils.criarCardProduto(produto) + '</div>'
        + '</div>';
    }).join('');
  }

  /* A busca do hero leva para o catalogo com o termo ja digitado. */
  function iniciarBusca() {
    var formulario = document.getElementById('busca-hero');
    if (!formulario) return;
    formulario.addEventListener('submit', function (evento) {
      evento.preventDefault();
      var campo = formulario.querySelector('input');
      var termo = campo ? campo.value.trim() : '';
      global.location.href = '/pages/catalogo.html' + (termo ? '?q=' + encodeURIComponent(termo) : '');
    });
  }

  function iniciar() {
    montarFaixas();
    montarTop10();
    iniciarBusca();
  }

  document.addEventListener('DOMContentLoaded', iniciar);
}(window));
