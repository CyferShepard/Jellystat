// api.js
const express = require("express");
const axios = require("axios");
const ActivityMonitor=require('./watchdog/ActivityMonitor');
const db = require("./db");

const router = express.Router();

router.get("/test", async (req, res) => {
  console.log(`ENDPOINT CALLED: /test`);
  res.send("Backend Responded Succesfully");
});

router.get("/getconfig", async (req, res) => {
  try{
    const { rows } = await db.query('SELECT "JF_HOST","JF_API_KEY","APP_USER" FROM app_config where "ID"=1');
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

router.post("/getSeasons", async (req, res) => {
  try{
    const { Id } = req.body;

    const { rows } = await db.query(
      `SELECT * FROM jf_library_seasons where "SeriesId"='${Id}'`
    );
    console.log({ Id: Id });
    res.send(rows);
  

  }catch(error)
  {
    console.log(error);
  }

  console.log(`ENDPOINT CALLED: /getSeasons: `);
});

router.post("/getEpisodes", async (req, res) => {
  try{
    const { Id } = req.body;
    const { rows } = await db.query(
      `SELECT * FROM jf_library_episodes where "SeasonId"='${Id}'`
    );
    console.log({ Id: Id });
    res.send(rows);
  

  }catch(error)
  {
    console.log(error);
  }

  console.log(`ENDPOINT CALLED: /getEpisodes: `);
});



router.post("/getItemDetails", async (req, res) => {
  try{

    const { Id } = req.body;


    //

    let query= `SELECT im."Name" "FileName",im.*,i.* FROM jf_library_items i left join jf_item_info im on i."Id" = im."Id" where i."Id"='${Id}'`;
  


    const { rows:items } = await db.query(
      query
    );

    if(items.length===0)
    {
      query=`SELECT im."Name" "FileName",im.*,s.*  FROM jf_library_seasons s left join jf_item_info im on s."Id" = im."Id" where s."Id"='${Id}'`;
      const { rows:seasons } = await db.query(
        query
      );

      if(seasons.length===0)
      {
        query=`SELECT im."Name" "FileName",im.*,e.*  FROM jf_library_episodes e join jf_item_info im on e."EpisodeId" = im."Id" where e."EpisodeId"='${Id}'`;
        const { rows:episodes } = await db.query(
          query
        );
  
        res.send(episodes);
  
      }else{
  
        res.send(seasons);
  
      }
  
    }else{

      res.send(items);

    }



  

  }catch(error)
  {
    console.log(error);
  }

  console.log(`ENDPOINT CALLED: /getLibraryItems: `);
});


router.get("/getHistory", async (req, res) => {
  try{
   

    const { rows } = await db.query(
      `SELECT * FROM jf_all_playback_activity order by "ActivityDateInserted" desc`
    );

    const groupedResults = {};
    rows.forEach(row => {
      if (groupedResults[row.NowPlayingItemId+row.EpisodeId]) {
        groupedResults[row.NowPlayingItemId+row.EpisodeId].results.push(row);
      } else {
        groupedResults[row.NowPlayingItemId+row.EpisodeId] = {
          ...row,
          results: []
        };
      }
    });
    
    res.send(Object.values(groupedResults));
    

  }catch(error)
  {
    console.log(error);
  }

});

router.get("/getAdminUsers", async (req, res) => {
  try {
    const { rows:config } = await db.query('SELECT * FROM app_config where "ID"=1');
    const url = `${config[0].JF_HOST}/Users`;
    const response = await axios.get(url, {
      headers: {
        "X-MediaBrowser-Token": config[0].JF_API_KEY,
      },
    });
    const adminUser = await response.data.filter(
      (user) => user.Policy.IsAdministrator === true
    );
    res.send(adminUser);
  } catch (error) {
    console.log( error);
    res.send(error);
    
  }

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
