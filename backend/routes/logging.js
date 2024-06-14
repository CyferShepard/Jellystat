const db = require("../db");
const moment = require("moment");
const taskstate = require("../logging/taskstate");

const { jf_logging_columns, jf_logging_mapping } = require("../models/jf_logging");
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

async function insertLog(uuid, triggertype, taskType) {
  try {
    let startTime = moment();
    const log = {
      Id: uuid,
      Name: taskType,
      Type: "Task",
      ExecutionType: triggertype,
      Duration: 0,
      TimeRun: startTime,
      Log: JSON.stringify([{}]),
      Result: taskstate.RUNNING,
    };

    await db.insertBulk("jf_logging", log, jf_logging_columns);
  } catch (error) {
    console.log(error);
    return [];
  }
}

async function updateLog(uuid, data, taskstate) {
  try {
    const { rows: task } = await db.query(`SELECT "TimeRun" FROM jf_logging WHERE "Id" = '${uuid}';`);

    if (task.length === 0) {
      console.log("Unable to find task to update");
    } else {
      let endtime = moment();
      let startTime = moment(task[0].TimeRun);
      let duration = endtime.diff(startTime, "seconds");
      const log = {
        Id: uuid,
        Name: "NULL Placeholder",
        Type: "Task",
        ExecutionType: "NULL Placeholder",
        Duration: duration,
        TimeRun: startTime,
        Log: JSON.stringify(data),
        Result: taskstate,
      };

      await db.insertBulk("jf_logging", log, jf_logging_columns);
    }
  } catch (error) {
    console.log(error);
    return [];
  }
}

module.exports = { router, insertLog, updateLog };
