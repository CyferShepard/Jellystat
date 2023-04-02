// api.js
const express = require("express");
const db = require("./db");

const router = express.Router();

router.get("/test", async (req, res) => {
  console.log(`ENDPOINT CALLED: /test`);
  res.send("Backend Responded Succesfully");
});

router.get("/getLibraryOverview", async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM jf_library_count_view");
    res.send(rows);
  } catch (error) {
    res.send(error);
  }
});

router.post("/getMostViewedSeries", async (req, res) => {
  try {
    const { days } = req.body;
    let _days = days;
    if (days === undefined) {
      _days = 30;
    }
    const { rows } = await db.query(
      `select * from fs_most_played_items(${_days-1},'Series') limit 5`
    );
    res.send(rows);
  } catch (error) {
    res.send(error);
  }
});

router.post("/getMostViewedMovies", async (req, res) => {
  try {
    const { days } = req.body;
    let _days = days;
    if (days === undefined) {
      _days = 30;
    }
    const { rows } = await db.query(
      `select * from fs_most_played_items(${_days-1},'Movie') limit 5`
    );
    res.send(rows);
  } catch (error) {
    console.log('/getMostViewedMovies');
    console.log(error);
    res.send(error);
  }
});

router.post("/getMostViewedMusic", async (req, res) => {
  try {
    const { days } = req.body;
    let _days = days;
    if (days === undefined) {
      _days = 30;
    }
    const { rows } = await db.query(
      `select * from fs_most_played_items(${_days-1},'Audio') limit 5`
    );
    res.send(rows);
  } catch (error) {
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
      `select * from fs_most_viewed_libraries(${_days-1})`
    );
    res.send(rows);
  } catch (error) {
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
      `select * from fs_most_used_clients(${_days-1}) limit 5`
    );
    res.send(rows);
  } catch (error) {
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
      `select * from fs_most_active_user(${_days-1}) limit 5`
    );
    res.send(rows);
  } catch (error) {
    res.send(error);
  }
});

router.post("/getMostPopularMovies", async (req, res) => {
  try {
    const { days } = req.body;
    let _days = days;
    if (days === undefined) {
      _days = 30;
    }
    const { rows } = await db.query(
      `select * from fs_most_popular_items(${_days-1},'Movie') limit 5`
    );
    res.send(rows);
  } catch (error) {
    res.send(error);
  }
});

router.post("/getMostPopularSeries", async (req, res) => {
  try {
    const { days } = req.body;
    let _days = days;
    if (days === undefined) {
      _days = 30;
    }
    const { rows } = await db.query(
      `select * from fs_most_popular_items(${_days-1},'Series') limit 5`
    );
    res.send(rows);
  } catch (error) {
    res.send(error);
  }
});

router.post("/getMostPopularMusic", async (req, res) => {
  try {
    const { days } = req.body;
    let _days = days;
    if (days === undefined) {
      _days = 30;
    }
    const { rows } = await db.query(
      `select * from fs_most_popular_items(${_days-1},'Audio') limit 5`
    );
    res.send(rows);
  } catch (error) {
    res.send(error);
  }
});

router.get("/getPlaybackActivity", async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM jf_playback_activity");
    res.send(rows);
  } catch (error) {
    res.send(error);
  }
});

router.get("/getAllUserActivity", async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM jf_all_user_activity");
    res.send(rows);
  } catch (error) {
    res.send(error);
  }
});

router.post("/getUserDetails", async (req, res) => {
  try {
    const { userid } = req.body;
    const { rows } = await db.query(
      `select * from jf_users where "Id"='${userid}'`
    );
    res.send(rows[0]);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});

router.post("/getGlobalUserStats", async (req, res) => {
  try {
    const { hours,userid } = req.body;
    let _hours = hours;
    if (hours === undefined) {
      _hours = 24;
    }
    console.log(`select * from fs_user_stats(${_hours},'${userid}')`);
    const { rows } = await db.query(
      `select * from fs_user_stats(${_hours},'${userid}')`
    );
    res.send(rows[0]);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});

router.post("/getUserLastPlayed", async (req, res) => {
  try {
    const { userid } = req.body;
    const { rows } = await db.query(
      `select * from fs_last_user_activity('${userid}') limit 15`
    );
    res.send(rows);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});

router.post("/getLibraryDetails", async (req, res) => {
  try {
    const { libraryid } = req.body;
    const { rows } = await db.query(
      `select * from jf_libraries where "Id"='${libraryid}'`
    );
    res.send(rows[0]);
  } catch (error) {
    console.log(error);
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
    console.log(`select * from fs_library_stats(${_hours},'${libraryid}')`);
    const { rows } = await db.query(
      `select * from fs_library_stats(${_hours},'${libraryid}')`
    );
    res.send(rows[0]);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});


router.get("/getLibraryStats", async (req, res) => {
  try {
    const { rows } = await db.query("select * from js_library_stats_overview");
    res.send(rows);
  } catch (error) {
    res.send(error);
  }
});

router.post("/getLibraryLastPlayed", async (req, res) => {
  try {
    const { libraryid } = req.body;
    const { rows } = await db.query(
      `select * from fs_last_library_activity('${libraryid}') limit 15`
    );
    res.send(rows);
  } catch (error) {
    console.log(error);
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
    const { rows } = await db.query(
      `select * from fs_watch_stats_over_time('${_days}')`
    );

    
const reorganizedData = {};

rows.forEach((item) => {
  const id = item.Library;
  const count = item.Count;
  const date = new Date(item.Date).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: '2-digit'
  });
  
  if (!reorganizedData[id]) {
    reorganizedData[id] = {
      id,
      data: []
    };
  }
  
  reorganizedData[id].data.push({ x: date, y: count });
});
const finalData = Object.values(reorganizedData);
    res.send(finalData);
  } catch (error) {
    console.log(error);
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
    const { rows } = await db.query(
      `select * from fs_watch_stats_popular_days_of_week('${_days}')`
    );

    
const reorganizedData = {};

rows.forEach((item) => {

  const id = item.Library;
  const count = item.Count;
  const day = item.Day;
  
  if (!reorganizedData[id]) {
    reorganizedData[id] = {
      id,
      data: []
    };
  }

  reorganizedData[id].data.push({ x: day, y: count });
});
const finalData = Object.values(reorganizedData);
    res.send(finalData);
  } catch (error) {
    console.log(error);
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
    const { rows } = await db.query(
      `select * from fs_watch_stats_popular_hour_of_day('${_days}')`
    );

    
const reorganizedData = {};

rows.forEach((item) => {

  const id = item.Library;
  const count = item.Count;
  const hour = item.Hour;
  
  if (!reorganizedData[id]) {
    reorganizedData[id] = {
      id,
      data: []
    };
  }

  reorganizedData[id].data.push({ x: hour, y: count });
});
const finalData = Object.values(reorganizedData);
    res.send(finalData);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});



module.exports = router;
