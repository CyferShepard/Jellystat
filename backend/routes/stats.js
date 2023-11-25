// api.js
const express = require("express");
const db = require("../db");

const router = express.Router();



router.get("/getLibraryOverview", async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM jf_library_count_view");
    res.send(rows);
  } catch (error) {
    res.status(503);
    res.send(error);
  }
});

router.post("/getMostViewedByType", async (req, res) => {
  try {
    const { days,type } = req.body;

    const valid_types=['Audio','Movie','Series'];

    let _days = days;
    if (days === undefined) {
      _days = 30;
    }

    if(!valid_types.includes(type))
    {
      res.status(503);
      return res.send('Invalid Type Value');
    }
  

    const { rows } = await db.query(
      `select * from fs_most_played_items($1,'${type}') limit 5`, [_days-1]
    );
    res.send(rows);
  } catch (error) {
    res.status(503);
    res.send(error);
  }
});

router.post("/getMostPopularByType", async (req, res) => {
  try {
    const { days,type } = req.body;

    const valid_types=['Audio','Movie','Series'];

    let _days = days;
    if (days === undefined) {
      _days = 30;
    }

    if(!valid_types.includes(type))
    {
      res.status(503);
      return res.send('Invalid Type Value');
    }

    const { rows } = await db.query(
      `select * from fs_most_popular_items($1,$2) limit 5`, [_days-1, type]
    );
    res.send(rows);
  } catch (error) {
    res.status(503);
    res.send(error);
  }
});



router.post("/getMostViewedLibraries", async (req, res) => {
  try {
    const { days } = req.body;
    let _days = days;
    if (days === undefined) {
      _days = 30;
    }
    const { rows } = await db.query(
      `select * from fs_most_viewed_libraries($1)`, [_days-1]
    );
    res.send(rows);
  } catch (error) {
    res.status(503);
    res.send(error);
  }
});

router.post("/getMostUsedClient", async (req, res) => {
  try {
    const { days } = req.body;
    let _days = days;
    if (days === undefined) {
      _days = 30;
    }
    const { rows } = await db.query(
      `select * from fs_most_used_clients($1) limit 5`, [_days-1]
    );
    res.send(rows);
  } catch (error) {
    res.status(503);
    res.send(error);
  }
});

router.post("/getMostActiveUsers", async (req, res) => {
  try {
    const { days } = req.body;
    let _days = days;
    if (days === undefined) {
      _days = 30;
    }
    const { rows } = await db.query(
      `select * from fs_most_active_user($1) limit 5`, [_days-1]
    );
   res.send(rows);
  } catch (error) {
    res.status(503);
    res.send(error);
  }
});


router.get("/getPlaybackActivity", async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM jf_playback_activity");
    res.send(rows);
  } catch (error) {
    res.status(503);
    res.send(error);
  }
});

router.get("/getAllUserActivity", async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM jf_all_user_activity");
    res.send(rows);
  } catch (error) {
    res.send([]);
  }
});


router.post("/getUserLastPlayed", async (req, res) => {
  try {
    const { userid } = req.body;
    const { rows } = await db.query(
      `select * from fs_last_user_activity($1) limit 15`, [userid]
    );
    res.send(rows);
  } catch (error) {
    console.log(error);
    res.status(503);
    res.send(error);
  }
});

//Global Stats
router.post("/getGlobalUserStats", async (req, res) => {
  try {
    const { hours,userid } = req.body;
    let _hours = hours;
    if (hours === undefined) {
      _hours = 24;
    }
    const { rows } = await db.query(
      `select * from fs_user_stats($1,$2)`, [_hours, userid]
    );
    res.send(rows[0]);
  } catch (error) {
    console.log(error);
    res.status(503);
    res.send(error);
  }
});

router.post("/getGlobalItemStats", async (req, res) => {
  try {
    const { hours,itemid } = req.body;
    let _hours = hours;
    if (hours === undefined) {
      _hours = 24;
    }
    const { rows } = await db.query(
      `select count(*)"Plays",
      sum("PlaybackDuration") total_playback_duration
      from jf_playback_activity jf_playback_activity
      where 
      ("EpisodeId"=$1 OR "SeasonId"=$1 OR "NowPlayingItemId"=$1)
      AND jf_playback_activity."ActivityDateInserted" BETWEEN CURRENT_DATE - INTERVAL '1 hour' * $2 AND NOW();`, [itemid, _hours]
    );
    res.send(rows[0]);
  } catch (error) {
    console.log(error);
    res.status(503);
    res.send(error);
  }
});

router.post("/getGlobalLibraryStats", async (req, res) => {
  try {
    const { hours,libraryid } = req.body;
    let _hours = hours;
    if (hours === undefined) {
      _hours = 24;
    }
    const { rows } = await db.query(
      `select * from fs_library_stats($1,$2)`, [_hours, libraryid]
    );
    res.send(rows[0]);
  } catch (error) {
    console.log(error);
    res.status(503);
    res.send(error);
  }
});




router.get("/getLibraryCardStats", async (req, res) => {
  try {
    const { rows } = await db.query("select * from js_library_stats_overview");
    res.send(rows);
  } catch (error) {
    res.status(503);
    res.send(error);
  }
});

router.get("/getLibraryMetadata", async (req, res) => {
  try {
    const { rows } = await db.query("select * from js_library_metadata");
    res.send(rows);
  } catch (error) {
    res.status(503);
    res.send(error);
  }
});

router.post("/getLibraryItemsWithStats", async (req, res) => {
  try{
    const  {libraryid}  = req.body;
    const { rows } = await db.query(
      `SELECT * FROM jf_library_items_with_playcount_playtime where "ParentId"=$1`, [libraryid]
    );
    res.send(rows);
  

  }catch(error)
  {
    console.log(error);
  }

 
});


router.post("/getLibraryLastPlayed", async (req, res) => {
  try {
    const { libraryid } = req.body;
    const { rows } = await db.query(
      `select * from fs_last_library_activity($1) limit 15`, [libraryid]
    );
    res.send(rows);
  } catch (error) {
    console.log(error);
    res.status(503);
    res.send(error);
  }
});


router.post("/getViewsOverTime", async (req, res) => {
  try {
    const { days } = req.body;
    let _days = days;
    if (days=== undefined) {
      _days = 30;
    }
    const { rows:stats } = await db.query(
      `select * from fs_watch_stats_over_time($1)`, [_days]
    );

    const { rows:libraries } = await db.query(
      `select distinct "Id","Name" from jf_libraries`
    );

    
const reorganizedData = {};

stats.forEach((item) => {
  const library = item.Library;
  const count = item.Count;
  const date = new Date(item.Date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'short',
    day: '2-digit'
  });


  if (!reorganizedData[date]) {
    reorganizedData[date] = {
      Key:date
    };
  }
  
  reorganizedData[date]= { ...reorganizedData[date], [library]: count};
});
const finalData = {libraries:libraries,stats:Object.values(reorganizedData)};
    res.send(finalData);
  } catch (error) {
    console.log(error);
    res.status(503);
    res.send(error);
  }
});

router.post("/getViewsByDays", async (req, res) => {
  try {
    const { days } = req.body;
    let _days = days;
    if (days=== undefined) {
      _days = 30;
    }
    const { rows:stats } = await db.query(
      `select * from fs_watch_stats_popular_days_of_week($1)`, [_days]
    );

    const { rows:libraries } = await db.query(
      `select distinct "Id","Name" from jf_libraries`
    );

    
const reorganizedData = {};

stats.forEach((item) => {
  const library = item.Library;
  const count = item.Count;
  const day = item.Day;


  if (!reorganizedData[day]) {
    reorganizedData[day] = {
      Key:day
    };
  }
  
  reorganizedData[day]= { ...reorganizedData[day], [library]: count};
});
const finalData = {libraries:libraries,stats:Object.values(reorganizedData)};
    res.send(finalData);
  } catch (error) {
    console.log(error);
    res.status(503);
    res.send(error);
  }
});

router.post("/getViewsByHour", async (req, res) => {
  try {
    const { days } = req.body;
    let _days = days;
    if (days=== undefined) {
      _days = 30;
    }
    const { rows:stats } = await db.query(
      `select * from fs_watch_stats_popular_hour_of_day($1)`, [_days]
    );

    const { rows:libraries } = await db.query(
      `select distinct "Id","Name" from jf_libraries`
    );

    
const reorganizedData = {};

stats.forEach((item) => {
  const library = item.Library;
  const count = item.Count;
  const hour = item.Hour;


  if (!reorganizedData[hour]) {
    reorganizedData[hour] = {
      Key:hour
    };
  }
  
  reorganizedData[hour]= { ...reorganizedData[hour], [library]: count};
});
const finalData = {libraries:libraries,stats:Object.values(reorganizedData)};
    res.send(finalData);
  } catch (error) {
    console.log(error);
    res.status(503);
    res.send(error);
  }
});




module.exports = router;
