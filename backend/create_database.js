const { Client } = require('pg');

const _POSTGRES_USER = process.env.POSTGRES_USER;
const _POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD;
const _POSTGRES_IP = process.env.POSTGRES_IP;
const _POSTGRES_PORT = process.env.POSTGRES_PORT;
const _POSTGRES_DATABASE = process.env.POSTGRES_DB || 'jfstat';
const _POSTGRES_SSL_REJECT_UNAUTHORIZED = process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED === undefined ? true : process.env.POSTGRES_SSL_REJECT_UNAUTHORIZED === "true";
const _POSTGRES_MAINTENANCE_DB = process.env.POSTGRES_MAINTENANCE_DB || "postgres";

const baseClientOptions = {
  host: _POSTGRES_IP,
  user: _POSTGRES_USER,
  password: _POSTGRES_PASSWORD,
  port: _POSTGRES_PORT,
  ...(process.env.POSTGRES_SSL_ENABLED === "true"
    ? { ssl: { rejectUnauthorized: _POSTGRES_SSL_REJECT_UNAUTHORIZED } }
    : {})
};

const createDatabase = async () => {
  const probeClient = new Client({ ...baseClientOptions, database: _POSTGRES_DATABASE });
  try {
    await probeClient.connect();
    await probeClient.end();
    return false; // database already exists
  } catch (error) {
    if (error.code !== '3D000') {
      console.error(error.stack);
      return false;
    }
  }

  const adminClient = new Client({ ...baseClientOptions, database: _POSTGRES_MAINTENANCE_DB });
  try {
    await adminClient.connect();
    await adminClient.query('CREATE DATABASE ' + _POSTGRES_DATABASE);
    return true;
  } catch (error) {
    if (!error.stack.includes('already exists')) {
      console.error(error.stack);
    }
    return false;
  } finally {
    await adminClient.end();
  }
};

module.exports = {
  createDatabase: createDatabase,
};
