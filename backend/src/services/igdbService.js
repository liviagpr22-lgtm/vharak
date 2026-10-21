const env = require('../config/env');
const { AppError } = require('../utils/errors');

const URL_TOKEN = 'https://id.twitch.tv/oauth2/token';
const URL_API = 'https://api.igdb.com/v4';

/*
 * Token OAuth da Twitch reutilizado enquanto valido,
 * renovado automaticamente 60 segundos antes de expirar.
 */
let token = null;

let queryEmAndamento = null;

const IBCACHE = new Map();
const TEMPO_CACHE_MS = 60_000;

const INTERVALO_MINIMO_MS = 260; 
let ultimaRequisicao = 0;
let fila = Promise.resolve();

function configurada() {
  return Boolean(env.twitch.clientId && env.twitch.clientSecret);
}

async function obterToken() {
  if (token && token.expiraEm > Date.now() + 60_000) {
    return token.valor;
  }

  if (!configurada()) {
    throw new AppError(503, 'igdb_nao_configurada', 'A integracao IGDB nao esta configurada no servidor.');
  }

  if (queryEmAndamento) {
    await queryEmAndamento;
    return token.expiraEm > Date.now() + 60_000 ? token.valor : null;
  }

  queryEmAndamento = (async () => {
    const resp = await fetch(URL_TOKEN, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        client_id: env.twitch.clientId,
        client_secret: env.twitch.clientSecret,
        grant_type: 'client_credentials'
      })
    });

    if (!resp.ok) {
      throw new AppError(502, 'igdb_falhou_autenticar', 'Nao foi possivel autenticar junto a Twitch (credenciais invalidas ou indisponiveis).');
    }

    const dadosToken = await resp.json();
    if (!dadosToken.access_token) {
      throw new AppError(502, 'igdb_token_invalido', 'Resposta da Twitch sem token de acesso.');
    }

    token = {
      valor: dadosToken.access_token,
      expiraEm: Date.now() + (Number(dadosToken.expires_in) || 0) * 1000
    };
  })().finally(() => {
    queryEmAndamento = null;
  });

  await queryEmAndamento;
  return token.valor;
}

function obterCache(chave) {
  const entrada = IBCACHE.get(chave);
  if (!entrada) {
    return null;
  }
  if (entrada.expira < Date.now()) {
    IBCACHE.delete(chave);
    return null;
  }
  return entrada.dados;
}

function utilizarCache(chave, dados) {
  IBCACHE.set(chave, { expira: Date.now() + TEMPO_CACHE_MS, dados });
  return dados;
}

async function limitarTaxa() {
  const agora = Date.now();
  const diferenca = agora - ultimaRequisicao;
  if (diferenca < INTERVALO_MINIMO_MS) {
    await new Promise((r) => setTimeout(r, INTERVALO_MINIMO_MS - diferenca));
  }
  ultimaRequisicao = Date.now();
}

async function igdbRequest(endpoint, corpo) {
  const accessToken = await obterToken();

  await limitarTaxa();

  let resposta;
  try {
    resposta = await fetch(`${URL_API}/${endpoint}`, {
      method: 'POST',
      headers: {
        'Client-ID': env.twitch.clientId,
        Authorization: `Bearer ${accessToken}`,
        Accept: 'application/json',
        'Content-Type': 'text/plain'
      },
      body: corpo
    });
  } catch (err) {
    throw new AppError(502, 'igdb_indisponivel', 'Falha de rede ao acessar a IGDB.');
  }

  if (resposta.status === 429) {
    throw new AppError(429, 'igdb_limite', 'Limite de consultas a IGDB atingido. Tente novamente em instantes.');
  }
  if (resposta.status === 401 || resposta.status === 403) {
    token = null; 
    throw new AppError(502, 'igdb_nao_autorizado', 'Credenciais de acesso a IGDB foram recusadas.');
  }
  if (resposta.status === 404) {
    return [];
  }
  if (!resposta.ok) {
    throw new AppError(502, 'igdb_erro', `Erro da IGDB (HTTP ${resposta.status}).`);
  }

  return resposta.json();
}

function urlCapa(cover) {
  if (!cover || !cover.image_id) {
    return null;
  }
  return cover.url.replace('t_thumb', 't_1080p');
}

const CAMPOS_JOGO = `
  name
  cover.image_id
  first_release_date
  summary
  storyline
  total_rating
  aggregated_rating
  genres.name
  platforms.name
  involved_companies.company.name
  involved_companies.publisher
  involved_companies.developer
  game_modes.name
`.split(/[,\s\n]+/).filter(Boolean).join(', ');

async function buscarJogos({ busca, pagina = 1, limite = 12, genero, plataforma, jogoId, ordenar }) {
  if (!configurada()) {
    throw new AppError(503, 'igdb_nao_configurada', 'A integracao IGDB nao esta configurada no servidor.');
  }

  limite = Math.min(Math.max(Number(limite) || 12, 1), 50);
  pagina = Math.max(Number(pagina) || 1, 1);

  const partes = [];
  partes.push(`fields ${CAMPOS_JOGO};`);

  if (jogoId) {
    partes.push(`where id = (${jogoId});`);
  } else {
    if (busca) {
      partes.push(`search "${String(busca).replace(/"/g, '')}";`);
    }
    const filtros = [];
    if (genero) {
      filtros.push(`genres.slug = "${genero.replace(/"/g, '')}"`);
    }
    if (plataforma) {
      filtros.push(`platforms.slug = "${plataforma.replace(/"/g, '')}"`);
    }
    if (filtros.length > 0) {
      partes.push(`where ${filtros.join(' & ')};`);
    }
    partes.push(`offset ${(pagina - 1) * limite};`);
    partes.push(`limit ${limite};`);
    if (ordenar === 'melhor') {
      partes.splice(3, 0, 'sort total_rating desc;');
    }
  }

  const chave = `jogos:${JSON.stringify(partes)}`;
  const emCache = obterCache(chave);
  if (emCache) {
    return emCache;
  }

  const dados = await igdbRequest('games', partes.join('\n'));

  const mapa = dados.map((jogo) => ({
    igdbId: jogo.id,
    nome: jogo.name,
    resumo: jogo.summary || null,
    dataLancamento: jogo.first_release_date ? new Date(jogo.first_release_date * 1000).toISOString().slice(0, 10) : null,
    notaCriticas: jogo.total_rating ?? null,
    notaPublico: jogo.aggregated_rating ?? null,
    capa: urlCapa(jogo.cover),
    generos: (jogo.genres || []).map((g) => ({ nome: g.name })),
    plataformas: (jogo.platforms || []).map((pl) => ({ nome: pl.name })),
    empresas: (jogo.involved_companies || []).map((ic) => ({
      empresa: ic.company?.name || null,
      publicou: Boolean(ic.publisher),
      desenvolveu: Boolean(ic.developer)
    })),
    modos: (jogo.game_modes || []).map((gl) => gl.name)
  }));

  return utilizarCache(chave, { itens: mapa, pagina, limite });
}

module.exports = { configurada, buscarJogos };
