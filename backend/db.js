const { Pool } = require('pg');
const pgp = require("pg-promise")();
const {update_query : update_query_map} = require("./models/bulk_insert_update_handler");


const _POSTGRES_USER=process.env.POSTGRES_USER;
const _POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD;
const _POSTGRES_IP=process.env.POSTGRES_IP;
const _POSTGRES_PORT = process.env.POSTGRES_PORT;

if([_POSTGRES_USER,_POSTGRES_PASSWORD,_POSTGRES_IP,_POSTGRES_PORT].includes(undefined))
{
  console.log('Error: Postgres details not defined');
  return;

}

const pool = new Pool({
  user: (_POSTGRES_USER),
  host:(_POSTGRES_IP),
  database: 'jfstat',
  password:(_POSTGRES_PASSWORD),
  port: (_POSTGRES_PORT),
});

pool.on('error', (err, client) => {
  console.error('Unexpected error on idle client', err);
  return;
  //process.exit(-1);
});

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
      const update_query= update_query_map.find(query => query.table === table_name).query;
      await client.query("COMMIT");
      const cs = new pgp.helpers.ColumnSet(columns, { table: table_name });
      const query = pgp.helpers.insert(data, cs) + update_query; // Update the column names accordingly
      await client.query(query);

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
  // initDB: initDB,
};
