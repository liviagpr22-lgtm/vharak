const express = require('express');
const router = express.Router();
const service = require('../services/catalogoService');
const { id } = require('../utils/validations');

router.get('/produtos', async (req, res, next) => {
  try {
    const resultado = await service.listar({
      busca: req.query.busca,
      categoria: req.query.categoria,
      plataforma: req.query.plataforma,
      genero: req.query.genero,
      tipo: req.query.tipo,
      ordenar: req.query.ordenar,
      precoMin: req.query.preco_min,
      precoMax: req.query.preco_max,
      destaque: req.query.destaque,
      disponiveis: req.query.disponiveis,
      pagina: req.query.pagina,
      limite: req.query.limite
    });
    return res.json(resultado);
  } catch (err) {
    return next(err);
  }
});

router.get('/categorias', async (req, res, next) => {
  try {
    return res.json(await service.listarCategorias());
  } catch (err) {
    return next(err);
  }
});

router.get('/plataformas', async (req, res, next) => {
  try {
    return res.json(await service.listarPlataformas());
  } catch (err) {
    return next(err);
  }
});

router.get('/generos', async (req, res, next) => {
  try {
    return res.json(await service.listarGeneros());
  } catch (err) {
    return next(err);
  }
});

router.get('/destaques', async (req, res, next) => {
  try {
    return res.json(await service.listar({ destaque: '1', limite: req.query.limite || 8 }));
  } catch (err) {
    return next(err);
  }
});

router.get('/produtos/:id', async (req, res, next) => {
  try {
    id(req.params.id, 'id do produto');
    return res.json(await service.detalhar(req.params.id));
  } catch (err) {
    return next(err);
  }
});

router.get('/produtos/:id/estoque', async (req, res, next) => {
  try {
    id(req.params.id, 'id do produto');
    return res.json(await service.estoque(req.params.id));
  } catch (err) {
    return next(err);
  }
});

module.exports = router;
