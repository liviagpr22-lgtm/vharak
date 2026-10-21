/*
 * VHARAK | auth-page.js
 * Login e cadastro.
 *
 * A sessao fica no navegador (auth.js). O que este arquivo faz e
 * validar, mostrar o erro na hora e levar o cliente para o perfil.
 */
(function (global) {
  'use strict';

  var VH = global.VH || (global.VH = {});

  function mostrarErro(campo, mensagem) {
    var alvo = document.getElementById(campo);
    if (!alvo) return;
    alvo.textContent = mensagem;
    alvo.hidden = !mensagem;
  }

  function iniciarLogin() {
    var formulario = document.getElementById('formulario-login');
    if (!formulario) return;

    formulario.addEventListener('submit', function (evento) {
      evento.preventDefault();
      mostrarErro('erro-login', '');

      var email = formulario.querySelector('#email').value;
      var senha = formulario.querySelector('#senha').value;

      try {
        VH.auth.entrar(email, senha);
        VH.utils.mostrarAviso('Bem-vindo de volta!');
        global.location.href = '/pages/perfil.html';
      } catch (erro) {
        mostrarErro('erro-login', erro.message);
      }
    });
  }

  function iniciarCadastro() {
    var formulario = document.getElementById('formulario-cadastro');
    if (!formulario) return;

    formulario.addEventListener('submit', function (evento) {
      evento.preventDefault();
      mostrarErro('erro-cadastro', '');

      var nome = formulario.querySelector('#nome').value;
      var email = formulario.querySelector('#email-cadastro').value;
      var senha = formulario.querySelector('#senha-cadastro').value;
      var confirmacao = formulario.querySelector('#confirmar-senha').value;

      if (senha !== confirmacao) {
        mostrarErro('erro-cadastro', 'As senhas não conferem.');
        return;
      }

      try {
        VH.auth.cadastrar(nome, email, senha);
        VH.utils.mostrarAviso('Conta criada. Bem-vindo a VHARAK!');
        global.location.href = '/pages/perfil.html';
      } catch (erro) {
        mostrarErro('erro-cadastro', erro.message);
      }
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    iniciarLogin();
    iniciarCadastro();
  });
}(window));
