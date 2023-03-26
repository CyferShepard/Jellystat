// api.js
const express = require("express");
const ActivityMonitor=require('./watchdog/ActivityMonitor');
const db = require("./db");

const router = express.Router();

router.get("/test", async (req, res) => {
  console.log(`ENDPOINT CALLED: /test`);
  res.send("Backend Responded Succesfully");
});

router.get("/getconfig", async (req, res) => {
  try{
    const { rows } = await db.query('SELECT * FROM app_config where "ID"=1');
    res.send(rows);

  }catch(error)
  {
    console.log(error);
  }

});

router.post("/setconfig", async (req, res) => {
  try{
    const { JF_HOST, JF_API_KEY } = req.body;

    const { rows:getConfig } = await db.query('SELECT * FROM app_config where "ID"=1');
  
    let query='UPDATE app_config SET "JF_HOST"=$1, "JF_API_KEY"=$2 where "ID"=1';
    if(getConfig.length===0)
    {
      query='INSERT INTO app_config ("JF_HOST","JF_API_KEY","APP_USER","APP_PASSWORD") VALUES ($1,$2,null,null)';
    }
  
  
    const { rows } = await db.query(
      query,
      [JF_HOST, JF_API_KEY]
    );
    res.send(rows);
  }catch(error)
  {
    console.log(error);
  }
  

  console.log(`ENDPOINT CALLED: /setconfig: `);
});

// router.get("/getAllFromJellyfin", async (req, res) => {
//   const sync = require("./sync");
//   const { rows } = await db.query('SELECT * FROM app_config where "ID"=1');
//   if (rows[0].JF_HOST === null || rows[0].JF_API_KEY === null) {
//     res.send({ error: "Config Details Not Found" });
//     return;
//   }

//   const _sync = new sync(rows[0].JF_HOST, rows[0].JF_API_KEY);
//   const results = await _sync.getAllItems();

//   res.send(results);

//   // console.log(`ENDPOINT CALLED: /getAllFromJellyfin: `);
// });

router.get("/getLibraries", async (req, res) => {
  try{
    const { rows } = await db.query(
      `SELECT * FROM jf_libraries`
    );
    res.send(rows);
  

  }catch(error)
  {
    console.log(error);
  }

});


router.post("/getLibraryItems", async (req, res) => {
  try{
    const  Id  = req.headers['id'];

    const { rows } = await db.query(
      `SELECT * FROM jf_library_items where "ParentId"='${Id}'`
    );
    console.log({ Id: Id });
    res.send(rows);
  

  }catch(error)
  {
    console.log(error);
  }

  console.log(`ENDPOINT CALLED: /getLibraryItems: `);
});

router.get("/runWatchdog", async (req, res) => {
  let message='Watchdog Started';
  if(!process.env.WatchdogRunning )
  {
    ActivityMonitor.startWatchdog(1000);
    console.log(message);
    res.send(message);
  }else{
    message=`Watchdog Already Running`;
    console.log(message);
    res.send(message);
  }
});

module.exports = router;
