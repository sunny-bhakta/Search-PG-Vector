require('dotenv').config();
const { Pool } = require('pg');
const config = require('config');
const { registerType, toSql } = require('pgvector/pg');
const logger = require('../utils/logger');

const poolConfig = config.get('database.pool');
const databaseUrl = process.env.DATABASE_URL || config.get('database.url');

const pool = new Pool({
  connectionString: databaseUrl,
  min: poolConfig.min,
  max: poolConfig.max,
  idleTimeoutMillis: poolConfig.idleTimeoutMillis
});

pool.on('connect', async (client) => {
  try {
    await registerType(client);
  } catch (err) {
    logger.error('Failed to register pgvector type parser', { err: err.message });
  }
});

pool.on('error', (err) => {
  logger.error('Unexpected PG pool error', { err: err.message });
});

async function query(text, params = []) {
  return pool.query(text, params);
}

async function withTransaction(callback) {
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    const result = await callback(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}

function toVector(value) {
  if (!Array.isArray(value)) {
    throw new Error('Vector value must be an array of numbers');
  }
  return toSql(value);
}

async function close() {
  await pool.end();
}

module.exports = {
  pool,
  query,
  withTransaction,
  toVector,
  close
};
