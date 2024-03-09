const db = require("../db");
const pgp = require("pg-promise")();

const moment = require("moment");
const { columnsPlayback, mappingPlayback } = require("../models/jf_playback_activity");
const { jf_activity_watchdog_columns, jf_activity_watchdog_mapping } = require("../models/jf_activity_watchdog");
const { randomUUID } = require("crypto");
const configClass = require("../classes/config");
const JellyfinAPI = require("../classes/jellyfin-api");

async function ActivityMonitor(interval) {
  const Jellyfin = new JellyfinAPI();
  // console.log("Activity Interval: " + interval);

  setInterval(async () => {
    try {
      const config = await new configClass().getConfig();

      if (config.error) {
        return;
      }
      const ExcludedUsers = config.settings?.ExcludedUsers || [];
      const SessionData = await Jellyfin.getSessions().then((sessions) =>
        sessions.filter((row) => row.NowPlayingItem !== undefined && !ExcludedUsers.includes(row.UserId))
      );

      /////get data from jf_activity_monitor
      const WatchdogData = await db.query("SELECT * FROM jf_activity_watchdog").then((res) => res.rows);

      /////return if no necessary changes made to reduce resource consumtion
      if (SessionData.length === 0 && WatchdogData.length === 0) {
        return;
      }

      // //compare to sessiondata

      let WatchdogDataToInsert = [];
      let WatchdogDataToUpdate = [];

      //filter fix if table is empty

      if (WatchdogData.length === 0) {
        // if there are no existing Ids in the table, map all items in the data array to the expected format
        WatchdogDataToInsert = await SessionData.map(jf_activity_watchdog_mapping);
      } else {
        // otherwise, filter only new data to insert
        WatchdogDataToInsert = await SessionData.filter(
          (session) => !WatchdogData.map((wdData) => wdData.Id).includes(session.Id)
        ).map(jf_activity_watchdog_mapping);

        WatchdogDataToUpdate = WatchdogData.filter((wdData) => {
          const session = SessionData.find((sessionData) => sessionData.Id === wdData.Id);
          if (session && session.PlayState) {
            if (wdData.IsPaused !== session.PlayState.IsPaused) {
              wdData.IsPaused = session.PlayState.IsPaused;
              return true;
            }
          }
          return false;
        });
      }

      if (WatchdogDataToInsert.length > 0) {
        //insert new rows where not existing items
        db.insertBulk("jf_activity_watchdog", WatchdogDataToInsert, jf_activity_watchdog_columns);
      }

      //update wd state
      if (WatchdogDataToUpdate.length > 0) {
        const WatchdogDataUpdated = WatchdogDataToUpdate.map((obj) => {
          let startTime = moment(obj.ActivityDateInserted, "YYYY-MM-DD HH:mm:ss.SSSZ");
          let endTime = moment();

          let diffInSeconds = endTime.diff(startTime, "seconds");

          if (obj.IsPaused) {
            obj.PlaybackDuration = parseInt(obj.PlaybackDuration) + diffInSeconds;
          }

          obj.ActivityDateInserted = `'${endTime.format("YYYY-MM-DD HH:mm:ss.SSSZ")}'::timestamptz`;

          const { ...rest } = obj;

          return { ...rest };
        });

        await (async () => {
          try {
            await db.query("BEGIN");
            const cs = new pgp.helpers.ColumnSet([
              "?Id",
              "IsPaused",
              { name: "PlaybackDuration", mod: ":raw" },
              { name: "ActivityDateInserted", mod: ":raw" },
            ]);

            const updateQuery = pgp.helpers.update(WatchdogDataUpdated, cs, "jf_activity_watchdog") + ' WHERE v."Id" = t."Id"';
            await db
              .query(updateQuery)
              .then((result) => {
                // console.log('Update successful', result.rowCount, 'rows updated');
              })
              .catch((error) => {
                console.error("Error updating rows", error);
              });

            await db.query("COMMIT");
          } catch (error) {
            await db.query("ROLLBACK");
            console.log(error);
          }
        })();
      }

      //delete from db no longer in session data and insert into stats db
      //Bulk delete from db thats no longer on api

      const toDeleteIds = WatchdogData.filter((id) => !SessionData.some((row) => row.Id === id.Id)).map((row) => row.Id);

      const playbackData = WatchdogData.filter((id) => !SessionData.some((row) => row.Id === id.Id));

      let playbackToInsert = playbackData.map((obj) => {
        const uuid = randomUUID();

        obj.Id = uuid;

        let startTime = moment(obj.ActivityDateInserted, "YYYY-MM-DD HH:mm:ss.SSSZ");
        let endTime = moment();

        let diffInSeconds = endTime.diff(startTime, "seconds");

        if (!obj.IsPaused) {
          obj.PlaybackDuration = parseInt(obj.PlaybackDuration) + diffInSeconds;
        }

        obj.ActivityDateInserted = endTime.format("YYYY-MM-DD HH:mm:ss.SSSZ");
        const { ...rest } = obj;

        return { ...rest };
      });

      /////get data from jf_playback_activity within the last hour with progress of <=80% for current items in session

      const ExistingRecords = await db
        .query(`SELECT * FROM jf_recent_playback_activity(1)`)
        .then((res) =>
          res.rows.filter(
            (row) =>
              playbackToInsert.some((pbi) => pbi.NowPlayingItemId === row.NowPlayingItemId && pbi.EpisodeId === row.EpisodeId) &&
              row.Progress <= 80.0
          )
        );
      let ExistingDataToUpdate = [];

      //for each item in playbackToInsert, check if it exists in the recent playback activity and update accordingly
      if (playbackToInsert.length > 0 && ExistingRecords.length > 0) {
        ExistingDataToUpdate = playbackToInsert.filter((playbackData) => {
          const existingrow = ExistingRecords.find(
            (existing) =>
              existing.NowPlayingItemId === playbackData.NowPlayingItemId &&
              existing.EpisodeId === playbackData.EpisodeId &&
              existing.UserId === playbackData.UserId
          );

          if (existingrow) {
            playbackData.Id = existingrow.Id;
            playbackData.PlaybackDuration = Number(existingrow.PlaybackDuration) + Number(playbackData.PlaybackDuration);
            playbackData.ActivityDateInserted = moment().format("YYYY-MM-DD HH:mm:ss.SSSZ");
            return true;
          }
          return false;
        });
      }

      //remove items from playbackToInsert that already exists in the recent playback activity so it doesnt duplicate or where PlaybackDuration===0
      playbackToInsert = playbackToInsert.filter(
        (pb) =>
          pb.PlaybackDuration > 0 &&
          !ExistingRecords.some(
            (er) => er.NowPlayingItemId === pb.NowPlayingItemId && er.EpisodeId === pb.EpisodeId && er.UserId === pb.UserId
          )
      );

      //remove items where PlaybackDuration===0

      ExistingDataToUpdate = ExistingDataToUpdate.filter((pb) => pb.PlaybackDuration > 0);

      if (toDeleteIds.length > 0) {
        await db.deleteBulk("jf_activity_watchdog", toDeleteIds);
      }
      if (playbackToInsert.length > 0) {
        await db.insertBulk("jf_playback_activity", playbackToInsert, columnsPlayback);
      }

      if (ExistingDataToUpdate.length > 0) {
        await db.insertBulk("jf_playback_activity", ExistingDataToUpdate, columnsPlayback);
      }

      ///////////////////////////
    } catch (error) {
      if (error?.code === "ECONNREFUSED") {
        console.error("Error: Unable to connect to Jellyfin");
      } else if (error?.code === "ERR_BAD_RESPONSE") {
        console.warn(error.response?.data);
      } else {
        console.error(error);
      }
      return [];
    }
  }, interval);
}

module.exports = {
  ActivityMonitor,
};
