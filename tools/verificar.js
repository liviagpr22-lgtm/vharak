/*
 * VHARAK | tools/verificar.js
 * conferences automaticas do site, sem depender do navegador:
 *
 *   1. sintaxe de todos os arquivos JavaScript
 *   2. chaves CSS balanceadas
 *   3. todo link local (href/src) existe no disco
 *   4. toda pagina tem <title>, <meta viewport> e <meta description>
 *   5. encoding UTF-8 sem caracteres de substituicao
 *
 * Uso: node tools/verificar.js
 */
const fs = require('fs');
const path = require('path');
const { execFileSync } = require('child_process');

const RAIZ = path.join(__dirname, '..');
const FRONTEND = path.join(RAIZ, 'frontend');

let erros = 0;
let avisos = 0;

function falhar(msg) { erros += 1; console.log('  X ' + msg); }
function avisar(msg) { avisos += 1; console.log('  ! ' + msg); }
function ok(msg) { console.log('  ok ' + msg); }

function listar(raiz, extensao) {
  const saida = [];
  for (const entrada of fs.readdirSync(raiz, { withFileTypes: true })) {
    const caminho = path.join(raiz, entrada.name);
    if (entrada.isDirectory()) {
      /* node_modules, .next e assets nao fazem parte do site; src guarda
         as fontes das paginas, nao as paginas geradas. */
      if (['node_modules', '.next', 'assets', 'src'].includes(entrada.name)) continue;
      saida.push(...listar(caminho, extensao));
    } else if (extensao.test(entrada.name)) {
      saida.push(caminho);
    }
  }
  return saida;
}

/* ---- 1. Sintaxe do JavaScript ------------------------------------------ */
console.log('\n[1] Sintaxe do JavaScript');
const scripts = listar(FRONTEND, /\.js$/);
for (const arquivo of scripts) {
  try {
    execFileSync(process.execPath, ['--check', arquivo], { stdio: 'pipe' });
  } catch (e) {
    falhar(path.relative(FRONTEND, arquivo) + '\n      ' + String(e.stderr).split('\n').slice(0, 4).join('\n      '));
  }
}
if (!erros) ok(`${scripts.length} arquivos JavaScript sem erro de sintaxe`);

/* ---- 2. Chaves CSS ------------------------------------------------------ */
console.log('\n[2] Chaves CSS balanceadas');
const folhas = listar(FRONTEND, /\.css$/);
for (const folha of folhas) {
  const texto = fs.readFileSync(folha, 'utf8');
  const semComentario = texto.replace(/\/\*[\s\S]*?\*\//g, '');
  const abrem = (semComentario.match(/\{/g) || []).length;
  const fecham = (semComentario.match(/\}/g) || []).length;
  if (abrem !== fecham) {
    falhar(`${path.relative(FRONTEND, folha)}: ${abrem} abre e ${fecham} fecha`);
  }
}
if (!erros) ok(`${folhas.length} folhas de estilo balanceadas`);

/* ---- 2b. Concatenacao de string sem o sinal de mais --------------------- *
 * Duas strings em linhas separadas, sem o "+" entre elas, nao viram uma
 * string so: o JavaScript separa as expressoes e o trecho seguinte some
 * da pagina sem nenhum erro no console. E o bug mais silencioso que
 * existe neste tipo de codigo.                                       */
console.log('\n[2b] String concatenada sem "+"');
for (const arquivo of scripts) {
  const linhas = fs.readFileSync(arquivo, 'utf8').split('\n');
  for (let i = 1; i < linhas.length; i += 1) {
    const atual = linhas[i];
    const anterior = linhas[i - 1];

    /* A linha comeca com uma string e a de cima termina com uma string:
       falta o operador entre as duas. */
    if (!/^\s*['"`]/.test(atual)) continue;
    if (!/['"`]\s*$/.test(anterior)) continue;
    /* Falso positivo: a linha de cima fecha uma expressao que ja
       terminou (ex.: um return seguido de outra sentenca). */
    if (/^\s*(return|throw|break|continue)\b/.test(atual)) continue;

    falhar(`${path.relative(FRONTEND, arquivo)}:${i + 1}: `
      + 'string nao concatenada (falta o "+")\n      ' + anterior.trim().slice(-60));
  }
}
if (!erros) ok('nenhuma string concatenada sem o sinal de mais');

/* ---- 3. Links locais ---------------------------------------------------- */
console.log('\n[3] Links locais');
const paginas = listar(FRONTEND, /\.html$/);
let linksQuebrados = 0;
for (const pagina of paginas) {
  const texto = fs.readFileSync(pagina, 'utf8');
  const referencias = [...texto.matchAll(/(?:href|src)="(\/[^"#?]+)"/g)].map((m) => m[1]);
  for (const referencia of referencias) {
    if (referencia.startsWith('/api')) continue;
    const destino = path.join(FRONTEND, decodeURIComponent(referencia).replace(/^\//, ''));
    if (!fs.existsSync(destino)) {
      linksQuebrados += 1;
      falhar(`${path.relative(FRONTEND, pagina)} -> ${referencia} (nao existe)`);
    }
  }
}
if (!linksQuebrados) ok('todos os links locais das paginas existem');

/* ---- 4. Head das paginas ------------------------------------------------ */
console.log('\n[4] Head das paginas');
for (const pagina of paginas) {
  const texto = fs.readFileSync(pagina, 'utf8');
  const nome = path.relative(FRONTEND, pagina);
  const problemas = [];
  if (!/<title>[^<]+<\/title>/.test(texto)) problemas.push('sem <title>');
  if (!/name="viewport"/.test(texto)) problemas.push('sem viewport');
  if (!/name="description"/.test(texto)) problemas.push('sem meta description');
  if (!/<meta charset="UTF-8"/i.test(texto)) problemas.push('sem charset');
  if (!/<html lang="/.test(texto)) problemas.push('sem lang');
  /* O <main> e o alvo do atalho "pular para o conteudo". */
  const mains = texto.match(/<main[^>]*>/g) || [];
  if (mains.length !== 1) problemas.push(mains.length === 0 ? 'sem <main>' : 'com ' + mains.length + ' <main>');
  else if (!/id="conteudo"/.test(mains[0])) problemas.push('sem id="conteudo" no <main>');
  if (problemas.length) falhar(nome + ': ' + problemas.join(', '));
}
if (!erros) ok(`${paginas.length} paginas com head completo`);

/* ---- 5. Encoding --------------------------------------------------------- */
console.log('\n[5] Encoding');
for (const arquivo of [...scripts, ...folhas, ...paginas]) {
  const buffer = fs.readFileSync(arquivo);
  const texto = buffer.toString('utf8');
  if (texto.includes('\uFFFD')) falhar(path.relative(FRONTEND, arquivo) + ': caracteres corrompidos');
}
if (!erros) ok('nenhum arquivo com caractere corrompido');

/* ---- 6. Dados ------------------------------------------------------------ */
console.log('\n[6] Catalogo');
const contexto = { window: {} };
require('vm').createContext(contexto);
require('vm').runInContext(fs.readFileSync(path.join(FRONTEND, 'js', 'dados-catalogo.js'), 'utf8'), contexto);
const produtos = contexto.window.VH.PRODUTOS;
const ids = new Set();
let duplicados = 0;
for (const p of produtos) {
  if (ids.has(p.id)) { duplicados += 1; falhar('id duplicado: ' + p.id); }
  ids.add(p.id);
  if (!p.capa) falhar(p.id + ': sem capa');
  const capa = path.join(FRONTEND, p.capa);
  if (!fs.existsSync(capa)) falhar(p.id + ': capa inexistente -> ' + p.capa);
}
if (!duplicados) ok(`${produtos.length} produtos com id unico e capa existente`);

/* ---- Resumo -------------------------------------------------------------- */
console.log('\n' + '='.repeat(52));
console.log(erros === 0 ? `Tudo certo. ${avisos} aviso(s).` : `${erros} problema(s) encontrado(s).`);
process.exit(erros === 0 ? 0 : 1);
