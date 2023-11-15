const { Client } = require('pg');

const _POSTGRES_USER = process.env.POSTGRES_USER;
const _POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD;
const _POSTGRES_IP = process.env.POSTGRES_IP;
const _POSTGRES_PORT = process.env.POSTGRES_PORT;

const client = new Client({
  host: _POSTGRES_IP,
  user: _POSTGRES_USER,
  password: _POSTGRES_PASSWORD,
  port: _POSTGRES_PORT,
});

const createDatabase = async () => {
  try {
    await client.connect(); // gets connection
    await client.query('CREATE DATABASE jfstat'); // sends queries
    return true;
  } catch (error) {
    if (!error.stack.includes('already exists')) {
      console.error(error.stack);
    }

    return false;
  } finally {
    await client.end(); // closes connection
  }
};

module.exports = {
  createDatabase: createDatabase,
};
