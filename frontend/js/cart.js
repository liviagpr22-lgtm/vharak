/*
 * VHARAK | cart.js
 * Carrinho de compras guardado no navegador.
 *
 * Cada item guarda o id do produto, a quantidade e um retrato do preco no
 * momento da compra: se o preco mudar depois, o carrinho continua
 * mostrando o que o cliente aceitou.
 */
(function (global) {
  'use strict';

  var VH = global.VH || (global.VH = {});

  var CHAVE = 'vharak_carrinho';
  var CHAVE_PEDIDOS = 'vharak_pedidos';

  function ler() {
    try {
      var bruto = global.localStorage.getItem(CHAVE);
      var itens = bruto ? JSON.parse(bruto) : [];
      return Array.isArray(itens) ? itens : [];
    } catch (erro) {
      return [];
    }
  }

  function gravar(itens) {
    try {
      global.localStorage.setItem(CHAVE, JSON.stringify(itens));
    } catch (erro) {
      /* Sem armazenamento: o carrinho vale so para esta navegacao. */
    }
  }

  function itens() {
    return ler();
  }

  function adicionar(produto, quantidade) {
    var qtd = quantidade || 1;
    var lista = ler();
    var existente = null;

    for (var i = 0; i < lista.length; i += 1) {
      if (lista[i].id === produto.id) { existente = lista[i]; break; }
    }

    if (existente) {
      existente.quantidade += qtd;
    } else {
      lista.push({
        id: produto.id,
        nome: produto.nome,
        tipo: produto.tipo,
        capa: produto.capa,
        preco: VH.utils.precoDe(produto),
        quantidade: qtd
      });
    }

    gravar(lista);
    atualizarContador();
    return lista;
  }

  function remover(id) {
    var lista = ler().filter(function (item) { return item.id !== id; });
    gravar(lista);
    atualizarContador();
    return lista;
  }

  function atualizarQuantidade(id, quantidade) {
    var lista = ler();
    for (var i = 0; i < lista.length; i += 1) {
      if (lista[i].id === id) {
        if (quantidade <= 0) return remover(id);
        lista[i].quantidade = quantidade;
      }
    }
    gravar(lista);
    atualizarContador();
    return lista;
  }

  function limpar() {
    gravar([]);
    atualizarContador();
  }

  function contagem() {
    var lista = ler();
    var total = 0;
    for (var i = 0; i < lista.length; i += 1) total += lista[i].quantidade;
    return total;
  }

  function total() {
    var lista = ler();
    var soma = 0;
    for (var i = 0; i < lista.length; i += 1) {
      if (typeof lista[i].preco === 'number') soma += lista[i].preco * lista[i].quantidade;
    }
    return soma;
  }

  function temPrecoPendente() {
    var lista = ler();
    for (var i = 0; i < lista.length; i += 1) {
      if (typeof lista[i].preco !== 'number') return true;
    }
    return false;
  }

  /* Mensagem de fechamento de pedido pelo WhatsApp: o cliente ve a
     lista antes de enviar, e a loja recebe tudo em texto. */
  function mensagemDoPedido() {
    var lista = ler();
    if (!lista.length) return '';

    var linhas = lista.map(function (item) {
      var valor = typeof item.preco === 'number'
        ? 'R$ ' + (item.preco / 100).toFixed(2).replace('.', ',')
        : 'preço a combinar';
      return '• ' + item.quantidade + 'x ' + item.nome + ' — ' + valor;
    });

    var soma = total();
    var rodape = soma > 0
      ? '\nTotal: R$ ' + (soma / 100).toFixed(2).replace('.', ',')
      : '\nOs itens acima ainda não têm preço publicado. Gostaria de saber os valores.';

    return 'Olá! Gostaria de fechar este pedido na VHARAK:\n\n'
      + linhas.join('\n')
      + rodape
      + '\n\nPode me passar as formas de pagamento e o prazo de entrega?';
  }

  function atualizarContador() {
    var marcador = document.querySelector('.cart-count');
    if (!marcador) return;
    var total = contagem();
    marcador.textContent = total > 0 ? String(total) : '';
  }

  /* Registra o pedido no navegador quando o cliente fecha a compra pelo
     WhatsApp. O pedido fica visivel no perfil enquanto a loja confirma
     o pagamento por fora. */
  function registrarPedido() {
    var lista = ler();
    if (!lista.length) return null;

    var pedido = {
      id: 'PED-' + Date.now().toString(36).toUpperCase(),
      quando: new Date().toISOString(),
      status: 'Aguardando confirmação',
      itens: lista.map(function (item) {
        return { nome: item.nome, quantidade: item.quantidade, preco: item.preco, id: item.id };
      }),
      total: total()
    };

    try {
      var bruto = global.localStorage.getItem(CHAVE_PEDIDOS);
      var pedidos = bruto ? JSON.parse(bruto) : [];
      pedidos.unshift(pedido);
      global.localStorage.setItem(CHAVE_PEDIDOS, JSON.stringify(pedidos));
    } catch (erro) {
      /* Sem armazenamento o pedido continua valendo no WhatsApp. */
    }

    return pedido;
  }

  function pedidos() {
    try {
      var bruto = global.localStorage.getItem(CHAVE_PEDIDOS);
      var lista = bruto ? JSON.parse(bruto) : [];
      return Array.isArray(lista) ? lista : [];
    } catch (erro) {
      return [];
    }
  }

  /* Delegacao: os botoes "Comprar" nascem junto com o card, entao o
     clique e tratado uma vez so, no documento. */
  document.addEventListener('click', function (evento) {
    var botao = evento.target.closest('[data-comprar]');
    if (!botao) return;
    evento.preventDefault();

    var id = botao.getAttribute('data-comprar');
    var produto = VH.buscarPorId(id);
    if (!produto) return;

    VH.carrinho.adicionar(produto, 1);
    VH.utils.mostrarAviso(produto.nome + ' foi adicionado ao carrinho.');
    botao.textContent = 'No carrinho';
    setTimeout(function () { botao.textContent = 'Comprar'; }, 1400);
  });

  VH.carrinho = {
    itens: itens,
    adicionar: adicionar,
    remover: remover,
    atualizarQuantidade: atualizarQuantidade,
    limpar: limpar,
    contagem: contagem,
    total: total,
    temPrecoPendente: temPrecoPendente,
    mensagemDoPedido: mensagemDoPedido,
    registrarPedido: registrarPedido,
    pedidos: pedidos,
    atualizarContador: atualizarContador
  };

  document.addEventListener('DOMContentLoaded', atualizarContador);
}(window));
