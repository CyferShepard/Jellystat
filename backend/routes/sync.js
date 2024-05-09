const express = require("express");
const pgp = require("pg-promise")();
const db = require("../db");

const moment = require("moment");
const { randomUUID } = require("crypto");

const { sendUpdate } = require("../ws");

const logging = require("./logging");
const taskName = require("../logging/taskName");
const triggertype = require("../logging/triggertype");

const configClass = require("../classes/config");
const JellyfinAPI = require("../classes/jellyfin-api");
const Jellyfin = new JellyfinAPI();

const router = express.Router();

const { jf_libraries_columns, jf_libraries_mapping } = require("../models/jf_libraries");
const { jf_library_items_columns, jf_library_items_mapping } = require("../models/jf_library_items");
const { jf_library_seasons_columns, jf_library_seasons_mapping } = require("../models/jf_library_seasons");
const { jf_library_episodes_columns, jf_library_episodes_mapping } = require("../models/jf_library_episodes");
const { jf_item_info_columns, jf_item_info_mapping } = require("../models/jf_item_info");
const { columnsPlaybackReporting, mappingPlaybackReporting } = require("../models/jf_playback_reporting_plugin_data");

const { jf_users_columns, jf_users_mapping } = require("../models/jf_users");
const taskstate = require("../logging/taskstate");

let syncTask;
let PlaybacksyncTask;

/////////////////////////////////////////Functions

function getErrorLineNumber(error) {
  const stackTrace = error.stack.split("\n");
  const errorLine = stackTrace[1].trim();
  const lineNumber = errorLine.substring(errorLine.lastIndexOf("\\") + 1, errorLine.lastIndexOf(")"));
  return lineNumber;
}

class sync {
  async getExistingIDsforTable(tablename) {
    return await db.query(`SELECT "Id" FROM ${tablename}`).then((res) => res.rows.map((row) => row.Id));
  }

  async insertData(tablename, dataToInsert, column_mappings) {
    let result = await db.insertBulk(tablename, dataToInsert, column_mappings);
    if (result.Result === "SUCCESS") {
      syncTask.loggedData.push({ color: "dodgerblue", Message: dataToInsert.length + " Rows Inserted." });
    } else {
      syncTask.loggedData.push({
        color: "red",
        Message: "Error performing bulk insert:" + result.message,
      });
      throw new Error("Error performing bulk insert:" + result.message);
    }
  }

  async removeData(tablename, dataToRemove) {
    let result = await db.deleteBulk(tablename, dataToRemove);
    if (result.Result === "SUCCESS") {
      syncTask.loggedData.push(dataToRemove.length + " Rows Removed.");
    } else {
      syncTask.loggedData.push({ color: "red", Message: "Error: " + result.message });
      throw new Error("Error :" + result.message);
    }
  }

  async updateSingleFieldOnDB(tablename, dataToUpdate, field_name, field_value, where_field) {
    let result = await db.updateSingleFieldBulk(tablename, dataToUpdate, field_name, field_value, where_field);
    if (result.Result === "SUCCESS") {
      syncTask.loggedData.push({ color: "dodgerblue", Message: dataToUpdate.length + " Rows updated." });
    } else {
      syncTask.loggedData.push({ color: "red", Message: "Error: " + result.message });
      throw new Error("Error :" + result.message);
    }
  }
}
////////////////////////////////////////API Methods

async function syncUserData() {
  sendUpdate(syncTask.wsKey, { type: "Update", message: "Syncing User Data" });
  syncTask.loggedData.push({ color: "lawngreen", Message: "Syncing... 1/7" });
  syncTask.loggedData.push({ color: "yellow", Message: "Beginning User Sync" });

  const _sync = new sync();

  const data = await Jellyfin.getUsers();

  const existingIds = await _sync.getExistingIDsforTable("jf_users"); // get existing user Ids from the db

  let dataToInsert = await data.map(jf_users_mapping);

  if (dataToInsert.length > 0) {
    await _sync.insertData("jf_users", dataToInsert, jf_users_columns);
  }

  const toDeleteIds = existingIds.filter((id) => !data.some((row) => row.Id === id));
  if (toDeleteIds.length > 0) {
    await _sync.removeData("jf_users", toDeleteIds);
  }

  //update usernames on log table where username does not match the user table
  await db.query(
    'UPDATE jf_playback_activity a SET "UserName" = u."Name" FROM jf_users u WHERE u."Id" = a."UserId" AND u."Name" <> a."UserName"'
  );
  syncTask.loggedData.push({ color: "yellow", Message: "User Sync Complete" });
}

async function syncLibraryFolders(data, existing_excluded_libraries) {
  sendUpdate(syncTask.wsKey, { type: "Update", message: "Syncing Library Folders" });
  syncTask.loggedData.push({ color: "lawngreen", Message: "Syncing... 2/7" });
  syncTask.loggedData.push({ color: "yellow", Message: "Beginning Library Sync" });
  const _sync = new sync();
  const existingIds = await db
    .query(`SELECT "Id" FROM jf_libraries where "archived" = false `)
    .then((res) => res.rows.map((row) => row.Id));
  let dataToInsert = await data.map(jf_libraries_mapping);

  if (dataToInsert.length !== 0) {
    await _sync.insertData("jf_libraries", dataToInsert, jf_libraries_columns);
  }

  //archive libraries and items instead of deleting them

  const toArchiveLibraryIds = existingIds.filter((id) => !data.some((row) => row.Id === id));
  if (toArchiveLibraryIds.length > 0) {
    sendUpdate(syncTask.wsKey, { type: "Update", message: "Archiving old Library Data" });

    //dont archive items that exist on jellyfin but where marked as excluded in the config
    if (toArchiveLibraryIds.filter((id) => !existing_excluded_libraries.some((row) => row.Id === id)).length > 0) {
      const ItemsToArchive = await db
        .query(
          `SELECT "Id" FROM jf_library_items where "archived" = false and "ParentId" in (${toArchiveLibraryIds
            .filter((id) => !existing_excluded_libraries.some((row) => row.Id === id))
            .map((id) => `'${id}'`)
            .join(",")})`
        )
        .then((res) => res.rows.map((row) => row.Id));
      if (ItemsToArchive.length > 0) {
        await _sync.updateSingleFieldOnDB("jf_library_items", ItemsToArchive, "archived", true);
      }
    }

    await _sync.updateSingleFieldOnDB("jf_libraries", toArchiveLibraryIds, "archived", true);

    syncTask.loggedData.push({ color: "yellow", Message: "Library Sync Complete" });
  }
}
async function syncLibraryItems(data) {
  const _sync = new sync();
  const existingLibraryIds = await _sync.getExistingIDsforTable("jf_libraries"); // get existing library Ids from the db

  syncTask.loggedData.push({ color: "lawngreen", Message: "Syncing... 3/7" });
  sendUpdate(syncTask.wsKey, { type: "Update", message: "Beginning Library Item Sync (3/7)" });
  syncTask.loggedData.push({ color: "yellow", Message: "Beginning Library Item Sync" });

  data = data.filter((row) => existingLibraryIds.includes(row.ParentId));

  const existingIds = await _sync.getExistingIDsforTable("jf_library_items where archived=false");

  let dataToInsert = await data.map(jf_library_items_mapping);
  dataToInsert = dataToInsert.filter((item) => item.Id !== undefined);

  if (syncTask.taskName === taskName.partialsync) {
    dataToInsert = dataToInsert.filter((item) => !existingIds.includes(item.Id));
  }

  if (dataToInsert.length > 0) {
    await _sync.insertData("jf_library_items", dataToInsert, jf_library_items_columns);
  }

  syncTask.loggedData.push({
    color: "dodgerblue",
    Message: `${
      syncTask.taskName === taskName.partialsync ? dataToInsert.length : Math.max(dataToInsert.length - existingIds.length, 0)
    } Rows Inserted. ${syncTask.taskName === taskName.partialsync ? 0 : existingIds.length} Rows Updated.`,
  });

  if (syncTask.taskName === taskName.fullsync) {
    let toArchiveIds = existingIds.filter((id) => !data.some((row) => row.Id === id));

    if (toArchiveIds.length > 0) {
      await _sync.updateSingleFieldOnDB("jf_library_items", toArchiveIds, "archived", true);
    }

    syncTask.loggedData.push({ color: "orange", Message: toArchiveIds.length + " Library Items Archived." });
  }

  syncTask.loggedData.push({ color: "yellow", Message: "Item Sync Complete" });
}

async function syncShowItems(data) {
  const _sync = new sync();
  syncTask.loggedData.push({ color: "lawngreen", Message: "Syncing... 4/7" });
  sendUpdate(syncTask.wsKey, { type: "Update", message: "Beginning Show Item Sync (4/7)" });
  syncTask.loggedData.push({ color: "yellow", Message: "Beginning Seasons and Episode sync" });

  const { rows: shows } = await db.query(`SELECT *	FROM public.jf_library_items where "Type"='Series'`);

  let insertSeasonsCount = 0;
  let insertEpisodeCount = 0;
  let updateSeasonsCount = 0;
  let updateEpisodeCount = 0;

  //loop for each show
  for (const show of shows) {
    //get all seasons and episodes for this show from the data
    const allSeasons = data.filter((item) => item.Type === "Season" && item.SeriesId === show.Id);
    const allEpisodes = data.filter((item) => item.Type === "Episode" && item.SeriesId === show.Id);

    if (allSeasons.length > 0 || allEpisodes.length > 0) {
      const existingIdsSeasons = await db
        .query(`SELECT *	FROM public.jf_library_seasons where "SeriesId" = '${show.Id}'`)
        .then((res) => res.rows.map((row) => row.Id));
      let existingIdsEpisodes = [];
      if (existingIdsSeasons.length > 0) {
        existingIdsEpisodes = await db
          .query(
            `SELECT * FROM public.jf_library_episodes WHERE "SeasonId" IN (${existingIdsSeasons
              .filter((seasons) => seasons !== "")
              .map((seasons) => pgp.as.value(seasons))
              .map((value) => "'" + value + "'")
              .join(", ")})`
          )
          .then((res) => res.rows.map((row) => row.EpisodeId));
      }

      let seasonsToInsert = [];
      let episodesToInsert = [];

      seasonsToInsert = await allSeasons.map(jf_library_seasons_mapping);
      episodesToInsert = await allEpisodes.map(jf_library_episodes_mapping);

      //for partial sync, dont overwrite existing data
      if (syncTask.taskName === taskName.partialsync) {
        seasonsToInsert = seasonsToInsert.filter((season) => !existingIdsSeasons.some((id) => id === season.Id));
        episodesToInsert = episodesToInsert.filter((episode) => !existingIdsEpisodes.some((id) => id === episode.EpisodeId));
      }

      //Bulkinsert new seasons not on db
      if (seasonsToInsert.length !== 0) {
        let result = await db.insertBulk("jf_library_seasons", seasonsToInsert, jf_library_seasons_columns);
        if (result.Result === "SUCCESS") {
          insertSeasonsCount +=
            syncTask.taskName === taskName.partialsync
              ? seasonsToInsert.length
              : Math.max(seasonsToInsert.length - existingIdsSeasons.length, 0);
          updateSeasonsCount += syncTask.taskName === taskName.partialsync ? 0 : existingIdsSeasons.length;
        } else {
          syncTask.loggedData.push({
            color: "red",
            Message: "Error performing bulk insert:" + result.message,
          });
          await logging.updateLog(syncTask.uuid, syncTask.loggedData, taskstate.FAILED);
        }
      }

      //Bulkinsert new episodes not on db
      if (episodesToInsert.length !== 0) {
        let result = await db.insertBulk("jf_library_episodes", episodesToInsert, jf_library_episodes_columns);
        if (result.Result === "SUCCESS") {
          insertEpisodeCount +=
            syncTask.taskName === taskName.partialsync
              ? episodesToInsert.length
              : Math.max(episodesToInsert.length - existingIdsEpisodes.length, 0);
          updateEpisodeCount += syncTask.taskName === taskName.partialsync ? 0 : existingIdsEpisodes.length;
        } else {
          syncTask.loggedData.push({
            color: "red",
            Message: "Error performing bulk insert:" + result.message,
          });
          await logging.updateLog(syncTask.uuid, syncTask.loggedData, taskstate.FAILED);
        }
      }

      if (syncTask.taskName === taskName.fullsync) {
        let toArchiveSeasons = existingIdsSeasons.filter((id) => !seasonsToInsert.some((row) => row.Id === id));
        let toArchiveEpisodes = existingIdsEpisodes.filter(
          (EpisodeId) => !episodesToInsert.some((row) => row.EpisodeId === EpisodeId)
        );

        if (toArchiveSeasons.length > 0) {
          await _sync.updateSingleFieldOnDB("jf_library_seasons", toArchiveSeasons, "archived", true);
          syncTask.loggedData.push({ color: "orange", Message: toArchiveSeasons.length + " Seasons Archived." });
        }
        if (toArchiveEpisodes.length > 0) {
          await _sync.updateSingleFieldOnDB("jf_library_episodes", toArchiveEpisodes, "archived", true, "EpisodeId");

          syncTask.loggedData.push({ color: "orange", Message: toArchiveEpisodes.length + " Episodes Archived." });
        }
      }
    }
  }

  syncTask.loggedData.push({
    color: "dodgerblue",
    Message: `Seasons: ${insertSeasonsCount} Rows Inserted. ${updateSeasonsCount} Rows Updated.`,
  });
  syncTask.loggedData.push({
    color: "dodgerblue",
    Message: `Episodes: ${insertEpisodeCount} Rows Inserted. ${updateEpisodeCount} Rows Updated.`,
  });
  syncTask.loggedData.push({ color: "yellow", Message: "Sync Complete" });
}
async function syncItemInfo(seasons_and_episodes, library_items) {
  syncTask.loggedData.push({ color: "lawngreen", Message: "Syncing... 5/7" });
  sendUpdate(syncTask.wsKey, { type: "Update", message: "Beginning Item Info Sync (5/7)" });
  syncTask.loggedData.push({ color: "yellow", Message: "Beginning File Info Sync" });

  let Items = library_items.filter((item) => item.Type !== "Series" && item.Type !== "Folder" && item.Id !== undefined);
  let Episodes = seasons_and_episodes.filter((item) => item.Type === "Episode" && item.Id !== undefined);

  let insertItemInfoCount = 0;
  let insertEpisodeInfoCount = 0;
  let updateItemInfoCount = 0;
  let updateEpisodeInfoCount = 0;

  let current_item = 0;
  let all_items = Items.length;
  let data_to_insert = [];
  //loop for each Movie
  for (const Item of Items) {
    current_item++;
    sendUpdate(syncTask.wsKey, {
      type: "Update",
      message: `Syncing Item Info ${((current_item / all_items) * 100).toFixed(2)}%`,
    });
    const existingItemInfo = await db
      .query(`SELECT *	FROM public.jf_item_info where "Id" = '${Item.Id}'`)
      .then((res) => res.rows.map((row) => row.Id));

    if ((existingItemInfo.length == 0 && syncTask.taskName === taskName.partialsync) || syncTask.taskName === taskName.fullsync) {
      //dont update item info if it already exists and running a partial sync
      const mapped_data = await Item.MediaSources.map((item) => jf_item_info_mapping(item, "Item"));
      data_to_insert.push(...mapped_data);

      if (mapped_data.length !== 0) {
        insertItemInfoCount += mapped_data.length - existingItemInfo.length;
        updateItemInfoCount += existingItemInfo.length;
      }
    }
  }

  let current_episode = 0;
  let all_episodes = Episodes.length;
  //loop for each Episode
  for (const Episode of Episodes) {
    current_episode++;
    sendUpdate(syncTask.wsKey, {
      type: "Update",
      message: `Syncing Episode Info ${((current_episode / all_episodes) * 100).toFixed(2)}%`,
    });

    const existingEpisodeItemInfo = await db
      .query(`SELECT *	FROM public.jf_item_info where "Id" = '${Episode.Id}'`)
      .then((res) => res.rows.map((row) => row.Id));

    if (
      (existingEpisodeItemInfo.length == 0 && syncTask.taskName === taskName.partialsync) ||
      syncTask.taskName === taskName.fullsync
    ) {
      //dont update item info if it already exists and running a partial sync
      const mapped_data = await Episode.MediaSources.map((item) => jf_item_info_mapping(item, "Episode"));
      data_to_insert.push(...mapped_data);

      //filter fix if jf_libraries is empty
      if (mapped_data.length !== 0) {
        insertEpisodeInfoCount += mapped_data.length - existingEpisodeItemInfo.length;
        updateEpisodeInfoCount += existingEpisodeItemInfo.length;
      }
    }
  }

  if (data_to_insert.length !== 0) {
    let result = await db.insertBulk("jf_item_info", data_to_insert, jf_item_info_columns);
    if (result.Result !== "SUCCESS") {
      syncTask.loggedData.push({
        color: "red",
        Message: "Error performing bulk insert:" + result.message,
      });
      await logging.updateLog(syncTask.uuid, syncTask.loggedData, taskstate.FAILED);
    }
  }

  syncTask.loggedData.push({
    color: "dodgerblue",
    Message:
      (insertItemInfoCount > 0 ? insertItemInfoCount : 0) + " Item Info inserted. " + updateItemInfoCount + " Item Info Updated",
  });
  syncTask.loggedData.push({
    color: "dodgerblue",
    Message:
      (insertEpisodeInfoCount > 0 ? insertEpisodeInfoCount : 0) +
      " Episodes Info inserted. " +
      updateEpisodeInfoCount +
      " Episodes Info Updated",
  });
  syncTask.loggedData.push({ color: "yellow", Message: "Info Sync Complete" });
  sendUpdate(syncTask.wsKey, { type: "Update", message: "Info Sync Complete" });
}

async function removeOrphanedData() {
  const _sync = new sync();
  syncTask.loggedData.push({ color: "lawngreen", Message: "Syncing... 6/7" });
  sendUpdate(syncTask.wsKey, { type: "Update", message: "Cleaning up FileInfo/Episode/Season Records (6/7)" });
  syncTask.loggedData.push({ color: "yellow", Message: "Removing Orphaned FileInfo/Episode/Season Records" });

  await db.query("CALL jd_remove_orphaned_data()");
  const archived_items = await db
    .query(`select "Id" from jf_library_items where archived=true and "Type"='Series'`)
    .then((res) => res.rows.map((row) => row.Id));
  const archived_seasons = await db
    .query(`select "Id" from jf_library_seasons where archived=true`)
    .then((res) => res.rows.map((row) => row.Id));
  await _sync.updateSingleFieldOnDB("jf_library_seasons", archived_items, "archived", true, "SeriesId");
  await _sync.updateSingleFieldOnDB("jf_library_episodes", archived_items, "archived", true, "SeriesId");
  await _sync.updateSingleFieldOnDB("jf_library_episodes", archived_seasons, "archived", true, "SeasonId");

  syncTask.loggedData.push({ color: "dodgerblue", Message: "Orphaned FileInfo/Episode/Season Removed." });

  syncTask.loggedData.push({ color: "Yellow", Message: "Sync Complete" });
}

async function migrateArchivedActivty() {
  const _sync = new sync();
  syncTask.loggedData.push({ color: "lawngreen", Message: "Syncing... 7/7" });
  sendUpdate(syncTask.wsKey, { type: "Update", message: "Migrating Archived Activity to New Items (7/7)" });
  syncTask.loggedData.push({ color: "yellow", Message: "Migrating Archived Activity to New Items" });

  //Movies
  const movie_query = `
  SELECT a."NowPlayingItemId" "OldNowPlayingItemId",i."Id" "NowPlayingItemId"
	FROM jf_playback_activity a
	join jf_library_items i
	on a."NowPlayingItemName"=i."Name"
	and a."NowPlayingItemId"!=i."Id"
	and i.archived=false

  where a."EpisodeId" is null
  AND NOT EXISTS
  (
      SELECT 1
      FROM jf_library_items i_e
      WHERE a."NowPlayingItemId" = i_e."Id"
      AND i_e.archived = false
  )
  `;

  const episode_query = `
  SELECT a."EpisodeId" "OldEpisodeId",e."EpisodeId",e."SeasonId",e."SeriesId"
	FROM jf_playback_activity a
	join jf_library_episodes e
	on a."NowPlayingItemName"=e."Name"
  and a."SeriesName"=e."SeriesName"
	and a."EpisodeId"!=e."EpisodeId"
	and e.archived=false

  where a."EpisodeId" is not null

  AND NOT EXISTS
  (
      SELECT 1
      FROM jf_library_episodes i_e
      WHERE a."EpisodeId" = i_e."EpisodeId"
      AND i_e.archived = false
  )
  `;

  const { rows: movieMapping } = await db.query(movie_query);
  const { rows: episodeMapping } = await db.query(episode_query);

  for (const movie of movieMapping) {
    const updateQuery = `UPDATE jf_playback_activity SET "NowPlayingItemId" = '${movie.NowPlayingItemId}' WHERE "NowPlayingItemId" = '${movie.OldNowPlayingItemId}'`;
    await db.query(updateQuery);
  }

  for (const episode of episodeMapping) {
    const updateQuery = `UPDATE jf_playback_activity SET "EpisodeId" = '${episode.EpisodeId}', "SeasonId"='${episode.SeasonId}', "NowPlayingItemId"='${episode.SeriesId}' WHERE "EpisodeId" = '${episode.OldEpisodeId}'`;
    await db.query(updateQuery);
  }

  syncTask.loggedData.push({ color: "dodgerblue", Message: "Archived Activity Migrated to New Items Succesfully." });

  syncTask.loggedData.push({ color: "Yellow", Message: "Sync Complete" });
}

async function syncPlaybackPluginData() {
  PlaybacksyncTask.loggedData.push({ color: "lawngreen", Message: "Syncing..." });

  //Playback Reporting Plugin Check
  const installed_plugins = await Jellyfin.getInstalledPlugins();

  const hasPlaybackReportingPlugin = installed_plugins.filter(
    (plugins) => plugins?.ConfigurationFileName === "Jellyfin.Plugin.PlaybackReporting.xml"
  );

  if (!hasPlaybackReportingPlugin || hasPlaybackReportingPlugin.length === 0) {
    if (!hasPlaybackReportingPlugin || hasPlaybackReportingPlugin.length === 0) {
      PlaybacksyncTask.loggedData.push({ color: "dodgerblue", Message: `No new data to insert.` });
    } else {
      PlaybacksyncTask.loggedData.push({ color: "lawngreen", Message: "Playback Reporting Plugin not detected. Skipping step." });
    }
  } else {
    //

    PlaybacksyncTask.loggedData.push({ color: "dodgerblue", Message: "Determining query constraints." });
    const OldestPlaybackActivity = await db
      .query('SELECT  MIN("ActivityDateInserted") "OldestPlaybackActivity" FROM public.jf_playback_activity')
      .then((res) => res.rows[0]?.OldestPlaybackActivity);

    const MaxPlaybackReportingPluginID = await db
      .query('SELECT MAX(rowid) "MaxRowId" FROM jf_playback_reporting_plugin_data')
      .then((res) => res.rows[0]?.MaxRowId);

    //Query Builder
    let query = `SELECT rowid, * FROM PlaybackActivity`;

    if (OldestPlaybackActivity) {
      const formattedDateTime = moment(OldestPlaybackActivity).format("YYYY-MM-DD HH:mm:ss");

      query = query + ` WHERE DateCreated < '${formattedDateTime}'`;

      if (MaxPlaybackReportingPluginID) {
        query = query + ` AND rowid > ${MaxPlaybackReportingPluginID}`;
      }
    } else if (MaxPlaybackReportingPluginID) {
      query = query + ` WHERE rowid > ${MaxPlaybackReportingPluginID}`;
    }

    query += " order by rowid";

    PlaybacksyncTask.loggedData.push({ color: "dodgerblue", Message: "Query built. Executing." });
    //

    const PlaybackData = await Jellyfin.StatsSubmitCustomQuery(query);

    let DataToInsert = await PlaybackData.map(mappingPlaybackReporting);

    if (DataToInsert.length > 0) {
      PlaybacksyncTask.loggedData.push({ color: "dodgerblue", Message: `Inserting ${DataToInsert.length} Rows.` });
      let result = await db.insertBulk("jf_playback_reporting_plugin_data", DataToInsert, columnsPlaybackReporting);

      if (result.Result === "SUCCESS") {
        PlaybacksyncTask.loggedData.push({ color: "dodgerblue", Message: `${DataToInsert.length} Rows have been inserted.` });
        PlaybacksyncTask.loggedData.push({
          color: "yellow",
          Message: "Running process to format data to be inserted into the Activity Table",
        });
      } else {
        PlaybacksyncTask.loggedData.push({ color: "red", Message: "Error: " + result.message });
        await logging.updateLog(PlaybacksyncTask.uuid, PlaybacksyncTask.loggedData, taskstate.FAILED);
      }
    }

    PlaybacksyncTask.loggedData.push({ color: "dodgerblue", Message: "Process complete. Data has been imported." });
  }
  await db.query("CALL ji_insert_playback_plugin_data_to_activity_table()");
  PlaybacksyncTask.loggedData.push({ color: "dodgerblue", Message: "Any imported data has been processed." });

  PlaybacksyncTask.loggedData.push({ color: "lawngreen", Message: `Playback Reporting Plugin Sync Complete` });
}

async function updateLibraryStatsData() {
  syncTask.loggedData.push({ color: "yellow", Message: "Updating Library Stats" });

  await db.query("CALL ju_update_library_stats_data()");

  syncTask.loggedData.push({ color: "dodgerblue", Message: "Library Stats Updated." });
}

async function fullSync(triggertype) {
  const config = await new configClass().getConfig();

  const uuid = randomUUID();
  syncTask = { loggedData: [], uuid: uuid, wsKey: "FullSyncTask", taskName: taskName.fullsync };
  try {
    sendUpdate(syncTask.wsKey, { type: "Start", message: triggertype + " " + taskName.fullsync + " Started" });
    await logging.insertLog(uuid, triggertype, taskName.fullsync);

    if (config.error) {
      syncTask.loggedData.push({ Message: config.error });
      await logging.updateLog(syncTask.uuid, syncTask.loggedData, taskstate.FAILED);
      return;
    }

    let libraries = await Jellyfin.getLibraries();
    if (libraries.length === 0) {
      syncTask.loggedData.push({ Message: "Error: No Libararies found to sync." });
      await logging.updateLog(syncTask.uuid, syncTask.loggedData, taskstate.FAILED);
      sendUpdate(syncTask.wsKey, { type: "Success", message: triggertype + " " + taskName.fullsync + " Completed" });
      return;
    }

    const excluded_libraries = config.settings.ExcludedLibraries || [];

    let filtered_libraries = libraries.filter((library) => !excluded_libraries.includes(library.Id));
    let existing_excluded_libraries = libraries.filter((library) => excluded_libraries.includes(library.Id));

    //clear data from memory as its no longer needed
    libraries = null;

    let data = [];

    //for each item in library run get item using that id as the ParentId (This gets the children of the parent id)
    for (let i = 0; i < filtered_libraries.length; i++) {
      const item = filtered_libraries[i];
      const wsMessage = "Fetching Data for Library : " + item.Name + ` (${i + 1}/${filtered_libraries.length})`;
      sendUpdate(syncTask.wsKey, {
        type: "Update",
        message: wsMessage,
      });

      let libraryItems = await Jellyfin.getItemsFromParentId({
        id: item.Id,
        ws: sendUpdate,
        syncTask: syncTask,
        wsMessage: wsMessage,
      });
      if (libraryItems.length === 0) {
        syncTask.loggedData.push({ Message: "Error: No Items found for Library : " + item.Name });
      }

      sendUpdate(syncTask.wsKey, { type: "Update", message: "Mapping Data for Library : " + item.Name });

      const libraryItemsWithParent = libraryItems.map((items) => ({
        ...items,
        ...{ ParentId: item.Id },
      }));
      data.push(...libraryItemsWithParent);
      sendUpdate(syncTask.wsKey, { type: "Update", message: "Data Fetched for Library : " + item.Name });
    }
    let library_items = data.filter((item) => ["Movie", "Audio", "Series"].includes(item.Type));
    let seasons_and_episodes = data.filter((item) => ["Season", "Episode"].includes(item.Type));

    //clear data from memory as its no longer needed
    data = null;

    //syncUserData
    await syncUserData();

    //syncLibraryFolders
    await syncLibraryFolders(filtered_libraries, existing_excluded_libraries);

    //clear data from memory as its no longer needed
    filtered_libraries = null;
    existing_excluded_libraries = null;

    //syncLibraryItems
    await syncLibraryItems(library_items);

    //syncShowItems
    await syncShowItems(seasons_and_episodes);

    //syncItemInfo
    await syncItemInfo(seasons_and_episodes, library_items);

    //clear data from memory as its no longer needed
    library_items = null;
    seasons_and_episodes = null;

    //removeOrphanedData
    await removeOrphanedData();

    await migrateArchivedActivty();

    await updateLibraryStatsData();

    await logging.updateLog(syncTask.uuid, syncTask.loggedData, taskstate.SUCCESS);

    sendUpdate(syncTask.wsKey, { type: "Success", message: triggertype + " Sync Completed" });
  } catch (error) {
    syncTask.loggedData.push({ color: "red", Message: getErrorLineNumber(error) + ": Error: " + error });
    await logging.updateLog(syncTask.uuid, syncTask.loggedData, taskstate.FAILED);
    sendUpdate(syncTask.wsKey, { type: "Error", message: triggertype + " Sync Halted with Errors" });
  }
}

async function partialSync(triggertype) {
  const config = await new configClass().getConfig();

  const uuid = randomUUID();

  syncTask = { loggedData: [], uuid: uuid, wsKey: "PartialSyncTask", taskName: taskName.partialsync };
  try {
    sendUpdate(syncTask.wsKey, { type: "Start", message: triggertype + " " + taskName.partialsync + " Started" });
    await logging.insertLog(uuid, triggertype, taskName.partialsync);

    if (config.error) {
      syncTask.loggedData.push({ Message: config.error });
      await logging.updateLog(syncTask.uuid, syncTask.loggedData, taskstate.FAILED);
      return;
    }

    const libraries = await Jellyfin.getLibraries();

    if (libraries.length === 0) {
      syncTask.loggedData.push({ Message: "Error: No Libararies found to sync." });
      await logging.updateLog(syncTask.uuid, syncTask.loggedData, taskstate.FAILED);
      sendUpdate(syncTask.wsKey, { type: "Success", message: triggertype + " " + taskName.fullsync + " Completed" });
      return;
    }

    const excluded_libraries = config.settings.ExcludedLibraries || [];

    const filtered_libraries = libraries.filter((library) => !excluded_libraries.includes(library.Id));
    const existing_excluded_libraries = libraries.filter((library) => excluded_libraries.includes(library.Id));

    let data = [];

    //for each item in library run get item using that id as the ParentId (This gets the children of the parent id)
    for (let i = 0; i < filtered_libraries.length; i++) {
      const library = filtered_libraries[i];
      sendUpdate(syncTask.wsKey, {
        type: "Update",
        message: "Fetching Data for Library : " + library.Name + ` (${i + 1}/${filtered_libraries.length})`,
      });
      let recentlyAddedForLibrary = await Jellyfin.getRecentlyAdded({ libraryid: library.Id, limit: 10 });

      sendUpdate(syncTask.wsKey, { type: "Update", message: "Mapping Data for Library : " + library.Name });
      const libraryItemsWithParent = recentlyAddedForLibrary.map((items) => ({
        ...items,
        ...{ ParentId: library.Id },
      }));
      data.push(...libraryItemsWithParent);
      sendUpdate(syncTask.wsKey, { type: "Update", message: "Data Fetched for Library : " + library.Name });
    }

    const library_items = data.filter((item) => ["Movie", "Audio", "Series"].includes(item.Type));

    for (const item of library_items.filter((item) => item.Type === "Series")) {
      let dataForShow = await Jellyfin.getItemsFromParentId({ id: item.Id });
      const seasons_and_episodes_for_show = dataForShow.filter((item) => ["Season", "Episode"].includes(item.Type));
      data.push(...seasons_and_episodes_for_show);
    }

    const seasons_and_episodes = data.filter((item) => ["Season", "Episode"].includes(item.Type));

    //clear data from memory as its no longer needed
    data = null;

    //   //syncUserData
    await syncUserData();

    //   //syncLibraryFolders
    await syncLibraryFolders(filtered_libraries, existing_excluded_libraries);

    //syncLibraryItems
    await syncLibraryItems(library_items);

    //syncShowItems
    await syncShowItems(seasons_and_episodes);

    //syncItemInfo
    await syncItemInfo(seasons_and_episodes, library_items);

    //removeOrphanedData
    await removeOrphanedData();

    await migrateArchivedActivty();

    await updateLibraryStatsData();

    await logging.updateLog(syncTask.uuid, syncTask.loggedData, taskstate.SUCCESS);

    sendUpdate(syncTask.wsKey, { type: "Success", message: triggertype + " Sync Completed" });
  } catch (error) {
    syncTask.loggedData.push({ color: "red", Message: getErrorLineNumber(error) + ": Error: " + error });
    await logging.updateLog(syncTask.uuid, syncTask.loggedData, taskstate.FAILED);
    sendUpdate(syncTask.wsKey, { type: "Error", message: triggertype + " Sync Halted with Errors" });
  }
}

////////////////////////////////////////API Calls

///////////////////////////////////////Sync All
router.get("/beginSync", async (req, res) => {
  const config = await new configClass().getConfig();

  if (config.error) {
    res.send({ error: "Config Details Not Found" });
    return;
  }

  const last_execution = await db
    .query(
      `SELECT "Result"
  FROM public.jf_logging
  WHERE "Name"='${taskName.fullsync}'
  ORDER BY "TimeRun" DESC
  LIMIT 1`
    )
    .then((res) => res.rows);

  if (last_execution.length !== 0) {
    if (last_execution[0].Result === taskstate.RUNNING) {
      sendUpdate("TaskError", "Error: Sync is already running");
      res.send();
      return;
    }
  }

  await fullSync(triggertype.Manual);
  res.send();
});

router.get("/beginPartialSync", async (req, res) => {
  const config = await new configClass().getConfig();

  if (config.error) {
    res.send({ error: config.error });
    return;
  }

  const last_execution = await db
    .query(
      `SELECT "Result"
  FROM public.jf_logging
  WHERE "Name"='${taskName.partialsync}'
  ORDER BY "TimeRun" DESC
  LIMIT 1`
    )
    .then((res) => res.rows);

  if (last_execution.length !== 0) {
    if (last_execution[0].Result === taskstate.RUNNING) {
      sendUpdate("TaskError", "Error: Sync is already running");
      res.send();
      return;
    }
  }

  await partialSync(triggertype.Manual);
  res.send();
});

///////////////////////////////////////Write Users
router.post("/fetchItem", async (req, res) => {
  try {
    const config = await new configClass().getConfig();
    if (config.error) {
      res.send({ error: config.error });
      return;
    }

    const { itemId } = req.body;
    if (itemId === undefined) {
      res.status(400);
      res.send("The itemId field is required.");
    }

    if (config.error) {
      res.status(503);
      res.send({ error: config.error });
      return;
    }

    const libraries = await Jellyfin.getLibraries();

    const item = [];

    for (let i = 0; i < libraries.length; i++) {
      const library = libraries[i];

      let libraryItems = await Jellyfin.getItemsFromParentId({ id: library.Id, itemid: itemId });

      if (libraryItems.length > 0) {
        const libraryItemsWithParent = libraryItems.map((items) => ({
          ...items,
          ...{ ParentId: library.Id },
        }));
        item.push(...libraryItemsWithParent);
      }
    }
    if (item.length === 0) {
      res.status(404);
      res.send({ error: "Error: Item not found in library" });
      return;
    }

    let insertTable = "jf_library_items";
    let itemToInsert = await item.map((item) => {
      if (item.Type === "Episode") {
        insertTable = "jf_library_episodes";
        return jf_library_episodes_mapping(item);
      } else if (item.Type === "Season") {
        insertTable = "jf_library_seasons";
        return jf_library_seasons_mapping(item);
      } else {
        return jf_library_items_mapping(item);
      }
    });
    let itemInfoToInsert = await item
      .map((item) =>
        item.MediaSources.map((iteminfo) => jf_item_info_mapping(iteminfo, item.Type == "Episode" ? "Episode" : "Item"))
      )
      .flat();

    if (itemToInsert.length !== 0) {
      let result = await db.insertBulk(
        insertTable,
        itemToInsert,
        insertTable == "jf_library_items"
          ? jf_library_items_columns
          : insertTable == "jf_library_seasons"
          ? jf_library_seasons_columns
          : jf_library_episodes_columns
      );
      if (result.Result === "SUCCESS") {
        let result_info = await db.insertBulk("jf_item_info", itemInfoToInsert, jf_item_info_columns);
        if (result_info.Result === "SUCCESS") {
          res.send("Item Synced");
        } else {
          res.status(500);
          res.send("Unable to insert Item Info: " + result_info.message);
        }
      } else {
        res.status(500);
        res.send("Unable to insert Item: " + result.message);
      }
    } else {
      res.status(404);
      res.send("Unable to find Item");
    }
  } catch (error) {
    console.log(error);
    res.status(500);
    res.send(error);
  }
});

//////////////////////////////////////

//////////////////////////////////////////////////////syncPlaybackPluginData
router.get("/syncPlaybackPluginData", async (req, res) => {
  const config = await new configClass().getConfig();

  const uuid = randomUUID();
  PlaybacksyncTask = { loggedData: [], uuid: uuid };
  try {
    await logging.insertLog(uuid, triggertype.Manual, taskName.import);
    sendUpdate("PlaybackSyncTask", { type: "Start", message: "Playback Plugin Sync Started" });

    if (config.error) {
      res.send({ error: config.error });
      PlaybacksyncTask.loggedData.push({ Message: config.error });
      await logging.updateLog(uuid, PlaybacksyncTask.loggedData, taskstate.FAILED);
      return;
    }

    await sleep(5000);
    await syncPlaybackPluginData();

    await logging.updateLog(PlaybacksyncTask.uuid, PlaybacksyncTask.loggedData, taskstate.SUCCESS);
    sendUpdate("PlaybackSyncTask", { type: "Success", message: "Playback Plugin Sync Completed" });
    res.send("syncPlaybackPluginData Complete");
  } catch (error) {
    PlaybacksyncTask.loggedData.push({ color: "red", Message: getErrorLineNumber(error) + ": Error: " + error });
    await logging.updateLog(PlaybacksyncTask.uuid, PlaybacksyncTask.loggedData, taskstate.FAILED);
    res.send("syncPlaybackPluginData Halted with Errors");
  }
});

function sleep(ms) {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

//////////////////////////////////////

module.exports = {
  router,
  fullSync,
  partialSync,
};
