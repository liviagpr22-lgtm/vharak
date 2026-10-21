/*
 * VHARAK | auth.js
 * Sessao do cliente no navegador.
 *
 * A loja roda com catalogo estatico: nao ha servidor de contas por tras,
 * entao a sessao fica no localStorage. A estrutura ja e a mesma que a
 * API usaria -- trocar este arquivo por chamadas reais e mexer apenas
 * aqui.
 */
(function (global) {
  'use strict';

  var VH = global.VH || (global.VH = {});

  var CHAVE = 'vharak_sessao';
  var CHAVE_CLIENTES = 'vharak_clientes';

  function ler(chave) {
    try {
      var bruto = global.localStorage.getItem(chave);
      return bruto ? JSON.parse(bruto) : null;
    } catch (erro) {
      return null;
    }
  }

  function gravar(chave, valor) {
    try {
      global.localStorage.setItem(chave, JSON.stringify(valor));
    } catch (erro) {
      /* Navegador bloqueia o armazenamento: a loja continua navegavel,
         apenas sem sessao e sem carrinho guardado. */
    }
  }

  function sessao() {
    return ler(CHAVE);
  }

  function clientes() {
    return ler(CHAVE_CLIENTES) || [];
  }

  function emailNormalizado(email) {
    return String(email || '').trim().toLowerCase();
  }

  function cadastrar(nome, email, senha) {
    var nomeLimpo = String(nome || '').trim();
    var emailLimpo = emailNormalizado(email);
    var senhaLimpa = String(senha || '');

    if (nomeLimpo.length < 2) throw new Error('Informe seu nome completo.');
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailLimpo)) throw new Error('Informe um e-mail valido.');
    if (senhaLimpa.length < 4) throw new Error('A senha precisa ter ao menos 4 caracteres.');

    var lista = clientes();
    for (var i = 0; i < lista.length; i += 1) {
      if (lista[i].email === emailLimpo) throw new Error('Este e-mail ja tem cadastro.');
    }

    var cliente = {
      id: 'cli_' + Date.now().toString(36),
      nome: nomeLimpo,
      email: emailLimpo,
      senha: senhaLimpa,
      criadoEm: new Date().toISOString()
    };

    lista.push(cliente);
    gravar(CHAVE_CLIENTES, lista);
    gravar(CHAVE, { id: cliente.id, nome: cliente.nome, email: cliente.email });
    return sessao();
  }

  function entrar(email, senha) {
    var emailLimpo = emailNormalizado(email);
    var senhaLimpa = String(senha || '');
    var lista = clientes();

    for (var i = 0; i < lista.length; i += 1) {
      if (lista[i].email === emailLimpo && lista[i].senha === senhaLimpa) {
        var ativo = { id: lista[i].id, nome: lista[i].nome, email: lista[i].email };
        gravar(CHAVE, ativo);
        return ativo;
      }
    }
    throw new Error('E-mail ou senha incorretos.');
  }

  function sair() {
    try { global.localStorage.removeItem(CHAVE); } catch (erro) { /* sem armazenamento */ }
    global.location.href = '/';
  }

  function iniciais(nome) {
    return String(nome || 'V')
      .split(' ').filter(Boolean).slice(0, 2)
      .map(function (parte) { return parte.charAt(0).toUpperCase(); }).join('');
  }

  VH.auth = {
    sessao: sessao,
    cadastrar: cadastrar,
    entrar: entrar,
    sair: sair,
    iniciais: iniciais
  };
}(window));
