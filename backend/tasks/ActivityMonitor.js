const db = require("../db");

const dayjs = require("dayjs");
const { columnsPlayback } = require("../models/jf_playback_activity");
const { jf_activity_watchdog_columns, jf_activity_watchdog_mapping } = require("../models/jf_activity_watchdog");
const configClass = require("../classes/config");
const API = require("../classes/api-loader");
const { sendUpdate } = require("../ws");
const { isNumber } = require("@mui/x-data-grid/internals");
const WebhookManager = require("../classes/webhook-manager"); 

const MINIMUM_SECONDS_TO_INCLUDE_PLAYBACK = process.env.MINIMUM_SECONDS_TO_INCLUDE_PLAYBACK
  ? Number(process.env.MINIMUM_SECONDS_TO_INCLUDE_PLAYBACK)
  : 1;

const webhookManager = new WebhookManager();

async function getSessionsInWatchDog(SessionData, WatchdogData) {
  const existingData = await WatchdogData.filter((wdData) => {
    return SessionData.some((sessionData) => {
      const NowPlayingItemId = sessionData.NowPlayingItem.SeriesId || sessionData.NowPlayingItem.Id;

      const matchesEpisodeId =
        sessionData.NowPlayingItem.SeriesId != undefined ? wdData.EpisodeId === sessionData.NowPlayingItem.Id : true;

      const matchingSessionFound =
        // wdData.Id === sessionData.Id &&
        wdData.UserId === sessionData.UserId &&
        wdData.DeviceId === sessionData.DeviceId &&
        wdData.NowPlayingItemId === NowPlayingItemId &&
        matchesEpisodeId;

      if (matchingSessionFound && wdData.IsPaused != sessionData.PlayState.IsPaused) {
        wdData.IsPaused = sessionData.PlayState.IsPaused;

        //if the playstate was paused, calculate the difference in seconds and add to the playback duration
        if (sessionData.PlayState.IsPaused == true) {
          const startTime = dayjs(wdData.ActivityDateInserted);
          const lastPausedDate = dayjs(sessionData.LastPausedDate, "YYYY-MM-DD HH:mm:ss.SSSZ");

          const diffInSeconds = lastPausedDate.diff(startTime, "seconds");

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
  const newData = await SessionData.filter((sessionData) => {
    if (WatchdogData.length === 0) return true;
    return !WatchdogData.some((wdData) => {
      const NowPlayingItemId = sessionData.NowPlayingItem.SeriesId || sessionData.NowPlayingItem.Id;

      const matchesEpisodeId =
        sessionData.NowPlayingItem.SeriesId != undefined ? wdData.EpisodeId === sessionData.NowPlayingItem.Id : true;

      const matchingSessionFound =
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
  const removedData = WatchdogData.filter((wdData) => {
    if (SessionData.length === 0) return true;
    return !SessionData.some((sessionData) => {
      const NowPlayingItemId = sessionData.NowPlayingItem.SeriesId || sessionData.NowPlayingItem.Id;

      const matchesEpisodeId =
        sessionData.NowPlayingItem.SeriesId != undefined ? wdData.EpisodeId === sessionData.NowPlayingItem.Id : true;

      const noMatchingSessionFound =
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
    const startTime = dayjs(obj.ActivityDateInserted);
    const endTime = dayjs();

    const diffInSeconds = endTime.diff(startTime, "seconds");

    if (obj.IsPaused == false) {
      obj.PlaybackDuration = parseInt(obj.PlaybackDuration) + diffInSeconds;
    }

    obj.ActivityDateInserted = endTime.format("YYYY-MM-DD HH:mm:ss.SSSZ");
    const { ...rest } = obj;

    return { ...rest };
  });
  return removedData;
}

let currentIntervalId = null;
let lastHadActiveSessions = false;
let cachedPollingSettings = {
  activeSessionsInterval: 1000,
  idleInterval: 5000
};

async function ActivityMonitor(defaultInterval) {
  // console.log("Activity Monitor started with default interval: " + defaultInterval);
  
  const runMonitoring = async () => {
    try {
      const config = await new configClass().getConfig();

      if (config.error || config.state !== 2) {
        return;
      }
      
      // Get adaptive polling settings from config
      const pollingSettings = config.settings?.ActivityMonitorPolling || {
        activeSessionsInterval: 1000,
        idleInterval: 5000
      };
      
      // Check if polling settings have changed
      const settingsChanged = 
        cachedPollingSettings.activeSessionsInterval !== pollingSettings.activeSessionsInterval ||
        cachedPollingSettings.idleInterval !== pollingSettings.idleInterval;
      
      if (settingsChanged) {
        console.log('[ActivityMonitor] Polling settings changed, updating intervals');
        console.log('Old settings:', cachedPollingSettings);
        console.log('New settings:', pollingSettings);
        cachedPollingSettings = { ...pollingSettings };
      }

      const ExcludedUsers = config.settings?.ExcludedUsers || [];
      const apiSessionData = await API.getSessions();
      const SessionData = apiSessionData.filter((row) => row.NowPlayingItem !== undefined && !ExcludedUsers.includes(row.UserId));
      sendUpdate("sessions", apiSessionData);
      
      const hasActiveSessions = SessionData.length > 0;
      
      // Determine current appropriate interval
      const currentInterval = hasActiveSessions ? pollingSettings.activeSessionsInterval : pollingSettings.idleInterval;
      
      // Check if we need to change the interval (either due to session state change OR settings change)
      if (hasActiveSessions !== lastHadActiveSessions || settingsChanged) {
        if (hasActiveSessions !== lastHadActiveSessions) {
          console.log(`[ActivityMonitor] Switching to ${hasActiveSessions ? 'active' : 'idle'} polling mode (${currentInterval}ms)`);
          lastHadActiveSessions = hasActiveSessions;
        }
        if (settingsChanged) {
          console.log(`[ActivityMonitor] Applying new ${hasActiveSessions ? 'active' : 'idle'} interval: ${currentInterval}ms`);
        }
        
        // Clear current interval and restart with new timing
        if (currentIntervalId) {
          clearInterval(currentIntervalId);
        }
        currentIntervalId = setInterval(runMonitoring, currentInterval);
        return; // Let the new interval handle the next execution
      }
      
      /////get data from jf_activity_monitor
      const WatchdogData = await db.query("SELECT * FROM jf_activity_watchdog").then((res) => res.rows);

      /////return if no necessary changes made to reduce resource consumption
      if (SessionData.length === 0 && WatchdogData.length === 0) {
        return;
      }
      // New Code

      const WatchdogDataToInsert = await getSessionsNotInWatchDog(SessionData, WatchdogData);
      const WatchdogDataToUpdate = await getSessionsInWatchDog(SessionData, WatchdogData);
      const dataToRemove = await getWatchDogNotInSessions(SessionData, WatchdogData);

      /////////////////

      //filter fix if table is empty

      if (WatchdogDataToInsert.length > 0) {
        for (const session of WatchdogDataToInsert) {
          let userData = {};
          try {
            const userInfo = await API.getUserById(session.UserId);
            if (userInfo) {
              userData = {
                username: userInfo.Name,
                userImageTag: userInfo.PrimaryImageTag
              };
            }
          } catch (error) {
            console.error(`[WEBHOOK] Error fetching user data: ${error.message}`);
          }

          await webhookManager.triggerEventWebhooks('playback_started', {
            sessionInfo: {
              userId: session.UserId,
              deviceId: session.DeviceId,
              deviceName: session.DeviceName,
              clientName: session.ClientName,
              isPaused: session.IsPaused,
              mediaType: session.MediaType,
              mediaName: session.NowPlayingItemName,
              startTime: session.ActivityDateInserted
            },
            userData,
            mediaInfo: {
              itemId: session.NowPlayingItemId,
              episodeId: session.EpisodeId,
              mediaName: session.NowPlayingItemName,
              seasonName: session.SeasonName,
              seriesName: session.SeriesName
            }
          });
        }

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

      if (dataToRemove.length > 0) {
        for (const session of dataToRemove) {
          let userData = {};
          try {
            const userInfo = await API.getUserById(session.UserId);
            if (userInfo) {
              userData = {
                username: userInfo.Name,
                userImageTag: userInfo.PrimaryImageTag
              };
            }
          } catch (error) {
            console.error(`[WEBHOOK] Error fetching user data: ${error.message}`);
          }

          await webhookManager.triggerEventWebhooks('playback_ended', {
            sessionInfo: {
              userId: session.UserId,
              deviceId: session.DeviceId,
              deviceName: session.DeviceName,
              clientName: session.ClientName,
              playbackDuration: session.PlaybackDuration,
              endTime: session.ActivityDateInserted
            },
            userData,
            mediaInfo: {
              itemId: session.NowPlayingItemId,
              episodeId: session.EpisodeId,
              mediaName: session.NowPlayingItemName,
              seasonName: session.SeasonName,
              seriesName: session.SeriesName
            }
          });
        }

        const toDeleteIds = dataToRemove.map((row) => row.ActivityId);

      //delete from db no longer in session data and insert into stats db
      //Bulk delete from db thats no longer on api

      let playbackToInsert = dataToRemove;

      if (playbackToInsert.length == 0 && toDeleteIds.length == 0) {
        return;
      }

      /////get data from jf_playback_activity within the last hour with progress of <=80% for current items in session

      const ExistingRecords = await db
        .query(`SELECT * FROM jf_recent_playback_activity(1)`)
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
    } 
    }
    catch (error) {
      if (error?.code === "ECONNREFUSED") {
        console.error("Error: Unable to connect to API"); //TO-DO Change this to correct API name
      } else if (error?.code === "ERR_BAD_RESPONSE") {
        console.warn(error.response?.data);
      } else {
        console.error(error);
      }
      return [];
    }
  };
  
  // Get initial configuration to start with the correct interval
  const initConfig = async () => {
    try {
      const config = await new configClass().getConfig();
      
      if (config.error || config.state !== 2) {
        console.log("[ActivityMonitor] Config not ready, starting with default interval:", defaultInterval + "ms");
        currentIntervalId = setInterval(runMonitoring, defaultInterval);
        return;
      }
      
      // Get adaptive polling settings from config
      const pollingSettings = config.settings?.ActivityMonitorPolling || {
        activeSessionsInterval: 1000,
        idleInterval: 5000
      };
      
      // Initialize cached settings
      cachedPollingSettings = { ...pollingSettings };
      
      // Start with idle interval since there are likely no active sessions at startup
      const initialInterval = pollingSettings.idleInterval;
      console.log("[ActivityMonitor] Starting adaptive polling with idle interval:", initialInterval + "ms");
      console.log("[ActivityMonitor] Loaded settings:", pollingSettings);
      currentIntervalId = setInterval(runMonitoring, initialInterval);
      
    } catch (error) {
      console.log("[ActivityMonitor] Error loading config, using default interval:", defaultInterval + "ms");
      currentIntervalId = setInterval(runMonitoring, defaultInterval);
    }
  };
  
  // Initialize with proper configuration
  await initConfig();
  
  // Return a cleanup function
  return () => {
    if (currentIntervalId) {
      clearInterval(currentIntervalId);
      currentIntervalId = null;
    }
  };
}

module.exports = {
  ActivityMonitor,
};
