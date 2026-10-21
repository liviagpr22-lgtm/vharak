# VHARAK — Loja Virtual Gamer

Loja de jogos e consoles. Interface em HTML, CSS e JavaScript puro, sem
framework, sem build e sem dependências externas.

**Identidade visual:** preto absoluto + dourado metálico. Fundo carvão,
acento dourado, elevação só em tons de cinza. A linguagem vem do
CineClick (CineStore) e foi adaptada para o domínio de jogos: a capa do
jogo é o protagonista da tela e a classificação indicativa aparece no
selo oficial da ClassInd.

---

## 1. Como rodar

Sem backend, para developing a vitrine:

```bash
cd C:\VHARAK
node tools\servidor.js 8000
```

Depois acesse <http://localhost:8000>.

Com o backend (API + MySQL) rodando em `backend/`, o Express já serve o
`frontend/` como estático em <http://localhost:3000>:

```bash
cd C:\VHARAK\backend
npm start
```

---

## 2. Estrutura de pastas

```
VHARAK/
├── frontend/               Site (o que o cliente ve)
│   ├── index.html          Home
│   ├── pages/              Paginas publicas e painel
│   │   ├── src/            Fontes das paginas (veja a secao 3)
│   │   ├── admin/          Painel da loja
│   │   ├── catalogo.html   Catalogo com filtros
│   │   ├── consoles.html   Consoles por fabricante e geracao
│   │   ├── produto.html    Detalhe do jogo ou console
│   │   ├── carrinho.html   Carrinho e fechamento pelo WhatsApp
│   │   ├── login.html · cadastro.html · perfil.html
│   │   └── ajuda.html      Central de ajuda + politica e termos
│   ├── css/                12 folhas, uma por assunto
│   ├── js/                 15 modulos
│   ├── assets/             Capas, fotos, marca
│   ├── sitemap.xml · robots.txt
│   └── README.md
├── backend/                API Express + MySQL (ainda nao ligada ao site)
├── frontend-antigo/        Backup do site anterior
└── tools/                  Ferramentas de desenvolvimento
```

---

## 3. As paginas sao geradas

O cabecalho, o rodape, o `<head>` e a ordem dos scripts sao iguais em
todas as paginas. Para nao manter dez copias, existe um gerador:

```
frontend/pages/src/*.html   ->   frontend/pages/*.html
```

Cada fonte comeca com comentarios que dizem o que gerar:

```html
<!-- titulo: Catalogo de jogos e consoles | VHARAK -->
<!-- descricao: 105 jogos e 23 consoles de PlayStation, Xbox e Nintendo. -->
<!-- ativo: jogos -->
<!-- css: global, header, footer, product-card, catalog -->
<!-- js: catalog -->
```

O corpo da fonte vai entre os comentarios. O gerador cuida do resto.

```bash
node tools\gerar-paginas.js
```

**As paginas geradas nao devem ser editadas a mao:** a proxima execucao
sobrescreve tudo. Edite sempre a fonte em `pages/src/`.

---

## 4. Camadas de estilo

| Arquivo | Camada | O que contem |
|---|---|---|
| `global.css` | 0 · Tokens | Cores, tipografia, espacamento, raios, sombras, botoes, badges, formularios, toast, modal |
| `header.css` | 1 · Cabecalho | Header fixo, logo, navegacao, carrinho, menu de conta, menu do celular |
| `footer.css` | 2 · Rodape | Rodape em colunas, barra legal, botao flutuante de WhatsApp |
| `product-card.css` | 3 · Card | O card de produto: capa, selos, preco, acoes |
| `home.css` | 4 · Home | Hero, faixas, Top 10, faixa de chamada |
| `catalog.css` | 4 · Catalogo | Abas, busca, pills de filtro, ordenacao, contador |
| `product-detail.css` | 4 · Detalhe | Fundo com a arte, cartela, ficha, versoes, avaliacoes |
| `cart.css` | 5 · Carrinho | Lista de itens, quantidades, resumo |
| `auth.css` | 5 · Conta | Login e cadastro |
| `profile.css` | 5 · Perfil | Dados do cliente e pedidos |
| `help.css` | 5 · Ajuda | Categorias, cartoes de problema, painel de solucoes |
| `admin.css` | 6 · Painel | Barra lateral, indicadores, tabelas |

**Regras que valem para todas as folhas:**

1. **Mobile-first.** O estilo base serve o celular; a media query so melhora.
2. **Tokens sempre.** Nenhum `#hex` ou `px` solto fora do `global.css`.
3. **Uma regra por bloco**, com comentario explicando o *por que*, nao o *o que*.
4. **`:is()` para agrupar.** Nunca `:has()` dentro de `:has()` — e invalido
   por especificacao e a regra e descartada sem aviso.
5. **Sem estilo inline**, sem `!important` (exceto em `[hidden]`).
6. **Acessibilidade:** foco sempre visivel (`:focus-visible`), alvos de
   toque de 44px, contraste conferido, `prefers-reduced-motion` respeitado.
7. **Nada de inventar conteudo.** O CSS nao cria textos, precos ou produtos.

---

## 5. Tokens principais

Todos definidos em `global.css`.

### Cores

| Token | Valor | Uso |
|---|---|---|
| `--bg-primary` | `#0a0a0a` | Fundo da pagina |
| `--bg-secondary` | `#141414` | Rodape, modal, menu do celular |
| `--bg-card` | `#1a1a1a` | Cards, campos, tabelas |
| `--bg-card-hover` | `#222` | Hover de card |
| `--bg-elevated` | `#1f1f1f` | Dropdown de conta |
| `--accent` | `#e0b34a` | Acento principal: logo, botao, destaque |
| `--accent-hover` | `#f6d98a` | Hover do acento |
| `--accent-escuro` | `#a97b21` | Borda de acao |
| `--accent-texto` | `#1a1408` | Texto sobre acento (contraste 17:1) |
| `--text-primary` | `#ffffff` | Texto principal |
| `--text-secondary` | `#a3a3a3` | Texto de apoio |
| `--text-muted` | `#555555` | Rotulos e legendas |
| `--border` / `--border-light` | `#2a2a2a` / `#333` | Contorno das superficies |
| `--success` / `--danger` / `--info` | `#46d369` / `#e50914` / `#4a9eff` | Estados |

### Classificacao indicativa (ClassInd)

Os mesmos quadradinhos de 30x30 do cinema, com as cores oficiais:

| Token | Valor |
|---|---|
| `--class-livre-fundo` | `#00a651` |
| `--class-10-fundo` | `#0091da` |
| `--class-12-fundo` | `#e6b800` |
| `--class-14-fundo` | `#f58220` |
| `--class-16-fundo` | `#e31b23` |
| `--class-18-fundo` | `#111111` |

### Tipografia

Uma familia so: **Inter** (Google Fonts, 400 a 900). A hierarquia vem do
peso e do tamanho, nunca de outra fonte.

| Token | Valor | Uso |
|---|---|---|
| `--radius-sm` / `--radius-md` / `--radius-lg` | `6px` / `10px` / `16px` | Cantos |
| `--header-h` | `68px` | Altura do cabecalho fixo |
| `--largura-conteudo` / `--largura-nav` | `1300px` / `1400px` | Larguras |

---

## 6. JavaScript

| Arquivo | Responsabilidade |
|---|---|
| `configuracao.js` | **Unico lugar** com WhatsApp, e-mail e redes. Monta os links de contato. |
| `dados-catalogo.js` | Fonte unica do catalogo: 105 jogos e 23 consoles, com consultas prontas. |
| `precos.js` | Precos da loja, em centavos. **Gerado** por `tools/gerar-precos.js`. |
| `precos-local.js` | Sobrepoe o `precos.js` com os precos editados no painel, para o dono ver o resultado antes de publicar. |
| `dados-ajuda.js` | Conteudo da Central de Ajuda: 8 categorias, 18 problemas, 85 solucoes. |
| `auth.js` | Sessao do cliente no navegador. |
| `cart.js` | Carrinho, pedidos e a mensagem de fechamento do WhatsApp. |
| `utils.js` | Nucleo: formatacao, badges, **card de produto**, header, toast. |
| `home.js` · `catalog.js` · `product.js` · `cart-page.js` · `auth-page.js` · `profile.js` · `help.js` | Um modulo por pagina. |
| `admin.js` | Painel local: precos, exportacao, pedidos e clientes. |

**A ordem dos scripts importa:** configuracao → dados-catalogo → precos →
auth → cart → utils → modulo da pagina. O gerador de paginas mantem essa
ordem sozinho.

---

## 7. Precos

`precos.js` guarda os valores, em centavos:

```js
var PRECOS = {
  'ps-elden-ring': { preco: 29990, de: 39990 },
  // ...
};
```

- `preco` = valor a venda. `de` = preco cheio, quando ha desconto.
- Enquanto `preco` for `null`, a vitrine mostra **"Preco a anunciar"** e o
  botao principal do produto vira **"Falar no Zap"**: a venda acontece na
  conversa, com o valor combinado por la.

### Os precos que estao no ar agora sao provisorios

O `precos.js` vem com valores sorteados, para a vitrine ficar completa
enquanto a loja nao publica os precos de verdade. **Troque antes de
divulgar.** O aviso esta no cabecalho do proprio arquivo.

- Todos os 128 produtos tem preco, e nenhum fica abaixo de R$ 50,00.
- As faixas acompanham o tipo: um PS5 fica entre R$ 2.800 e R$ 4.200, um
  jogo de 2017 entre R$ 50 e R$ 160.
- 13 produtos ganharam preco cheio (desconto).
- O sorteio usa semente fixa: `node tools/gerar-precos-placeholder.js`
  produz sempre os mesmos numeros, e nunca um preco cheio menor que o de
  venda.

### Como publicar os precos de verdade

Tudo pelo painel, em `/pages/admin/produtos.html` (senha: `vharak`):

1. **Baixar modelo em branco** — um CSV com uma linha por produto
   (`id;nome;preco;preco cheio`), para preencher na sua planilha.
2. **Colar lista de precos** — cole as linhas de volta na caixa de texto.
   Aceita o id ou o nome do produto, e o preco como `299,90`, `299.90` ou
   `R$ 299,90`. O separador e ponto e virgula, tabulacao, barra ou dois
   espacos (a virgula e o decimal, nao separa).
   As linhas que nao entraram sao listadas com o motivo.
3. **Exportar precos.js** — baixa o arquivo.
4. Substitua o arquivo baixado em `frontend/js/precos.js`.

Ate a substituicao, a vitrine do **mesmo navegador** ja mostra os precos
editados (o modulo `precos-local.js` sobrepoe o arquivo com o que foi
digitado no painel). Serve para conferir antes de publicar.

### Se preferir editar direto

A tabela da pagina tambem aceita digitar o preco linha a linha. Com 128
produtos, a lista colada e mais rapida.

---

## 8. Onde o catalogo vem de

| Fonte | Caminho | O que traz |
|---|---|---|
| Migracao | `tools/migrar-catalogo.js` | Reconstroi `dados-catalogo.js` a partir de `frontend-antigo/` |
| Precos | `tools/gerar-precos.js` | Regera `precos.js` com uma linha por produto, **preservando os precos que ja existem** |
| Precos provisorios | `tools/gerar-precos-placeholder.js` | Sorteia precos provisorios (semente fixa) para a vitrine ficar completa |
| Ajuda | `tools/migrar-ajuda.js` | Exporta o conteudo da ajuda antiga |

Para incluir um produto novo: acrescente a entrada em `dados-catalogo.js`,
o preco em `precos.js` e a capa em `assets/jogos/`.

---

## 9. Ferramentas

Todas em `tools/`, e todas rodam com Node puro:

| Comando | O que faz |
|---|---|
| `node tools\servidor.js 8000` | Servidor estatico para developing |
| `node tools\gerar-paginas.js` | Gera as paginas a partir de `pages/src/` |
| `node tools\verificar.js` | Sintaxe do JS, strings concatenadas sem `+`, chaves do CSS, links quebrados, head das paginas, encoding, catalogo |
| `node tools\verificar-paginas.js` | Abre cada pagina em um navegador e reporta erro de JavaScript, requisicao quebrada e pagina que ficou vazia |
| `node tools\testar-catalogo.js` | Testa o card de produto, o preco, o escapamento e a busca |
| `node tools\testar-painel.js` | Testa o fluxo do painel: entrar, colar a lista de precos, exportar e ver o preco na vitrine |
| `node tools\gerar-seo.js [dominio]` | Gera `sitemap.xml` e `robots.txt` |
| `node tools\preview.js <url> <png> [w] [h] [opcoes]` | Print com emulacao de dispositivo (390px, 768px, ...) e medidor de estouro horizontal. Opcoes: `completo`, `login` |
| `node tools\preview-painel.js` | Print do painel com a lista de precos ja aplicada |
| `node tools\inspecionar.js <url> "<expressao>"` | Avalia uma expressao dentro da pagina, para depurar |
| `node tools\pingar.js [porta]` | Confere se todas as rotas respondem 200 |
| `node tools\medir-capas.js` | Mede a proporcao das capas do catalogo |
| `node tools\checar-encoding.js` | Confere UTF-8 sem caracteres corrompidos |
| `node tools\garar-precos-placeholder.js` | Sorteia precos provisorios (semente fixa) |

Rode `verificar.js`, `verificar-paginas.js` e `testar-catalogo.js` antes de
considerar o trabalho pronto.

**As ferramentas sobem o servidor sozinhas.** Nao e preciso abrir um
terminal a parte com `node tools/servidor.js`: cada uma sobe o seu e
fecha no fim. Se ja houver um servidor na porta, elas usam o que
estiver no ar.

---

## 10. Pendencias conhecidas

1. **Os precos no ar sao provisorios.** Foram sorteados para a vitrine
   ficar completa (secao 7). Substitua pelos valores reais antes de
   divulgar.
2. **20 capas ainda sao ilustracoes em SVG** no padrao da marca. Para usar
   a capa real, troque `capa.svg` por `capa.jpg` e aponte o campo `capa`
   no catalogo.
3. **O backend nao esta ligado.** A API em `backend/` tem catalogo,
   pedidos, pagamentos e admin prontos, mas o site roda com catalogo
   estatico. Ligar os dois e o proximo passo.
4. **Nao ha imagem de compartilhamento (og:image)padrao.** Cada produto
   usa a propria capa. Vale criar uma arte de 1200x630 para a home.
5. **As fotos de console tem fundos diferentes.** Algumas vem com fundo
   branco. Elas aparecem inteiras, sem corte, mas num cartao escuro.
6. **A conta do cliente e local.** A sessao fica no `localStorage`. A senha
   do painel tambem: e uma trava de tela, nao seguranca de loja.

---

## 11. Estado atual

- 14 paginas (10 publicas, 5 do painel), todas com `<head>` completo.
- 128 produtos no catalogo: 105 jogos e 23 consoles, com 39 avaliacoes
  e notas cadastradas.
- 12 folhas de estilo, 15 modulos de JavaScript, sem framework.
- Central de Ajuda com 8 categorias, 18 problemas e 85 solucoes.
- Politica de privacidade e termos de uso publicados (LGPD).
- `sitemap.xml` com 136 URLs e `robots.txt`.
- Sem backend ligado, sem chamadas externas alem do Google Fonts.
