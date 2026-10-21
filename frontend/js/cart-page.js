/*
 * VHARAK | cart-page.js
 * Pagina do carrinho: lista, quantidades, resumo e o fechamento pelo
 * WhatsApp.
 *
 * O fechamento nao passa por formulario de pagamento: a conversa no
 * WhatsApp e o canal de venda da loja, e o pedido vai pronto no texto.
 */
(function (global) {
  'use strict';

  var VH = global.VH || (global.VH = {});

  function desenhar() {
    var lista = document.getElementById('carrinho-lista');
    var vazio = document.getElementById('carrinho-vazio');
    var resumo = document.getElementById('resumo-carrinho');
    if (!lista) return;

    var itens = VH.carrinho.itens();

    if (!itens.length) {
      if (vazio) vazio.hidden = false;
      if (resumo) resumo.hidden = true;
      lista.innerHTML = '';
      return;
    }

    if (vazio) vazio.hidden = true;
    if (resumo) resumo.hidden = false;

    lista.innerHTML = itens.map(function (item) {
      var produto = VH.buscarPorId(item.id);
      var preco = typeof item.preco === 'number' ? item.preco : null;
      var capa = item.capa ? '/' + item.capa : '/assets/no-boxart.svg';
      var ehConsole = item.tipo === 'console';

      return '<article class="carrinho-item" data-item="' + VH.utils.escapar(item.id) + '">'
        + '<div class="capa' + (ehConsole ? ' capa-console' : '') + '">'
        + '<img src="' + VH.utils.escapar(capa) + '" alt="Capa de ' + VH.utils.escapar(item.nome) + '" loading="lazy" onerror="this.onerror=null;this.src=\'/assets/no-boxart.svg\'">'
        + '</div>'
        + '<div class="info">'
        + '<h3><a href="/pages/produto.html?id=' + encodeURIComponent(item.id) + '">' + VH.utils.escapar(item.nome) + '</a></h3>'
        + '<p class="meta">' + (ehConsole ? 'Console' : 'Jogo') + '</p>'
        + (preco !== null
          ? '<p class="preco-item">R$ ' + (preco / 100).toFixed(2).replace('.', ',') + ' cada</p>'
          : '<p class="preco-item sem-preco">Preco a anunciar</p>')
        + '</div>'
        + '<div class="quantidade" role="group" aria-label="Quantidade">'
        + '<button type="button" data-menos aria-label="Diminuir quantidade">&minus;</button>'
        + '<span>' + item.quantidade + '</span>'
        + '<button type="button" data-mais aria-label="Aumentar quantidade">+</button>'
        + '</div>'
        + '<button type="button" class="remover" data-remover>Remover</button>'
        + '</article>';
    }).join('');

    desenharResumo();
  }

  function desenharResumo() {
    var alvo = document.getElementById('resumo-carrinho');
    if (!alvo) return;

    var itens = VH.carrinho.itens();
    var total = VH.carrinho.total();
    var pendente = VH.carrinho.temPrecoPendente();

    var mensagem = VH.carrinho.mensagemDoPedido();
    var link = VH.configuracao.linkWhatsapp(mensagem);

    alvo.innerHTML = '<h2>Resumo</h2>'
      + '<div class="resumo-linha"><span>Itens</span><span>' + VH.carrinho.contagem() + '</span></div>'
      + (total > 0
        ? '<div class="resumo-linha total"><span>Total</span><strong>R$ ' + (total / 100).toFixed(2).replace('.', ',') + '</strong></div>'
        : '<div class="resumo-linha total"><span>Total</span><span>a combinar</span></div>')
      + (link
        ? '<a class="btn btn-whatsapp btn-block btn-lg" href="' + VH.utils.escapar(link) + '" target="_blank" rel="noopener">Finalizar pelo WhatsApp</a>'
        : '<button class="btn btn-primary btn-block btn-lg" type="button" disabled>Finalizar pelo WhatsApp</button>')
      + (pendente
        ? '<p class="nota-resumo">Alguns itens ainda nao tem preco publicado. A loja confirma os valores na conversa.</p>'
        : '<p class="nota-resumo">O frete e calculado pela loja de acordo com o CEP e a forma de pagamento.</p>')
      + '<button type="button" class="remover" id="limpar-carrinho" style="display:block;margin:14px auto 0">Esvaziar carrinho</button>';
  }

  function iniciarEventos() {
    var lista = document.getElementById('carrinho-lista');
    if (!lista) return;

    lista.addEventListener('click', function (evento) {
      var linha = evento.target.closest('[data-item]');
      if (!linha) return;
      var id = linha.getAttribute('data-item');
      var item = VH.carrinho.itens().filter(function (i) { return i.id === id; })[0];
      if (!item) return;

      if (evento.target.closest('[data-mais]')) {
        VH.carrinho.atualizarQuantidade(id, item.quantidade + 1);
      } else if (evento.target.closest('[data-menos]')) {
        VH.carrinho.atualizarQuantidade(id, item.quantidade - 1);
      } else if (evento.target.closest('[data-remover]')) {
        VH.carrinho.remover(id);
        VH.utils.mostrarAviso('Item removido do carrinho.');
      } else {
        return;
      }
      desenhar();
    });

    var resumo = document.getElementById('resumo-carrinho');
    if (resumo) {
      resumo.addEventListener('click', function (evento) {
        if (evento.target.closest('#limpar-carrinho')) {
          VH.carrinho.limpar();
          VH.utils.mostrarAviso('Carrinho esvaziado.');
          desenhar();
          return;
        }
        /* Ao fechar pelo WhatsApp, o pedido fica registrado no perfil
           antes de a conversa abrir. */
        if (evento.target.closest('.btn-whatsapp')) {
          var pedido = VH.carrinho.registrarPedido();
          if (pedido) {
            VH.carrinho.limpar();
            VH.utils.mostrarAviso('Pedido ' + pedido.id + ' registrado. Abrindo o WhatsApp...');
          }
        }
      });
    }
  }

  document.addEventListener('DOMContentLoaded', function () {
    desenhar();
    iniciarEventos();
  });
}(window));
