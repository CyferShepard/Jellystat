// api.js
const express = require("express");

const db = require("../db");
const pgp = require("pg-promise")();
const { randomUUID } = require("crypto");

const { axios } = require("../classes/axios");
const configClass = require("../classes/config");
const { checkForUpdates } = require("../version-control");
const API = require("../classes/api-loader");
const { sendUpdate } = require("../ws");
const moment = require("moment");
const { tables } = require("../global/backup_tables");

const router = express.Router();

//Functions
function groupActivity(rows) {
  const groupedResults = {};
  rows.forEach((row) => {
    const key = row.NowPlayingItemId + row.EpisodeId + row.UserId;
    if (groupedResults[key]) {
      if (row.ActivityDateInserted > groupedResults[key].ActivityDateInserted) {
        groupedResults[key] = {
          ...row,
          results: groupedResults[key].results,
        };
      }
      groupedResults[key].results.push(row);
    } else {
      groupedResults[key] = {
        ...row,
        results: [],
      };
      groupedResults[key].results.push(row);
    }
  });

  // Update GroupedResults with playbackDurationSum
  Object.values(groupedResults).forEach((row) => {
    if (row.results && row.results.length > 0) {
      row.PlaybackDuration = row.results.reduce((acc, item) => acc + parseInt(item.PlaybackDuration), 0);
      row.TotalPlays = row.results.length;
    }
  });
  return groupedResults;
}

function groupRecentlyAdded(rows) {
  const groupedResults = {};
  rows.forEach((row) => {
    if (row.Type != "Movie") {
      const key = row.SeriesId + row.SeasonId;
      if (groupedResults[key]) {
        groupedResults[key].NewEpisodeCount++;
      } else {
        groupedResults[key] = { ...row };
        if (row.Type != "Series" && row.Type != "Movie") {
          groupedResults[key].NewEpisodeCount = 1;
        }
      }
    } else {
      groupedResults[row.Id] = {
        ...row,
      };
    }
  });

  return Object.values(groupedResults);
}

async function purgeLibraryItems(id, withActivity, purgeAll = false) {
  let items_query = `select * from jf_library_items where "ParentId"=$1`;

  const { rows: items } = await db.query(items_query, [id]);
  let seasonIds = [];
  let episodeIds = [];

  for (const item of items) {
    let season_query = `select * from jf_library_seasons where "SeriesId"=$1`;
    if (!item.archived && !purgeAll) {
      season_query += " and archived=true";
    }
    const { rows: seasons } = await db.query(season_query, [item.Id]);
    seasonIds.push(...seasons.map((item) => item.Id));
    if (seasons.length > 0) {
      for (const season of seasons) {
        let episode_query = `select * from jf_library_episodes where "SeasonId"=$1`;
        if (!item.archived && !season.archived && !purgeAll) {
          episode_query += " and archived=true";
        }
        const { rows: episodes } = await db.query(episode_query, [season.Id]);
        episodeIds.push(...episodes.map((item) => item.Id));
      }
    } else {
      let episode_query = `select * from jf_library_episodes where "SeriesId"=$1`;
      if (!item.archived && !purgeAll) {
        episode_query += " and archived=true";
      }
      const { rows: episodes } = await db.query(episode_query, [item.Id]);
      episodeIds.push(...episodes.map((item) => item.Id));
    }
  }

  if (episodeIds.length > 0) {
    await db.deleteBulk("jf_library_episodes", episodeIds);
  }

  if (seasonIds.length > 0) {
    await db.deleteBulk("jf_library_seasons", seasonIds);
  }

  items_query = items_query.replace("select *", "delete");
  if (!purgeAll) {
    items_query += ` and archived=true`;
  }
  await db.query(items_query, [id]);

  if (withActivity) {
    const deleteQuery = {
      text: `DELETE FROM jf_playback_activity WHERE${
        episodeIds.length > 0 ? ` "EpisodeId" IN (${pgp.as.csv(episodeIds)})  OR` : ""
      }${seasonIds.length > 0 ? ` "SeasonId" IN (${pgp.as.csv(seasonIds)}) OR` : ""} "NowPlayingItemId"='${id}'`,
    };
    await db.query(deleteQuery);
  }
}

router.get("/getconfig", async (req, res) => {
  try {
    const config = await new configClass().getConfig();
    if (config.error) {
      res.status(503);
      res.send({ error: config.error });
      return;
    }

    const payload = {
      JF_HOST: config.JF_HOST,
      APP_USER: config.APP_USER,
      settings: config.settings,
      REQUIRE_LOGIN: config.REQUIRE_LOGIN,
      IS_JELLYFIN: config.IS_JELLYFIN,
    };

    res.send(payload);
  } catch (error) {
    console.log(error);
  }
});

router.get("/getLibraries", async (req, res) => {
  try {
    const libraries = await db.query("SELECT * FROM jf_libraries").then((res) => res.rows);
    res.send(libraries);
  } catch (error) {
    res.status(503);
    res.send(error);
  }
});

router.get("/getRecentlyAdded", async (req, res) => {
  try {
    const { libraryid, limit = 50, GroupResults = true } = req.query;

    const config = await new configClass().getConfig();
    const excluded_libraries = config.settings.ExcludedLibraries || [];

    let recentlyAddedFromJellystat = await API.getRecentlyAdded({ libraryid: libraryid });

    let recentlyAddedFromJellystatMapped = recentlyAddedFromJellystat.map((item) => {
      return {
        Name: item.Name,
        SeriesName: item.SeriesName,
        Id: item.Id,
        SeriesId: item.SeriesId || null,
        SeasonId: item.SeasonId || null,
        EpisodeId: item.Type === "Episode" ? item.Id : null,

        SeasonNumber: item.ParentIndexNumber ?? null,
        EpisodeNumber: item.IndexNumber ?? null,
        PrimaryImageHash:
          item.ImageTags &&
          item.ImageTags.Primary &&
          item.ImageBlurHashes &&
          item.ImageBlurHashes.Primary &&
          item.ImageBlurHashes.Primary[item.ImageTags["Primary"]]
            ? item.ImageBlurHashes.Primary[item.ImageTags["Primary"]]
            : null,

        DateCreated: item.DateCreated ?? null,
        Type: item.Type,
      };
    });

    if (libraryid !== undefined) {
      const { rows } = await db.query(
        `SELECT i."Name", null "SeriesName", "Id", null "SeriesId", null "SeasonId", null "EpisodeId", null "SeasonNumber", null "EpisodeNumber",  "PrimaryImageHash",i."DateCreated", "Type", i."ParentId"
        FROM public.jf_library_items i
        where i.archived=false
          and i."ParentId"=$1
      union
      SELECT e."Name",  e."SeriesName",e."Id" , e."SeriesId", e."SeasonId", e."EpisodeId",  e."ParentIndexNumber" "SeasonNumber",  e."IndexNumber" "EpisodeNumber", e."PrimaryImageHash", e."DateCreated", e."Type", i."ParentId"
        FROM public.jf_library_episodes e
        JOIN public.jf_library_items i
        on i."Id"=e."SeriesId"
        where e.archived=false
        and i."ParentId"=$1
      order by "DateCreated" desc
      limit $2`,
        [libraryid, limit]
      );
      if (rows[0].DateCreated !== undefined && rows[0].DateCreated !== null) {
        let lastSynctedItemDate = moment(rows[0].DateCreated, "YYYY-MM-DD HH:mm:ss.SSSZ");

        recentlyAddedFromJellystatMapped = recentlyAddedFromJellystatMapped.filter((item) =>
          moment(item.DateCreated, "YYYY-MM-DD HH:mm:ss.SSSZ").isAfter(lastSynctedItemDate)
        );
      }

      const filteredDbRows = rows.filter((item) => !excluded_libraries.includes(item.ParentId));

      res.send([...recentlyAddedFromJellystatMapped, ...filteredDbRows]);
      return;
    }
    const { rows } = await db.query(
      `SELECT i."Name", null "SeriesName", "Id", null "SeriesId", null "SeasonId", null "EpisodeId", null "SeasonNumber" , null "EpisodeNumber" ,  "PrimaryImageHash",i."DateCreated", "Type", i."ParentId"
      FROM public.jf_library_items i
      where i.archived=false
    union
    SELECT e."Name",  e."SeriesName",e."Id" , e."SeriesId", e."SeasonId", e."EpisodeId",  e."ParentIndexNumber"  "SeasonNumber",  e."IndexNumber" "EpisodeNumber", e."PrimaryImageHash", e."DateCreated", e."Type", i."ParentId"
      FROM public.jf_library_episodes e
       JOIN public.jf_library_items i
        on i."Id"=e."SeriesId"
      where e.archived=false
    order by "DateCreated" desc
    limit $1`,
      [limit]
    );

    if (rows[0].DateCreated !== undefined && rows[0].DateCreated !== null) {
      let lastSynctedItemDate = moment(rows[0].DateCreated, "YYYY-MM-DD HH:mm:ss.SSSZ");

      recentlyAddedFromJellystatMapped = recentlyAddedFromJellystatMapped.filter((item) =>
        moment(item.DateCreated, "YYYY-MM-DD HH:mm:ss.SSSZ").isAfter(lastSynctedItemDate)
      );
    }

    const filteredDbRows = rows.filter((item) => !excluded_libraries.includes(item.ParentId));

    let recentlyAdded = [...recentlyAddedFromJellystatMapped, ...filteredDbRows];
    recentlyAdded = recentlyAdded.filter((item) => item.Type !== "Series");

    if (GroupResults == true) {
      recentlyAdded = groupRecentlyAdded(recentlyAdded);
    }

    res.send(recentlyAdded);
    return;
  } catch (error) {
    res.status(503);
    res.send(error);
  }
});

router.post("/setconfig", async (req, res) => {
  try {
    const { JF_HOST, JF_API_KEY } = req.body;

    if (JF_HOST === undefined && JF_API_KEY === undefined) {
      res.status(400);
      res.send("JF_HOST and JF_API_KEY are required for configuration");
      return;
    }

    var url = JF_HOST;

    const validation = await API.validateSettings(url, JF_API_KEY);
    if (validation.isValid === false) {
      res.status(validation.status);
      res.send(validation);
      return;
    }

    const { rows: getConfig } = await db.query('SELECT * FROM app_config where "ID"=1');

    let query = 'UPDATE app_config SET "JF_HOST"=$1, "JF_API_KEY"=$2 where "ID"=1';
    if (getConfig.length === 0) {
      query = 'INSERT INTO app_config ("ID","JF_HOST","JF_API_KEY","APP_USER","APP_PASSWORD") VALUES (1,$1,$2,null,null)';
    }

    const { rows } = await db.query(query, [validation.cleanedUrl, JF_API_KEY]);

    const systemInfo = await API.systemInfo();

    if (systemInfo && systemInfo != {}) {
      const settingsjson = await db.query('SELECT settings FROM app_config where "ID"=1').then((res) => res.rows);

      if (settingsjson.length > 0) {
        const settings = settingsjson[0].settings || {};

        settings.ServerID = systemInfo?.Id || null;

        let query = 'UPDATE app_config SET settings=$1 where "ID"=1';

        await db.query(query, [settings]);
      }
    }
    res.send(rows);
  } catch (error) {
    console.log(error);
  }
});
router.post("/setPreferredAdmin", async (req, res) => {
  try {
    const { userid, username } = req.body;

    if (userid === undefined && username === undefined) {
      res.status(400);
      res.send("A valid userid and username is required for preferred admin");
      return;
    }

    const settingsjson = await db.query('SELECT settings FROM app_config where "ID"=1').then((res) => res.rows);

    if (settingsjson.length > 0) {
      const settings = settingsjson[0].settings || {};

      settings.preferred_admin = { userid: userid, username: username };

      let query = 'UPDATE app_config SET settings=$1 where "ID"=1';

      await db.query(query, [settings]);

      res.send("Settings updated succesfully");
    } else {
      res.status(404);
      res.send("Settings not found");
    }
  } catch (error) {
    console.log(error);
  }

  console.log(`ENDPOINT CALLED: /setconfig: `);
});

router.post("/setRequireLogin", async (req, res) => {
  try {
    const { REQUIRE_LOGIN } = req.body;

    if (REQUIRE_LOGIN === undefined || typeof REQUIRE_LOGIN !== "boolean") {
      res.status(400);
      res.send("A valid value(true/false) is required for REQUIRE_LOGIN");
      return;
    }

    let query = 'UPDATE app_config SET "REQUIRE_LOGIN"=$1 where "ID"=1';

    const { rows } = await db.query(query, [REQUIRE_LOGIN]);
    res.send(rows);
  } catch (error) {
    console.log(error);
  }
});

router.post("/updateCredentials", async (req, res) => {
  const { username, current_password, new_password } = req.body;
  const config = await new configClass().getConfig();

  let result = { isValid: true, errorMessage: "" };

  if (config.error) {
    result = { isValid: false, errorMessage: config.error };
    res.status(503);
    res.send(result);
    return;
  }
  if (username === undefined && current_password === undefined && new_password === undefined) {
    result.isValid = false;
    result.errorMessage = "Invalid Parameters";
    res.status(400);
    res.send(result);
    return;
  }

  if (username !== undefined && username === "") {
    result.isValid = false;
    result.errorMessage = "Username cannot be empty";
    res.status(400);
    res.send(result);
    return;
  }

  try {
    if (username !== undefined && config.APP_USER !== username) {
      await db.query(`UPDATE app_config SET "APP_USER"='${username}' where "ID"=1`);
    }

    if (current_password === undefined && new_password === undefined) {
      res.status(400);
      res.send(result);
      return;
    }

    if (config.APP_PASSWORD === current_password) {
      if (config.APP_PASSWORD === new_password) {
        result.isValid = false;
        result.errorMessage = "New Password cannot be the same as Old Password";
      } else {
        await db.query(
          `UPDATE app_config SET "APP_PASSWORD"='${new_password}' where "ID"=1 AND "APP_PASSWORD"='${current_password}' `
        );
      }
    } else {
      result.isValid = false;
      result.errorMessage = "Old Password is Invalid";
    }
  } catch (error) {
    console.log(error);
    result.errorMessage = error;
  }
  if (!result.isValid) {
    res.status(400);
  }
  res.send(result);
});

router.post("/updatePassword", async (req, res) => {
  const { current_password, new_password } = req.body;

  let result = { isValid: true, errorMessage: "" };

  try {
    const { rows } = await db.query(
      `SELECT "JF_HOST","JF_API_KEY","APP_USER" FROM app_config where "ID"=1 AND "APP_PASSWORD"='${current_password}' `
    );

    if (rows && rows.length > 0) {
      if (current_password === new_password) {
        result.isValid = false;
        result.errorMessage = "New Password cannot be the same as Old Password";
      } else {
        await db.query(
          `UPDATE app_config SET "APP_PASSWORD"='${new_password}' where "ID"=1 AND "APP_PASSWORD"='${current_password}' `
        );
      }
    } else {
      result.isValid = false;
      result.errorMessage = "Old Password is Invalid";
    }
  } catch (error) {
    console.log(error);
    result.errorMessage = error;
  }

  res.send(result);
});

router.get("/TrackedLibraries", async (req, res) => {
  const config = await new configClass().getConfig();

  if (config.error) {
    res.send({ error: config.error });
    return;
  }

  try {
    const libraries = await API.getLibraries();

    const ExcludedLibraries = config.settings?.ExcludedLibraries || [];

    const librariesWithTrackedStatus = libraries.map((items) => ({
      ...items,
      ...{ Tracked: !ExcludedLibraries.includes(items.Id) },
    }));
    res.send(librariesWithTrackedStatus);
  } catch (error) {
    res.status(503);
    res.send({ error: "Error: " + error });
  }
});

router.post("/setExcludedLibraries", async (req, res) => {
  const { libraryID } = req.body;

  if (libraryID === undefined) {
    res.status(400);
    res.send("No Library Id provided");
    return;
  }

  const settingsjson = await db.query('SELECT settings FROM app_config where "ID"=1').then((res) => res.rows);

  if (settingsjson.length > 0) {
    const settings = settingsjson[0].settings || {};

    let libraries = settings.ExcludedLibraries || [];
    if (libraries.includes(libraryID)) {
      libraries = libraries.filter((item) => item !== libraryID);
    } else {
      libraries.push(libraryID);
    }
    settings.ExcludedLibraries = libraries;

    let query = 'UPDATE app_config SET settings=$1 where "ID"=1';

    await db.query(query, [settings]);

    res.send("Settings updated succesfully");
  } else {
    res.status(404);
    res.send("Settings not found");
  }
});

router.get("/UntrackedUsers", async (req, res) => {
  const config = await new configClass().getConfig();

  if (config.error) {
    res.send({ error: config.error });
    return;
  }

  try {
    const ExcludedUsers = config.settings?.ExcludedUsers || [];

    res.send(ExcludedUsers);
  } catch (error) {
    res.status(503);
    res.send({ error: "Error: " + error });
  }
});

router.post("/setUntrackedUsers", async (req, res) => {
  const { userId } = req.body;
  if (Array.isArray(userId) || userId === undefined) {
    res.status(400);
    return res.send("No Valid User ID provided");
  }

  const settingsjson = await db.query('SELECT settings FROM app_config where "ID"=1').then((res) => res.rows);

  if (settingsjson.length > 0) {
    const settings = settingsjson[0].settings || {};

    let excludedUsers = settings.ExcludedUsers || [];
    if (excludedUsers.includes(userId)) {
      excludedUsers = excludedUsers.filter((item) => item !== userId);
    } else {
      excludedUsers.push(userId);
    }
    settings.ExcludedUsers = excludedUsers;

    let query = 'UPDATE app_config SET settings=$1 where "ID"=1';

    await db.query(query, [settings]);

    res.send(excludedUsers);
  } else {
    res.status(404);
    res.send("Settings not found");
  }
});

router.get("/keys", async (req, res) => {
  const config = await new configClass().getConfig();

  res.send(config.api_keys || []);
});

router.delete("/keys", async (req, res) => {
  const { key } = req.body;
  const config = await new configClass().getConfig();

  if (!key) {
    res.status(400);
    res.send({ error: "No API key provided to remove" });
    return;
  }

  const keys = config.api_keys || [];
  const keyExists = keys.some((obj) => obj.key === key);
  if (keyExists) {
    const new_keys_array = keys.filter((obj) => obj.key !== key);
    let query = 'UPDATE app_config SET api_keys=$1 where "ID"=1';

    await db.query(query, [JSON.stringify(new_keys_array)]);
    return res.send("Key removed: " + key);
  } else {
    res.status(404);
    return res.send("API key does not exist");
  }
});

router.post("/keys", async (req, res) => {
  const { name } = req.body;

  if (name === undefined) {
    res.status(400);
    res.send("Key Name is required to generate a key");
    return;
  }

  const config = await new configClass().getConfig();

  if (!name) {
    res.status(400);
    res.send({ error: "A Name is required to generate a key" });
    return;
  }

  let keys = config.api_keys || [];

  const uuid = randomUUID();
  const new_key = { name: name, key: uuid };

  keys.push(new_key);

  let query = 'UPDATE app_config SET api_keys=$1 where "ID"=1';

  await db.query(query, [JSON.stringify(keys)]);
  res.send(keys);
});

router.get("/getTaskSettings", async (req, res) => {
  try {
    const settingsjson = await db.query('SELECT settings FROM app_config where "ID"=1').then((res) => res.rows);

    if (settingsjson.length > 0) {
      const settings = settingsjson[0].settings || {};

      let tasksettings = settings.Tasks || {};
      res.send(tasksettings);
    } else {
      res.status(404);
      res.send({ error: "Task Settings Not Found" });
    }
  } catch (error) {
    res.status(503);
    res.send({ error: "Error: " + error });
  }
});

router.post("/setTaskSettings", async (req, res) => {
  const { taskname, Interval } = req.body;

  if (taskname === undefined || Interval === undefined) {
    res.status(400);
    res.send("Task Name and Interval are required");
    return;
  }

  if (!Number.isInteger(Interval) && Interval <= 0) {
    res.status(400);
    res.send("A valid Interval(int) which is > 0 minutes is required");
    return;
  }

  try {
    const settingsjson = await db.query('SELECT settings FROM app_config where "ID"=1').then((res) => res.rows);

    if (settingsjson.length > 0) {
      const settings = settingsjson[0].settings || {};
      if (!settings.Tasks) {
        settings.Tasks = {};
      }

      let tasksettings = settings.Tasks;
      if (!tasksettings[taskname]) {
        tasksettings[taskname] = {};
      }
      tasksettings[taskname].Interval = Interval;

      settings.Tasks = tasksettings;

      let query = 'UPDATE app_config SET settings=$1 where "ID"=1';

      await db.query(query, [settings]);
      res.status(200);
      res.send(tasksettings);
    } else {
      res.status(404);
      res.send({ error: "Task Settings Not Found" });
    }
  } catch (error) {
    res.status(503);
    res.send({ error: "Error: " + error });
  }
});

//Jellystat functions
router.get("/CheckForUpdates", async (req, res) => {
  try {
    let result = await checkForUpdates();
    res.send(result);
  } catch (error) {
    console.log(error);
  }
});

//DB Queries
router.post("/getUserDetails", async (req, res) => {
  try {
    const { userid } = req.body;

    if (userid === undefined) {
      res.status(400);
      res.send("No User Id provided");
      return;
    }

    const { rows } = await db.query(`select * from jf_users where "Id"='${userid}'`);
    res.send(rows[0]);
  } catch (error) {
    console.log(error);
    res.status(503);
    res.send(error);
  }
});

router.get("/getLibraries", async (req, res) => {
  try {
    const { rows } = await db.query(`SELECT * FROM jf_libraries`);
    res.send(rows);
  } catch (error) {
    console.log(error);
  }
});

router.post("/getLibrary", async (req, res) => {
  try {
    const { libraryid } = req.body;

    if (libraryid === undefined) {
      res.status(400);
      res.send("No Library Id provided");
      return;
    }

    const { rows } = await db.query(`select * from jf_libraries where "Id"='${libraryid}'`);
    res.send(rows[0]);
  } catch (error) {
    console.log(error);
    res.status(503);
    res.send(error);
  }
});

router.post("/getLibraryItems", async (req, res) => {
  try {
    const { libraryid } = req.body;

    if (libraryid === undefined) {
      res.status(400);
      res.send("No Library Id provided");
      return;
    }

    const { rows } = await db.query(`SELECT * FROM jf_library_items where "ParentId"=$1`, [libraryid]);
    res.send(rows);
  } catch (error) {
    console.log(error);
  }
});

router.post("/getSeasons", async (req, res) => {
  try {
    const { Id } = req.body;

    if (Id === undefined) {
      res.status(400);
      res.send("No Season Id provided");
      return;
    }

    const { rows } = await db.query(
      `SELECT s.*, i."PrimaryImageHash", (select count(e.*) "Episodes" from jf_library_episodes e  where e."SeasonId"=s."Id") ,(select sum(ii."Size") "Size" from jf_library_episodes e join jf_item_info ii on ii."Id"=e."EpisodeId" where e."SeasonId"=s."Id") FROM jf_library_seasons s left join jf_library_items i on i."Id"=s."SeriesId" where "SeriesId"=$1`,
      [Id]
    );
    res.send(rows);
  } catch (error) {
    console.log(error);
  }
});

router.post("/getEpisodes", async (req, res) => {
  try {
    const { Id } = req.body;

    if (Id === undefined) {
      res.status(400);
      res.send("No Episode Id provided");
      return;
    }

    const { rows } = await db.query(
      `SELECT e.*, i."PrimaryImageHash", ii."Size" FROM jf_library_episodes e left join jf_library_items i on i."Id"=e."SeriesId" join jf_item_info ii on ii."Id"=e."EpisodeId" where "SeasonId"=$1`,
      [Id]
    );
    res.send(rows);
  } catch (error) {
    console.log(error);
  }
});

router.post("/getItemDetails", async (req, res) => {
  try {
    const { Id } = req.body;
    if (Id === undefined) {
      res.status(400);
      res.send("No ID provided");
      return;
    }
    // let query = `SELECT im."Name" "FileName",im.*,i.* FROM jf_library_items i left join jf_item_info im on i."Id" = im."Id" where i."Id"=$1`;
    let query = `SELECT im."Name" "FileName",im."Id",im."Path",im."Name",im."Bitrate",im."MediaStreams",im."Type",  COALESCE(im."Size" ,(SELECT SUM(im."Size") FROM jf_library_seasons s JOIN jf_library_episodes e on s."Id"=e."SeasonId" JOIN jf_item_info im ON im."Id" = e."EpisodeId" WHERE s."SeriesId" = i."Id")) "Size",i.*, (select "Name" from jf_libraries l where l."Id"=i."ParentId") "LibraryName" FROM jf_library_items i left join jf_item_info im on i."Id" = im."Id" where i."Id"=$1`;
    let maxActivityQuery = `SELECT  MAX("ActivityDateInserted") "LastActivityDate" FROM public.jf_playback_activity`;
    let activityCountQuery = `SELECT  Count("ActivityDateInserted") "times_played",  SUM("PlaybackDuration") "total_play_time" FROM public.jf_playback_activity`;

    const { rows: items } = await db.query(query, [Id]);

    if (items.length === 0) {
      // query = `SELECT im."Name" "FileName",im.*,s.*, s.archived, i."PrimaryImageHash"  FROM jf_library_seasons s left join jf_item_info im on s."Id" = im."Id" left join jf_library_items i on i."Id"=s."SeriesId"  where s."Id"=$1`;
      query = `SELECT s."Name", (SELECT SUM(im."Size") FROM jf_library_episodes e JOIN jf_item_info im ON im."Id" = e."EpisodeId" WHERE s."Id" = e."SeasonId") AS "Size", s.*, i."PrimaryImageHash", i."ParentId",(select "Name" from jf_libraries l where l."Id"=i."ParentId") "LibraryName" FROM jf_library_seasons s LEFT JOIN jf_library_items i ON i."Id"=s."SeriesId" WHERE s."Id"=$1`;
      const { rows: seasons } = await db.query(query, [Id]);

      if (seasons.length === 0) {
        query = `SELECT im."Name" "FileName",im.*,e.*, e.archived , i."PrimaryImageHash", i."ParentId",(select "Name" from jf_libraries l where l."Id"=i."ParentId") "LibraryName"  FROM jf_library_episodes e join jf_item_info im on e."EpisodeId" = im."Id" left join jf_library_items i on i."Id"=e."SeriesId" where e."EpisodeId"=$1`;
        const { rows: episodes } = await db.query(query, [Id]);

        if (episodes.length !== 0) {
          maxActivityQuery = `${maxActivityQuery} where "EpisodeId"=$1`;
          activityCountQuery = `${activityCountQuery} where "EpisodeId"=$1`;
          const LastActivityDate = await db.querySingle(maxActivityQuery, [Id]);
          const TimesPlayed = await db.querySingle(activityCountQuery, [Id]);

          episodes.forEach((episode) => {
            episode.LastActivityDate = LastActivityDate.LastActivityDate ?? null;
            episode.times_played = TimesPlayed.times_played ?? null;
            episode.total_play_time = TimesPlayed.total_play_time ?? null;
          });
          res.send(episodes);
        } else {
          res.status(404).send("Item not found");
        }
      } else {
        maxActivityQuery = `${maxActivityQuery} where "SeasonId"=$1`;
        activityCountQuery = `${activityCountQuery} where "SeasonId"=$1`;
        const LastActivityDate = await db.querySingle(maxActivityQuery, [Id]);
        const TimesPlayed = await db.querySingle(activityCountQuery, [Id]);
        seasons.forEach((season) => {
          season.LastActivityDate = LastActivityDate.LastActivityDate ?? null;
          season.times_played = TimesPlayed.times_played ?? null;
          season.total_play_time = TimesPlayed.total_play_time ?? null;
        });
        res.send(seasons);
      }
    } else {
      maxActivityQuery = `${maxActivityQuery} where "NowPlayingItemId"=$1`;
      activityCountQuery = `${activityCountQuery} where "NowPlayingItemId"=$1`;
      const LastActivityDate = await db.querySingle(maxActivityQuery, [Id]);
      const TimesPlayed = await db.querySingle(activityCountQuery, [Id]);

      items.forEach((item) => {
        item.LastActivityDate = LastActivityDate.LastActivityDate ?? null;
        item.times_played = TimesPlayed.times_played ?? null;
        item.total_play_time = TimesPlayed.total_play_time ?? null;
      });

      res.send(items);
    }
  } catch (error) {
    console.log(error);
  }
});

router.delete("/item/purge", async (req, res) => {
  try {
    const { id, withActivity } = req.body;

    if (id === undefined) {
      res.status(400);
      res.send("No Item ID provided");
      return;
    }
    const { rows: items } = await db.query(`select * from jf_library_items where "Id"=$1`, [id]);
    const { rows: seasons } = await db.query(`select * from jf_library_seasons where "SeriesId"=$1 or "Id"=$1`, [id]);
    if (seasons.length > 0) {
      for (const season of seasons) {
        let delete_season_episodes_query = 'delete from jf_library_episodes where "SeasonId"=$1';
        if (!season.archived && (items.length > 0 ? !items[0].archived : true)) {
          delete_season_episodes_query += " and archived=true";
        }
        await db.query(delete_season_episodes_query, [season.Id]);
        if (season.archived || (items.length > 0 && items[0].archived)) {
          await db.query(`delete from jf_library_seasons where "Id"=$1`, [season.Id]);
        }
      }
    } else {
      const { rows: episodes } = await db.query(`select * from jf_library_episodes where "EpisodeId"=$1 and archived=true`, [id]);
      if (episodes.length > 0) {
        await db.query(`delete from jf_library_episodes where "EpisodeId"=$1 and archived=true`, [id]);
      }
      if (items.length > 0 && items[0].archived) {
        await db.query(`delete from jf_library_episodes where "SeriesId"=$1`, [id]);
        await db.query(`delete from jf_library_seasons where "SeriesId"=$1`, [id]);
        await db.query(`delete from jf_library_items where "Id"=$1`, [id]);
      }
      if (withActivity) {
        const deleteQuery = {
          text: `DELETE FROM jf_playback_activity WHERE${
            episodes.length > 0 ? ` "EpisodeId" IN (${pgp.as.csv(episodes.map((item) => item.EpisodeId))})  OR` : ""
          }${
            seasons.length > 0 ? ` "SeasonId" IN (${pgp.as.csv(seasons.map((item) => item.SeasonId))}) OR` : ""
          } "NowPlayingItemId"='${id}'`,
        };
        await db.query(deleteQuery);
      }
    }

    sendUpdate("GeneralAlert", {
      type: "Success",
      message: `Item ${withActivity ? "with Playback Activity" : ""} has been Purged`,
    });
    res.send("Item purged succesfully");
  } catch (error) {
    console.log(error);
    sendUpdate("GeneralAlert", { type: "Error", message: `There was an error Purging the Data` });

    res.status(503);
    res.send(error);
  }
});

router.delete("/library/purge", async (req, res) => {
  try {
    const { id, withActivity } = req.body;

    if (id === undefined) {
      res.status(400);
      res.send("No Library ID provided");
      return;
    }

    await purgeLibraryItems(id, withActivity, true);

    await db.query(`delete from jf_libraries where "Id"=$1`, [id]);

    sendUpdate("GeneralAlert", {
      type: "Success",
      message: `Library ${withActivity ? "with Playback Activity" : ""} has been Purged`,
    });
    res.send("Item purged succesfully");
  } catch (error) {
    console.log(error);
    sendUpdate("GeneralAlert", { type: "Error", message: `There was an error Purging the Data` });

    res.status(503);
    res.send(error);
  }
});

router.delete("/libraryItems/purge", async (req, res) => {
  try {
    const { id, withActivity } = req.body;
    if (id === undefined) {
      res.status(400);
      res.send("No Library ID provided");
      return;
    }

    await purgeLibraryItems(id, withActivity);

    sendUpdate("GeneralAlert", {
      type: "Success",
      message: `Library Items ${withActivity ? "with Playback Activity" : ""} has been Purged`,
    });
    res.send("Item purged succesfully");
  } catch (error) {
    console.log(error);
    sendUpdate("GeneralAlert", { type: "Error", message: `There was an error Purging the Data` });

    res.status(503);
    res.send(error);
  }
});

router.get("/getBackupTables", async (req, res) => {
  try {
    const config = await new configClass().getConfig();
    const excluded_tables = config.settings.ExcludedTables || [];

    let backupTables = tables.map((table) => {
      return {
        ...table,
        Excluded: excluded_tables.includes(table.value),
      };
    });

    res.send(backupTables);
    return;
  } catch (error) {
    res.status(503);
    res.send(error);
  }
});

router.post("/setExcludedBackupTable", async (req, res) => {
  const { table } = req.body;
  if (table === undefined || tables.map((item) => item.value).indexOf(table) === -1) {
    res.status(400);
    res.send("Invalid table provided");
    return;
  }

  const settingsjson = await db.query('SELECT settings FROM app_config where "ID"=1').then((res) => res.rows);

  if (settingsjson.length > 0) {
    const settings = settingsjson[0].settings || {};

    let excludedTables = settings.ExcludedTables || [];
    if (excludedTables.includes(table)) {
      excludedTables = excludedTables.filter((item) => item !== table);
    } else {
      excludedTables.push(table);
    }
    settings.ExcludedTables = excludedTables;

    let query = 'UPDATE app_config SET settings=$1 where "ID"=1';

    await db.query(query, [settings]);

    let backupTables = tables.map((table) => {
      return {
        ...table,
        Excluded: settings.ExcludedTables.includes(table.value),
      };
    });

    res.send(backupTables);
  } else {
    res.status(404);
    res.send("Settings not found");
  }
});

//DB Queries - History
router.get("/getHistory", async (req, res) => {
  try {
    const { rows } = await db.query(`
    SELECT a.*, e."IndexNumber" "EpisodeNumber",e."ParentIndexNumber" "SeasonNumber" , i."ParentId"
    FROM jf_playback_activity a
    left join jf_library_episodes e
    on a."EpisodeId"=e."EpisodeId"
    and a."SeasonId"=e."SeasonId"
    left join jf_library_items i
    on i."Id"=a."NowPlayingItemId" or e."SeriesId"=i."Id"
     order by a."ActivityDateInserted" desc`);

    const groupedResults = groupActivity(rows);

    res.send(Object.values(groupedResults));
  } catch (error) {
    console.log(error);
  }
});

router.post("/getLibraryHistory", async (req, res) => {
  try {
    const { libraryid } = req.body;

    if (libraryid === undefined) {
      res.status(400);
      res.send("No Library ID provided");
      return;
    }

    const { rows } = await db.query(
      `select a.* , e."IndexNumber" "EpisodeNumber",e."ParentIndexNumber" "SeasonNumber" 
      from jf_playback_activity a 
      join jf_library_items i 
      on i."Id"=a."NowPlayingItemId" 
      left join jf_library_episodes e
      on a."EpisodeId"=e."EpisodeId"
      and a."SeasonId"=e."SeasonId"  
      where i."ParentId"=$1 
      order by a."ActivityDateInserted" desc`,
      [libraryid]
    );
    const groupedResults = groupActivity(rows);
    res.send(Object.values(groupedResults));
  } catch (error) {
    console.log(error);
    res.status(503);
    res.send(error);
  }
});

router.post("/getItemHistory", async (req, res) => {
  try {
    const { itemid } = req.body;

    if (itemid === undefined) {
      res.status(400);
      res.send("No Item ID provided");
      return;
    }

    const { rows } = await db.query(
      `select a.*, e."IndexNumber" "EpisodeNumber",e."ParentIndexNumber" "SeasonNumber" 
      from jf_playback_activity a
      left join jf_library_episodes e
    on a."EpisodeId"=e."EpisodeId"
    and a."SeasonId"=e."SeasonId"
      where
      (a."EpisodeId"=$1 OR a."SeasonId"=$1 OR a."NowPlayingItemId"=$1);`,
      [itemid]
    );

    const groupedResults = rows.map((item) => ({
      ...item,
      results: [],
    }));

    res.send(groupedResults);
  } catch (error) {
    console.log(error);
    res.status(503);
    res.send(error);
  }
});

router.post("/getUserHistory", async (req, res) => {
  try {
    const { userid } = req.body;

    if (userid === undefined) {
      res.status(400);
      res.send("No User ID provided");
      return;
    }

    const { rows } = await db.query(
      `select a.*, e."IndexNumber" "EpisodeNumber",e."ParentIndexNumber" "SeasonNumber" , i."ParentId"
      from jf_playback_activity a
      left join jf_library_episodes e
      on a."EpisodeId"=e."EpisodeId"
      and a."SeasonId"=e."SeasonId"
      left join jf_library_items i
    on i."Id"=a."NowPlayingItemId" or e."SeriesId"=i."Id"
      where a."UserId"=$1;`,
      [userid]
    );

    const groupedResults = groupActivity(rows);

    res.send(Object.values(groupedResults));
  } catch (error) {
    console.log(error);
    res.status(503);
    res.send(error);
  }
});

router.post("/deletePlaybackActivity", async (req, res) => {
  try {
    const { ids } = req.body;

    if (ids === undefined || !Array.isArray(ids)) {
      res.status(400);
      res.send("A list of IDs is required. EG: [1,2,3]");
      return;
    }

    await db.query(`DELETE from jf_playback_activity where "Id" = ANY($1)`, [ids]);
    // const groupedResults = groupActivity(rows);
    res.send(`${ids.length} Records Deleted`);
  } catch (error) {
    console.log(error);
    res.status(503);
    res.send(error);
  }
});

module.exports = router;
