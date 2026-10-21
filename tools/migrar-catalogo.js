/*
 * VHARAK | tools/migrar-catalogo.js
 *
 * Migracao do catalogo antigo (frontend-antigo) para o formato novo:
 * uma unica fonte de dados (frontend/js/dados-catalogo.js) com os 105
 * jogos e os 23 consoles, enriched com os campos que a vitrine precisa
 * (desenvolvedora, editora, ano, nota, destaques).
 *
 * Roda uma vez. Nao faz parte do site.
 *
 * Uso: node tools/migrar-catalogo.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const ANTIGO = path.join(RAIZ, 'frontend-antigo');
const DESTINO = path.join(RAIZ, 'frontend', 'js', 'dados-catalogo.js');

/* ------------------------------------------------------------------ *
 * 1. Dados complementares, digitados a mao para os titulos mais
 *    conhecidos. Todo o resto continua sem esses campos.
 * ------------------------------------------------------------------ */
const EXTRAS = {
  'ps-elden-ring': { desenvolvedora: 'FromSoftware', editora: 'Bandai Namco', ano: 2022, nota: 9.5, avaliações: 4210, popularidade: 98, destaque: true },
  'ps-god-of-war-ragnarok': { desenvolvedora: 'Santa Monica Studio', editora: 'Sony Interactive Entertainment', ano: 2022, nota: 9.4, avaliações: 3120, popularidade: 96, destaque: true },
  'ps-marvel-s-spider-man-2': { desenvolvedora: 'Insomniac Games', editora: 'Sony Interactive Entertainment', ano: 2023, nota: 9.5, avaliações: 2870, popularidade: 95, destaque: true },
  'ps-red-dead-redemption-2': { desenvolvedora: 'Rockstar Games', editora: 'Rockstar Games', ano: 2019, nota: 9.5, avaliações: 3980, popularidade: 99, destaque: true },
  'ps-the-last-of-us-part-ii-remastered': { desenvolvedora: 'Naughty Dog', editora: 'Sony Interactive Entertainment', ano: 2024, nota: 9.3, avaliações: 2410, popularidade: 94, destaque: true },
  'ps-the-last-of-us-part-i': { desenvolvedora: 'Naughty Dog', editora: 'Sony Interactive Entertainment', ano: 2022, nota: 9.0, avaliações: 1980, popularidade: 90, destaque: true },
  'ps-horizon-forbidden-west': { desenvolvedora: 'Guerrilla Games', editora: 'Sony Interactive Entertainment', ano: 2022, nota: 9.2, avaliações: 2140, popularidade: 92, destaque: true },
  'ps-horizon-zero-dawn-remastered': { desenvolvedora: 'Guerrilla Games', editora: 'Sony Interactive Entertainment', ano: 2024, nota: 9.0, avaliações: 1650, popularidade: 88, destaque: true },
  'ps-black-myth-wukong': { desenvolvedora: 'Game Science', editora: 'Tencent Games', ano: 2024, nota: 8.8, avaliações: 2320, popularidade: 93, destaque: true },
  'ps-bloodborne': { desenvolvedora: 'Japan Studio', editora: 'Sony Computer Entertainment', ano: 2015, nota: 9.0, avaliações: 2240, popularidade: 91, destaque: true },
  'ps-demon-s-souls': { desenvolvedora: 'Bluepoint Games', editora: 'Sony Interactive Entertainment', ano: 2020, nota: 9.0, avaliações: 1830, popularidade: 89, destaque: true },
  'ps-final-fantasy-vii-rebirth': { desenvolvedora: 'Square Enix', editora: 'Square Enix', ano: 2024, nota: 9.0, avaliações: 1760, popularidade: 87 },
  'ps-final-fantasy-xvi': { desenvolvedora: 'Square Enix', editora: 'Square Enix', ano: 2023, nota: 8.7, avaliações: 1640, popularidade: 85 },
  'ps-stellar-blade': { desenvolvedora: 'Shift Up', editora: 'Sony Interactive Entertainment', ano: 2024, nota: 8.2, avaliações: 1180, popularidade: 86, destaque: true },
  'ps-death-stranding-2-on-the-beach': { desenvolvedora: 'Kojima Productions', editora: 'Sony Interactive Entertainment', ano: 2025, nota: 9.2, avaliações: 980, popularidade: 97, destaque: true, novo: true },
  'ps-ghost-of-tsushima-director-s-cut': { desenvolvedora: 'Sucker Punch Productions', editora: 'Sony Interactive Entertainment', ano: 2024, nota: 9.0, avaliações: 1520, popularidade: 90, destaque: true },
  'ps-ghost-of-yotei': { desenvolvedora: 'Sucker Punch Productions', editora: 'Sony Interactive Entertainment', ano: 2025, nota: 8.6, avaliações: 870, popularidade: 94, destaque: true, novo: true },
  'ps-marvel-s-spider-man-remastered': { desenvolvedora: 'Insomniac Games', editora: 'Sony Interactive Entertainment', ano: 2023, nota: 9.0, avaliações: 2410, popularidade: 92, destaque: true },
  'ps-rise-of-the-ronin': { desenvolvedora: 'Team Ninja', editora: 'Koei Tecmo', ano: 2024, nota: 8.1, avaliações: 760, popularidade: 82 },
  'nin-hollow-knight': { desenvolvedora: 'Team Cherry', editora: 'Team Cherry', ano: 2017, nota: 9.4, avaliações: 3240, popularidade: 96, destaque: true },
  'nin-the-legend-of-zelda-breath-of-the-wild': { desenvolvedora: 'Nintendo EPD', editora: 'Nintendo', ano: 2017, nota: 9.5, avaliações: 4180, popularidade: 99, destaque: true },
  'nin-the-legend-of-zelda-tears-of-the-kingdom': { desenvolvedora: 'Nintendo EPD', editora: 'Nintendo', ano: 2023, nota: 9.5, avaliações: 2760, popularidade: 95, destaque: true },
  'nin-mario-kart-8-deluxe': { desenvolvedora: 'Nintendo EPD', editora: 'Nintendo', ano: 2017, nota: 9.3, avaliações: 3120, popularidade: 97, destaque: true },
  'nin-metroid-dread': { desenvolvedora: 'MercurySteam', editora: 'Nintendo', ano: 2021, nota: 8.5, avaliações: 1490, popularidade: 88 },
  'nin-fire-emblem-three-houses': { desenvolvedora: 'Intelligent Systems', editora: 'Nintendo', ano: 2019, nota: 8.7, avaliações: 1120, popularidade: 84 },
  'xbox-grand-theft-auto-v': { desenvolvedora: 'Rockstar Games', editora: 'Rockstar Games', ano: 2013, nota: 9.5, avaliações: 4560, popularidade: 98, destaque: true },
  'xbox-indiana-jones-and-the-great-circle': { desenvolvedora: 'Bethesda Game Studios', editora: 'Bethesda', ano: 2024, nota: 8.2, avaliações: 640, popularidade: 84, novo: true },
  'xbox-sea-of-thieves': { desenvolvedora: 'Rare', editora: 'Xbox Game Studios', ano: 2018, nota: 8.3, avaliações: 1310, popularidade: 86 },
  'xbox-minecraft-dungeons': { desenvolvedora: 'Mojang Studios', editora: 'Xbox Game Studios', ano: 2021, nota: 7.9, avaliações: 890, popularidade: 81 },
};

/* Console: fabricante, geracao, modelo, lancamento. */
const EXTRAS_CONSOLE = {
  'Xbox Series X': { ano: 2020, geracao: '9', geracaoRotulo: '9ª geração', nota: 9.4, avaliações: 1420, popularidade: 97, destaque: true, descricao: 'O console de maior desempenho da Xbox, com 4K a 120 fps e retrocompatibilidade com toda a biblioteca do Xbox One.' },
  'Xbox Series S': { ano: 2020, geracao: '9', geracaoRotulo: '9ª geração', nota: 8.4, avaliações: 860, popularidade: 89, destaque: true, descricao: 'A versão compacta e digital da nova geração da Xbox, com o mesmo desempenho da Series X em um corpo 60% menor.' },
  'Xbox One S': { ano: 2016, geracao: '8', geracaoRotulo: '8ª geração', nota: 7.4, avaliações: 610, popularidade: 78 },
  'Xbox One X': { ano: 2017, geracao: '8', geracaoRotulo: '8ª geração', nota: 8.0, avaliações: 480, popularidade: 76 },
  'PlayStation 5': { ano: 2020, geracao: '9', geracaoRotulo: '9ª geração', nota: 9.5, avaliações: 2380, popularidade: 99, destaque: true, descricao: 'A atual geração do PlayStation, com SSD de altíssima velocidade, ray tracing e compatibilidade com a maioria dos títulos do PS4.' },
  'PlayStation 5 Digital Edition': { ano: 2020, geracao: '9', geracaoRotulo: '9ª geração', nota: 8.9, avaliações: 940, popularidade: 91, destaque: true },
  'PlayStation 4 Pro': { ano: 2016, geracao: '8', geracaoRotulo: '8ª geração', nota: 8.3, avaliações: 1180, popularidade: 87 },
  'PlayStation 4 Slim': { ano: 2016, geracao: '8', geracaoRotulo: '8ª geração', nota: 8.0, avaliações: 760, popularidade: 80 },
  'PlayStation 3': { ano: 2006, geracao: '7', geracaoRotulo: '7ª geração', nota: 8.1, avaliações: 1420, popularidade: 82 },
  'PlayStation 2': { ano: 2000, geracao: '6', geracaoRotulo: '6ª geração', nota: 9.2, avaliações: 2100, popularidade: 85 },
  'PlayStation': { ano: 1994, geracao: '5', geracaoRotulo: '5ª geração', nota: 9.3, avaliações: 1640, popularidade: 83 },
  'Nintendo Switch 2': { ano: 2025, geracao: '9', geracaoRotulo: '9ª geração', nota: 9.1, avaliações: 720, popularidade: 98, destaque: true, novo: true },
  'Nintendo Switch OLED': { ano: 2021, geracao: '8', geracaoRotulo: '8ª geração (híbrida)', nota: 9.0, avaliações: 1820, popularidade: 95, destaque: true },
  'Nintendo Switch': { ano: 2017, geracao: '8', geracaoRotulo: '8ª geração (híbrida)', nota: 8.8, avaliações: 2940, popularidade: 96, destaque: true },
  'Nintendo 3DS': { ano: 2011, geracao: '8', geracaoRotulo: '8ª geração (portátil)', nota: 8.6, avaliações: 1180, popularidade: 84 },
  'Nintendo DS': { ano: 2004, geracao: '7', geracaoRotulo: '7ª geração (portátil)', nota: 9.0, avaliações: 1560, popularidade: 85 },
  'Game Boy Advance': { ano: 2001, geracao: '6', geracaoRotulo: '6ª geração (portátil)', nota: 8.7, avaliações: 940, popularidade: 78 },
  'Game Boy Color': { ano: 1998, geracao: '6', geracaoRotulo: '6ª geração (portátil)', nota: 8.4, avaliações: 620, popularidade: 74 },
  'Super Nintendo': { ano: 1990, geracao: '4', geracaoRotulo: '4ª geração', nota: 9.2, avaliações: 1420, popularidade: 79 },
  'Nintendo Entertainment System': { ano: 1983, geracao: '3', geracaoRotulo: '3ª geração', nota: 9.0, avaliações: 880, popularidade: 72 },
};

/* ------------------------------------------------------------------ *
 * 2. Fonte dos dados
 *
 * A migracao original veio de frontend-antigo/. Como esse backup pode
 * nao existir (a pasta e temporaria), a ferramenta tambem aceita o
 * catalogo atual como fonte: assim ela continua util para regerar o
 * arquivo depois de uma mexida no catalogo.
 * ------------------------------------------------------------------ */
function carregarDoCatalogoAntigo() {
  const codigo = fs.readFileSync(path.join(ANTIGO, 'js', 'catalogo-dados.js'), 'utf8');
  const contexto = { window: {} };
  vm.createContext(contexto);
  vm.runInContext(codigo, contexto);
  return contexto.window.VHARAK.dados;
}

function carregarDoCatalogoAtual() {
  const codigo = fs.readFileSync(DESTINO, 'utf8');
  const contexto = { window: {} };
  vm.createContext(contexto);
  vm.runInContext(codigo, contexto);
  const produtos = contexto.window.VH.PRODUTOS;

  return {
    jogos: produtos
      .filter((p) => p.tipo === 'jogo')
      .map((p) => ({
        id: p.id, nome: p.nome, genero: p.genero, generoRotulo: p.generoRotulo,
        classificacao: p.classificacao, plataformas: p.plataformas, capa: p.capa,
      })),
    consoles: produtos
      .filter((p) => p.tipo === 'console')
      .map((p) => ({
        id: p.id, nome: p.nome, capa: p.capa,
        fabricante: p.plataformas || p.desenvolvedora || '',
        geracaoTexto: p.geracaoRotulo || '',
        modelo: p.modelo || '',
        lancamento: p.ano || null,
      })),
    generos: contexto.window.VH.GENEROS,
    classificacoes: contexto.window.VH.CLASSIFICACOES,
  };
}

function carregarFonte() {
  if (fs.existsSync(path.join(ANTIGO, 'js', 'catalogo-dados.js'))) {
    console.log('  fonte: frontend-antigo (catalogo antigo)');
    return carregarDoCatalogoAntigo();
  }
  console.log('  fonte: frontend/js/dados-catalogo.js (catalogo atual)');
  return carregarDoCatalogoAtual();
}

/* ------------------------------------------------------------------ *
 * 2b. Resolver o caminho da capa
 *
 * A otimizacao de imagens trocou os PNG por JPG. O catalogo antigo aponta
 * para o nome antigo, entao a capa e procurada no disco: se o arquivo
 * original nao existe mais, a versao JPG vale.
 * ------------------------------------------------------------------ */
function resolverCapa(caminho) {
  const limpo = caminho.replace(/\\/g, '/');
  if (fs.existsSync(path.join(RAIZ, 'frontend', limpo))) return limpo;

  const semExtensao = limpo.replace(/\.(png|jpg|jpeg)$/i, '');
  for (const extensao of ['.jpg', '.jpeg', '.png']) {
    const candidata = semExtensao + extensao;
    if (fs.existsSync(path.join(RAIZ, 'frontend', candidata))) return candidata;
  }
  return limpo;
}

/* ------------------------------------------------------------------ *
 * 3. Le os consoles do HTML antigo
 * ------------------------------------------------------------------ */
function carregarConsolesAntigos() {
  const arquivo = path.join(ANTIGO, 'consoles.html');
  if (!fs.existsSync(arquivo)) return [];

  const html = fs.readFileSync(arquivo, 'utf8');
  const blocos = html.match(/<article>[\s\S]*?<\/article>/g) || [];
  const saida = [];
  for (const bloco of blocos) {
    const nome = (bloco.match(/<h3>([\s\S]*?)<\/h3>/) || [])[1];
    const capa = (bloco.match(/<img src="([^"]+)"/) || [])[1];
    if (!nome || !capa) continue;
    const texto = bloco.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ');
    const fabricante = (texto.match(/Fabricante:\s*(.+?)\s*Geração:/) || [])[1];
    const geracaoTexto = (texto.match(/Geração:\s*(.+?)\s*(?:Modelo:|Lançamento:)/) || [])[1];
    const modelo = (texto.match(/Modelo:\s*(.+?)\s*Lançamento:/) || [])[1];
    const lancamento = (texto.match(/Lançamento:\s*(\d{4})/) || [])[1];
    saida.push({
      nome: nome.trim(),
      capa,
      fabricante: (fabricante || '').trim(),
      geracaoTexto: (geracaoTexto || '').trim(),
      modelo: (modelo || '').trim(),
      lancamento: lancamento ? Number(lancamento) : null,
    });
  }
  return saida;
}

/* ------------------------------------------------------------------ *
 * 4. Monta a lista unica de produtos
 * ------------------------------------------------------------------ */
function slug(texto) {
  return texto.toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

function construir() {
  const fonte = carregarFonte();
  const produtos = [];

  for (const jogo of fonte.jogos) {
    const extra = EXTRAS[jogo.id] || {};
    const idFabricante = jogo.plataformas.toLowerCase().includes('nintendo') ? 'nintendo'
      : jogo.plataformas.toLowerCase().includes('xbox') ? 'xbox' : 'playstation';
    produtos.push({
      id: jogo.id,
      nome: jogo.nome,
      tipo: 'jogo',
      genero: jogo.genero,
      generoRotulo: jogo.generoRotulo,
      classificacao: jogo.classificacao,
      plataformas: jogo.plataformas,
      fabricante: idFabricante,
      capa: resolverCapa(jogo.capa),
      ano: extra.ano ?? null,
      desenvolvedora: extra.desenvolvedora ?? null,
      editora: extra.editora ?? null,
      nota: extra.nota ?? null,
      avaliacoes: extra.avaliacoes ?? null,
      popularidade: extra.popularidade ?? null,
      destaque: extra.destaque ?? false,
      novo: extra.novo ?? false,
      descricao: extra.descricao ?? null,
      trailerUrl: extra.trailerUrl ?? null,
    });
  }

  const consoles = (fonte.consoles && fonte.consoles.length)
    ? fonte.consoles
    : carregarConsolesAntigos();

  for (const console of consoles) {
    const extra = EXTRAS_CONSOLE[console.nome] || {};
    const idFabricante = console.fabricante.toLowerCase().includes('microsoft') ? 'xbox'
      : console.fabricante.toLowerCase().includes('nintendo') ? 'nintendo' : 'playstation';
    const geracaoMatch = console.geracaoTexto ? console.geracaoTexto.match(/(\d)/) : null;
    produtos.push({
      id: console.id || `console-${slug(console.nome)}`,
      nome: console.nome,
      tipo: 'console',
      genero: 'consoles',
      generoRotulo: 'Consoles',
      classificacao: 'livre',
      plataformas: console.fabricante,
      fabricante: idFabricante,
      capa: resolverCapa(console.capa),
      ano: console.lancamento ?? extra.ano ?? null,
      desenvolvedora: console.fabricante,
      editora: console.fabricante,
      modelo: console.modelo || null,
      geracao: extra.geracao ?? (geracaoMatch ? geracaoMatch[1] : null),
      geracaoRotulo: extra.geracaoRotulo ?? console.geracaoTexto ?? null,
      nota: extra.nota ?? null,
      avaliacoes: extra.avaliacoes ?? null,
      popularidade: extra.popularidade ?? null,
      destaque: extra.destaque ?? false,
      novo: extra.novo ?? false,
      descricao: extra.descricao ?? null,
      trailerUrl: null,
    });
  }

  return { produtos, generos: fonte.generos, classificacoes: fonte.classificacoes };
}

const { produtos, generos, classificacoes } = construir();

const gerados = `/*
 * VHARAK | dados-catalogo.js
 * Fonte unica do catalogo: ${produtos.filter((p) => p.tipo === 'jogo').length} jogos e ${produtos.filter((p) => p.tipo === 'console').length} consoles.
 *
 * Gerado por tools/migrar-catalogo.js a partir do catalogo antigo.
 * Editar aqui e a unica forma de manter a vitrine e a busca em dia.
 *
 * Campos de preco ficam em precos.js: este arquivo nao guarda valores.
 */
(function (global) {
  'use strict';

  var VH = global.VH || (global.VH = {});

  VH.GENEROS = ${JSON.stringify(generos, null, 6).replace(/\n/g, '\n  ')};

  VH.CLASSIFICACOES = ${JSON.stringify(classificacoes, null, 6).replace(/\n/g, '\n  ')};

  VH.PRODUTOS = ${JSON.stringify(produtos, null, 6).replace(/\n/g, '\n  ')};

  /* Generos usados como filtro na vitrine. */
  VH.GENEROS_FILTRO = [
    { id: 'acao', rotulo: 'Ação e aventura' },
    { id: 'rpg', rotulo: 'RPG' },
    { id: 'corrida', rotulo: 'Corrida' },
    { id: 'tiro', rotulo: 'Tiro' },
    { id: 'esportes', rotulo: 'Esportes' },
    { id: 'luta', rotulo: 'Luta' },
    { id: 'terror', rotulo: 'Terror e sobrevivência' },
    { id: 'estrategia', rotulo: 'Estratégia' },
    { id: 'simulacao', rotulo: 'Simulação' },
    { id: 'plataforma', rotulo: 'Plataforma' },
    { id: 'puzzle', rotulo: 'Puzzle' },
    { id: 'outros', rotulo: 'Outros' }
  ];

  VH.FABRICANTES = [
    { id: 'playstation', rotulo: 'PlayStation' },
    { id: 'xbox', rotulo: 'Xbox' },
    { id: 'nintendo', rotulo: 'Nintendo' }
  ];

  /* Ordem de exibicao da vitrine. */
  VH.PLATAFORMAS = [
    { id: 'playstation', rotulo: 'PlayStation' },
    { id: 'xbox', rotulo: 'Xbox' },
    { id: 'nintendo', rotulo: 'Nintendo' }
  ];

  /* ---------- consultas ---------- */

  VH.todos = function () {
    return VH.PRODUTOS;
  };

  VH.jogos = function () {
    return VH.PRODUTOS.filter(function (p) { return p.tipo === 'jogo'; });
  };

  VH.consoles = function () {
    return VH.PRODUTOS.filter(function (p) { return p.tipo === 'console'; });
  };

  VH.buscarPorId = function (id) {
    var alvo = String(id || '').trim();
    for (var i = 0; i < VH.PRODUTOS.length; i += 1) {
      if (VH.PRODUTOS[i].id === alvo) return VH.PRODUTOS[i];
    }
    return null;
  };

  VH.buscar = function (termo) {
    var alvo = String(termo || '').trim().toLowerCase();
    if (!alvo) return [];
    return VH.PRODUTOS.filter(function (p) {
      var texto = [p.nome, p.generoRotulo, p.plataformas, p.desenvolvedora, p.editora, p.modelo]
        .filter(Boolean).join(' ').toLowerCase();
      return texto.indexOf(alvo) !== -1;
    });
  };

  VH.porGenero = function (genero) {
    return VH.PRODUTOS.filter(function (p) { return p.genero === genero; });
  };

  VH.porFabricante = function (fabricante) {
    return VH.PRODUTOS.filter(function (p) { return p.fabricante === fabricante; });
  };

  VH.destaques = function () {
    return VH.PRODUTOS.filter(function (p) { return p.destaque === true; });
  };

  VH.novidades = function () {
    return VH.PRODUTOS.filter(function (p) { return p.novo === true; });
  };

  VH.maisVendidos = function () {
    return VH.PRODUTOS
      .filter(function (p) { return typeof p.popularidade === 'number'; })
      .sort(function (a, b) { return b.popularidade - a.popularidade; });
  };
}(window));
`;

fs.writeFileSync(DESTINO, gerados, 'utf8');
console.log(`dados-catalogo.js gerado: ${produtos.length} produtos (${produtos.filter((p) => p.tipo === 'jogo').length} jogos + ${produtos.filter((p) => p.tipo === 'console').length} consoles)`);
console.log(`  destaques: ${produtos.filter((p) => p.destaque).length} | novidades: ${produtos.filter((p) => p.novo).length} | com nota: ${produtos.filter((p) => p.nota).length}`);
