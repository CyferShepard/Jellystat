const {Pool} = require("pg");
const knexConfig = require("knexConfig");
const pgp = require("pg-promise")();
const {
    update_query: update_query_map,
} = require("./models/bulk_insert_update_handler");

const _POSTGRES_USER = knexConfig.development.connection.user;
const _POSTGRES_PASSWORD = knexConfig.development.connection.password;
const _POSTGRES_IP = knexConfig.development.connection.host;
const _POSTGRES_PORT = knexConfig.development.connection.port;
const _POSTGRES_DATABASE = knexConfig.development.connection.database;

if (
    [_POSTGRES_USER, _POSTGRES_PASSWORD, _POSTGRES_IP, _POSTGRES_PORT].includes(
        undefined,
    )
) {
    console.log("Error: Postgres details not defined");
    return;
}

async function initDatabase() {
    const knex = require('knex')(knexConfig);

    await knex.raw('SELECT \'CREATE DATABASE ' + knexConfig.development.connection.database + '\' ' +
        'WHERE NOT EXISTS (SELECT FROM pg_database WHERE datname = ' + knexConfig.development.connection.database + ')');
    try {
        return knex.migrate.latest()
    } catch (error) {
        console.log("An error has occured on startup: " + error);
    }
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
});

async function deleteBulk(table_name, data) {
    const client = await pool.connect();
    let result = "SUCCESS";
    let message = "";
    try {
        await client.query("BEGIN");

        if (data && data.length !== 0) {
            const deleteQuery = {
                text: `DELETE
                       FROM ${table_name}
                       WHERE "Id" IN (${pgp.as.csv(data)})`,
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
    return {Result: result, message: "" + message};
}

async function insertBulk(table_name, data, columns) {
    //dedupe data

    if (Array.isArray(data)) {
        data = data.reduce((accumulator, currentItem) => {
            const isDuplicate = accumulator.some((item) =>
                currentItem.Id
                    ? item.Id === currentItem.Id
                    : item.rowid === currentItem.rowid,
            );

            if (!isDuplicate) {
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
        const update_query = update_query_map.find(
            (query) => query.table === table_name,
        ).query;
        await client.query("COMMIT");
        const cs = new pgp.helpers.ColumnSet(columns, {table: table_name});
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
        return await pool.query(text, params);
    } catch (error) {
        if (error?.routine === "auth_failed") {
            console.log("Error 401: Unable to Authenticate with Postgres DB");
        } else if (error?.code === "ENOTFOUND") {
            console.log("Error: Unable to Connect to Postgres DB");
        } else if (error?.code === "ERR_SOCKET_BAD_PORT") {
            console.log(
                "Error: Invalid Postgres DB Port Range. Port should be >= 0 and < 65536.",
            );
        } else if (error?.code === "ECONNREFUSED") {
            console.log(
                "Error: Postgres DB Connection refused at " +
                error.address +
                ":" +
                error.port,
            );
        } else {
            console.error("Error occurred while executing query:", error);
        }
        return [];
    }
}

module.exports = {
    initDatabase,
    query: query,
    deleteBulk: deleteBulk,
    insertBulk: insertBulk,
};
