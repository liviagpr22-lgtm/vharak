/*
 * VHARAK | tools/acentuar-js.js
 * Acentua os textos dos modulos de JavaScript sem tocar no codigo.
 *
 * Aqui a troca e por literal exato: cada string trocada esta escrita
 * na lista abaixo. Nada e substituido por regra, entao identificadores
 * (precoDe, data-preco, classificacao) continuam intactos.
 *
 * Uso: node tools/acentuar-js.js
 */
const fs = require('fs');
const path = require('path');

const RAIZ = path.join(__dirname, '..');
const JS = path.join(RAIZ, 'frontend', 'js');

/* Trocas literais: a string antiga inteira pela nova. */
const TROCAS = {
  /* ---- admin.js ---------------------------------------------------- */
  "'  (formato nao reconhecido)'": "'  (formato não reconhecido)'",
  "'  (produto nao encontrado)'": "'  (produto não encontrado)'",
  "'  (preco invalido)'": "'  (preço inválido)'",
  "'  (preco cheio menor que o de venda)'": "'  (preço cheio menor que o de venda)'",
  "'Nao foi possivel guardar a alteracao.'": "'Não foi possível guardar a alteração.'",
  "'Preco invalido.'": "'Preço inválido.'",
  "'O preco \"de\" precisa ser maior que o preco de venda.'": "'O preço \"de\" precisa ser maior que o preço de venda.'",
  "'Jogos no catalogo'": "'Jogos no catálogo'",
  "'titulos cadastrados'": "'títulos cadastrados'",
  "'Com preco publicado'": "'Com preço publicado'",
  "' preco(s) aplicado(s).'": "' preço(s) aplicado(s).'",
  "' linha(s) nao aplicada(s)": "' linha(s) não aplicada(s)",

  /* ---- cart-page.js e cart.js --------------------------------------- */
  "'Preco a anunciar'": "'Preço a anunciar'",
  "'preco a combinar'": "'preço a combinar'",
  "'Alguns itens ainda nao tem preco publicado. A loja confirma os valores na conversa.'":
    "'Alguns itens ainda não têm preço publicado. A loja confirma os valores na conversa.'",
  "'\\nOs itens acima ainda nao tem preco publicado. Gostaria de saber os valores.'":
    "'\\nOs itens acima ainda não têm preço publicado. Gostaria de saber os valores.'",
  "'Aguardando confirmacao'": "'Aguardando confirmação'",

  /* ---- catalog.js ---------------------------------------------------- */
  "'Relevancia'": "'Relevância'",
  "'Lancamentos'": "'Lançamentos'",
  "'Melhor avaliados'": "'Melhor avaliados'",
  "'Menor preco'": "'Menor preço'",

  /* ---- home.js -------------------------------------------------------- */
  "'Chegaram recem'": "'Chegaram recém'",
  "'Da 3a a 9a geracao'": "'Da 3ª a 9ª geração'",
  "'Acao e aventura'": "'Ação e aventura'",
  "'Estrategia'": "'Estratégia'",

  /* ---- product.js ------------------------------------------------------ */
  "'O preco deste item ainda nao foi publicado. Fale com a gente eombinamos o valor e a entrega.'":
    "'O preço deste item ainda não foi publicado. Fale com a gente e combinamos o valor e a entrega.'",
  "'Em ate 12x no cartao. Entrega para todo o Brasil.'":
    "'Em até 12x no cartão. Entrega para todo o Brasil.'",
  "'Genero'": "'Gênero'",
  "'Geracao'": "'Geração'",
  "'Classificacao'": "'Classificação'",
  "'Versao digital'": "'Versão digital'",
  "'Versao fisica'": "'Versão física'",
  "'Caixa, manual e midia'": "'Caixa, manual e mídia'",
  "'Consulte a disponibilidade desta versao pelo WhatsApp antes de fechar o pedido: o estoque de cada formato varia.'":
    "'Consulte a disponibilidade desta versão pelo WhatsApp antes de fechar o pedido: o estoque de cada formato varia.'",
  "'Versoes disponiveis'": "'Versões disponíveis'",
  "'Nenhuma avaliacao ainda. Se voce ja comprou, conte para os outros.'":
    "'Nenhuma avaliação ainda. Se você já comprou, conte para os outros.'",
  "'Avaliacao enviada. Obrigado!'": "'Avaliação enviada. Obrigado!'",
  "'Produto nao encontrado'": "'Produto não encontrado'",
  "'O item que voce procurou nao esta no catalogo ou o link está errado.'":
    "'O item que você procurou não está no catálogo ou o link está errado.'",
  "'Deixe sua avaliacao'": "'Deixe sua avaliação'",
  "'Seu comentario'": "'Seu comentário'",
  "'O que voce achou do produto?'": "'O que você achou do produto?'",
  "'Enviar avaliacao'": "'Enviar avaliação'",
  "'Voce tambem pode gostar'": "'Você também pode gostar'",
  "' avaliacoes)'": "' avaliações)'",
  "' disponivel para '": "' disponível para '",
  "' esta no catalogo da VHARAK'": "' está no catálogo da VHARAK'",

  /* ---- profile.js ------------------------------------------------------ */
  "'Voce ainda nao entrou na sua conta.'": "'Você ainda não entrou na sua conta.'",
  "'Voce ainda nao fez nenhum pedido.'": "'Você ainda não fez nenhum pedido.'",

  /* ---- utils.js ---------------------------------------------------------- */
  "'Classificacao indicativa: livre para todas as idades'":
    "'Classificação indicativa: livre para todas as idades'",
  "'Classificacao indicativa: 10 anos'": "'Classificação indicativa: 10 anos'",
  "'Classificacao indicativa: 12 anos'": "'Classificação indicativa: 12 anos'",
  "'Classificacao indicativa: 14 anos'": "'Classificação indicativa: 14 anos'",
  "'Classificacao indicativa: 16 anos'": "'Classificação indicativa: 16 anos'",
  "'Classificacao indicativa: 18 anos'": "'Classificação indicativa: 18 anos'",
  "'Acessorio'": "'Acessório'",
  "'Preco a anunciar'": "'Preço a anunciar'",

  /* ---- help.js ----------------------------------------------------------- */
  "' solucao'": "' solução'",
  "' solucoes'": "' soluções'",
  "'Nao resolveu? Fale com a loja e a gente te ajuda.'":
    "'Não resolveu? Fale com a loja e a gente te ajuda.'",

  /* ---- auth-page.js ------------------------------------------------------- */
  "'As senhas nao conferem.'": "'As senhas não conferem.'",

  /* ---- configuracao.js ---------------------------------------------------- */
  "'Acesso local. A senha protege os dados deste navegador, nao a loja.'":
    "'Acesso local. A senha protege os dados deste navegador, não a loja.'",
};

/* Trocas menores, aplicadas dentro de literais maiores. */
const TROCAS_DENTRO = {
  'preco a anunciar': 'preço a anunciar',
};

let total = 0;
for (const nome of fs.readdirSync(JS)) {
  if (!nome.endsWith('.js')) continue;
  if (nome === 'dados-catalogo.js' || nome === 'dados-ajuda.js' || nome === 'precos.js') continue;

  const arquivo = path.join(JS, nome);
  const original = fs.readFileSync(arquivo, 'utf8');
  let novo = original;

  for (const [antes, depois] of Object.entries(TROCAS)) {
    if (novo.includes(antes)) novo = novo.split(antes).join(depois);
  }
  for (const [antes, depois] of Object.entries(TROCAS_DENTRO)) {
    novo = novo.split(antes).join(depois);
  }

  if (novo !== original) {
    fs.writeFileSync(arquivo, novo, 'utf8');
    total += 1;
    console.log('  ok ' + nome);
  }
}

console.log(`\n${total} modulo(s) acentuado(s).`);
