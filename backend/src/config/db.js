const mysql = require('mysql2/promise');
const env = require('./env');

const pool = mysql.createPool(env.db);

async function query(sql, params = []) {
  const [rows] = await pool.execute(sql, params);
  return rows;
}

async function queryOne(sql, params = []) {
  const rows = await query(sql, params);
  return rows.length > 0 ? rows[0] : null;
}

async function withTransaction(handler) {
  const connection = await pool.getConnection();
  try {
    await connection.beginTransaction();
    const result = await handler(connection);
    await connection.commit();
    return result;
  } catch (error) {
    try {
      await connection.rollback();
    } catch (rollbackError) {
      console.error('[db] Falha no rollback da transacao:', rollbackError.message);
    }
    throw error;
  } finally {
    connection.release();
  }
}

async function checkConnection() {
  const rows = await query('SELECT 1 AS ok');
  return rows.length > 0 && rows[0].ok === 1;
}

module.exports = { pool, query, queryOne, withTransaction, checkConnection };
