// db.js
const { Pool } = require('pg');
const fs = require('fs');
const pgp = require("pg-promise")();


const _POSTGRES_USER=process.env.POSTGRES_USER;
const _POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD;
const _POSTGRES_IP=process.env.POSTGRES_IP;
const _POSTGRES_PORT = process.env.POSTGRES_PORT;

if([_POSTGRES_USER,_POSTGRES_PASSWORD,_POSTGRES_IP,_POSTGRES_PORT].includes(undefined))
{
  console.log('Postgres details not defined');
  //return;

}

const development=false;
const _DEV_USER='jfstat';
const _DEV_PASSWORD = '123456';
const _DEV_IP='10.0.0.99';
const _DEV_PORT = 32778;

const pool = new Pool({
  user: (development ? _DEV_USER: _POSTGRES_USER),
  host:(development ? _DEV_IP: _POSTGRES_IP),
  database: 'jfstat',
  password:(development ? _DEV_PASSWORD: _POSTGRES_PASSWORD),
  port: (development ? _DEV_PORT: _POSTGRES_PORT),
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  return;
  //process.exit(-1);
});

async function initDB()
{
  const checkPool = new Pool({
    user: (development ? _DEV_USER: _POSTGRES_USER),
    host:(development ? _DEV_IP: _POSTGRES_IP),
    database: 'postgres',
    password:(development ? _DEV_PASSWORD: _POSTGRES_PASSWORD),
    port: (development ? _DEV_PORT: _POSTGRES_PORT),
  });
  
  checkPool.connect((err, client, done) => {
  if (err) {
    console.error('Error connecting to PostgreSQL database', err.stack);
    return;
  }

  client.query("SELECT 1 FROM pg_database WHERE datname = 'jfstat'", (err, res) => {
    if (err) {
      console.error('Error executing query to check if database exists', err.stack);
      //return;
    }

    if (res.rows.length === 0) {
      const dbName = 'jfstat';
      const sql = fs.readFileSync('./init.sql').toString();
      client.query(`CREATE DATABASE ${dbName}`, (err, res) => {
        if (err) throw err;
        console.log(`Database ${dbName} created`);
        done();
      });

      checkPool.end(() => {
        pool.query(sql, (err, res) => {
            if (err) throw err;
            console.log('Database and table created');
            pool.end();
          });
      });
    } else {
      console.log('Database exists');
      done();
    }
  });
});

}
async function deleteBulk(table_name, data) {
  const client = await pool.connect();
  let result='SUCCESS';
  let message='';
  try {
    await client.query('BEGIN');

    // const AllIds = data.map((row) => row.Id);

    if (data.length !== 0) {
      
      const deleteQuery = {
        text: `DELETE FROM ${table_name} WHERE "Id" IN (${pgp.as.csv(
          data
        )})`
      };
      // console.log(deleteQuery);
      await client.query(deleteQuery);
    } 
    // else {
    //   await client.query(`DELETE FROM ${table_name}`);
    //   console.log('Delete All');
    // }

    await client.query('COMMIT');
    message=(data.length + " Rows removed.");

  } catch (error) {
    await client.query('ROLLBACK');
    message=('Error: '+ error);
    result='ERROR';
  } finally {
    client.release();
  }
  return ({Result:result,message:message});
}

async function insertBulk(table_name, data,columns) {
  const client = await pool.connect();
  let result='SUCCESS';
  let message='';
  try {
      await client.query("BEGIN");

      const query = pgp.helpers.insert(
        data,
        columns,
        table_name
      );
      await client.query(query);

      await client.query("COMMIT");

      message=(data.length + " Rows Inserted.");

  } catch (error) {
    await client.query('ROLLBACK');
    message=('Error: '+ error);
    result='ERROR';
  } finally {
    client.release();
  }
  return ({Result:result,message:message});
}

async function query(text, params)  {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    console.error('Error occurred while executing query:', error);
    // throw error;
  }
}

module.exports = {
  query:query,
  deleteBulk: deleteBulk,
  insertBulk: insertBulk,
  initDB: initDB,
};
