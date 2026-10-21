/*
 * VHARAK | help.js
 * Central de Ajuda: lista de problemas por categoria e o painel que abre
 * com as solucoes.
 *
 * O conteudo vem de dados-ajuda.js. Este arquivo so cuida da navegacao.
 */
(function (global) {
  'use strict';

  var VH = global.VH || (global.VH = {});

  var categoriaAtiva = '';

  function desenharProblemas() {
    var alvo = document.getElementById('grade-problemas');
    if (!alvo) return;

    var termo = document.getElementById('campo-busca-ajuda');
    var lista = termo && termo.value.trim()
      ? VH.ajuda.buscar(termo.value.trim())
      : (categoriaAtiva ? VH.ajuda.porCategoria(categoriaAtiva) : VH.ajuda.problemas);

    if (!lista.length) {
      alvo.innerHTML = '<div class="painel-vazio"><p>Nenhum problema encontrado com esse termo.</p></div>';
      return;
    }

    alvo.innerHTML = lista.map(function (problema) {
      return '<button type="button" class="problema" data-problema="' + VH.utils.escapar(problema.id) + '">'
        + '<span class="rotulo-categoria">' + VH.utils.escapar(VH.ajuda.nomeDaCategoria(problema.categoria)) + '</span>'
        + '<h3>' + VH.utils.escapar(problema.titulo) + '</h3>'
        + '<p>' + VH.utils.escapar(problema.resumo) + '</p>'
        + '<span class="contagem">' + problema.solucoes.length
        + (problema.solucoes.length === 1 ? ' solução' : ' soluções') + '</span>'
        + '</button>';
    }).join('');
  }

  function abrirProblema(id) {
    var painel = document.getElementById('painel-solucao');
    if (!painel) return;

    var problema = null;
    for (var i = 0; i < VH.ajuda.problemas.length; i += 1) {
      if (VH.ajuda.problemas[i].id === id) problema = VH.ajuda.problemas[i];
    }
    if (!problema) return;

    var zap = VH.configuracao.linkWhatsapp(
      'Olá! Preciso de ajuda com este assunto da VHARAK: ' + problema.titulo + '.'
    );

    painel.innerHTML = '<div class="solucao">'
      + '<div class="solucao-topo">'
      + '<div><span class="categoria-rotulo">' + VH.utils.escapar(VH.ajuda.nomeDaCategoria(problema.categoria)) + '</span>'
      + '<h3>' + VH.utils.escapar(problema.titulo) + '</h3></div>'
      + '<button type="button" class="fechar-painel" data-fechar aria-label="Fechar">&times;</button>'
      + '</div>'
      + '<p class="resumo">' + VH.utils.escapar(problema.resumo) + '</p>'
      + problema.solucoes.map(function (solucao) {
        return '<div class="solucao-item">'
          + '<h4>' + VH.utils.escapar(solucao.titulo) + '</h4>'
          + '<p>' + VH.utils.escapar(solucao.texto) + '</p>'
          + '</div>';
      }).join('')
      + '<div class="solucao-fim">'
      + '<p>Nao resolveu? Fale com a loja e a gente te ajuda.</p>'
      + (zap
        ? '<a class="btn btn-whatsapp" href="' + VH.utils.escapar(zap) + '" target="_blank" rel="noopener">Falar com o suporte</a>'
        : '<button class="btn btn-secondary" type="button" disabled>Suporte em breve</button>')
      + '</div>'
      + '</div>';

    painel.hidden = false;
    painel.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  function fecharProblema() {
    var painel = document.getElementById('painel-solucao');
    if (painel) {
      painel.hidden = true;
      painel.innerHTML = '';
    }
  }

  function iniciarCategorias() {
    var alvo = document.getElementById('categorias-ajuda');
    if (!alvo) return;

    alvo.innerHTML = '<button type="button" class="categoria active" data-categoria="">Todos os temas</button>'
      + VH.ajuda.categorias.map(function (categoria) {
        return '<button type="button" class="categoria" data-categoria="' + VH.utils.escapar(categoria.slug) + '">'
          + VH.utils.escapar(categoria.nome) + '</button>';
      }).join('');

    alvo.addEventListener('click', function (evento) {
      var botao = evento.target.closest('[data-categoria]');
      if (!botao) return;
      categoriaAtiva = botao.getAttribute('data-categoria') || '';
      alvo.querySelectorAll('.categoria').forEach(function (outro) {
        outro.classList.toggle('active', outro === botao);
      });
      fecharProblema();
      desenharProblemas();
    });
  }

  function iniciarBusca() {
    var campo = document.getElementById('campo-busca-ajuda');
    if (!campo) return;
    var temporizador = null;
    campo.addEventListener('input', function () {
      clearTimeout(temporizador);
      temporizador = setTimeout(function () {
        fecharProblema();
        desenharProblemas();
      }, 200);
    });
  }

  function iniciarGrade() {
    var grade = document.getElementById('grade-problemas');
    if (!grade) return;
    grade.addEventListener('click', function (evento) {
      var botao = evento.target.closest('[data-problema]');
      if (!botao) return;
      abrirProblema(botao.getAttribute('data-problema'));
    });
  }

  function iniciarFechamento() {
    var painel = document.getElementById('painel-solucao');
    if (!painel) return;
    painel.addEventListener('click', function (evento) {
      if (evento.target.closest('[data-fechar]')) fecharProblema();
    });
  }

  document.addEventListener('DOMContentLoaded', function () {
    iniciarCategorias();
    iniciarBusca();
    iniciarGrade();
    iniciarFechamento();
    desenharProblemas();
  });
}(window));
