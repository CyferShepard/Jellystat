// api.js
const express = require("express");

const db = require("../db");
const pgp = require('pg-promise')();
const { randomUUID }  = require('crypto');

const {axios} = require("../classes/axios");
const configClass = require("../classes/config");
const { checkForUpdates } = require("../version-control");
const JellyfinAPI = require('../classes/jellyfin-api');
const { sendUpdate } = require("../ws");



const router = express.Router();
const Jellyfin=new JellyfinAPI();



router.get("/getconfig", async (req, res) => {
  try {
    const config = await new configClass().getConfig();

    const payload={
      JF_HOST:config.JF_HOST , 
      APP_USER:config.APP_USER , 
      settings:config.settings ,
      REQUIRE_LOGIN:config.REQUIRE_LOGIN,
    };


    res.send(payload);
  } catch (error) {
    console.log(error);
  }
});

router.post("/setconfig", async (req, res) => {
  try {
    const { JF_HOST, JF_API_KEY } = req.body;

    const { rows: getConfig } = await db.query(
      'SELECT * FROM app_config where "ID"=1'
    );

    let query =
      'UPDATE app_config SET "JF_HOST"=$1, "JF_API_KEY"=$2 where "ID"=1';
    if (getConfig.length === 0) {
      query =
        'INSERT INTO app_config ("JF_HOST","JF_API_KEY","APP_USER","APP_PASSWORD") VALUES ($1,$2,null,null)';
    }

    const { rows } = await db.query(query, [JF_HOST, JF_API_KEY]);
    res.send(rows);
  } catch (error) {
    console.log(error);
  }

});
router.post("/setPreferredAdmin", async (req, res) => {
  try {
    const { userid, username } = req.body;

    const settingsjson = await db
      .query('SELECT settings FROM app_config where "ID"=1')
      .then((res) => res.rows);

    if (settingsjson.length > 0) {
      const settings = settingsjson[0].settings || {};

      settings.preferred_admin = {userid:userid,username:username};

      let query = 'UPDATE app_config SET settings=$1 where "ID"=1';

      await db.query(query, [settings]);

      res.send("Settings updated succesfully");
    }else
    {
      res.status(404)
      res.send("Settings not found");
    }

  } catch (error) {
    console.log(error);
  }

  console.log(`ENDPOINT CALLED: /setconfig: `);
});

router.post("/setRequireLogin", async (req, res) => {
  try {
    const { REQUIRE_LOGIN } = req.body;

    if (REQUIRE_LOGIN === undefined) {
      res.status(503);
      res.send(rows);
    }

    let query = 'UPDATE app_config SET "REQUIRE_LOGIN"=$1 where "ID"=1';

    console.log(`ENDPOINT CALLED: /setRequireLogin: ` + REQUIRE_LOGIN);

    const { rows } = await db.query(query, [REQUIRE_LOGIN]);
    res.send(rows);
  } catch (error) {
    console.log(error);
  }
});

router.post("/updatePassword", async (req, res) => {
  const { current_password, new_password } = req.body;

  let result = { isValid: true, errorMessage: "" };

  try {
    const { rows } = await db.query(
      `SELECT "JF_HOST","JF_API_KEY","APP_USER" FROM app_config where "ID"=1 AND "APP_PASSWORD"='${current_password}' `
    );

    if (rows && rows.length > 0) {
      if (current_password === new_password) {
        result.isValid = false;
        result.errorMessage = "New Password cannot be the same as Old Password";
      } else {
        await db.query(
          `UPDATE app_config SET "APP_PASSWORD"='${new_password}' where "ID"=1 AND "APP_PASSWORD"='${current_password}' `
        );
      }
    } else {
      result.isValid = false;
      result.errorMessage = "Old Password is Invalid";
    }
  } catch (error) {
    console.log(error);
    result.errorMessage = error;
  }

  res.send(result);
});

router.get("/TrackedLibraries", async (req, res) => {
  const config=await new configClass().getConfig();

  if (config.error) {
    res.send({ error: config.error});
    return;
  }

  try
  {
    const libraries=await Jellyfin.getLibraries();



      const ExcludedLibraries = config.settings?.ExcludedLibraries || [];

      const librariesWithTrackedStatus = libraries.map((items) => ({
        ...items,
        ...{ Tracked: !ExcludedLibraries.includes(items.Id) },
      }));
      res.send(librariesWithTrackedStatus);

  }catch(error)
  {
      res.status(503);
      res.send({ error: "Error: "+error });
  }

});

router.post("/setExcludedLibraries", async (req, res) => {
  const { libraryID } = req.body;

  const settingsjson = await db
    .query('SELECT settings FROM app_config where "ID"=1')
    .then((res) => res.rows);

  if (settingsjson.length > 0) {
    const settings = settingsjson[0].settings || {};

    let libraries = settings.ExcludedLibraries || [];
    if (libraries.includes(libraryID)) {
      libraries = libraries.filter((item) => item !== libraryID);
    } else {
      libraries.push(libraryID);
    }
    settings.ExcludedLibraries = libraries;

    let query = 'UPDATE app_config SET settings=$1 where "ID"=1';

    await db.query(query, [settings]);

    res.send("Settings updated succesfully");
  }else
  {
    res.status(404)
    res.send("Settings not found");
  }

});

router.get("/keys", async (req,res) => {
  const config=await new configClass().getConfig();

    res.send(config.api_keys||[]);

});

router.delete("/keys", async (req,res) => {
   const { key } = req.body;
   const config=await new configClass().getConfig();

  if(!key)
  {
    res.status(400);
    res.send({ error: "No API key provided to remove" });
    return;
  }



    const keys = config.api_keys || [];
    const keyExists = keys.some(obj => obj.key === key);
    if(keyExists)
    {
      const new_keys_array=keys.filter(obj => obj.key !== key);
      let query = 'UPDATE app_config SET api_keys=$1 where "ID"=1';

      await db.query(query, [JSON.stringify(new_keys_array)]);
      return res.send('Key removed: '+key);

    }else
    {
      res.status(404);
      return res.send('API key does not exist');
    }


});

router.post("/keys", async (req, res) => {
  const { name } = req.body;
  const config=await new configClass().getConfig();

  if(!name)
  {
    res.status(400);
    res.send({ error: "A Name is required to generate a key" });
    return;
  }


  let keys=config.api_keys||[];

  const uuid = randomUUID()
  const new_key={name:name, key:uuid};

  keys.push(new_key);

  let query = 'UPDATE app_config SET api_keys=$1 where "ID"=1';

  await db.query(query, [JSON.stringify(keys)]);
  res.send(keys);

});

router.get("/getTaskSettings", async (req, res) => {


  try
  {
    const settingsjson = await db
    .query('SELECT settings FROM app_config where "ID"=1')
    .then((res) => res.rows);

    if (settingsjson.length > 0) {
      const settings = settingsjson[0].settings || {};

      let tasksettings = settings.Tasks || {};
      res.send(tasksettings);

    }else {
      res.status(404);
      res.send({ error: "Task Settings Not Found" });
    }


  }catch(error)
  {
      res.status(503);
      res.send({ error: "Error: "+error });
  }

});

router.post("/setTaskSettings", async (req, res) => {
  const { taskname,Interval } = req.body;

  try
  {
    const settingsjson = await db
    .query('SELECT settings FROM app_config where "ID"=1')
    .then((res) => res.rows);

    if (settingsjson.length > 0) {
      const settings = settingsjson[0].settings || {};
      if(!settings.Tasks)
      {
        settings.Tasks = {};
      }

      let tasksettings = settings.Tasks;
      if(!tasksettings[taskname])
      {
        tasksettings[taskname]={};
      }
      tasksettings[taskname].Interval=Interval;

      settings.Tasks=tasksettings;

      let query = 'UPDATE app_config SET settings=$1 where "ID"=1';

      await db.query(query, [settings]);
      res.status(200);
      res.send(tasksettings);

    }else {
      res.status(404);
      res.send({ error: "Task Settings Not Found" });
    }


  }catch(error)
  {
      res.status(503);
      res.send({ error: "Error: "+error });
  }



});


//Jellystat functions
router.get("/CheckForUpdates", async (req, res) => {
  try {
    let result = await checkForUpdates();
    res.send(result);
  } catch (error) {
    console.log(error);
  }
});

//DB Queries
router.post("/getUserDetails", async (req, res) => {
  try {
    const { userid } = req.body;
    const { rows } = await db.query(
      `select * from jf_users where "Id"='${userid}'`
    );
    res.send(rows[0]);
  } catch (error) {
    console.log(error);
    res.status(503);
    res.send(error);
  }
});

router.get("/getLibraries", async (req, res) => {
  try {
    const { rows } = await db.query(`SELECT * FROM jf_libraries`);
    res.send(rows);
  } catch (error) {
    console.log(error);
  }
});

router.post("/getLibrary", async (req, res) => {
  try {
    const { libraryid } = req.body;
    const { rows } = await db.query(
      `select * from jf_libraries where "Id"='${libraryid}'`
    );
    res.send(rows[0]);
  } catch (error) {
    console.log(error);
    res.status(503);
    res.send(error);
  }
});


router.post("/getLibraryItems", async (req, res) => {
  try {
    const { libraryid } = req.body;
    const { rows } = await db.query(
      `SELECT * FROM jf_library_items where "ParentId"=$1`, [libraryid]
    );
    res.send(rows);
  } catch (error) {
    console.log(error);
  }
});

router.post("/getSeasons", async (req, res) => {
  try {
    const { Id } = req.body;

    const { rows } = await db.query(
      `SELECT s.*,i.archived, i."PrimaryImageHash" FROM jf_library_seasons s left join jf_library_items i on i."Id"=s."SeriesId" where "SeriesId"=$1`, [Id]
    );
    res.send(rows);
  } catch (error) {
    console.log(error);
  }

});

router.post("/getEpisodes", async (req, res) => {
  try {
    const { Id } = req.body;
    const { rows } = await db.query(
      `SELECT e.*,i.archived, i."PrimaryImageHash" FROM jf_library_episodes e left join jf_library_items i on i."Id"=e."SeriesId" where "SeasonId"=$1`, [Id]
    );
    res.send(rows);
  } catch (error) {
    console.log(error);
  }
});

router.post("/getItemDetails", async (req, res) => {
  try {
    const { Id } = req.body;
    let query = `SELECT im."Name" "FileName",im.*,i.* FROM jf_library_items i left join jf_item_info im on i."Id" = im."Id" where i."Id"=$1`;

    const { rows: items } = await db.query(query, [Id]);

    if (items.length === 0) {
      query = `SELECT im."Name" "FileName",im.*,s.*, i.archived, i."PrimaryImageHash"  FROM jf_library_seasons s left join jf_item_info im on s."Id" = im."Id" left join jf_library_items i on i."Id"=s."SeriesId"  where s."Id"=$1`;
      const { rows: seasons } = await db.query(query, [Id]);

      if (seasons.length === 0) {
        query = `SELECT im."Name" "FileName",im.*,e.*, i.archived , i."PrimaryImageHash"  FROM jf_library_episodes e join jf_item_info im on e."EpisodeId" = im."Id" left join jf_library_items i on i."Id"=e."SeriesId" where e."EpisodeId"=$1`;
        const { rows: episodes } = await db.query(query, [Id]);

        if (episodes.length !== 0) {
          res.send(episodes);
        } else {
          res.status(404).send("Item not found");
        }
      } else {
        res.send(seasons);
      }
    } else {
      res.send(items);
    }
  } catch (error) {
    console.log(error);
  }


});

router.delete("/item/purge", async (req, res) => {
  try {
    const { id, withActivity } = req.body;

    const { rows: episodes } = await db.query(`select * from jf_library_episodes where "SeriesId"=$1`, [id]);
    if(episodes.length>0)
    {
      await db.query(`delete from jf_library_episodes where "SeriesId"=$1`, [id]);
    }

    const { rows: seasons } = await db.query(`select * from jf_library_seasons where "SeriesId"=$1`, [id]);
    if(seasons.length>0)
    {
      await db.query(`delete from jf_library_seasons where "SeriesId"=$1`, [id]);
    }

    await db.query(`delete from jf_library_items where "Id"=$1`, [id]);

    if(withActivity)
    {

      const deleteQuery = {
        text: `DELETE FROM jf_playback_activity WHERE${episodes.length>0 ? ` "EpisodeId" IN (${pgp.as.csv(episodes.map((item)=>item.EpisodeId))})  OR`:"" }${seasons.length>0 ? ` "SeasonId" IN (${pgp.as.csv(seasons.map((item)=>item.SeasonId))}) OR` :""} "NowPlayingItemId"='${id}'`,
      };
      await db.query(deleteQuery);
    }

    sendUpdate("GeneralAlert",{type:"Success",message:`Item ${withActivity ? "with Playback Activity":""} has been Purged`});
    res.send("Item purged succesfully");



  } catch (error) {
    console.log(error);
    sendUpdate("GeneralAlert",{type:"Error",message:`There was an error Purging the Data`});

    res.status(503);
    res.send(error);
  }


});

//DB Queries - History
router.get("/getHistory", async (req, res) => {
  try {
    const { rows } = await db.query(
      `SELECT * FROM jf_playback_activity order by "ActivityDateInserted" desc`
    );

    const groupedResults = {};
    rows.forEach((row) => {
      if (groupedResults[row.NowPlayingItemId + row.EpisodeId]) {
        groupedResults[row.NowPlayingItemId + row.EpisodeId].results.push(row);
      } else {
        groupedResults[row.NowPlayingItemId + row.EpisodeId] = {
          ...row,
          results: [],
        };
        groupedResults[row.NowPlayingItemId + row.EpisodeId].results.push(row);
      }
    });

    // Update GroupedResults with playbackDurationSum
    Object.values(groupedResults).forEach((row) => {
      if (row.results && row.results.length > 0) {
        row.PlaybackDuration = row.results.reduce(
          (acc, item) => acc + parseInt(item.PlaybackDuration),
          0
        );
      }
    });

    res.send(Object.values(groupedResults));
  } catch (error) {
    console.log(error);
  }
});

router.post("/getLibraryHistory", async (req, res) => {
  try {
    const { libraryid } = req.body;
    const { rows } = await db.query(
      `select a.* from jf_playback_activity a join jf_library_items i on i."Id"=a."NowPlayingItemId"  where i."ParentId"=$1 order by "ActivityDateInserted" desc`, [libraryid]
    );
    const groupedResults = {};
    rows.forEach((row) => {
      if (groupedResults[row.NowPlayingItemId + row.EpisodeId]) {
        groupedResults[row.NowPlayingItemId + row.EpisodeId].results.push(row);
      } else {
        groupedResults[row.NowPlayingItemId + row.EpisodeId] = {
          ...row,
          results: [],
        };
        groupedResults[row.NowPlayingItemId + row.EpisodeId].results.push(row);
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
      ("EpisodeId"=$1 OR "SeasonId"=$1 OR "NowPlayingItemId"=$1);`, [itemid]
    );

    const groupedResults = rows.map((item) => ({
      ...item,
      results: [],
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
      where "UserId"=$1;`, [userid]
    );

    const groupedResults = {};
    rows.forEach((row) => {
      if (groupedResults[row.NowPlayingItemId + row.EpisodeId]) {
        groupedResults[row.NowPlayingItemId + row.EpisodeId].results.push(row);
      } else {
        groupedResults[row.NowPlayingItemId + row.EpisodeId] = {
          ...row,
          results: [],
        };
        groupedResults[row.NowPlayingItemId + row.EpisodeId].results.push(row);
      }
    });

    res.send(Object.values(groupedResults));
  } catch (error) {
    console.log(error);
    res.status(503);
    res.send(error);
  }
});


//Jellyfin related functions

router.post("/validateSettings", async (req, res) => {
  const { url, apikey } = req.body;

  let isValid = false;
  let errorMessage = "";
  try {
    await axios
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
        } else if (error.response && error.response.status === 401) {
          isValid = false;
          errorMessage = `Error: ${error.response.status} Not Authorized. Please check API key`;
        } else if (error.response && error.response.status === 404) {
          isValid = false;
          errorMessage = `Error ${error.response.status}: The requested URL was not found.`;
        } else {
          isValid = false;
          errorMessage = `${error}`;
        }
      });
  } catch (error) {
    isValid = false;
    errorMessage = `Error: ${error}`;

  }

  console.log({ isValid: isValid, errorMessage: errorMessage });

  res.send({ isValid: isValid, errorMessage: errorMessage });
});




module.exports = router;
