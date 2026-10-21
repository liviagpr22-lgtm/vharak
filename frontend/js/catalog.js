/*
 * VHARAK | catalog.js
 * Pagina de catalogo: abas de tipo, busca, filtros e ordenacao.
 *
 * O estado inteiro mora na URL: qualquer combinacao de filtros pode ser
 * copiada e enviada para alguem, e o botao "voltar" do navegador
 * desfaz um filtro por vez.
 */
(function (global) {
  'use strict';

  var VH = global.VH || (global.VH = {});

  var CLASSIFICACOES = [
    { id: 'livre', rotulo: 'L' },
    { id: '10', rotulo: '10' },
    { id: '12', rotulo: '12' },
    { id: '14', rotulo: '14' },
    { id: '16', rotulo: '16' },
    { id: '18', rotulo: '18' }
  ];

  var ORDENS = [
    { id: 'relevancia', rotulo: 'Relevância' },
    { id: 'vendidos', rotulo: 'Mais vendidos' },
    { id: 'novidades', rotulo: 'Lançamentos' },
    { id: 'nota', rotulo: 'Melhor avaliados' },
    { id: 'nome', rotulo: 'Nome (A-Z)' },
    { id: 'preco', rotulo: 'Menor preço' }
  ];

  var estado = {
    tipo: '',
    q: '',
    genero: '',
    fabricante: '',
    classificacao: '',
    geracao: '',
    ordenar: 'relevancia'
  };

  function lerEstadoDaUrl() {
    var params = new URLSearchParams(global.location.search);
    estado.tipo = params.get('tipo') || '';
    estado.q = params.get('q') || '';
    estado.genero = params.get('genero') || '';
    estado.fabricante = params.get('fabricante') || '';
    estado.classificacao = params.get('classificacao') || '';
    estado.geracao = params.get('geracao') || '';
    estado.ordenar = params.get('ordenar') || 'relevancia';

    /* A pagina de consoles abre ja filtrada: o tipo padrao vale so
       quando a URL nao diz nada. */
    if (!estado.tipo) {
      var padrao = document.querySelector('[data-tipo-padrao]');
      if (padrao) estado.tipo = padrao.getAttribute('data-tipo-padrao') || '';
    }
  }

  function escreverEstadoNaUrl() {
    var params = new URLSearchParams();
    if (estado.tipo) params.set('tipo', estado.tipo);
    if (estado.q) params.set('q', estado.q);
    if (estado.genero) params.set('genero', estado.genero);
    if (estado.fabricante) params.set('fabricante', estado.fabricante);
    if (estado.classificacao) params.set('classificacao', estado.classificacao);
    if (estado.ordenar && estado.ordenar !== 'relevancia') params.set('ordenar', estado.ordenar);
    if (estado.geracao) params.set('geracao', estado.geracao);

    var query = params.toString();
    var nova = global.location.pathname + (query ? '?' + query : '');
    global.history.replaceState({}, '', nova);
  }

  /* ---- Filtragem --------------------------------------------------------- */
  function filtrar(produtos) {
    var termo = estado.q.trim().toLowerCase();

    return produtos.filter(function (produto) {
      if (estado.tipo && produto.tipo !== estado.tipo) return false;
      if (estado.genero && produto.genero !== estado.genero) return false;
      if (estado.fabricante && produto.fabricante !== estado.fabricante) return false;
      if (estado.classificacao) {
        if (produto.tipo === 'console') return false;
        if (String(produto.classificacao).toLowerCase() !== estado.classificacao) return false;
      }
      if (estado.geracao && produto.geracao !== estado.geracao) return false;
      if (termo) {
        var texto = [produto.nome, produto.generoRotulo, produto.plataformas,
          produto.desenvolvedora, produto.editora, produto.modelo]
          .filter(Boolean).join(' ').toLowerCase();
        if (texto.indexOf(termo) === -1) return false;
      }
      return true;
    });
  }

  function ordenar(produtos) {
    var lista = produtos.slice();

    if (estado.ordenar === 'vendidos') {
      lista.sort(function (a, b) {
        return (b.popularidade || 0) - (a.popularidade || 0);
      });
    } else if (estado.ordenar === 'novidades') {
      lista.sort(function (a, b) {
        return (b.ano || 0) - (a.ano || 0);
      });
    } else if (estado.ordenar === 'nota') {
      lista.sort(function (a, b) {
        return (b.nota || 0) - (a.nota || 0);
      });
    } else if (estado.ordenar === 'nome') {
      lista.sort(function (a, b) {
        return a.nome.localeCompare(b.nome, 'pt-BR');
      });
    } else if (estado.ordenar === 'preco') {
      lista.sort(function (a, b) {
        var pa = VH.utils.precoDe(a);
        var pb = VH.utils.precoDe(b);
        if (pa === null && pb === null) return a.nome.localeCompare(b.nome, 'pt-BR');
        if (pa === null) return 1;
        if (pb === null) return -1;
        return pa - pb;
      });
    }
    return lista;
  }

  /* ---- Desenho ------------------------------------------------------------ */
  function desenhar() {
    var grade = document.getElementById('grade-catalogo');
    var contador = document.getElementById('contador-resultados');
    if (!grade) return;

    var resultados = ordenar(filtrar(VH.todos()));

    if (contador) {
      contador.innerHTML = '<strong>' + resultados.length + '</strong> '
        + (resultados.length === 1 ? 'produto encontrado' : 'produtos encontrados');
    }

    if (!resultados.length) {
      grade.innerHTML = '';
      var vazio = document.getElementById('estado-vazio');
      if (vazio) vazio.hidden = false;
      return;
    }

    var estadoVazio = document.getElementById('estado-vazio');
    if (estadoVazio) estadoVazio.hidden = true;

    grade.innerHTML = resultados.map(VH.utils.criarCardProduto).join('');
  }

  function marcarPill(grupo, valor) {
    var botoes = document.querySelectorAll('[data-filtro="' + grupo + '"]');
    botoes.forEach(function (botao) {
      var ativo = botao.getAttribute('data-valor') === valor;
      botao.classList.toggle('active', ativo);
      botao.setAttribute('aria-pressed', ativo ? 'true' : 'false');
    });
  }

  function marcarAbas() {
    var abas = document.querySelectorAll('[data-aba]');
    abas.forEach(function (aba) {
      var ativo = (aba.getAttribute('data-aba') || '') === estado.tipo;
      aba.classList.toggle('active', ativo);
      aba.setAttribute('aria-selected', ativo ? 'true' : 'false');
    });
  }

  function sincronizarControles() {
    var campo = document.getElementById('campo-busca');
    if (campo && campo.value !== estado.q) campo.value = estado.q;

    var seletor = document.getElementById('seletor-ordem');
    if (seletor) seletor.value = estado.ordenar;

    marcarAbas();
    marcarPill('genero', estado.genero);
    marcarPill('fabricante', estado.fabricante);
    marcarPill('classificacao', estado.classificacao);
    marcarPill('geracao', estado.geracao);
  }

  /* ---- Eventos -------------------------------------------------------------- */
  function iniciarAbas() {
    document.querySelectorAll('[data-aba]').forEach(function (aba) {
      aba.addEventListener('click', function () {
        estado.tipo = aba.getAttribute('data-aba') || '';
        escreverEstadoNaUrl();
        sincronizarControles();
        desenhar();
      });
    });
  }

  function iniciarFiltros() {
    document.querySelectorAll('[data-filtro]').forEach(function (botao) {
      botao.addEventListener('click', function () {
        var grupo = botao.getAttribute('data-filtro');
        var valor = botao.getAttribute('data-valor') || '';
        /* Clicar de novo no filtro ativo desliga o filtro. */
        estado[grupo] = estado[grupo] === valor ? '' : valor;
        escreverEstadoNaUrl();
        sincronizarControles();
        desenhar();
      });
    });
  }

  function iniciarBusca() {
    var campo = document.getElementById('campo-busca');
    if (!campo) return;

    var temporizador = null;
    campo.addEventListener('input', function () {
      clearTimeout(temporizador);
      temporizador = setTimeout(function () {
        estado.q = campo.value.trim();
        escreverEstadoNaUrl();
        desenhar();
      }, 220);
    });

    var formulario = document.getElementById('formulario-busca');
    if (formulario) {
      formulario.addEventListener('submit', function (evento) {
        evento.preventDefault();
        clearTimeout(temporizador);
        estado.q = campo.value.trim();
        escreverEstadoNaUrl();
        desenhar();
      });
    }
  }

  function iniciarOrdenacao() {
    var seletor = document.getElementById('seletor-ordem');
    if (!seletor) return;
    seletor.addEventListener('change', function () {
      estado.ordenar = seletor.value;
      escreverEstadoNaUrl();
      desenhar();
    });
  }

  function iniciarLimpeza() {
    var botao = document.getElementById('limpar-filtros');
    if (!botao) return;
    botao.addEventListener('click', function () {
      estado.tipo = '';
      estado.q = '';
      estado.genero = '';
      estado.fabricante = '';
      estado.classificacao = '';
      estado.geracao = '';
      estado.ordenar = 'relevancia';
      escreverEstadoNaUrl();
      sincronizarControles();
      desenhar();
    });
  }

  /* ---- Montagem dos filtros ------------------------------------------------ */
  function montarFiltros() {
    var alvoGenero = document.getElementById('filtro-genero');
    if (alvoGenero) {
      alvoGenero.innerHTML = VH.GENEROS_FILTRO.map(function (genero) {
        return '<button type="button" class="pill" data-filtro="genero" data-valor="' + genero.id + '" aria-pressed="false">'
          + VH.utils.escapar(genero.rotulo) + '</button>';
      }).join('');
    }

    var alvoFabricante = document.getElementById('filtro-fabricante');
    if (alvoFabricante) {
      alvoFabricante.innerHTML = VH.FABRICANTES.map(function (fabricante) {
        return '<button type="button" class="pill" data-filtro="fabricante" data-valor="' + fabricante.id + '" aria-pressed="false">'
          + VH.utils.escapar(fabricante.rotulo) + '</button>';
      }).join('');
    }

    var alvoClassificacao = document.getElementById('filtro-classificacao');
    if (alvoClassificacao) {
      alvoClassificacao.innerHTML = CLASSIFICACOES.map(function (item) {
        return '<button type="button" class="pill" data-filtro="classificacao" data-valor="' + item.id + '" aria-pressed="false">'
          + item.rotulo + '</button>';
      }).join('');
    }

    var alvoOrdem = document.getElementById('seletor-ordem');
    if (alvoOrdem) {
      alvoOrdem.innerHTML = ORDENS.map(function (ordem) {
        return '<option value="' + ordem.id + '">' + ordem.rotulo + '</option>';
      }).join('');
    }

    /* A geracao so aparece na pagina de consoles, e so quando o catalogo
       tem consoles com esse campo preenchido. */
    var alvoGeracao = document.getElementById('filtro-geracao');
    if (alvoGeracao) {
      var geracoes = [];
      VH.consoles().forEach(function (console) {
        if (!console.geracao) return;
        for (var i = 0; i < geracoes.length; i += 1) {
          if (geracoes[i].id === console.geracao) return;
        }
        geracoes.push({ id: console.geracao, rotulo: console.geracaoRotulo || (console.geracao + 'a geracao') });
      });
      geracoes.sort(function (a, b) { return Number(b.id) - Number(a.id); });
      alvoGeracao.innerHTML = geracoes.map(function (item) {
        return '<button type="button" class="pill" data-filtro="geracao" data-valor="' + VH.utils.escapar(item.id) + '" aria-pressed="false">'
          + VH.utils.escapar(item.rotulo) + '</button>';
      }).join('');
    }
  }

  function iniciar() {
    lerEstadoDaUrl();
    montarFiltros();
    sincronizarControles();
    iniciarAbas();
    iniciarFiltros();
    iniciarBusca();
    iniciarOrdenacao();
    iniciarLimpeza();
    desenhar();
  }

  document.addEventListener('DOMContentLoaded', iniciar);
}(window));
