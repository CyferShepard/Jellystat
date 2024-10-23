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

// Handle other routes
router.use((req, res) => {
  res.status(404).send({ error: "Not Found" });
});

module.exports = router;
