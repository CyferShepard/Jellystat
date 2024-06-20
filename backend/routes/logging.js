const db = require("../db");

const express = require("express");
const router = express.Router();
// #swagger.tags = ['Logs']
router.get("/getLogs", async (req, res) => {
  try {
    const { rows } = await db.query(`SELECT * FROM jf_logging order by "TimeRun" desc LIMIT 50 `);
    res.send(rows);
  } catch (error) {
    res.send(error);
  }
});

module.exports = router;
