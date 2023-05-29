// api.js
const express = require("express");
const axios = require("axios");
const ActivityMonitor=require('./tasks/ActivityMonitor');
const db = require("./db");
const https = require('https');
const { checkForUpdates } = require('./version-control');

const agent = new https.Agent({
  rejectUnauthorized: (process.env.REJECT_SELF_SIGNED_CERTIFICATES || 'true').toLowerCase() ==='true'
});



const axios_instance = axios.create({
  httpsAgent: agent
});

const router = express.Router();

router.get("/test", async (req, res) => {
  console.log(`ENDPOINT CALLED: /test`);
  res.send("Backend Responded Succesfully");
});

router.get("/getconfig", async (req, res) => {
  try{
    const { rows } = await db.query('SELECT "JF_HOST","JF_API_KEY","APP_USER","REQUIRE_LOGIN" FROM app_config where "ID"=1');
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

router.post("/setRequireLogin", async (req, res) => {
  try{
    const { REQUIRE_LOGIN } = req.body;

    if(REQUIRE_LOGIN===undefined)
    {
      res.status(503);
      res.send(rows);
    }
  
    let query='UPDATE app_config SET "REQUIRE_LOGIN"=$1 where "ID"=1';

    console.log(`ENDPOINT CALLED: /setRequireLogin: `+REQUIRE_LOGIN);
  
    const { rows } = await db.query(
      query,
      [REQUIRE_LOGIN]
    );
    res.send(rows);
  }catch(error)
  {
    console.log(error);
  }
  

});

router.get("/CheckForUpdates", async (req, res) => {
  try{

    let result=await checkForUpdates();
    res.send(result);

  }catch(error)
  {
    console.log(error);
  }

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
    const  {libraryid}  = req.body;
    console.log(`ENDPOINT CALLED: /getLibraryItems: `+libraryid);
    const { rows } = await db.query(
      `SELECT * FROM jf_library_items where "ParentId"='${libraryid}'`
    );
    res.send(rows);
  

  }catch(error)
  {
    console.log(error);
  }

 
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
  
          if(episodes.length!==0)
          {
            res.send(episodes);
          }else
          {
            res.status(404).send('Item not found');
          }

  
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
      `SELECT * FROM jf_playback_activity order by "ActivityDateInserted" desc`
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
        groupedResults[row.NowPlayingItemId+row.EpisodeId].results.push(row);
      }
    });

        // Update GroupedResults with playbackDurationSum
        Object.values(groupedResults).forEach(row => {
          if (row.results && row.results.length > 0) {
            row.PlaybackDuration = row.results.reduce((acc, item) => acc + parseInt(item.PlaybackDuration), 0);
          }
        });
        
    
    res.send(Object.values(groupedResults));
    

  }catch(error)
  {
    console.log(error);
  }

});

router.post("/getLibraryHistory", async (req, res) => {
  try {
    const { libraryid } = req.body;
    const { rows } = await db.query(
      `select a.* from jf_playback_activity a join jf_library_items i on i."Id"=a."NowPlayingItemId"  where i."ParentId"='${libraryid}' order by "ActivityDateInserted" desc`
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
        groupedResults[row.NowPlayingItemId+row.EpisodeId].results.push(row);
      }
    });
    
    res.send(Object.values(groupedResults));
  } catch (error) {
    console.log(error);
    res.status(503);
    res.send(error);
  }
});


router.post("/getItemHistory", async (req, res) => {
  try {
    const { itemid } = req.body;

    const { rows } = await db.query(
      `select jf_playback_activity.*
      from jf_playback_activity jf_playback_activity
      where 
      ("EpisodeId"='${itemid}' OR "SeasonId"='${itemid}' OR "NowPlayingItemId"='${itemid}');`
    );
    
  

    const groupedResults = rows.map(item => ({
      ...item,
      results: []
    }));
    

    
    res.send(groupedResults);
  } catch (error) {
    console.log(error);
    res.status(503);
    res.send(error);
  }
});

router.post("/getUserHistory", async (req, res) => {
  try {
    const { userid } = req.body;

    const { rows } = await db.query(
      `select jf_playback_activity.*
      from jf_playback_activity jf_playback_activity
      where "UserId"='${userid}';`
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
        groupedResults[row.NowPlayingItemId+row.EpisodeId].results.push(row);
      }
    });
    
    res.send(Object.values(groupedResults));
  } catch (error) {
    console.log(error);
    res.status(503);
    res.send(error);
  }
});




router.get("/getAdminUsers", async (req, res) => {
  try {
    const { rows:config } = await db.query('SELECT * FROM app_config where "ID"=1');
    const url = `${config[0].JF_HOST}/Users`;
    const response = await axios_instance.get(url, {
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
    res.status(503);
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

router.get("/getSessions", async (req, res) => {
  try {

   
    const { rows: config } = await db.query('SELECT * FROM app_config where "ID"=1');

    if (config.length===0 || config[0].JF_HOST === null || config[0].JF_API_KEY === null) {
      res.status(503);
      res.send({ error: "Config Details Not Found" });
      return;
    }

   

    let url=`${config[0].JF_HOST}/sessions`;
    
    const response_data = await axios_instance.get(url, {
      headers: {
        "X-MediaBrowser-Token":  config[0].JF_API_KEY ,
      },
    });
    res.send(response_data.data);
  } catch (error) {
    res.status(503);
    res.send(error);
  }
});

router.post("/validateSettings", async (req, res) => {
    const { url,apikey } = req.body;
  
    let isValid = false;
    let errorMessage = "";
    try
    {
      await axios_instance
      .get(url + "/system/configuration", {
        headers: {
          "X-MediaBrowser-Token": apikey,
        },
      })
      .then((response) => {
        if (response.status === 200) {
          isValid = true;
        }
      })
      .catch((error) => {
        if (error.code === "ERR_NETWORK") {
          isValid = false;
          errorMessage = `Error : Unable to connect to Jellyfin Server`;
        } else if (error.code === "ECONNREFUSED") {
          isValid = false;
          errorMessage = `Error : Unable to connect to Jellyfin Server`;
        }
        else if (error.response && error.response.status === 401) {
          isValid = false;
          errorMessage = `Error: ${error.response.status} Not Authorized. Please check API key`;
        } else if (error.response && error.response.status === 404) {
          isValid = false;
          errorMessage = `Error ${error.response.status}: The requested URL was not found.`;
        } else {
          isValid = false;
          errorMessage =  `${error}`;
        }
      });

    }catch(error)
    {
      isValid = false;
      errorMessage = `Error: ${error}`;
    }
   

    res.send({isValid:isValid,errorMessage:errorMessage });


});

router.post("/updatePassword", async (req, res) => {
  const { current_password,new_password } = req.body;

  let result={isValid:true,errorMessage:""};


  try{
    const { rows } = await db.query(`SELECT "JF_HOST","JF_API_KEY","APP_USER" FROM app_config where "ID"=1 AND "APP_PASSWORD"='${current_password}' `);
    
    if(rows && rows.length>0)
    {
      if(current_password===new_password)
      {
        result.isValid=false;
        result.errorMessage = "New Password cannot be the same as Old Password";
      }else{
  
        await db.query(`UPDATE app_config SET "APP_PASSWORD"='${new_password}' where "ID"=1 AND "APP_PASSWORD"='${current_password}' `);
       
    
      }

    }else{
      result.isValid=false;
      result.errorMessage = "Old Password is Invalid";
    }

  }catch(error)
  {
    console.log(error);
    result.errorMessage = error;
  }
  
 

  res.send(result);


});







module.exports = router;
