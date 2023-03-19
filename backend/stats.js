// api.js
const express = require("express");
const db = require("./db");

const router = express.Router();

router.get("/test", async (req, res) => {
  console.log(`ENDPOINT CALLED: /test`);
  res.send("Backend Responded Succesfully");
});

router.get("/getLibraryOverview", async (req, res) => {
  const { rows } = await db.query('SELECT * FROM jf_library_count_view');
  res.send(rows);
  console.log(`ENDPOINT CALLED: /getLibraryOverview`);
});


router.post("/getMostViewedSeries", async (req, res) => {
  const {days} = req.body;
  let _days=days;
  if(days===undefined)
  {
    _days=30;
  }
  const { rows } = await db.query(
    `select * from fs_most_played_items(${_days},'Series') limit 5`
  );
  res.send(rows);

});


router.post("/getMostViewedMovies", async (req, res) => {
  const {days} = req.body;
  let _days=days;
  if(days===undefined)
  {
    _days=30;
  }
  const { rows } = await db.query(
    `select * from fs_most_played_items(${_days},'Movie') limit 5`
  );
  res.send(rows);

});



router.post("/getMostViewedLibraries", async (req, res) => {
  const {days} = req.body;
  let _days=days;
  if(days===undefined)
  {
    _days=30;
  }
  const { rows } = await db.query(
    `select * from fs_most_viewed_libraries(${_days})`
  );
  res.send(rows);

});

router.get("/getMostUsedClient", async (req, res) => {
  const { rows } = await db.query('SELECT * FROM js_most_used_clients limit 5');
  res.send(rows);
});

router.get("/getMostActiveUsers", async (req, res) => {
  const { rows } = await db.query('SELECT * FROM js_most_active_user limit 5');
  res.send(rows);
});


router.post("/getMostPopularMovies", async (req, res) => {
  const {days} = req.body;
  let _days=days;
  if(days===undefined)
  {
    _days=30;
  }
  const { rows } = await db.query(
    `select * from fs_most_popular_items(${_days},'Movie') limit 5`
  );
  res.send(rows);

});



router.post("/getMostPopularSeries", async (req, res) => {
  const {days} = req.body;
  let _days=days;
  if(days===undefined)
  {
    _days=30;
  }
  console.log(`select * from fs_most_popular_items(${_days},'Series') limit 5`);
  const { rows } = await db.query(
    `select * from fs_most_popular_items(${_days},'Series') limit 5`
  );
  res.send(rows);

});


router.get("/getPlaybackActivity", async (req, res) => {
  const { rows } = await db.query('SELECT * FROM jf_playback_activity');
  res.send(rows);
  // console.log(`ENDPOINT CALLED: /getPlaybackActivity`);
});

module.exports = router;
