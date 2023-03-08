// db.js
const { Pool } = require('pg');

const pool = new Pool({
    user: 'jfstat',
    host: '10.0.0.99',
    database: 'jfstat',
    password: '123456',
    port: 32778, // or your PostgreSQL port number
  });

module.exports = {
  query: (text, params) => pool.query(text, params),
};
