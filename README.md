# VHARAK — Loja Virtual Gamer

Loja de jogos e consoles. O site esta em `frontend/`, a API esta em
`backend/`.

```bash
# So a vitrine (sem banco)
node tools\servidor.js 8000       ->  http://localhost:8000

# Com a API (precisa do MySQL ligado)
cd backend && npm start            ->  http://localhost:3000
```

## O que tem aqui

| Pasta | O que e |
|---|---|
| `frontend/` | O site. HTML, CSS e JavaScript puro, sem framework e sem build. |
| `backend/` | API Express + MySQL. Ainda nao esta ligada ao site. |
| `frontend-antigo/` | Backup do site anterior, mantido como referencia. |
| `tools/` | Ferramentas de desenvolvimento (gerador de paginas, verificacoes, prints). |

**A documentacao completa do site esta em [`frontend/README.md`](frontend/README.md).**

## O essencial

- **As paginas sao geradas.** Edite `frontend/pages/src/`, nunca
  `frontend/pages/`. Rode `node tools/gerar-paginas.js` depois de mexer.
- **Os precos ficam em `frontend/js/precos.js`.** Enquanto um produto nao
  tiver preco, a vitrine mostra "Preco a anunciar" e o botao vira
  "Falar no Zap".
- **Antes de dar por pronto:** `node tools/verificar.js` e
  `node tools/testar-catalogo.js`.

## Antes de publicar

1. **Trocar os precos provisorios pelos reais.** Os valores no ar foram
   sorteados (todos acima de R$ 50, com faixas por tipo de produto) para
   a vitrine ficar completa. O aviso está no cabeçalho de
   `frontend/js/precos.js`. Substitua pelo painel: `/pages/admin/login.html`
   (senha `vharak`) → Produtos e preços → **Baixar modelo em branco** →
   preencher → **Colar lista de preços** → **Exportar precos.js** →
   substituir o arquivo em `frontend/js/precos.js`.
2. Trocar as 20 capas ilustrativas por capas reais.
3. Apontar o dominio em `tools/gerar-seo.js` e regerar `sitemap.xml`.
4. Criar a imagem de compartilhamento (og:image) de 1200x630.
5. Conferir a politica de privacidade com quem responde pela loja.
