/*
 * VHARAK | precos-local.js
 * Sobrepoe o precos.js com os precos editados no painel local.
 *
 * O painel guarda as alteracoes no navegador enquanto o dono nao exporta
 * o arquivo. Este modulo faz a vitrine refletir essas alteracoes na
 * hora, para o dono ver o resultado antes de publicar. Quando o
 * precos.js exportado substitui o arquivo, a sobreposicao deixa de ter
 * efeito: os dois caminhos levam ao mesmo valor.
 */
(function (global) {
  'use strict';

  var VH = global.VH || (global.VH = {});
  var CHAVE = 'vharak_precos_editados';

  function editados() {
    try {
      var bruto = global.localStorage.getItem(CHAVE);
      var mapa = bruto ? JSON.parse(bruto) : {};
      return (mapa && typeof mapa === 'object') ? mapa : {};
    } catch (erro) {
      return {};
    }
  }

  if (!VH.precos) return;

  /* Se o script for carregado duas vezes, a segunda nao pode repetir a
     sobrescrita (o preco original ja seria a funcao de sobreposicao). */
  if (VH.precos.sobreposto) return;
  VH.precos.sobreposto = true;

  /* Guarda as FUNCOES, nao o objeto: VH.precos e o mesmo objeto que
     vamos sobrescrever, e guardar a referencia do objeto faria a funcao
     chamar a si mesma para sempre. */
  var precoOriginal = VH.precos.precoDe;
  var deOriginal = VH.precos.precoDeAnterior;

  VH.precos.precoDe = function (id) {
    var local = editados()[id];
    /* Se o painel gravou o preco deste produto, ele manda -- inclusive
       quando o valor e null (preco apagado de proposito). */
    if (local && Object.prototype.hasOwnProperty.call(local, 'preco')) {
      return typeof local.preco === 'number' ? local.preco : null;
    }
    return precoOriginal(id);
  };

  VH.precos.precoDeAnterior = function (id) {
    var local = editados()[id];
    if (local && Object.prototype.hasOwnProperty.call(local, 'de')) {
      return typeof local.de === 'number' ? local.de : null;
    }
    return deOriginal(id);
  };

  VH.precos.desconto = function (id) {
    var preco = VH.precos.precoDe(id);
    var de = VH.precos.precoDeAnterior(id);
    if (typeof preco !== 'number' || typeof de !== 'number') return null;
    if (de <= preco) return null;
    return Math.round((1 - preco / de) * 100);
  };

  VH.precos.publicado = function (id) {
    return VH.precos.precoDe(id) !== null;
  };

  VH.precos.editadosNoNavegador = editados;
}(window));
