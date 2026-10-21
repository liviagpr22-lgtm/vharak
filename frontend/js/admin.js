/*
 * VHARAK | admin.js
 * Painel local da loja.
 *
 * O catalogo e estatico: o painel nao escreve no servidor. Ele edita os
 * precos e as marcas dos produtos no navegador e gera o arquivo
 * precos.js pronto para ser substituido em /js/. E o que a loja precisa
 * enquanto a API nao existe.
 */
(function (global) {
  'use strict';

  var VH = global.VH || (global.VH = {});
  var CHAVE_SESSAO = 'vharak_admin';

  /* ---- Sessao --------------------------------------------------------------- */
  function sessao() {
    try {
      return global.localStorage.getItem(CHAVE_SESSAO) === 'aberta';
    } catch (erro) {
      return false;
    }
  }

  function entrar(senha) {
    if (String(senha || '') !== VH.configuracao.admin.senha) {
      throw new Error('Senha incorreta.');
    }
    try { global.localStorage.setItem(CHAVE_SESSAO, 'aberta'); } catch (erro) { /* sem armazenamento */ }
  }

  function sair() {
    try { global.localStorage.removeItem(CHAVE_SESSAO); } catch (erro) { /* sem armazenamento */ }
    global.location.href = '/pages/admin/login.html';
  }

  function exigirSessao() {
    if (!sessao()) {
      global.location.href = '/pages/admin/login.html';
      return false;
    }
    return true;
  }

  /* ---- Precos em edicao --------------------------------------------------------- */
  /* O painel guarda os precos que o dono digitou, por cima do precos.js. */
  function precosEditados() {
    try {
      var bruto = global.localStorage.getItem('vharak_precos_editados');
      return bruto ? JSON.parse(bruto) : {};
    } catch (erro) {
      return {};
    }
  }

  function salvarPrecoEditado(id, preco, de) {
    var mapa = precosEditados();
    mapa[id] = { preco: preco, de: de };
    try {
      global.localStorage.setItem('vharak_precos_editados', JSON.stringify(mapa));
    } catch (erro) {
      VH.utils.mostrarAviso('Não foi possível guardar a alteração.', 'erro');
    }
  }

  /* O preco vigente ja considera a sobreposicao do navegador (o modulo
     precos-local.js): e exatamente o valor que a vitrine mostra. */
  function precoVigente(id) {
    return VH.precos.precoDe(id);
  }

  function precoAnteriorVigente(id) {
    return VH.precos.precoDeAnterior(id);
  }

  /* ---- Lista colada de precos ---------------------------------------------- *
   * Digitar 128 precos linha a linha na tabela nao e praticavel. A lista
   * colada resolve: uma linha por produto, com o nome (ou o id) e o
   * preco. O separador e ponto e virgula, tabulacao, barra ou dois
   * espacos. A virgula nao separa: ela e o decimal brasileiro. */
  function normalizar(texto) {
    return String(texto || '')
      .toLowerCase()
      .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();
  }

  /* "R$ 1.299,90" | "1299.90" | "129990" -> centavos */
  function paraCentavos(valor) {
    var texto = String(valor || '').replace(/[^\d.,-]/g, '').trim();
    if (!texto) return null;

    var temVirgula = texto.indexOf(',') !== -1;
    var temPonto = texto.indexOf('.') !== -1;

    if (temVirgula && temPonto) {
      /* O ultimo separador e o decimal. */
      if (texto.lastIndexOf(',') > texto.lastIndexOf('.')) {
        texto = texto.replace(/\./g, '').replace(',', '.');
      } else {
        texto = texto.replace(/,/g, '');
      }
    } else if (temVirgula) {
      texto = texto.replace(',', '.');
    }

    var numero = Number(texto);
    if (!isFinite(numero) || numero < 0) return null;

    /* Com milhar separado por ponto e sem decimal, "1.299" e milhar. */
    var centavos = Math.round(numero * 100);
    return centavos;
  }

  function encontrarProduto(identificador) {
    var alvo = normalizar(identificador);
    if (!alvo) return null;

    /* 1. Id exato. */
    for (var i = 0; i < VH.PRODUTOS.length; i += 1) {
      if (VH.PRODUTOS[i].id === identificador.trim().toLowerCase()) return VH.PRODUTOS[i];
    }

    /* 2. Nome exato, sem acento. */
    for (var j = 0; j < VH.PRODUTOS.length; j += 1) {
      if (normalizar(VH.PRODUTOS[j].nome) === alvo) return VH.PRODUTOS[j];
    }

    /* 3. Nome que comeca com o texto digitado. */
    for (var k = 0; k < VH.PRODUTOS.length; k += 1) {
      if (normalizar(VH.PRODUTOS[k].nome).indexOf(alvo) === 0) return VH.PRODUTOS[k];
    }

    /* 4. O texto digitado esta dentro do nome: "Spider-Man 2" encontra
       "Marvel's Spider-Man 2". So vale para nomes especificos, com
       pelo menos 6 caracteres, para nao bringar o produto errado. */
    if (alvo.length >= 6) {
      var melhor = null;
      for (var m = 0; m < VH.PRODUTOS.length; m += 1) {
        var nome = normalizar(VH.PRODUTOS[m].nome);
        if (nome.indexOf(alvo) === -1) continue;
        /* Com varios candidatos, fica o de nome mais curto: e o mais
           especifico. */
        if (!melhor || nome.length < normalizar(melhor.nome).length) melhor = VH.PRODUTOS[m];
      }
      if (melhor) return melhor;
    }

    return null;
  }

  function aplicarListaDePrecos(texto) {
    var aplicados = [];
    var ignorados = [];

    String(texto || '').split(/\r?\n/).forEach(function (linha) {
      var limpa = linha.trim();
      if (!limpa || limpa.charAt(0) === '#') return;

      /* Separa em 2 ou 3 campos: identificador, preco e preco cheio.
         O separador e ponto e virgula, tabulacao, barra ou dois espacos.
         Virgula NAO separa: ela e o separador decimal brasileiro. */
      var partes = limpa.split(/;|\t|\s*\|\s*|\s{2,}/);
      if (partes.length < 2) {
        ignorados.push(linha + '  (formato não reconhecido)');
        return;
      }

      var identificador = partes[0];
      var preco = paraCentavos(partes[1]);
      var de = partes.length > 2 ? paraCentavos(partes[2]) : null;

      if (preco === null) {
        ignorados.push(linha + '  (preço inválido)');
        return;
      }
      if (de !== null && de <= preco) {
        ignorados.push(linha + '  (preço cheio menor que o de venda)');
        return;
      }

      var produto = encontrarProduto(identificador);
      if (!produto) {
        ignorados.push(linha + '  (produto não encontrado)');
        return;
      }

      salvarPrecoEditado(produto.id, preco, de);
      aplicados.push(produto.nome + ' — R$ ' + (preco / 100).toFixed(2).replace('.', ','));
    });

    return { aplicados: aplicados, ignorados: ignorados };
  }

  /* ---- Exportacao do precos.js ----------------------------------------------------- */
  /* Gera o texto do arquivo. Separado do download para poder ser testado
     sem navegador e para o painel poder mostrar o resultado antes de
     salvar. */
  function gerarConteudoDePrecos() {
    var linhas = [];

    VH.PRODUTOS.forEach(function (produto) {
      var preco = VH.precos.precoDe(produto.id);
      var de = VH.precos.precoDeAnterior(produto.id);

      if (preco === null && de === null) return;
      linhas.push("  '" + produto.id + "': { preco: " + preco + ', de: ' + de + ' },');
    });

    return `/*
 * VHARAK | precos.js
 * Precos da loja, em centavos. Gerado pelo painel local em
 * ${new Date().toLocaleString('pt-BR')}.
 *
 * Substitua este arquivo em frontend/js/precos.js para publicar as
 * alteracoes.
 */
(function (global) {
  'use strict';

  var VH = global.VH || (global.VH = {});

  var PRECOS = {
${linhas.join('\n')}
  };

  VH.precos = {
    todos: PRECOS,
    precoDe: function (id) {
      var entrada = PRECOS[id];
      return entrada && typeof entrada.preco === 'number' ? entrada.preco : null;
    },
    precoDeAnterior: function (id) {
      var entrada = PRECOS[id];
      return entrada && typeof entrada.de === 'number' ? entrada.de : null;
    },
    desconto: function (id) {
      var entrada = PRECOS[id];
      if (!entrada || typeof entrada.de !== 'number' || typeof entrada.preco !== 'number') return null;
      if (entrada.de <= entrada.preco) return null;
      return Math.round((1 - entrada.preco / entrada.de) * 100);
    },
    publicado: function (id) {
      return VH.precos.precoDe(id) !== null;
    }
  };
}(window));
`;
  }

  /* Gera um modelo em branco para preencher numa planilha: uma linha por
     produto, com o id, o nome e as colunas de preco. */
  function gerarModeloDePrecos() {
    var linhas = ['id;nome;preço;preço cheio'];
    VH.PRODUTOS.forEach(function (produto) {
      linhas.push(produto.id + ';' + produto.nome + ';;');
    });
    return linhas.join('\n');
  }

  function baixarArquivo(nome, conteudo) {
    var arquivo = new Blob([conteudo], { type: 'text/javascript;charset=utf-8' });
    var link = document.createElement('a');
    link.href = URL.createObjectURL(arquivo);
    link.download = nome;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(link.href);
  }

  function gerarArquivoDePrecos() {
    baixarArquivo('precos.js', gerarConteudoDePrecos());
  }

  /* ---- Dashboard ------------------------------------------------------------------ */
  function desenharDashboard() {
    var alvo = document.getElementById('indicadores');
    if (!alvo) return;

    var jogos = VH.jogos().length;
    var consoles = VH.consoles().length;
    var comPreco = VH.PRODUTOS.filter(function (p) { return precoVigente(p.id) !== null; }).length;
    var pedidos = VH.carrinho.pedidos().length;

    alvo.innerHTML = [
      { rotulo: 'Jogos no catálogo', valor: jogos, nota: 'títulos cadastrados' },
      { rotulo: 'Consoles', valor: consoles, nota: 'modelos cadastrados' },
      { rotulo: 'Com preço publicado', valor: comPreco, nota: 'de ' + VH.PRODUTOS.length + ' produtos', destaque: true },
      { rotulo: 'Pedidos registrados', valor: pedidos, nota: 'neste navegador' }
    ].map(function (indicador) {
      return '<div class="indicador' + (indicador.destaque ? ' destaque' : '') + '">'
        + '<div class="rotulo">' + indicador.rotulo + '</div>'
        + '<div class="valor">' + indicador.valor + '</div>'
        + '<div class="nota">' + indicador.nota + '</div>'
        + '</div>';
    }).join('');
  }

  /* ---- Produtos ---------------------------------------------------------------------- */
  function desenharProdutos() {
    var alvo = document.getElementById('tabela-produtos');
    if (!alvo) return;

    var termo = document.getElementById('busca-produtos');
    var filtro = document.getElementById('filtro-produtos');

    var lista = VH.PRODUTOS.slice();
    if (filtro && filtro.value) {
      lista = lista.filter(function (p) { return p.tipo === filtro.value; });
    }
    if (termo && termo.value.trim()) {
      var alvoTexto = termo.value.trim().toLowerCase();
      lista = lista.filter(function (p) {
        return p.nome.toLowerCase().indexOf(alvoTexto) !== -1;
      });
    }

    if (!lista.length) {
      alvo.innerHTML = '<tr><td colspan="4" class="admin-vazio">Nenhum produto encontrado.</td></tr>';
      return;
    }

    alvo.innerHTML = lista.map(function (produto) {
      var preco = precoVigente(produto.id);
      var de = precoAnteriorVigente(produto.id);
      return '<tr data-produto="' + VH.utils.escapar(produto.id) + '">'
        + '<td><img class="capa-mini" src="/' + VH.utils.escapar(produto.capa) + '" alt="" loading="lazy">'
        + '<span class="nome-forte">' + VH.utils.escapar(produto.nome) + '</span></td>'
        + '<td>' + (produto.tipo === 'console' ? 'Console' : VH.utils.escapar(produto.generoRotulo || 'Jogo')) + '</td>'
        + '<td>' + (produto.destaque ? '<span class="badge badge-accent">Destaque</span>' : '') + '</td>'
        + '<td>'
        + '<input type="number" min="0" step="1" placeholder="vazio" value="' + (preco === null ? '' : preco) + '" data-preco style="width:110px;padding:8px 10px;background:var(--bg-secondary);border:1px solid var(--border);border-radius:6px;color:var(--text-primary)">'
        + ' <input type="number" min="0" step="1" placeholder="de" value="' + (de === null ? '' : de) + '" data-preco-de style="width:110px;padding:8px 10px;background:var(--bg-secondary);border:1px solid var(--border);border-radius:6px;color:var(--text-primary)">'
        + '</td>'
        + '</tr>';
    }).join('');
  }

  function iniciarEdicaoDePreco() {
    var tabela = document.getElementById('tabela-produtos');
    if (!tabela) return;

    tabela.addEventListener('change', function (evento) {
      var campo = evento.target;
      if (!campo.hasAttribute('data-preco')) return;

      var linha = campo.closest('[data-produto]');
      var id = linha.getAttribute('data-produto');

      var preco = campo.value === '' ? null : Number(campo.value);
      var deCampo = linha.querySelector('[data-preco-de]');
      var de = deCampo && deCampo.value !== '' ? Number(deCampo.value) : null;

      if (preco !== null && (!isFinite(preco) || preco < 0)) {
        VH.utils.mostrarAviso('Preço inválido.', 'erro');
        return;
      }
      if (de !== null && preco !== null && de <= preco) {
        VH.utils.mostrarAviso('O preço "de" precisa ser maior que o preço de venda.', 'erro');
        return;
      }

      salvarPrecoEditado(id, preco, de);
      VH.utils.mostrarAviso('Preco salvo. Use "Exportar precos.js" para publicar.');
    });
  }

  /* ---- Pedidos e clientes ---------------------------------------------------------------- */
  function desenharPedidos() {
    var alvo = document.getElementById('tabela-pedidos');
    if (!alvo) return;

    var pedidos = VH.carrinho.pedidos();
    if (!pedidos.length) {
      alvo.innerHTML = '<tr><td colspan="4" class="admin-vazio">Nenhum pedido registrado neste navegador.</td></tr>';
      return;
    }

    alvo.innerHTML = pedidos.map(function (pedido) {
      var itens = pedido.itens.map(function (item) {
        return item.quantidade + 'x ' + VH.utils.escapar(item.nome);
      }).join(', ');
      var total = typeof pedido.total === 'number' && pedido.total > 0
        ? 'R$ ' + (pedido.total / 100).toFixed(2).replace('.', ',')
        : 'a combinar';
      return '<tr>'
        + '<td class="nome-forte">' + VH.utils.escapar(pedido.id) + '</td>'
        + '<td>' + itens + '</td>'
        + '<td>' + total + '</td>'
        + '<td>' + VH.utils.escapar(pedido.status) + ' — ' + VH.utils.formatarDataHora(pedido.quando) + '</td>'
        + '</tr>';
    }).join('');
  }

  function desenharClientes() {
    var alvo = document.getElementById('tabela-clientes');
    if (!alvo) return;

    var clientes = [];
    try {
      var bruto = global.localStorage.getItem('vharak_clientes');
      clientes = bruto ? JSON.parse(bruto) : [];
    } catch (erro) {
      clientes = [];
    }

    if (!clientes.length) {
      alvo.innerHTML = '<tr><td colspan="3" class="admin-vazio">Nenhum cliente cadastrado neste navegador.</td></tr>';
      return;
    }

    alvo.innerHTML = clientes.map(function (cliente) {
      return '<tr>'
        + '<td class="nome-forte">' + VH.utils.escapar(cliente.nome) + '</td>'
        + '<td>' + VH.utils.escapar(cliente.email) + '</td>'
        + '<td>' + VH.utils.formatarData(cliente.criadoEm) + '</td>'
        + '</tr>';
    }).join('');
  }

  /* ---- Login -------------------------------------------------------------------------------- */
  function iniciarLogin() {
    var formulario = document.getElementById('formulario-admin');
    if (!formulario) return;

    formulario.addEventListener('submit', function (evento) {
      evento.preventDefault();
      var erro = document.getElementById('erro-admin');
      try {
        entrar(formulario.querySelector('#senha-admin').value);
        global.location.href = '/pages/admin/dashboard.html';
      } catch (e) {
        if (erro) { erro.textContent = e.message; erro.hidden = false; }
      }
    });
  }

  /* ---- Inicializacao por pagina ------------------------------------------------------------------ */
  function iniciar() {
    if (document.querySelector('.admin-login')) {
      iniciarLogin();
      return;
    }
    if (!exigirSessao()) return;

    var botaoSair = document.querySelector('[data-sair]');
    if (botaoSair) botaoSair.addEventListener('click', sair);

    if (document.getElementById('indicadores')) desenharDashboard();
    if (document.getElementById('tabela-produtos')) {
      desenharProdutos();
      iniciarEdicaoDePreco();
      var busca = document.getElementById('busca-produtos');
      if (busca) busca.addEventListener('input', desenharProdutos);
      var filtro = document.getElementById('filtro-produtos');
      if (filtro) filtro.addEventListener('change', desenharProdutos);
      var exportar = document.getElementById('exportar-precos');
      if (exportar) exportar.addEventListener('click', gerarArquivoDePrecos);

      var modelo = document.getElementById('baixar-modelo');
      if (modelo) {
        modelo.addEventListener('click', function () {
          baixarArquivo('modelo-precos.csv', gerarModeloDePrecos());
        });
      }

      var aplicar = document.getElementById('aplicar-lista');
      if (aplicar) {
        aplicar.addEventListener('click', function () {
          var campo = document.getElementById('lista-precos');
          var resultado = document.getElementById('resultado-lista');
          if (!campo || !resultado) return;

          var relatorio = aplicarListaDePrecos(campo.value);
          desenharProdutos();

          var html = '<p style="font-weight:600;margin-bottom:8px">'
            + relatorio.aplicados.length + ' preço(s) aplicado(s).</p>';

          if (relatorio.aplicados.length) {
            html += '<ul style="color:var(--success);font-size:13px;line-height:1.8;margin-bottom:12px">';
            relatorio.aplicados.slice(0, 12).forEach(function (linha) {
              html += '<li>' + VH.utils.escapar(linha) + '</li>';
            });
            html += '</ul>';
            if (relatorio.aplicados.length > 12) {
              html += '<p style="color:var(--text-muted);font-size:13px">e mais '
                + (relatorio.aplicados.length - 12) + '.</p>';
            }
          }

          if (relatorio.ignorados.length) {
            html += '<details style="margin-top:8px"><summary style="cursor:pointer;color:var(--warning);font-size:13px">'
              + relatorio.ignorados.length + ' linha(s) não aplicada(s)</summary>'
              + '<ul style="color:var(--text-muted);font-size:13px;line-height:1.8;margin-top:8px">';
            relatorio.ignorados.forEach(function (linha) {
              html += '<li>' + VH.utils.escapar(linha) + '</li>';
            });
            html += '</ul></details>';
          }

          resultado.innerHTML = html;
        });
      }
    }
    if (document.getElementById('tabela-pedidos')) desenharPedidos();
    if (document.getElementById('tabela-clientes')) desenharClientes();
  }

  document.addEventListener('DOMContentLoaded', iniciar);

  VH.admin = {
    sessao: sessao,
    entrar: entrar,
    sair: sair,
    precoVigente: precoVigente,
    aplicarListaDePrecos: aplicarListaDePrecos,
    gerarConteudoDePrecos: gerarConteudoDePrecos,
    gerarArquivoDePrecos: gerarArquivoDePrecos,
    gerarModeloDePrecos: gerarModeloDePrecos,
    baixarArquivo: baixarArquivo
  };
}(window));
