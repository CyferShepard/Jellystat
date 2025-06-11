// api.js
const express = require("express");

const db = require("../db");
const dbHelper = require("../classes/db-helper");

const pgp = require("pg-promise")();
const { randomUUID } = require("crypto");

const configClass = require("../classes/config");
const { checkForUpdates } = require("../version-control");
const API = require("../classes/api-loader");
const { sendUpdate } = require("../ws");
const dayjs = require("dayjs");
const { tables } = require("../global/backup_tables");
const TaskScheduler = require("../classes/task-scheduler-singleton");
const TaskManager = require("../classes/task-manager-singleton.js");

const router = express.Router();

//consts
const groupedSortMap = [
  { field: "UserName", column: "a.UserName" },
  { field: "RemoteEndPoint", column: "a.RemoteEndPoint" },
  { field: "NowPlayingItemName", column: "FullName" },
  { field: "Client", column: "a.Client" },
  { field: "DeviceName", column: "a.DeviceName" },
  { field: "ActivityDateInserted", column: "a.ActivityDateInserted" },
  { field: "PlaybackDuration", column: `COALESCE(ar."TotalDuration", a."PlaybackDuration")` },
  { field: "TotalPlays", column: `COALESCE("TotalPlays",1)` },
  { field: "PlayMethod", column: "a.PlayMethod" },
];

const unGroupedSortMap = [
  { field: "UserName", column: "a.UserName" },
  { field: "RemoteEndPoint", column: "a.RemoteEndPoint" },
  { field: "NowPlayingItemName", column: "FullName" },
  { field: "Client", column: "a.Client" },
  { field: "DeviceName", column: "a.DeviceName" },
  { field: "ActivityDateInserted", column: "a.ActivityDateInserted" },
  { field: "PlaybackDuration", column: "a.PlaybackDuration" },
  { field: "PlayMethod", column: "a.PlayMethod" },
];

const filterFields = [
  { field: "UserName", column: `LOWER(a."UserName")` },
  { field: "RemoteEndPoint", column: `LOWER(a."RemoteEndPoint")` },
  {
    field: "NowPlayingItemName",
    column: `LOWER(
          CASE 
            WHEN a."SeriesName" is null THEN a."NowPlayingItemName"
            ELSE CONCAT(a."SeriesName" , ' : S' , a."SeasonNumber" , 'E' , a."EpisodeNumber" , ' - ' , a."NowPlayingItemName")
          END 
          )`,
  },
  { field: "Client", column: `LOWER(a."Client")` },
  { field: "DeviceName", column: `LOWER(a."DeviceName")` },
  { field: "ActivityDateInserted", column: "a.ActivityDateInserted", isColumn: true },
  { field: "PlaybackDuration", column: `a.PlaybackDuration`, isColumn: true, applyToCTE: true },
  { field: "TotalPlays", column: `COALESCE("TotalPlays",1)` },
  { field: "PlayMethod", column: `LOWER(a."PlayMethod")` },
];

//Functions
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
      refreshViews: true,
    };
    await db.query(deleteQuery);
  }
}

function buildFilterList(query, filtersArray) {
  if (filtersArray.length > 0) {
    query.where = query.where || [];
    filtersArray.forEach((filter) => {
      const findField = filterFields.find((item) => item.field === filter.field);
      const column = findField?.column || "a.ActivityDateInserted";
      const isColumn = findField?.isColumn || false;
      const applyToCTE = findField?.applyToCTE || false;
      if (filter.min) {
        query.where.push({
          column: column,
          operator: ">=",
          value: `$${query.values.length + 1}`,
        });

        query.values.push(filter.min);

        if (applyToCTE) {
          if (query.cte) {
            if (!query.cte.where) {
              query.cte.where = [];
            }
            query.cte.where.push({
              column: column,
              operator: ">=",
              value: `$${query.values.length + 1}`,
            });

            query.values.push(filter.min);
          }
        }
      }

      if (filter.max) {
        query.where.push({
          column: column,
          operator: "<=",
          value: `$${query.values.length + 1}`,
        });

        query.values.push(filter.max);

        if (applyToCTE) {
          if (query.cte) {
            if (!query.cte.where) {
              query.cte.where = [];
            }
            query.cte.where.push({
              column: column,
              operator: "<=",
              value: `$${query.values.length + 1}`,
            });

            query.values.push(filter.max);
          }
        }
      }

      if (filter.value) {
        const whereClause = {
          operator: "LIKE",
          value: `$${query.values.length + 1}`,
        };

        query.values.push(`%${filter.value.toLowerCase()}%`);

        if (isColumn) {
          whereClause.column = column;
        } else {
          whereClause.field = column;
        }
        query.where.push(whereClause);

        if (applyToCTE) {
          if (query.cte) {
            if (!query.cte.where) {
              query.cte.where = [];
            }
            whereClause.value = `$${query.values.length + 1}`;
            query.cte.where.push(whereClause);

            query.values.push(`%${filter.value.toLowerCase()}%`);
          }
        }
      }
    });
  }
}

//////////////////////////////
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
      const { rows: items } = await db.query(
        `SELECT i."Name", null "SeriesName", "Id", null "SeriesId", null "SeasonId", null "EpisodeId", null "SeasonNumber", null "EpisodeNumber",  "PrimaryImageHash",i."DateCreated", "Type", i."ParentId"
        FROM public.jf_library_items i
        where i.archived=false
          and i."Type" != 'Series'
          and i."ParentId"=$1
        order by "DateCreated" desc
        limit $2`,
        [libraryid, limit]
      );

      const { rows: episodes } = await db.query(
        `
        SELECT e."Name",  e."SeriesName",e."Id" , e."SeriesId", e."SeasonId", e."EpisodeId",  e."ParentIndexNumber"  "SeasonNumber",  e."IndexNumber" "EpisodeNumber", e."PrimaryImageHash", e."DateCreated", e."Type", i."ParentId"    
        FROM public.jf_library_episodes e
        JOIN public.jf_library_items i
              on i."Id"=e."SeriesId"
        where e."DateCreated" is not null
              and e.archived=false
               and i."ParentId"=$1
        order by e."DateCreated" desc
        limit $2`,
        [libraryid, limit]
      );

      let lastSynctedItemDate;
      if (items.length > 0 && items[0].DateCreated !== undefined && items[0].DateCreated !== null) {
        lastSynctedItemDate = dayjs(items[0].DateCreated, "YYYY-MM-DD HH:mm:ss.SSSZ");
      }

      if (episodes.length > 0 && episodes[0].DateCreated !== undefined && episodes[0].DateCreated !== null) {
        const newLastSynctedItemDate = dayjs(episodes[0].DateCreated, "YYYY-MM-DD HH:mm:ss.SSSZ");

        if (lastSynctedItemDate === undefined || newLastSynctedItemDate.isAfter(lastSynctedItemDate)) {
          lastSynctedItemDate = newLastSynctedItemDate;
        }
      }

      if (lastSynctedItemDate !== undefined) {
        recentlyAddedFromJellystatMapped = recentlyAddedFromJellystatMapped.filter((item) =>
          dayjs(item.DateCreated, "YYYY-MM-DD HH:mm:ss.SSSZ").isAfter(lastSynctedItemDate)
        );
      }

      const filteredDbRows = [
        ...items.filter((item) => !excluded_libraries.includes(item.ParentId)),
        ...episodes.filter((item) => !excluded_libraries.includes(item.ParentId)),
      ];

      const recentlyAdded = [...recentlyAddedFromJellystatMapped, ...filteredDbRows];
      // Sort recentlyAdded by DateCreated in descending order
      recentlyAdded.sort(
        (a, b) => dayjs(b.DateCreated, "YYYY-MM-DD HH:mm:ss.SSSZ") - dayjs(a.DateCreated, "YYYY-MM-DD HH:mm:ss.SSSZ")
      );

      res.send(recentlyAdded);
      return;
    }
    const { rows: items } = await db.query(
      `SELECT i."Name", null "SeriesName", "Id", null "SeriesId", null "SeasonId", null "EpisodeId", null "SeasonNumber" , null "EpisodeNumber" ,  "PrimaryImageHash",i."DateCreated", "Type", i."ParentId"
      FROM public.jf_library_items i
      where i.archived=false
      order by "DateCreated" desc
      limit $1`,
      [limit]
    );

    const { rows: episodes } = await db.query(
      `
      SELECT e."Name",  e."SeriesName",e."Id" , e."SeriesId", e."SeasonId", e."EpisodeId",  e."ParentIndexNumber"  "SeasonNumber",  e."IndexNumber" "EpisodeNumber", e."PrimaryImageHash", e."DateCreated", e."Type", i."ParentId"    
	    FROM public.jf_library_episodes e
	    JOIN public.jf_library_items i
            on i."Id"=e."SeriesId"
	    where e."DateCreated" is not null
	          and e.archived=false
      order by e."DateCreated" desc
      limit $1`,
      [limit]
    );
    let lastSynctedItemDate;
    if (items.length > 0 && items[0].DateCreated !== undefined && items[0].DateCreated !== null) {
      lastSynctedItemDate = dayjs(items[0].DateCreated, "YYYY-MM-DD HH:mm:ss.SSSZ");
    }

    if (episodes.length > 0 && episodes[0].DateCreated !== undefined && episodes[0].DateCreated !== null) {
      const newLastSynctedItemDate = dayjs(episodes[0].DateCreated, "YYYY-MM-DD HH:mm:ss.SSSZ");

      if (lastSynctedItemDate === undefined || newLastSynctedItemDate.isAfter(lastSynctedItemDate)) {
        lastSynctedItemDate = newLastSynctedItemDate;
      }
    }

    if (lastSynctedItemDate !== undefined) {
      recentlyAddedFromJellystatMapped = recentlyAddedFromJellystatMapped.filter((item) =>
        dayjs(item.DateCreated, "YYYY-MM-DD HH:mm:ss.SSSZ").isAfter(lastSynctedItemDate)
      );
    }

    const filteredDbRows = [
      ...items.filter((item) => !excluded_libraries.includes(item.ParentId)),
      ...episodes.filter((item) => !excluded_libraries.includes(item.ParentId)),
    ];

    let recentlyAdded = [...recentlyAddedFromJellystatMapped, ...filteredDbRows];
    recentlyAdded = recentlyAdded.filter((item) => item.Type !== "Series");

    if (GroupResults == true) {
      recentlyAdded = groupRecentlyAdded(recentlyAdded);
    }

    // Sort recentlyAdded by DateCreated in descending order
    recentlyAdded.sort(
      (a, b) => dayjs(b.DateCreated, "YYYY-MM-DD HH:mm:ss.SSSZ") - dayjs(a.DateCreated, "YYYY-MM-DD HH:mm:ss.SSSZ")
    );

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

        const query = 'UPDATE app_config SET settings=$1 where "ID"=1';

        await db.query(query, [settings]);
      }
    }

    const admins = await API.getAdmins(true);
    const preferredAdmin = await new configClass().getPreferedAdmin();
    if (admins && admins.length > 0 && preferredAdmin && !admins.map((item) => item.Id).includes(preferredAdmin)) {
      const newAdmin = admins[0];
      const settingsjson = await db.query('SELECT settings FROM app_config where "ID"=1').then((res) => res.rows);

      if (settingsjson.length > 0) {
        const settings = settingsjson[0].settings || {};

        settings.preferred_admin = { userid: newAdmin.Id, username: newAdmin.Name };

        const query = 'UPDATE app_config SET settings=$1 where "ID"=1';

        await db.query(query, [settings]);
      }
    }
    res.send(rows);
  } catch (error) {
    console.log(error);
  }
});

router.post("/setExternalUrl", async (req, res) => {
  try {
    const { ExternalUrl } = req.body;

    if (ExternalUrl === undefined) {
      res.status(400);
      res.send("ExternalUrl is required for configuration");
      return;
    }

    const config = await new configClass().getConfig();
    const validation = await API.validateSettings(ExternalUrl, config.JF_API_KEY);
    if (validation.isValid === false) {
      res.status(validation.status);
      res.send(validation);
      return;
    }

    try {
      const settings = config.settings || {};
      settings.EXTERNAL_URL = ExternalUrl;

      const query = 'UPDATE app_config SET settings=$1 where "ID"=1';

      await db.query(query, [settings]);
      config.settings = settings;
      res.send(config);
    } catch (error) {
      res.status(503);
      res.send({ error: "Error: " + error });
    }
  } catch (error) {
    console.log(error);
    res.status(503);
    res.send({ error: "Error: " + error });
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
      const taskScheduler = new TaskScheduler().getInstance();
      await taskScheduler.updateIntervalsFromDB();
      await taskScheduler.getTaskHistory();
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
          refreshViews: true,
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
  const { size = 50, page = 1, search, sort = "ActivityDateInserted", desc = true, filters } = req.query;

  let filtersArray = [];
  if (filters) {
    try {
      filtersArray = JSON.parse(filters);
    } catch (error) {
      return res.status(400).json({
        error: "Invalid filters parameter",
        example: [
          {
            field: "ActivityDateInserted",
            min: "2024-12-31T22:00:00.000Z",
            max: "2024-12-31T22:00:00.000Z",
          },
          {
            field: "PlaybackDuration",
            min: "1",
            max: "10",
          },
          {
            field: "TotalPlays",
            min: "1",
            max: "10",
          },
          {
            field: "DeviceName",
            value: "test",
          },
          {
            field: "Client",
            value: "test",
          },
          {
            field: "NowPlayingItemName",
            value: "test",
          },
          {
            field: "RemoteEndPoint",
            value: "127.0.0.1",
          },
          {
            field: "UserName",
            value: "test",
          },
        ],
      });
    }
  }

  const sortField = groupedSortMap.find((item) => item.field === sort)?.column || "a.ActivityDateInserted";

  const values = [];

  try {
    const cte = {
      cteAlias: "activity_results",
      select: [
        "a.NowPlayingItemId",
        `COALESCE(a."EpisodeId", '1') as "EpisodeId"`,
        "a.UserId",
        `json_agg(row_to_json(a) ORDER BY "ActivityDateInserted" DESC) as results`,
        `COUNT(a.*) as "TotalPlays"`,
        `SUM(a."PlaybackDuration") as "TotalDuration"`,
      ],
      table: "jf_playback_activity_with_metadata",
      alias: "a",
      group_by: ["a.NowPlayingItemId", `COALESCE(a."EpisodeId", '1')`, "a.UserId"],
    };

    const query = {
      cte: cte,
      select: [
        "a.*",
        "a.EpisodeNumber",
        "a.SeasonNumber",
        "a.ParentId",
        "ar.results",
        "ar.TotalPlays",
        "ar.TotalDuration",
        `
        CASE 
          WHEN a."SeriesName" is null THEN a."NowPlayingItemName"
          ELSE CONCAT(a."SeriesName" , ' : S' , a."SeasonNumber" , 'E' , a."EpisodeNumber" , ' - ' , a."NowPlayingItemName")
        END AS "FullName"
        `,
      ],
      table: "js_latest_playback_activity",
      alias: "a",
      joins: [
        {
          type: "left",
          table: "activity_results",
          alias: "ar",
          conditions: [
            { first: "a.NowPlayingItemId", operator: "=", second: "ar.NowPlayingItemId" },
            { first: "a.EpisodeId", operator: "=", second: "ar.EpisodeId", type: "and" },
            { first: "a.UserId", operator: "=", second: "ar.UserId", type: "and" },
          ],
        },
      ],

      order_by: sortField,
      sort_order: desc ? "desc" : "asc",
      pageNumber: page,
      pageSize: size,
    };

    if (search && search.length > 0) {
      query.where = [
        {
          field: `LOWER(
          CASE 
            WHEN a."SeriesName" is null THEN a."NowPlayingItemName"
            ELSE CONCAT(a."SeriesName" , ' : S' , a."SeasonNumber" , 'E' , a."EpisodeNumber" , ' - ' , a."NowPlayingItemName")
          END 
          )`,
          operator: "LIKE",
          value: `$${values.length + 1}`,
        },
      ];

      values.push(`%${search.toLowerCase()}%`);
    }

    query.values = values;

    buildFilterList(query, filtersArray);
    const result = await dbHelper.query(query);

    result.results = result.results.map((item) => ({
      ...item,
      PlaybackDuration: item.TotalDuration ? item.TotalDuration : item.PlaybackDuration,
    }));
    const response = { current_page: page, pages: result.pages, size: size, sort: sort, desc: desc, results: result.results };
    if (search && search.length > 0) {
      response.search = search;
    }

    if (filtersArray.length > 0) {
      response.filters = filtersArray;
    }

    res.send(response);
  } catch (error) {
    console.log(error);
  }
});

router.post("/getLibraryHistory", async (req, res) => {
  try {
    const { size = 50, page = 1, search, sort = "ActivityDateInserted", desc = true, filters } = req.query;

    let filtersArray = [];
    if (filters) {
      try {
        filtersArray = JSON.parse(filters);
      } catch (error) {
        return res.status(400).json({
          error: "Invalid filters parameter",
          example: [
            {
              field: "ActivityDateInserted",
              min: "2024-12-31T22:00:00.000Z",
              max: "2024-12-31T22:00:00.000Z",
            },
            {
              field: "PlaybackDuration",
              min: "1",
              max: "10",
            },
            {
              field: "TotalPlays",
              min: "1",
              max: "10",
            },
            {
              field: "DeviceName",
              value: "test",
            },
            {
              field: "Client",
              value: "test",
            },
            {
              field: "NowPlayingItemName",
              value: "test",
            },
            {
              field: "RemoteEndPoint",
              value: "127.0.0.1",
            },
            {
              field: "UserName",
              value: "test",
            },
          ],
        });
      }
    }
    const { libraryid } = req.body;

    if (libraryid === undefined) {
      res.status(400);
      res.send("No Library ID provided");
      return;
    }

    const sortField = groupedSortMap.find((item) => item.field === sort)?.column || "a.ActivityDateInserted";
    const values = [];

    const cte = {
      cteAlias: "activity_results",
      select: [
        "a.NowPlayingItemId",
        `COALESCE(a."EpisodeId", '1') as "EpisodeId"`,
        "a.UserId",
        `json_agg(row_to_json(a) ORDER BY "ActivityDateInserted" DESC) as results`,
        `COUNT(a.*) as "TotalPlays"`,
        `SUM(a."PlaybackDuration") as "TotalDuration"`,
      ],
      table: "jf_playback_activity_with_metadata",
      alias: "a",
      group_by: ["a.NowPlayingItemId", `COALESCE(a."EpisodeId", '1')`, "a.UserId"],
    };

    const query = {
      cte: cte,
      select: [
        "a.*",
        "a.EpisodeNumber",
        "a.SeasonNumber",
        "a.ParentId",
        "ar.results",
        "ar.TotalPlays",
        "ar.TotalDuration",
        `
        CASE 
          WHEN a."SeriesName" is null THEN a."NowPlayingItemName"
          ELSE CONCAT(a."SeriesName" , ' : S' , a."SeasonNumber" , 'E' , a."EpisodeNumber" , ' - ' , a."NowPlayingItemName")
        END AS "FullName"
        `,
      ],
      table: "js_latest_playback_activity",
      alias: "a",
      joins: [
        {
          type: "inner",
          table: "jf_library_items",
          alias: "i",
          conditions: [
            { first: "i.Id", operator: "=", second: "a.NowPlayingItemId" },
            { first: "i.ParentId", operator: "=", value: `$${values.length + 1}` },
          ],
        },
        {
          type: "left",
          table: "activity_results",
          alias: "ar",
          conditions: [
            { first: "a.NowPlayingItemId", operator: "=", second: "ar.NowPlayingItemId" },
            { first: "a.EpisodeId", operator: "=", second: "ar.EpisodeId", type: "and" },
            { first: "a.UserId", operator: "=", second: "ar.UserId", type: "and" },
          ],
        },
      ],

      order_by: sortField,
      sort_order: desc ? "desc" : "asc",
      pageNumber: page,
      pageSize: size,
    };

    values.push(libraryid);

    if (search && search.length > 0) {
      query.where = [
        {
          field: `LOWER(
          CASE 
            WHEN a."SeriesName" is null THEN a."NowPlayingItemName"
            ELSE CONCAT(a."SeriesName" , ' : S' , a."SeasonNumber" , 'E' , a."EpisodeNumber" , ' - ' , a."NowPlayingItemName")
          END 
          )`,
          operator: "LIKE",
          value: `$${values.length + 1}`,
        },
      ];

      values.push(`%${search.toLowerCase()}%`);
    }

    query.values = values;

    buildFilterList(query, filtersArray);

    const result = await dbHelper.query(query);

    result.results = result.results.map((item) => ({
      ...item,
      PlaybackDuration: item.TotalDuration ? item.TotalDuration : item.PlaybackDuration,
    }));

    const response = { current_page: page, pages: result.pages, size: size, sort: sort, desc: desc, results: result.results };
    if (search && search.length > 0) {
      response.search = search;
    }
    if (filtersArray.length > 0) {
      response.filters = filtersArray;
    }
    res.send(response);
  } catch (error) {
    console.log(error);
    res.status(503);
    res.send(error);
  }
});

router.post("/getItemHistory", async (req, res) => {
  try {
    const { size = 50, page = 1, search, sort = "ActivityDateInserted", desc = true, filters } = req.query;
    const { itemid } = req.body;

    if (itemid === undefined) {
      res.status(400);
      res.send("No Item ID provided");
      return;
    }

    let filtersArray = [];
    if (filters) {
      try {
        filtersArray = JSON.parse(filters);
        filtersArray = filtersArray.filter((filter) => filter.field !== "TotalPlays");
      } catch (error) {
        return res.status(400).json({
          error: "Invalid filters parameter",
          example: [
            {
              field: "ActivityDateInserted",
              min: "2024-12-31T22:00:00.000Z",
              max: "2024-12-31T22:00:00.000Z",
            },
            {
              field: "PlaybackDuration",
              min: "1",
              max: "10",
            },
            {
              field: "TotalPlays",
              min: "1",
              max: "10",
            },
            {
              field: "DeviceName",
              value: "test",
            },
            {
              field: "Client",
              value: "test",
            },
            {
              field: "NowPlayingItemName",
              value: "test",
            },
            {
              field: "RemoteEndPoint",
              value: "127.0.0.1",
            },
            {
              field: "UserName",
              value: "test",
            },
          ],
        });
      }
    }

    const sortField = unGroupedSortMap.find((item) => item.field === sort)?.column || "a.ActivityDateInserted";
    const values = [];
    const query = {
      select: [
        "a.*",
        "a.EpisodeNumber",
        "a.SeasonNumber",
        "a.ParentId",
        `
        CASE 
          WHEN a."SeriesName" is null THEN a."NowPlayingItemName"
          ELSE CONCAT(a."SeriesName" , ' : S' , a."SeasonNumber" , 'E' , a."EpisodeNumber" , ' - ' , a."NowPlayingItemName")
        END AS "FullName"
        `,
      ],
      table: "jf_playback_activity_with_metadata",
      alias: "a",
      where: [
        [
          { column: "a.EpisodeId", operator: "=", value: `$${values.length + 1}` },
          { column: "a.SeasonId", operator: "=", value: `$${values.length + 2}`, type: "or" },
          { column: "a.NowPlayingItemId", operator: "=", value: `$${values.length + 3}`, type: "or" },
        ],
      ],
      order_by: sortField,
      sort_order: desc ? "desc" : "asc",
      pageNumber: page,
      pageSize: size,
    };

    values.push(itemid);
    values.push(itemid);
    values.push(itemid);

    if (search && search.length > 0) {
      query.where = [
        {
          field: `LOWER(
          CASE 
            WHEN a."SeriesName" is null THEN a."NowPlayingItemName"
            ELSE CONCAT(a."SeriesName" , ' : S' , a."SeasonNumber" , 'E' , a."EpisodeNumber" , ' - ' , a."NowPlayingItemName")
          END 
          )`,
          operator: "LIKE",
          value: `$${values.length + 1}`,
        },
      ];
      values.push(`%${search.toLowerCase()}%`);
    }

    query.values = values;
    buildFilterList(query, filtersArray);
    const result = await dbHelper.query(query);

    const response = { current_page: page, pages: result.pages, size: size, sort: sort, desc: desc, results: result.results };
    if (search && search.length > 0) {
      response.search = search;
    }

    if (filters) {
      response.filters = JSON.parse(filters);
    }

    res.send(response);
  } catch (error) {
    console.log(error);
    res.status(503);
    res.send(error);
  }
});

router.post("/getUserHistory", async (req, res) => {
  try {
    const { size = 50, page = 1, search, sort = "ActivityDateInserted", desc = true, filters } = req.query;

    let filtersArray = [];
    if (filters) {
      try {
        filtersArray = JSON.parse(filters);
        filtersArray = filtersArray.filter((filter) => filter.field !== "TotalPlays");
      } catch (error) {
        return res.status(400).json({
          error: "Invalid filters parameter",
          example: [
            {
              field: "ActivityDateInserted",
              min: "2024-12-31T22:00:00.000Z",
              max: "2024-12-31T22:00:00.000Z",
            },
            {
              field: "PlaybackDuration",
              min: "1",
              max: "10",
            },
            {
              field: "TotalPlays",
              min: "1",
              max: "10",
            },
            {
              field: "DeviceName",
              value: "test",
            },
            {
              field: "Client",
              value: "test",
            },
            {
              field: "NowPlayingItemName",
              value: "test",
            },
            {
              field: "RemoteEndPoint",
              value: "127.0.0.1",
            },
            {
              field: "UserName",
              value: "test",
            },
          ],
        });
      }
    }
    const { userid } = req.body;

    if (userid === undefined) {
      res.status(400);
      res.send("No User ID provided");
      return;
    }

    const sortField = unGroupedSortMap.find((item) => item.field === sort)?.column || "a.ActivityDateInserted";

    const values = [];
    const query = {
      select: [
        "a.*",
        "a.EpisodeNumber",
        "a.SeasonNumber",
        "a.ParentId",
        `
        CASE 
          WHEN a."SeriesName" is null THEN a."NowPlayingItemName"
          ELSE CONCAT(a."SeriesName" , ' : S' , a."SeasonNumber" , 'E' , a."EpisodeNumber" , ' - ' , a."NowPlayingItemName")
        END AS "FullName"
        `,
      ],
      table: "jf_playback_activity_with_metadata",
      alias: "a",
      where: [[{ column: "a.UserId", operator: "=", value: `$${values.length + 1}` }]],
      order_by: sortField,
      sort_order: desc ? "desc" : "asc",
      pageNumber: page,
      pageSize: size,
    };

    values.push(userid);

    if (search && search.length > 0) {
      query.where = [
        {
          field: `LOWER(
          CASE 
            WHEN a."SeriesName" is null THEN a."NowPlayingItemName"
            ELSE CONCAT(a."SeriesName" , ' : S' , a."SeasonNumber" , 'E' , a."EpisodeNumber" , ' - ' , a."NowPlayingItemName")
          END 
          )`,
          operator: "LIKE",
          value: `$${values.length + 1}`,
        },
      ];
      values.push(`%${search.toLowerCase()}%`);
    }

    query.values = values;

    buildFilterList(query, filtersArray);

    const result = await dbHelper.query(query);

    const response = { current_page: page, pages: result.pages, size: size, sort: sort, desc: desc, results: result.results };

    if (search && search.length > 0) {
      response.search = search;
    }

    if (filters) {
      response.filters = JSON.parse(filters);
    }

    res.send(response);
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

    await db.query(`DELETE from jf_playback_activity where "Id" = ANY($1)`, [ids], true);
    res.send(`${ids.length} Records Deleted`);
  } catch (error) {
    console.log(error);
    res.status(503);
    res.send(error);
  }
});

router.post("/getActivityTimeLine", async (req, res) => {
  try {
    const { userId, libraries } = req.body;

    if (libraries === undefined || !Array.isArray(libraries)) {
      res.status(400);
      res.send("A list of IDs is required. EG: [1,2,3]");
      return;
    }

    if (userId === undefined) {
      res.status(400);
      res.send("A userId is required.");
      return;
    }

    const { rows } = await db.query(`SELECT * FROM fs_get_user_activity($1, $2);`, [userId, libraries]);
    res.send(rows);
  } catch (error) {
    console.log(error);
    res.status(503);
    res.send(error);
  }
});

//Tasks

router.get("/stopTask", async (req, res) => {
  const { task } = req.query;

  if (task === undefined) {
    res.status(400);
    res.send("No Task provided");
    return;
  }
  const taskManager = new TaskManager().getInstance();
  if (taskManager.taskList[task] === undefined) {
    res.status(404);
    res.send("Task not found");
    return;
  }

  const _task = taskManager.taskList[task];

  if (taskManager.isTaskRunning(_task.name)) {
    taskManager.stopTask(_task);
    res.send("Task Stopped");
    return;
  } else {
    res.status(400);
    res.send("Task is not running");
    return;
  }
});

// Handle other routes
router.use((req, res) => {
  res.status(404).send({ error: "Not Found" });
});

module.exports = router;
