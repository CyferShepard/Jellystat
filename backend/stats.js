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

module.exports = router;
