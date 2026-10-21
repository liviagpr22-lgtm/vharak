/*
 * VHARAK | profile.js
 * Perfil do cliente: dados da conta e pedidos feitos.
 */
(function (global) {
  'use strict';

  var VH = global.VH || (global.VH = {});

  function desenharDados() {
    var sessao = VH.auth && VH.auth.sessao ? VH.auth.sessao() : null;
    var alvo = document.getElementById('dados-conta');
    if (!alvo) return;

    if (!sessao) {
      alvo.innerHTML = '<div class="painel-vazio"><p>Voce ainda nao entrou na sua conta.</p>'
        + '<a class="btn btn-primary" href="/pages/login.html">Entrar ou criar conta</a></div>';
      return;
    }

    alvo.innerHTML = '<h2>Meus dados</h2>'
      + '<div class="dado-linha"><span class="rotulo">Nome</span><span class="valor">' + VH.utils.escapar(sessao.nome) + '</span></div>'
      + '<div class="dado-linha"><span class="rotulo">E-mail</span><span class="valor">' + VH.utils.escapar(sessao.email) + '</span></div>'
      + '<div class="dado-linha"><span class="rotulo">Cliente desde</span><span class="valor">hoje</span></div>';
  }

  function desenharPedidos() {
    var alvo = document.getElementById('lista-pedidos');
    if (!alvo) return;

    var sessao = VH.auth && VH.auth.sessao ? VH.auth.sessao() : null;
    if (!sessao) {
      alvo.innerHTML = '<div class="painel-vazio"><p>Entre na sua conta para ver seus pedidos.</p></div>';
      return;
    }

    var pedidos = VH.carrinho.pedidos();
    if (!pedidos.length) {
      alvo.innerHTML = '<h2>Meus pedidos</h2>'
        + '<div class="painel-vazio"><p>Voce ainda nao fez nenhum pedido.</p>'
        + '<a class="btn btn-primary" href="/pages/catalogo.html">Ver o catalogo</a></div>';
      return;
    }

    alvo.innerHTML = '<h2>Meus pedidos</h2>' + pedidos.map(function (pedido) {
      var itens = pedido.itens.map(function (item) {
        var valor = typeof item.preco === 'number'
          ? 'R$ ' + (item.preco / 100).toFixed(2).replace('.', ',')
          : 'preço a combinar';
        return item.quantidade + 'x ' + VH.utils.escapar(item.nome) + ' — ' + valor;
      }).join('<br>');

      var total = typeof pedido.total === 'number' && pedido.total > 0
        ? 'R$ ' + (pedido.total / 100).toFixed(2).replace('.', ',')
        : 'a combinar';

      return '<article class="pedido">'
        + '<div class="pedido-topo">'
        + '<span class="pedido-id">' + VH.utils.escapar(pedido.id) + '</span>'
        + '<span class="badge badge-warning">' + VH.utils.escapar(pedido.status) + '</span>'
        + '<span class="pedido-data">' + VH.utils.formatarDataHora(pedido.quando) + '</span>'
        + '</div>'
        + '<p class="pedido-itens">' + itens + '</p>'
        + '<p class="pedido-total">' + total + '</p>'
        + '</article>';
    }).join('');
  }

  function desenharCabecalho() {
    var sessao = VH.auth && VH.auth.sessao ? VH.auth.sessao() : null;
    var alvo = document.getElementById('perfil-cabecalho');
    if (!alvo) return;

    if (!sessao) {
      alvo.innerHTML = '<h1>Meu perfil</h1><p>Entre na sua conta para acompanhar seus pedidos.</p>';
      return;
    }

    alvo.innerHTML = '<div class="perfil-avatar">' + VH.utils.escapar(VH.auth.iniciais(sessao.nome)) + '</div>'
      + '<div><h1>' + VH.utils.escapar(sessao.nome) + '</h1><p>' + VH.utils.escapar(sessao.email) + '</p></div>';
  }

  document.addEventListener('DOMContentLoaded', function () {
    desenharCabecalho();
    desenharDados();
    desenharPedidos();
  });
}(window));
