// api.js
const express = require('express');
const db = require('./db');

const router = express.Router();

router.get('/test', async (req, res) => {
  console.log(`ENDPOINT CALLED: /test`);
    res.send('Backend Responded Succesfully');
});

router.get('/getconfig', async (req, res) => {
    const { rows } = await db.query('SELECT * FROM app_config where "ID"=1');
    console.log(`ENDPOINT CALLED: /getconfig: `+rows);
    // console.log(`ENDPOINT CALLED: /setconfig: `+rows.length);
    res.send(rows);

  });

  router.post('/setconfig', async (req, res) => {
    const { JF_HOST, JF_API_KEY } = req.body;

    const { rows } = await db.query('UPDATE app_config SET "JF_HOST"=$1, "JF_API_KEY"=$2 where "ID"=1', [JF_HOST, JF_API_KEY]);
      res.send(rows);
    // const { existing } = await db.query('SELECT * FROM app_config where "ID"=1');
    // console.log("Lenght: "+existing.rows[0].length );
    // if(existing != undefined && existing.length != 0)
    // {
    //   console.log("Update Config");
    //   const { rows } = await db.query('UPDATE app_config SET "JF_HOST"=$1, "JF_API_KEY"=$2 where "ID"=1', [JF_HOST, JF_API_KEY]);
    //   res.send(rows);
    // }
    // else{
    //   console.log("Insert Config");
    //   const { rows } = await db.query('INSERT into app_config VALUES ( $1, $2, null, null)', [JF_HOST, JF_API_KEY]);
    //   res.send(rows);
    // }


   
    console.log(`ENDPOINT CALLED: /setconfig: `);
    
  });
module.exports = router;
