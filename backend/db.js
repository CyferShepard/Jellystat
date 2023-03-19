// db.js
const { Pool } = require('pg');
const pgp = require("pg-promise")();

const pool = new Pool({
  user: 'jfstat',
  host: '10.0.0.99',
  database: 'jfstat',
  password: '123456',
  port: 32778, // or your PostgreSQL port number
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

module.exports = {
  query: (text, params) => pool.query(text, params),
  deleteBulk: deleteBulk,
  insertBulk: insertBulk,
};
