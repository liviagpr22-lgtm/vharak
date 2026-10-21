const { badRequest } = require('./errors');

function obrigatorio(valor, campo) {
  if (valor === undefined || valor === null || String(valor).trim() === '') {
    throw badRequest(`Campo obrigatorio: ${campo}.`);
  }
}

function texto(valor, campo, { min = 1, max = 200 } = {}) {
  obrigatorio(valor, campo);
  const limpo = String(valor).trim();
  if (limpo.length < min || limpo.length > max) {
    throw badRequest(`Campo ${campo} deve ter entre ${min} e ${max} caracteres.`);
  }
  return limpo;
}

function textoOpcional(valor, campo, { max = 1000 } = {}) {
  if (valor === undefined || valor === null) {
    return null;
  }
  const limpo = String(valor).trim();
  if (limpo.length > max) {
    throw badRequest(`Campo ${campo} deve ter no maximo ${max} caracteres.`);
  }
  return limpo === '' ? null : limpo;
}

function numero(valor, campo, { min = 0, max = 100000, int = true, obrig = false } = {}) {
  if (valor === undefined || valor === null || valor === '') {
    if (obrig) throw badRequest(`Campo obrigatorio: ${campo}.`);
    return null;
  }
  const numero = Number(valor);
  if (!Number.isFinite(numero) || (int && !Number.isInteger(numero)) || numero < min || numero > max) {
    throw badRequest(`Campo ${campo} invalido (esperado numero entre ${min} e ${max}).`);
  }
  return numero;
}

function preco(valor, campo, { min = 0, max = 100000, obrig = false } = {}) {
  return numero(valor, campo, { min, max, int: false, obrig });
}

function email(valor, campo = 'email') {
  obrigatorio(valor, campo);
  const limpo = String(valor).trim().toLowerCase();
  if (!/^[^\s@]{1,64}@[^\s@]{1,255}\.[^\s@]{2,}$/.test(limpo) || limpo.length > 150) {
    throw badRequest('Informe um e-mail valido.');
  }
  return limpo;
}

function senhaforte(valor, campo = 'senha', { min = 8, max = 100 } = {}) {
  obrigatorio(valor, campo);
  const limpo = String(valor);
  if (limpo.length < min || limpo.length > max) {
    throw badRequest(`Campo ${campo} deve ter entre ${min} e ${max} caracteres.`);
  }
  return limpo;
}

function enumValor(valor, campo, valores, { obrig = true, padrao = null } = {}) {
  if (valor === undefined || valor === null || valor === '') {
    if (obrig) throw badRequest(`Campo obrigatorio: ${campo}.`);
    return padrao;
  }
  const limpo = String(valor).trim().toLowerCase();
  if (!valores.includes(limpo)) {
    throw badRequest(`Campo ${campo} deve ser um de: ${valores.join(', ')}.`);
  }
  return limpo;
}

function id(valor, campo, { obrig = true } = {}) {
  return numero(valor, campo, { min: 1, max: 4294967295, obrig });
}

module.exports = {
  obrigatorio,
  texto,
  textoOpcional,
  numero,
  preco,
  email,
  senhaforte,
  enumValor,
  id
};
