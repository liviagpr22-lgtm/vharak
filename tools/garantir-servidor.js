/*
 * VHARAK | tools/garantir-servidor.js
 *
 * Garante que exista um servidor no ar para as ferramentas usarem:
 * reaproveita o que ja estiver rodando ou sobe um estatico na hora.
 *
 * Sem isso, cada ferramenta depende de um "node tools/servidor.js" em
 * outra janela -- e uma janela a mais para esquecer de abrir.
 */
const net = require('net');
const { criarServidor } = require('./servidor');

function portaEmUso(porta) {
  return new Promise((resolve) => {
    const conexao = net.connect({ host: '127.0.0.1', port: porta });
    conexao.once('connect', () => { conexao.end(); resolve(true); });
    conexao.once('error', () => resolve(false));
    conexao.setTimeout(1200, () => { conexao.destroy(); resolve(false); });
  });
}

async function garantirServidor(porta) {
  if (await portaEmUso(porta)) {
    return { porta,Proprio: false, fechar: async () => {} };
  }
  const servidor = await criarServidor(porta);
  return {
    porta,
    proprio: true,
    fechar: async () => { await new Promise((r) => servidor.close(r)); },
  };
}

module.exports = { garantirServidor, portaEmUso };
