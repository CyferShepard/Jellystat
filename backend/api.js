// api.js
const express = require('express');
const db = require('./db');

const router = express.Router();

router.get('/test', async (req, res) => {
  console.log(`ENDPOINT CALLED: /test`);
    res.send('Backend Responded Succesfully');
});

router.get('/getconfig', async (req, res) => {
    const { rows } = await db.query('SELECT * FROM app_config');
    console.log(`ENDPOINT CALLED: /getconfig: `+rows);
    res.send(rows);
  });

  router.post('/setconfig', async (req, res) => {
    const { JF_HOST, JF_API_KEY } = req.body;

    console.log(req.body);
    const { rows } = await db.query('UPDATE app_config SET "JF_HOST"=$1, "JF_API_KEY"=$2', [JF_HOST, JF_API_KEY]);
    console.log(`ENDPOINT CALLED: /setconfig: `+rows);
    res.send(rows);
  });
module.exports = router;
