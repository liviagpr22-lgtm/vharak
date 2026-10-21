/*
 * VHARAK | tools/migrar-ajuda.js
 * Exporta o conteudo da Central de Ajuda antiga (frontend-antigo) para o
 * formato novo: um arquivo de dados limpo, sem logica, com os problemas
 * e as solucoes ja escritos.
 *
 * Uso: node tools/migrar-ajuda.js
 */
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const RAIZ = path.join(__dirname, '..');
const ANTIGO = path.join(RAIZ, 'frontend-antigo', 'js');
const DESTINO = path.join(RAIZ, 'frontend', 'js', 'dados-ajuda.js');

const contexto = { window: {} };
vm.createContext(contexto);
vm.runInContext(fs.readFileSync(path.join(ANTIGO, 'interface.js'), 'utf8'), contexto);
vm.runInContext(fs.readFileSync(path.join(ANTIGO, 'ajuda-dados.js'), 'utf8'), contexto);

const dados = contexto.window.VHARAK.ajudaDados;
const categorias = dados.categorias();
const problemas = dados.problemas().map((p) => ({
  id: p.id,
  titulo: p.titulo,
  resumo: p.resumo,
  categoria: p.categoria,
  termos: p.termos || [],
  relacionados: p.relacionados || [],
  solucoes: (p.solucoes || []).map((s) => ({ titulo: s.titulo, texto: s.texto })),
}));

const conteudo = `/*
 * VHARAK | dados-ajuda.js
 * Conteudo da Central de Ajuda: ${categorias.length} categorias e ${problemas.length} problemas.
 *
 * Migrado de frontend-antigo/js/ajuda-dados.js por tools/migrar-ajuda.js.
 * Cada solucao e um par de titulo e texto -- nada aqui depende de logica.
 */
(function (global) {
  'use strict';

  var VH = global.VH || (global.VH = {});

  VH.ajuda = {
    categorias: ${JSON.stringify(categorias, null, 6).replace(/\n/g, '\n  ')},

    problemas: ${JSON.stringify(problemas, null, 6).replace(/\n/g, '\n  ')},

    /* Nome legivel da categoria a partir do slug. */
    nomeDaCategoria: function (slug) {
      for (var i = 0; i < VH.ajuda.categorias.length; i += 1) {
        if (VH.ajuda.categorias[i].slug === slug) return VH.ajuda.categorias[i].nome;
      }
      return '';
    },

    /* Problemas de uma categoria. */
    porCategoria: function (slug) {
      return VH.ajuda.problemas.filter(function (p) { return p.categoria === slug; });
    },

    /* Busca por titulo, resumo e termos. */
    buscar: function (termo) {
      var alvo = String(termo || '').trim().toLowerCase();
      if (!alvo) return VH.ajuda.problemas;
      return VH.ajuda.problemas.filter(function (p) {
        var texto = [p.titulo, p.resumo].concat(p.termos).join(' ').toLowerCase();
        return texto.indexOf(alvo) !== -1;
      });
    }
  };
}(window));
`;

fs.writeFileSync(DESTINO, conteudo, 'utf8');
console.log(`dados-ajuda.js gerado: ${categorias.length} categorias, ${problemas.length} problemas, `
  + `${problemas.reduce((t, p) => t + p.solucoes.length, 0)} solucoes.`);
