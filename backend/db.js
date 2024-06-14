const { Pool } = require("pg");
const pgp = require("pg-promise")();
const { update_query: update_query_map } = require("./models/bulk_insert_update_handler");
const moment = require("moment");

const _POSTGRES_USER = process.env.POSTGRES_USER;
const _POSTGRES_PASSWORD = process.env.POSTGRES_PASSWORD;
const _POSTGRES_IP = process.env.POSTGRES_IP;
const _POSTGRES_PORT = process.env.POSTGRES_PORT;
const _POSTGRES_DATABASE = process.env.POSTGRES_DB || "jfstat";

if ([_POSTGRES_USER, _POSTGRES_PASSWORD, _POSTGRES_IP, _POSTGRES_PORT].includes(undefined)) {
  console.log("Error: Postgres details not defined");
  return;
}

const pool = new Pool({
  user: _POSTGRES_USER,
  host: _POSTGRES_IP,
  database: _POSTGRES_DATABASE,
  password: _POSTGRES_PASSWORD,
  port: _POSTGRES_PORT,
});

pool.on("error", (err, client) => {
  console.error("Unexpected error on idle client", err);
  return;
  //process.exit(-1);
});

async function deleteBulk(table_name, data) {
  const client = await pool.connect();
  let result = "SUCCESS";
  let message = "";
  try {
    await client.query("BEGIN");

    if (data && data.length !== 0) {
      const deleteQuery = {
        text: `DELETE FROM ${table_name} WHERE "Id" IN (${pgp.as.csv(data)})`,
      };
      //  console.log(deleteQuery);
      await client.query(deleteQuery);
    }

    await client.query("COMMIT");
    message = data.length + " Rows removed.";
  } catch (error) {
    await client.query("ROLLBACK");
    message = "Bulk delete error: " + error;
    result = "ERROR";
  } finally {
    client.release();
  }
  return { Result: result, message: "" + message };
}

async function updateSingleFieldBulk(table_name, data, field_name, new_value, where_field) {
  const client = await pool.connect();
  let result = "SUCCESS";
  let message = "";
  if (where_field === undefined || where_field === null || where_field === "") {
    where_field = "Id";
  }
  try {
    await client.query("BEGIN");

    if (data && data.length !== 0) {
      const updateQuery = {
        text: `UPDATE ${table_name} SET "${field_name}"='${new_value}' WHERE "${where_field}" IN (${pgp.as.csv(data)})`,
      };
      //  console.log(deleteQuery);
      await client.query(updateQuery);
    }

    await client.query("COMMIT");
    message = data.length + " Rows updated.";
  } catch (error) {
    await client.query("ROLLBACK");
    message = "Bulk update error: " + error;
    result = "ERROR";
  } finally {
    client.release();
  }
  return { Result: result, message: "" + message };
}

async function insertBulk(table_name, data, columns) {
  //dedupe data

  if (Array.isArray(data)) {
    data = data.reduce((accumulator, currentItem) => {
      const isNotDuplicate = !accumulator.some((item) =>
        currentItem.Id ? item.Id === currentItem.Id : item.rowid === currentItem.rowid
      );

      if (isNotDuplicate) {
        accumulator.push(currentItem);
      }

      return accumulator;
    }, []);
  }

  //
  const client = await pool.connect();
  let result = "SUCCESS";
  let message = "";
  try {
    await client.query("BEGIN");
    const update_query = update_query_map.find((query) => query.table === table_name).query;
    await client.query("COMMIT");
    const cs = new pgp.helpers.ColumnSet(columns, { table: table_name });
    const query = pgp.helpers.insert(data, cs) + update_query; // Update the column names accordingly
    await client.query(query);
  } catch (error) {
    await client.query("ROLLBACK");
    message = "" + error;
    result = "ERROR";
  } finally {
    client.release();
  }
  return {
    Result: result,
    message: message ? "Bulk insert error: " + message : "",
  };
}

async function query(text, params) {
  try {
    const result = await pool.query(text, params);
    return result;
  } catch (error) {
    if (error?.routine === "auth_failed") {
      console.log("Error 401: Unable to Authenticate with Postgres DB");
    } else if (error?.code === "ENOTFOUND") {
      console.log("Error: Unable to Connect to Postgres DB");
    } else if (error?.code === "ERR_SOCKET_BAD_PORT") {
      console.log("Error: Invalid Postgres DB Port Range. Port should be >= 0 and < 65536.");
    } else if (error?.code === "ECONNREFUSED") {
      console.log("Error: Postgres DB Connection refused at " + error.address + ":" + error.port);
    } else {
      if (error.message && !error.message.includes('database "' + _POSTGRES_DATABASE + '" does not exist')) {
        console.error("[JELLYSTAT]: Error occurred while executing query:", error.message);
      }
    }
    return [];
    // throw error;
  }
}

module.exports = {
  query: query,
  deleteBulk: deleteBulk,
  insertBulk: insertBulk,
  updateSingleFieldBulk: updateSingleFieldBulk,
  // initDB: initDB,
};
