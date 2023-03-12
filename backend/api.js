// api.js
const express = require("express");
// const pgp = require("pg-promise")();
const db = require("./db");

const router = express.Router();

router.get("/test", async (req, res) => {
  console.log(`ENDPOINT CALLED: /test`);
  res.send("Backend Responded Succesfully");
});

router.get("/getconfig", async (req, res) => {
  const { rows } = await db.query('SELECT * FROM app_config where "ID"=1');
  console.log(`ENDPOINT CALLED: /getconfig: ` + rows);
  // console.log(`ENDPOINT CALLED: /setconfig: `+rows.length);
  res.send(rows);
});

router.post("/setconfig", async (req, res) => {
  const { JF_HOST, JF_API_KEY } = req.body;

  const { rows } = await db.query(
    'UPDATE app_config SET "JF_HOST"=$1, "JF_API_KEY"=$2 where "ID"=1',
    [JF_HOST, JF_API_KEY]
  );
  console.log({ JF_HOST: JF_HOST, JF_API_KEY: JF_API_KEY });
  res.send(rows);

  console.log(`ENDPOINT CALLED: /setconfig: `);
});

router.get("/getAllFromJellyfin", async (req, res) => {
  const sync = require("./sync");
  const { rows } = await db.query('SELECT * FROM app_config where "ID"=1');
  if (rows[0].JF_HOST === null || rows[0].JF_API_KEY === null) {
    res.send({ error: "Config Details Not Found" });
    return;
  }

  const _sync = new sync(rows[0].JF_HOST, rows[0].JF_API_KEY);
  const results = await _sync.getAllItems();

  res.send(results);

  console.log(`ENDPOINT CALLED: /getAllFromJellyfin: `);
});

module.exports = router;
