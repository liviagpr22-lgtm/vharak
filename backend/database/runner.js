const fs = require('fs');
const path = require('path');

const db = require('../src/config/db');

const dirMigrations = path.join(__dirname, 'migrations');

async function garantirTabelaControle() {
  await db.query(`CREATE TABLE IF NOT EXISTS \`migrations\` (
    \`id\` int unsigned NOT NULL AUTO_INCREMENT,
    \`filename\` varchar(255) NOT NULL UNIQUE,
    \`applied_at\` datetime DEFAULT CURRENT_TIMESTAMP,
    PRIMARY KEY (\`id\`)
  ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4`);
}

async function aplicar() {
  await garantirTabelaControle();

  const aplicadas = new Set(
    (await db.query('SELECT filename FROM migrations')).map((linha) => linha.filename)
  );

  const arquivos = fs
    .readdirSync(dirMigrations)
    .filter((arq) => arq.endsWith('.sql'))
    .sort();

  for (const arquivo of arquivos) {
    if (aplicadas.has(arquivo)) {
      console.log(`[migration] Ignorada (ja aplicada): ${arquivo}`);
      continue;
    }

    const conteudo = fs.readFileSync(path.join(dirMigrations, arquivo), 'utf8');
    const instrucoes = conteudo
      .split(';')
      .map((parte) => parte.trim())
      .filter(Boolean);

    await db.withTransaction(async (connection) => {
      for (const instrucao of instrucoes) {
        await connection.query(instrucao);
      }
      await connection.execute('INSERT INTO migrations (filename) VALUES (?)', [arquivo]);
    });

    console.log(`[migration] Aplicada: ${arquivo}`);
  }

  console.log('[migration] Situacao do banco atualizada.');
}

if (require.main === module) {
  aplicar()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('[migration] Falha:', err.message);
      process.exit(1);
    });
}

module.exports = { aplicar };
