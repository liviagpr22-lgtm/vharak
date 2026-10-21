# Colocar a VHARAK no ar

Guia do zero até um endereço público. O site é **estático**: HTML, CSS e
JavaScript puro, sem framework e sem build. Isso deixa a publicação
simples e gratuita.

---

## 1. O que já está pronto

| | |
|---|---|
| Site | `frontend/` — 14 páginas, 128 produtos, carrinho, conta, ajuda e painel |
| API | `backend/` — Express + MySQL (ainda não ligada ao site) |
| Deploy | `netlify.toml` — comando de build e pasta de publicação já configurados |
| Segredos | `backend/.env` fora do repositório; `backend/.env.example` é o modelo |

O site **funciona inteiro sem a API**: o catálogo é estático, o carrinho e
a conta ficam no navegador e o fechamento da compra é pelo WhatsApp. A API
entra depois, quando você ligar o painel ao banco.

---

## 2. Publicar o site (Netlify, grátis)

O `netlify.toml` já diz tudo:

```toml
[build]
  command = "node tools/gerar-paginas.js"
  publish = "frontend"
```

O passo de build regera as páginas a partir das fontes em
`frontend/pages/src/`. Assim o que vai ao ar nunca é uma página
desatualizada.

### Passo a passo

1. Crie o repositório no GitHub (pode ser pela interface ou pelo `gh`).
2. Em <https://app.netlify.com> clique em **Add new site → Import an existing project**.
3. Autorize o Netlify a acessar o GitHub e escolha o repositório.
4. Em **Build & deploy**:
   - **Build command**: `node tools/gerar-paginas.js`
   - **Publish directory**: `frontend`
   - **Node version**: 20
5. **Deploy site**. Em menos de um minuto você tem um endereço
   `https://vharak-xxx.netlify.app`.

Depois do primeiro deploy, todo `git push` republica o site sozinho.

### Alternativa: Cloudflare Pages ou Vercel

Os dois funcionam igual. No Cloudflare Pages, o comando é
`node tools/gerar-paginas.js` e a pasta de saída é `frontend`. O endereço
sai como `vharak.pages.dev`.

### Alternativa sem Git: Netlify Drop

Arraste a pasta `frontend/` para <https://app.netlify.com/drop>. Fica no
ar em segundos, mas cada mudança exige arrastar de novo — serve para
testar, não para manter.

---

## 3. Domínio próprio

Sem domínio, o site funciona em `*.netlify.app`. Quando comprar o seu
(no registro.br, ~R$40/ano para `.com.br`):

1. No painel do Netlify: **Site settings → Domain management → Add a
   domain**.
2. No painel do registrador, crie os registros que o Netlify mostrar
   (geralmente um `A` apontando para o IP do Netlify e um `CNAME` para
   `www`).
3. Espere a propagação (pode levar algumas horas).

O certificado HTTPS é emitido automaticamente.

Depois, regere o sitemap com o domínio novo:

```bash
node tools\gerar-seo.js https://seudominio.com.br
```

e faça o push.

---

## 4. Ligar a API (opcional, fase 2)

A API precisa de um servidor com Node e MySQL. Hospedagens que aceitam
isso: Railway, Render, Locaweb, Hostinger (planos com Node) ou um VPS.

O caminho é:

1. Subir o `backend/` com o `.env` preenchido (senha do banco e
   `JWT_SECRET` novos — nunca os de desenvolvimento).
2. Rodar as migrations: `node backend/database/runner.js`.
3. Apontar o `CORS_ORIGIN` para o domínio do site.
4. No frontend, trocar o catálogo estático por chamadas `/api`.

**O painel local muda de papel**: hoje ele edita os preços no navegador e
exporta o `precos.js` para você subir. Com a API ligada, ele passa a
gravar direto no banco.

---

## 5. Checklist antes de divulgar

- [ ] Preencher os preços reais. Hoje eles são **provisórios** (sorteados
      pelo `tools/gerar-precos-placeholder.js`) e o aviso está no
      cabeçalho do `frontend/js/precos.js`.
- [ ] Trocar as 20 capas ilustrativas em SVG por capas reais.
- [ ] Criar a imagem de compartilhamento (og:image) de 1200×630.
- [ ] Conferir a política de privacidade com quem responde pela loja.
- [ ] Ajustar o telefone e o e-mail em `frontend/js/configuracao.js` —
      é o único lugar onde o contato da loja aparece.
- [ ] Rodar as verificações: `node tools\verificar.js`,
      `node tools\verificar-paginas.js` e `node tools\testar-catalogo.js`.
