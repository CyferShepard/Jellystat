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
    const { days,userid } = req.body;
    let _days = days;
    if (days === undefined) {
      _days = 1;
    }
    console.log(`select * from fs_user_stats(${_days-1},'${userid}')`);
    const { rows } = await db.query(
      `select * from fs_user_stats(${_days-1},'${userid}')`
    );
    res.send(rows[0]);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});


module.exports = router;
