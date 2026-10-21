/*
 * VHARAK | tools/achar-acentos.js
 * Lista as palavras dos textos visiveis que costumam precisar de acento e
 * ainda estao sem ele. Serve de lista de conferencia para a revisao
 * ortografica.
 *
 * Uso: node tools/achar-acentos.js
 */
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const FRONTEND = path.join(RAIZ, 'frontend');

/* Palavras que precisam de acento, com a forma correta. */
const DICIONARIO = {
  acessorios: 'acessórios',
  acessorio: 'acessório',
  acao: 'ação',
  adiciona: 'adiciona',
  alem: 'além',
  area: 'área',
  areas: 'áreas',
  informacoes: 'informações',
  informacao: 'informação',
  acoes: 'ações',
  acao: 'ação',
  albuns: 'álbuns',
  alem: 'além',
  ancora: 'âncora',
  ancora: 'âncora',
  apaga: 'apaga',
  apareca: 'apareça',
  aparecoes: 'aparições',
  atencao: 'atenção',
  atualizacao: 'atualização',
  avancao: 'avançação',
  baixa: 'baixa',
  basico: 'básico',
  bed: 'bed',
  breve: 'breve',
  busca: 'busca',
  campo: 'campo',
  campos: 'campos',
  card: 'card',
  catalogo: 'catálogo',
  catalogos: 'catálogos',
  categoria: 'categoria',
  categorias: 'categorias',
  checkout: 'checkout',
  classif: 'classif',
  classificacao: 'classificação',
  classificacoes: 'classificações',
  clic: 'clique',
  clique: 'clique',
  com: 'com',
  como: 'como',
  compra: 'compra',
  compras: 'compras',
  confirma: 'confirma',
  confirmacao: 'confirmação',
  console: 'console',
  consoles: 'consoles',
  construcao: 'construção',
  conteudo: 'conteúdo',
  contents: 'contents',
  continuar: 'continuar',
  conversao: 'conversão',
  cookie: 'cookie',
  cookies: 'cookies',
  correcao: 'correção',
  custo: 'custo',
  da: 'da',
  das: 'das',
  de: 'de',
  desempenho: 'desempenho',
  descricao: 'descrição',
  descricoes: 'descrições',
  desde: 'desde',
  digitacao: 'digitação',
  directory: 'directory',
  disponivel: 'disponível',
  disponiveis: 'disponíveis',
  download: 'download',
  duracao: 'duração',
  e: 'e',
  em: 'em',
  email: 'email',
  encerra: 'encerra',
  entao: 'então',
  entrega: 'entrega',
  esse: 'esse',
  esta: 'está',
  estao: 'estão',
  estado: 'estado',
  estiver: 'estiver',
  estoque: 'estoque',
  eu: 'eu',
  evento: 'evento',
  exemplo: 'exemplo',
  facil: 'fácil',
  favor: 'favor',
  favorite: 'favoritos',
  favoritos: 'favoritos',
  feche: 'feche',
  fecha: 'fecha',
  fez: 'fez',
  fila: 'fila',
  fim: 'fim',
  fisico: 'físico',
  fisica: 'física',
  fone: 'fone',
  formula: 'fórmula',
  frase: 'frase',
  frase: 'frase',
  genero: 'gênero',
  generos: 'gêneros',
  grafico: 'gráfico',
  gratis: 'grátis',
  ha: 'há',
  headers: 'headers',
  help: 'help',
  hoje: 'hoje',
  hora: 'hora',
  image: 'image',
  imagens: 'imagens',
  informacao: 'informação',
  inicio: 'início',
  instagram: 'instagram',
  inteiros: 'inteiros',
  item: 'item',
  itens: 'itens',
  ja: 'já',
  javascript: 'javascript',
  json: 'json',
  lancamento: 'lançamento',
  lancamentos: 'lançamentos',
  legivel: 'legível',
  leia: 'leia',
  loja: 'loja',
  local: 'local',
  logica: 'lógica',
  marca: 'marca',
  mais: 'mais',
  mensagem: 'mensagem',
  mensagens: 'mensagens',
  minimo: 'mínimo',
  momento: 'momento',
  nome: 'nome',
  nota: 'nota',
  notas: 'notas',
  novo: 'novo',
  novos: 'novos',
  numero: 'número',
  numeros: 'números',
  objeto: 'objeto',
  opcional: 'opcional',
  opcao: 'opção',
  opcoes: 'opções',
  ordem: 'ordem',
  original: 'original',
  pagina: 'página',
  paginas: 'páginas',
  para: 'para',
  parcelamento: 'parcelamento',
  parcial: 'parcial',
  pendente: 'pendente',
  pendentes: 'pendentes',
  peso: 'peso',
  plataforma: 'plataforma',
  plataformas: 'plataformas',
  pode: 'pode',
  por: 'por',
  preco: 'preço',
  precos: 'preços',
  preciso: 'preciso',
  perguntar: 'perguntar',
  pergunta: 'pergunta',
  perguntas: 'perguntas',
  pessoa: 'pessoa',
  pessoas: 'pessoas',
  pode: 'pode',
  polir: 'polir',
  politica: 'política',
  politicas: 'políticas',
  por: 'por',
  preco: 'preço',
  precos: 'preços',
  preco: 'preço',
  produto: 'produto',
  produtos: 'produtos',
  proxima: 'próxima',
  proximo: 'próximo',
  qualidade: 'qualidade',
  quando: 'quando',
  quanto: 'quanto',
  quantos: 'quantos',
  quantidade: 'quantidade',
  que: 'que',
  quem: 'quem',
  quero: 'quero',
 questao: 'questão',
  readme: 'readme',
  reais: 'reais',
  recarregar: 'recarregar',
  receber: 'receber',
  recente: 'recente',
  recentes: 'recentes',
  referencia: 'referência',
  referencias: 'referências',
  regiao: 'região',
  remover: 'remover',
  remover: 'remover',
  resposta: 'resposta',
  respostas: 'respostas',
  resultado: 'resultado',
  resultados: 'resultados',
  rodape: 'rodapé',
  saldo: 'saldo',
  saida: 'saída',
  sair: 'sair',
  secoes: 'seções',
  secao: 'seção',
  seguranca: 'segurança',
  sempre: 'sempre',
  sem: 'sem',
  sempre: 'sempre',
  senha: 'senha',
  senhas: 'senhas',
  sera: 'será',
  servidor: 'servidor',
  sim: 'sim',
  sistema: 'sistema',
  site: 'site',
  sobre: 'sobre',
  solucao: 'solução',
  solucoes: 'soluções',
  sua: 'sua',
  suas: 'suas',
  tambem: 'também',
  tanto: 'tanto',
  te: 'te',
  tem: 'tem',
  tema: 'tema',
  tempo: 'tempo',
  termino: 'término',
  termos: 'termos',
  texto: 'texto',
  textos: 'textos',
  titulo: 'título',
  titulos: 'títulos',
  todas: 'todas',
  todo: 'todo',
  todos: 'todos',
  trailer: 'trailer',
  tela: 'tela',
  telas: 'telas',
  tipo: 'tipo',
  tipos: 'tipos',
  usa: 'usa',
  usando: 'usando',
  versao: 'versão',
  versoes: 'versões',
  voce: 'você',
  voces: 'vocês',
  voltar: 'voltar',
  whatsapp: 'whatsapp',
};

/* Palavras que nao precisam de acento: o script nao deve mexer nelas. */
const IGNORAR = new Set([
  'a', 'ao', 'aos', 'as', 'e', 'o', 'os', 'um', 'uma', 'de', 'do', 'da', 'dos', 'das',
  'em', 'no', 'na', 'nos', 'nas', 'por', 'para', 'com', 'sem', 'que', 'se', 'mais',
  'seu', 'sua', 'seus', 'suas', 'ao', 'ou', 'ja', 'la', 'aqui', 'ate', 'ele', 'ela',
  'isso', 'isto', 'esta', 'este', 'esse', 'essa', 'esse', 'entao', 'sera', 'tera',
  'foi', 'sera', 'entao', 'nao', 'sao', 'sao', 'voce', 'apos', 'ate', 'ha', 'la',
]);

/* Texto visivel: HTML (entre tags) e strings de JavaScript. */
function extrairVisivel(arquivo) {
  const texto = fs.readFileSync(arquivo, 'utf8');
  const achados = [];

  if (arquivo.endsWith('.html')) {
    /* Remove estilo, script e comentarios; o que sobra e texto. */
    const limpo = texto
      .replace(/<script[\s\S]*?<\/script>/gi, ' ')
      .replace(/<style[\s\S]*?<\/style>/gi, ' ')
      .replace(/<!--[\s\S]*?-->/g, ' ');
    for (const m of limpo.matchAll(/>([^<>]+)</g)) {
      achados.push({ linha: linhaDe(limpo, m.index), texto: m[1] });
    }
  }

  if (arquivo.endsWith('.js')) {
    /* Strings de uma linha e templates. */
    for (const m of texto.matchAll(/'([^'\\\n]{4,})'/g)) {
      if (/^[\s]*[{}\[\]()=;,]/.test(m[1])) continue;
      achados.push({ linha: linhaDe(texto, m.index), texto: m[1] });
    }
  }

  return achados;
}

function linhaDe(texto, indice) {
  return texto.slice(0, indice).split('\n').length;
}

function listar(raiz, extensao) {
  const saida = [];
  for (const entrada of fs.readdirSync(raiz, { withFileTypes: true })) {
    const caminho = path.join(raiz, entrada.name);
    if (entrada.isDirectory()) {
      if (['assets', 'node_modules'].includes(entrada.name)) continue;
      saida.push(...listar(caminho, extensao));
    } else if (extensao.test(entrada.name)) {
      saida.push(caminho);
    }
  }
  return saida;
}

const arquivos = [
  ...listar(path.join(FRONTEND, 'pages'), /\.html$/),
  ...listar(path.join(FRONTEND, 'js'), /\.js$/),
];

let total = 0;
const porPalavra = new Map();

for (const arquivo of arquivos) {
  for (const achado of extrairVisivel(arquivo)) {
    const palavras = achado.texto.split(/[^A-Za-zÀ-ÿ]+/);
    for (const palavra of palavras) {
      const chave = palavra.toLowerCase();
      if (IGNORAR.has(chave)) continue;
      if (!DICIONARIO[chave]) continue;
      if (chave === DICIONARIO[chave]) continue;
      const rel = path.relative(FRONTEND, arquivo);
      if (!porPalavra.has(chave)) porPalavra.set(chave, []);
      porPalavra.get(chave).push(`${rel}:${achado.linha}`);
      total += 1;
    }
  }
}

console.log('\nPalavras sem acento em textos visiveis:\n');
const ordenadas = [...porPalavra.entries()].sort((a, b) => b[1].length - a[1].length);
for (const [palavra, locais] of ordenadas) {
  console.log(`  ${String(locais.length).padStart(3)}x  ${palavra} -> ${DICIONARIO[palavra]}`);
  console.log(`        ${locais.slice(0, 6).join(', ')}${locais.length > 6 ? ' ...' : ''}`);
}
console.log(`\n${total} ocorrencia(s) em ${ordenadas.length} palavra(s) distinta(s).`);
