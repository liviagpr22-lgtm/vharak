/*
 * VHARAK | configuracao.js
 * Canais de contato e identidade da loja.
 *
 * Este e o UNICO lugar do projeto onde telefone, e-mail e redes sociais
 * aparecem. Nenhuma pagina, nenhum modulo e nenhum texto escreve esses
 * dados por conta propria: todos leem daqui.
 *
 * Nenhum dado pessoal do cliente e montado aqui. O WhatsApp abre uma
 * conversa endereçada ao assunto escolhido pelo visitante.
 */
(function (global) {
  'use strict';

  var VH = global.VH || (global.VH = {});

  var CONTATO = {
    /* Somente digitos, com DDD e sem o codigo do pais.
       Vazio = o canal cai sozinho no estado "em breve". */
    whatsapp: '12981883097',
    pais: '55',
    email: 'contato@vharak.com.br',
    instagram: 'vharak',
    endereco: 'Brasil',
    atendimento: 'Segunda a sexta, das 9h as 18h'
  };

  /* Porta de entrada do painel local.
     Isto NAO e seguranca de verdade: o painel roda no navegador e protege
     apenas os dados que estao guardados neste dispositivo. Quando o
     painel for ligado a API, a checagem passa a acontecer no servidor. */
  var ADMIN = {
    senha: 'vharak',
    aviso: 'Acesso local. A senha protege os dados deste navegador, não a loja.'
  };

  function digitos(valor) {
    return String(valor === null || valor === undefined ? '' : valor).replace(/\D/g, '');
  }

  function digitosDoWhatsapp() {
    return digitos(CONTATO.whatsapp);
  }

  /* O wa.me espera o numero internacional completo, sem sinal de mais. */
  function numeroCompleto() {
    var numero = digitosDoWhatsapp();
    if (!numero) return '';
    var pais = digitos(CONTATO.pais);
    return pais ? pais + numero : numero;
  }

  function whatsappDisponivel() {
    return numeroCompleto().length >= 10;
  }

  /* Somente para leitura pelo cliente. Nao usa o numero em nenhum link. */
  function numeroFormatado() {
    var numero = digitosDoWhatsapp();
    if (numero.length === 11) return '(' + numero.slice(0, 2) + ') ' + numero.slice(2, 7) + '-' + numero.slice(7);
    if (numero.length === 10) return '(' + numero.slice(0, 2) + ') ' + numero.slice(2, 6) + '-' + numero.slice(6);
    return numero;
  }

  /* Link do WhatsApp com a mensagem ja pronta. String vazia quando o
     canal oficial ainda nao foi publicado. */
  function linkWhatsapp(mensagem) {
    if (!whatsappDisponivel()) return '';
    var link = 'https://wa.me/' + numeroCompleto();
    var texto = typeof mensagem === 'string' ? mensagem.trim() : '';
    if (texto) link += '?text=' + encodeURIComponent(texto);
    return link;
  }

  /* Link do WhatsApp falando de um produto especifico. */
  function linkProduto(produto) {
    if (!produto) return linkWhatsapp('Olá! Tenho interesse nos produtos da VHARAK.');
    var mensagem = 'Olá! Tenho interesse no produto "' + produto.nome + '" (' + (produto.tipo === 'console' ? 'console' : 'jogo') + ') da VHARAK.';
    return linkWhatsapp(mensagem);
  }

  /* Link de telefone para o relatorio de links do site. */
  function linkTelefone() {
    var numero = digitosDoWhatsapp();
    if (!numero) return '';
    return 'tel:+' + digitos(CONTATO.pais) + numero;
  }

  function linkInstagram() {
    if (!CONTATO.instagram) return '';
    return 'https://instagram.com/' + CONTATO.instagram;
  }

  VH.configuracao = {
    contato: CONTATO,
    admin: ADMIN,
    numeroCompleto: numeroCompleto,
    whatsappDisponivel: whatsappDisponivel,
    numeroFormatado: numeroFormatado,
    linkWhatsapp: linkWhatsapp,
    linkProduto: linkProduto,
    linkTelefone: linkTelefone,
    linkInstagram: linkInstagram
  };
}(window));
