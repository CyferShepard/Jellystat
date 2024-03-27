const db = require("../db");
const moment = require("moment");
const sync = require("../routes/sync");
const taskName = require("../logging/taskName");
const taskstate = require("../logging/taskstate");
const triggertype = require("../logging/triggertype");

async function RecentlyAddedItemsSyncTask() {
  try {
    await db.query(
      `UPDATE jf_logging SET "Result"='${taskstate.FAILED}' WHERE "Name"='${taskName.partialsync}' AND "Result"='${taskstate.RUNNING}'`
    );
  } catch (error) {
    console.log("Error Cleaning up Sync Tasks: " + error);
  }

  let interval = 10000;

  let taskDelay = 60; //in minutes

  async function fetchTaskSettings() {
    try {
      //get interval from db

      const settingsjson = await db.query('SELECT settings FROM app_config where "ID"=1').then((res) => res.rows);

      if (settingsjson.length > 0) {
        const settings = settingsjson[0].settings || {};

        let synctasksettings = settings.Tasks?.PartialJellyfinSync || {};

        if (synctasksettings.Interval) {
          taskDelay = synctasksettings.Interval;
        } else {
          synctasksettings.Interval = taskDelay;

          if (!settings.Tasks) {
            settings.Tasks = {};
          }
          if (!settings.Tasks.PartialJellyfinSync) {
            settings.Tasks.PartialJellyfinSync = {};
          }
          settings.Tasks.PartialJellyfinSync = synctasksettings;

          let query = 'UPDATE app_config SET settings=$1 where "ID"=1';

          await db.query(query, [settings]);
        }
      }
    } catch (error) {
      console.log("Sync Task Settings Error: " + error);
    }
  }

  async function intervalCallback() {
    clearInterval(intervalTask);
    try {
      let current_time = moment();
      const { rows: config } = await db.query('SELECT * FROM app_config where "ID"=1');

      if (!config || config.length === 0 || config[0].JF_HOST === null || config[0].JF_API_KEY === null) {
        return;
      }

      const last_execution = await db
        .query(
          `SELECT "TimeRun","Result"
                                          FROM public.jf_logging
                                          WHERE "Name"='${taskName.partialsync}'
                                          ORDER BY "TimeRun" DESC
                                          LIMIT 1`
        )
        .then((res) => res.rows);
      if (last_execution.length !== 0) {
        await fetchTaskSettings();
        let last_execution_time = moment(last_execution[0].TimeRun).add(taskDelay, "minutes");

        if (!current_time.isAfter(last_execution_time) || last_execution[0].Result === taskstate.RUNNING) {
          intervalTask = setInterval(intervalCallback, interval);
          return;
        }
      }

      console.log("Running Recently Added Scheduled Sync");
      await sync.partialSync(triggertype.Automatic);
      console.log("Scheduled Recently Added Sync Complete");
    } catch (error) {
      console.log(error);
      return [];
    }

    intervalTask = setInterval(intervalCallback, interval);
  }

  let intervalTask = setInterval(intervalCallback, interval);
}

module.exports = {
  RecentlyAddedItemsSyncTask,
};
