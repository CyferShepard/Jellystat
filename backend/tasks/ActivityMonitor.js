const db = require("../db");

const dayjs = require("dayjs");
const { columnsPlayback } = require("../models/jf_playback_activity");
const { jf_activity_watchdog_columns, jf_activity_watchdog_mapping } = require("../models/jf_activity_watchdog");
const configClass = require("../classes/config");
const API = require("../classes/api-loader");
const { sendUpdate } = require("../ws");
const { isNumber } = require("@mui/x-data-grid/internals");
const MINIMUM_SECONDS_TO_INCLUDE_PLAYBACK = process.env.MINIMUM_SECONDS_TO_INCLUDE_PLAYBACK
  ? Number(process.env.MINIMUM_SECONDS_TO_INCLUDE_PLAYBACK)
  : 1;

async function getSessionsInWatchDog(SessionData, WatchdogData) {
  let existingData = await WatchdogData.filter((wdData) => {
    return SessionData.some((sessionData) => {
      let NowPlayingItemId = sessionData.NowPlayingItem.SeriesId || sessionData.NowPlayingItem.Id;

      let matchesEpisodeId =
        sessionData.NowPlayingItem.SeriesId != undefined ? wdData.EpisodeId === sessionData.NowPlayingItem.Id : true;

      let matchingSessionFound =
        // wdData.Id === sessionData.Id &&
        wdData.UserId === sessionData.UserId &&
        wdData.DeviceId === sessionData.DeviceId &&
        wdData.NowPlayingItemId === NowPlayingItemId &&
        matchesEpisodeId;

      if (matchingSessionFound && wdData.IsPaused != sessionData.PlayState.IsPaused) {
        wdData.IsPaused = sessionData.PlayState.IsPaused;

        //if the playstate was paused, calculate the difference in seconds and add to the playback duration
        if (sessionData.PlayState.IsPaused == true) {
          let startTime = dayjs(wdData.ActivityDateInserted, "YYYY-MM-DD HH:mm:ss.SSSZ");
          let lastPausedDate = dayjs(sessionData.LastPausedDate);

          let diffInSeconds = lastPausedDate.diff(startTime, "seconds");

          wdData.PlaybackDuration = parseInt(wdData.PlaybackDuration) + diffInSeconds;

          wdData.ActivityDateInserted = `${lastPausedDate.format("YYYY-MM-DD HH:mm:ss.SSSZ")}`;
        } else {
          wdData.ActivityDateInserted = dayjs().format("YYYY-MM-DD HH:mm:ss.SSSZ");
        }
        return true;
      }

      return false; // we return false if playstate didnt change to reduce db writes
    });
  });
  return existingData;
}

async function getSessionsNotInWatchDog(SessionData, WatchdogData) {
  let newData = await SessionData.filter((sessionData) => {
    if (WatchdogData.length === 0) return true;
    return !WatchdogData.some((wdData) => {
      let NowPlayingItemId = sessionData.NowPlayingItem.SeriesId || sessionData.NowPlayingItem.Id;

      let matchesEpisodeId =
        sessionData.NowPlayingItem.SeriesId != undefined ? wdData.EpisodeId === sessionData.NowPlayingItem.Id : true;

      let matchingSessionFound =
        // wdData.Id === sessionData.Id &&
        wdData.UserId === sessionData.UserId &&
        wdData.DeviceId === sessionData.DeviceId &&
        wdData.NowPlayingItemId === NowPlayingItemId &&
        matchesEpisodeId;

      return matchingSessionFound;
    });
  }).map(jf_activity_watchdog_mapping);

  return newData;
}

function getWatchDogNotInSessions(SessionData, WatchdogData) {
  let removedData = WatchdogData.filter((wdData) => {
    if (SessionData.length === 0) return true;
    return !SessionData.some((sessionData) => {
      let NowPlayingItemId = sessionData.NowPlayingItem.SeriesId || sessionData.NowPlayingItem.Id;

      let matchesEpisodeId =
        sessionData.NowPlayingItem.SeriesId != undefined ? wdData.EpisodeId === sessionData.NowPlayingItem.Id : true;

      let noMatchingSessionFound =
        // wdData.Id === sessionData.Id &&
        wdData.UserId === sessionData.UserId &&
        wdData.DeviceId === sessionData.DeviceId &&
        wdData.NowPlayingItemId === NowPlayingItemId &&
        matchesEpisodeId;
      return noMatchingSessionFound;
    });
  });

  //this is to update the playback duration for the removed items where it was playing before stopped as duration is only updated on pause

  removedData.map((obj) => {
    obj.Id = obj.ActivityId;
    let startTime = dayjs(obj.ActivityDateInserted, "YYYY-MM-DD HH:mm:ss.SSSZ");
    let endTime = dayjs();

    let diffInSeconds = endTime.diff(startTime, "seconds");

    if (obj.IsPaused == false) {
      obj.PlaybackDuration = parseInt(obj.PlaybackDuration) + diffInSeconds;
    }

    obj.ActivityDateInserted = endTime.format("YYYY-MM-DD HH:mm:ss.SSSZ");
    const { ...rest } = obj;

    return { ...rest };
  });
  return removedData;
}

async function ActivityMonitor(interval) {
  // console.log("Activity Interval: " + interval);

  setInterval(async () => {
    try {
      const config = await new configClass().getConfig();

      if (config.error || config.state !== 2) {
        return;
      }
      const ExcludedUsers = config.settings?.ExcludedUsers || [];
      const apiSessionData = await API.getSessions();
      const SessionData = apiSessionData.filter((row) => row.NowPlayingItem !== undefined && !ExcludedUsers.includes(row.UserId));
      sendUpdate("sessions", apiSessionData);
      /////get data from jf_activity_monitor
      const WatchdogData = await db.query("SELECT * FROM jf_activity_watchdog").then((res) => res.rows);

      /////return if no necessary changes made to reduce resource consumption
      if (SessionData.length === 0 && WatchdogData.length === 0) {
        return;
      }
      // New Code

      let WatchdogDataToInsert = await getSessionsNotInWatchDog(SessionData, WatchdogData);
      let WatchdogDataToUpdate = await getSessionsInWatchDog(SessionData, WatchdogData);
      let dataToRemove = await getWatchDogNotInSessions(SessionData, WatchdogData);

      /////////////////

      //filter fix if table is empty

      if (WatchdogDataToInsert.length > 0) {
        //insert new rows where not existing items
        // console.log("Inserted " + WatchdogDataToInsert.length + " wd playback records");
        db.insertBulk("jf_activity_watchdog", WatchdogDataToInsert, jf_activity_watchdog_columns);
        console.log("New Data Inserted: ", WatchdogDataToInsert.length);
      }

      //update wd state
      if (WatchdogDataToUpdate.length > 0) {
        await db.insertBulk("jf_activity_watchdog", WatchdogDataToUpdate, jf_activity_watchdog_columns);
        console.log("Existing Data Updated: ", WatchdogDataToUpdate.length);
      }

      //delete from db no longer in session data and insert into stats db
      //Bulk delete from db thats no longer on api

      const toDeleteIds = dataToRemove.map((row) => row.ActivityId);

      let playbackToInsert = dataToRemove;

      if (playbackToInsert.length == 0 && toDeleteIds.length == 0) {
        return;
      }

      /////get data from jf_playback_activity within the last hour with progress of <=80% for current items in session

      const ExistingRecords = await db
        .query(`SELECT * FROM jf_recent_playback_activity(1) limit 0`)
        .then((res) => {
          if (res.rows && Array.isArray(res.rows) && res.rows.length > 0) {
            return res.rows.filter(
              (row) =>
                playbackToInsert.some(
                  (pbi) => pbi.NowPlayingItemId === row.NowPlayingItemId && pbi.EpisodeId === row.EpisodeId
                ) && row.Progress <= 80.0
            );
          } else {
            return [];
          }
        })
        .catch((err) => {
          console.error("Error fetching existing records:", err);
        });
      let ExistingDataToUpdate = [];

      //for each item in playbackToInsert, check if it exists in the recent playback activity and update accordingly. insert new row if updating existing exceeds the runtime
      if (playbackToInsert.length > 0 && ExistingRecords.length > 0) {
        ExistingDataToUpdate = playbackToInsert.filter((playbackData) => {
          const existingrow = ExistingRecords.find((existing) => {
            let newDurationWithingRunTime = true;

            if (existing.RunTimeTicks != undefined && isNumber(existing.RunTimeTicks)) {
              newDurationWithingRunTime =
                (Number(existing.PlaybackDuration) + Number(playbackData.PlaybackDuration)) * 10000000 <=
                Number(existing.RunTimeTicks);
            }
            return (
              existing.NowPlayingItemId === playbackData.NowPlayingItemId &&
              existing.EpisodeId === playbackData.EpisodeId &&
              existing.UserId === playbackData.UserId &&
              newDurationWithingRunTime
            );
          });

          if (existingrow) {
            playbackData.Id = existingrow.Id;
            playbackData.PlaybackDuration = Number(existingrow.PlaybackDuration) + Number(playbackData.PlaybackDuration);
            playbackData.ActivityDateInserted = dayjs().format("YYYY-MM-DD HH:mm:ss.SSSZ");
            return true;
          }
          return false;
        });
      }

      //remove items from playbackToInsert that already exists in the recent playback activity so it doesnt duplicate or where PlaybackDuration===0
      playbackToInsert = playbackToInsert.filter(
        (pb) =>
          pb.PlaybackDuration >= MINIMUM_SECONDS_TO_INCLUDE_PLAYBACK &&
          !ExistingRecords.some(
            (er) => er.NowPlayingItemId === pb.NowPlayingItemId && er.EpisodeId === pb.EpisodeId && er.UserId === pb.UserId
          )
      );

      //remove items where PlaybackDuration===0

      ExistingDataToUpdate = ExistingDataToUpdate.filter((pb) => pb.PlaybackDuration >= MINIMUM_SECONDS_TO_INCLUDE_PLAYBACK);

      if (toDeleteIds.length > 0) {
        await db.deleteBulk("jf_activity_watchdog", toDeleteIds, "ActivityId");
        console.log("Removed Data from WD Count: ", dataToRemove.length);
      }
      if (playbackToInsert.length > 0) {
        await db.insertBulk("jf_playback_activity", playbackToInsert, columnsPlayback);
        console.log("Activity inserted/updated Count: ", playbackToInsert.length);
        // console.log("Inserted " + playbackToInsert.length + " new playback records");
      }

      if (ExistingDataToUpdate.length > 0) {
        await db.insertBulk("jf_playback_activity", ExistingDataToUpdate, columnsPlayback);
        // console.log("Updated " + playbackToInsert.length + " playback records");
      }

      ///////////////////////////
    } catch (error) {
      if (error?.code === "ECONNREFUSED") {
        console.error("Error: Unable to connect to API"); //TO-DO Change this to correct API name
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
