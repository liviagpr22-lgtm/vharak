const express = require('express');
const router = express.Router();
const igdbService = require('../services/igdbService');
const { id } = require('../utils/validations');

router.get('/jogos', async (req, res, next) => {
  try {
    const resultado = await igdbService.buscarJogos({
      busca: req.query.busca,
      pagina: req.query.pagina,
      limite: req.query.limite,
      genero: req.query.genero,
      plataforma: req.query.plataforma,
      ordenar: req.query.ordenar
    });
    return res.json(resultado);
  } catch (err) {
    return next(err);
  }
});

router.get('/jogos/:igdbId', async (req, res, next) => {
  try {
    const jogoId = id(req.params.igdbId, 'igdbId');
    const resultado = await igdbService.buscarJogos({ jogoId });
    if (!resultado.itens.length) {
      return res.status(404).json({ erro: 'not_found', mensagem: 'Jogo nao encontrado na IGDB.' });
    }
    return res.json(resultado.itens[0]);
  } catch (err) {
    return next(err);
  }
});

router.get('/estado', (req, res) => {
  return res.json({ configurada: igdbService.configurada() });
});

module.exports = router;
