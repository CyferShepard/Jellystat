// api.js
const express = require("express");
const db = require("../db");
const dbHelper = require("../classes/db-helper");

const dayjs = require("dayjs");

const router = express.Router();

//functions
function countOverlapsPerHour(records) {
  const hourCounts = {};

  records.forEach((record) => {
    const start = dayjs(record.StartTime).subtract(1, "hour");
    const end = dayjs(record.EndTime).add(1, "hour");

    // Iterate through each hour from start to end
    for (let hour = start.clone().startOf("hour"); hour.isBefore(end); hour.add(1, "hour")) {
      const hourKey = hour.format("MMM DD, YY HH:00");
      if (!hourCounts[hourKey]) {
        hourCounts[hourKey] = { Transcodes: 0, DirectPlays: 0 };
      }
      if (record.PlayMethod === "Transcode") {
        hourCounts[hourKey].Transcodes++;
      } else {
        hourCounts[hourKey].DirectPlays++;
      }
    }
  });

  // Convert the hourCounts object to an array of key-value pairs, sort it, and convert it back to an object
  const sortedHourCounts = Object.fromEntries(Object.entries(hourCounts).sort(([keyA], [keyB]) => keyA.localeCompare(keyB)));

  return sortedHourCounts;
}

const sortMap = [
  { field: "UserName", column: "UserName" },
  { field: "RemoteEndPoint", column: "RemoteEndPoint" },
  { field: "NowPlayingItemName", column: "NowPlayingItemName" },
  { field: "Client", column: "Client" },
  { field: "DeviceName", column: "DeviceName" },
  { field: "ActivityDateInserted", column: "ActivityDateInserted" },
  { field: "PlaybackDuration", column: "PlaybackDuration" },
  { field: "PlayMethod", column: "PlayMethod" },
];

const filterFields = [
  { field: "Id", column: "Id", isColumn: true },
  { field: "IsPaused", column: "IsPaused", isColumn: true },
  { field: "UserId", column: "UserId", isColumn: true },
  { field: "UserName", column: "UserName", isColumn: true },
  { field: "Client", column: "Client", isColumn: true },
  { field: "DeviceName", column: "DeviceName", isColumn: true },
  { field: "DeviceId", column: "DeviceId", isColumn: true },
  { field: "ApplicationVersion", column: "ApplicationVersion", isColumn: true },
  { field: "NowPlayingItemId", column: "NowPlayingItemId", isColumn: true },
  { field: "NowPlayingItemName", column: "NowPlayingItemName", isColumn: true },
  { field: "SeasonId", column: "SeasonId", isColumn: true },
  { field: "SeriesName", column: "SeriesName", isColumn: true },
  { field: "EpisodeId", column: "EpisodeId", isColumn: true },
  { field: "PlaybackDuration", column: "PlaybackDuration", isColumn: true },
  { field: "ActivityDateInserted", column: "ActivityDateInserted", isColumn: true },
  { field: "PlayMethod", column: "PlayMethod", isColumn: true },
  { field: "OriginalContainer", column: "OriginalContainer", isColumn: true },
  { field: "RemoteEndPoint", column: "RemoteEndPoint", isColumn: true },
  { field: "ServerId", column: "ServerId", isColumn: true },
  { field: "imported", column: "imported", isColumn: true },
];

//endpoints

router.get("/getLibraryOverview", async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM jf_library_count_view");
    res.send(rows);
  } catch (error) {
    res.status(503);
    res.send(error);
  }
});

router.post("/getMostViewedByType", async (req, res) => {
  try {
    const { days, type } = req.body;

    const valid_types = ["Audio", "Movie", "Series"];

    let _days = days;
    if (days === undefined) {
      _days = 30;
    }

    if (!valid_types.includes(type)) {
      res.status(503);
      return res.send(`Invalid Type Value.\nValid Types: ${JSON.stringify(valid_types)}`);
    }
    if (isNaN(parseFloat(days))) {
      res.status(503);
      return res.send(`Days needs to be a number.`);
    }
    if (Number(days) < 0) {
      res.status(503);
      return res.send(`Days cannot be less than 0`);
    }

    const { rows } = await db.query(`select * from fs_most_played_items($1,'${type}') limit 5`, [_days - 1]);
    res.send(rows);
  } catch (error) {
    res.status(503);
    res.send(error);
  }
});

router.post("/getMostPopularByType", async (req, res) => {
  try {
    const { days, type } = req.body;

    const valid_types = ["Audio", "Movie", "Series"];

    let _days = days;
    if (days === undefined) {
      _days = 30;
    }

    if (!valid_types.includes(type)) {
      res.status(503);
      return res.send("Invalid Type Value");
    }

    const { rows } = await db.query(`select * from fs_most_popular_items($1,$2) limit 5`, [_days - 1, type]);
    res.send(rows);
  } catch (error) {
    res.status(503);
    res.send(error);
  }
});

router.post("/getMostViewedLibraries", async (req, res) => {
  try {
    const { days } = req.body;
    let _days = days;
    if (days === undefined) {
      _days = 30;
    }
    const { rows } = await db.query(`select * from fs_most_viewed_libraries($1)`, [_days - 1]);
    res.send(rows);
  } catch (error) {
    res.status(503);
    res.send(error);
  }
});

router.post("/getMostUsedClient", async (req, res) => {
  try {
    const { days } = req.body;
    let _days = days;
    if (days === undefined) {
      _days = 30;
    }
    const { rows } = await db.query(`select * from fs_most_used_clients($1) limit 5`, [_days - 1]);
    res.send(rows);
  } catch (error) {
    res.status(503);
    res.send(error);
  }
});

router.post("/getMostActiveUsers", async (req, res) => {
  try {
    const { days } = req.body;
    let _days = days;
    if (days === undefined) {
      _days = 30;
    }
    const { rows } = await db.query(`select * from fs_most_active_user($1) limit 5`, [_days - 1]);
    res.send(rows);
  } catch (error) {
    res.status(503);
    res.send(error);
  }
});

router.get("/getPlaybackActivity", async (req, res) => {
  const { size = 50, page = 1, search, sort = "ActivityDateInserted", desc = true, filters } = req.query;
  let filtersArray = [];
  if (filters) {
    try {
      filtersArray = JSON.parse(filters);
    } catch (error) {
      return res.status(400).json({
        error: "Invalid filters parameter",
        example: [
          { field: "UserName", value: "User" },
          { field: "Client", in: "Android TV,Web" },
          { field: "PlaybackDuration", min: 1000, max: 5000 },
          { field: "PlayMethod", value: "DirectPlay" },
          { field: "ActivityDateInserted", min: "2025-01-01", max: "2025-12-31" },
          { field: "IsPaused", value: false },
        ],
        allowed_fields: [
          "Id",
          "IsPaused",
          "UserId",
          "UserName",
          "Client",
          "DeviceName",
          "DeviceId",
          "ApplicationVersion",
          "NowPlayingItemId",
          "NowPlayingItemName",
          "SeasonId",
          "SeriesName",
          "EpisodeId",
          "PlaybackDuration",
          "ActivityDateInserted",
          "PlayMethod",
          "OriginalContainer",
          "RemoteEndPoint",
          "ServerId",
          "imported",
        ],
      });
    }
  }

  const sortField = sortMap.find((item) => item.field === sort)?.column || "ActivityDateInserted";
  const values = [];
  try {
    const query = {
      select: ["*"],
      table: "jf_playback_activity",
      alias: "a",
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
            ELSE a."SeriesName"
          END 
          )`,
          operator: "LIKE",
          value: `$${values.length + 1}`,
        },
      ];

      values.push(`%${search.toLowerCase()}%`);
    }

    query.values = values;
    dbHelper.buildFilterList(query, filtersArray, filterFields);

    const result = await dbHelper.query(query);
    const response = { current_page: page, pages: result.pages, size: size, sort: sort, desc: desc, results: result.results };
    if (search && search.length > 0) {
      response.search = search;
    }

    if (filtersArray.length > 0) {
      response.filters = filtersArray;
    }
    res.send(response);
  } catch (error) {
    res.status(503);
    res.send(error);
  }
});

router.get("/getAllUserActivity", async (req, res) => {
  try {
    const { rows } = await db.query("SELECT * FROM jf_all_user_activity");
    res.send(rows);
  } catch (error) {
    res.send([]);
  }
});

router.post("/getUserLastPlayed", async (req, res) => {
  try {
    const { userid } = req.body;
    const { rows } = await db.query(`select * from fs_last_user_activity($1) limit 15`, [userid]);
    res.send(rows);
  } catch (error) {
    console.log(error);
    res.status(503);
    res.send(error);
  }
});

//Global Stats
router.post("/getGlobalUserStats", async (req, res) => {
  try {
    const { hours, userid } = req.body;
    let _hours = hours;
    if (hours === undefined) {
      _hours = 24;
    }
    const { rows } = await db.query(`select * from fs_user_stats($1,$2)`, [_hours, userid]);
    res.send(rows[0]);
  } catch (error) {
    console.log(error);
    res.status(503);
    res.send(error);
  }
});

router.post("/getGlobalItemStats", async (req, res) => {
  try {
    const { hours, itemid } = req.body;
    let _hours = hours;
    if (hours === undefined) {
      _hours = 24;
    }
    const { rows } = await db.query(
      `select count(*)"Plays",
      sum("PlaybackDuration") total_playback_duration
      from jf_playback_activity jf_playback_activity
      where 
      ("EpisodeId"=$1 OR "SeasonId"=$1 OR "NowPlayingItemId"=$1)
      AND jf_playback_activity."ActivityDateInserted" BETWEEN CURRENT_DATE - INTERVAL '1 hour' * $2 AND NOW();`,
      [itemid, _hours]
    );
    res.send(rows[0]);
  } catch (error) {
    console.log(error);
    res.status(503);
    res.send(error);
  }
});

router.post("/getGlobalLibraryStats", async (req, res) => {
  try {
    const { hours, libraryid } = req.body;
    let _hours = hours;
    if (hours === undefined) {
      _hours = 24;
    }
    const { rows } = await db.query(`select * from fs_library_stats($1,$2)`, [_hours, libraryid]);
    res.send(rows[0]);
  } catch (error) {
    console.log(error);
    res.status(503);
    res.send(error);
  }
});

router.get("/getLibraryCardStats", async (req, res) => {
  try {
    const { rows } = await db.query(
      `select *, now() - js_library_stats_overview."ActivityDateInserted" AS "LastActivity" from js_library_stats_overview`
    );
    res.send(rows);
  } catch (error) {
    res.status(503);
    res.send(error);
  }
});

router.post("/getLibraryCardStats", async (req, res) => {
  try {
    const { libraryid } = req.body;
    if (libraryid === undefined) {
      res.status(503);
      return res.send("Invalid Library Id");
    }

    const { rows } = await db.query(
      `select *, now() - js_library_stats_overview."ActivityDateInserted" AS "LastActivity" from js_library_stats_overview where "Id"=$1`,
      [libraryid]
    );
    res.send(rows[0]);
  } catch (error) {
    console.log(error);
    res.status(503);
    res.send(error);
  }
});

router.get("/getLibraryMetadata", async (req, res) => {
  try {
    const { rows } = await db.query("select * from js_library_metadata");
    res.send(rows);
  } catch (error) {
    res.status(503);
    res.send(error);
  }
});

router.post("/getLibraryItemsWithStats", async (req, res) => {
  try {
    const { libraryid } = req.body;
    const { rows } = await db.query(`SELECT * FROM jf_library_items_with_playcount_playtime where "ParentId"=$1`, [libraryid]);
    res.send(rows);
  } catch (error) {
    console.log(error);
  }
});

router.post("/getLibraryItemsPlayMethodStats", async (req, res) => {
  try {
    let { libraryid, startDate, endDate = dayjs(), hours = 24 } = req.body;

    // Validate startDate and endDate using dayjs
    if (
      startDate !== undefined &&
      (!dayjs(startDate, "YYYY-MM-DDTHH:mm:ss.SSSZ", true).isValid() ||
        !dayjs(endDate, "YYYY-MM-DDTHH:mm:ss.SSSZ", true).isValid())
    ) {
      return res.status(400).send({ error: "Invalid date format" });
    }

    if (hours < 1) {
      return res.status(400).send({ error: "Hours cannot be less than 1" });
    }

    if (libraryid === undefined) {
      return res.status(400).send({ error: "Invalid Library Id" });
    }

    if (startDate === undefined) {
      startDate = dayjs(endDate).subtract(hours, "hour").format("YYYY-MM-DD HH:mm:ss");
    }

    const { rows } = await db.query(
      `select a.*,i."ParentId"
      from jf_playback_activity a
	    left
	    join jf_library_episodes e
	    on a."EpisodeId"=e."EpisodeId"
	    join jf_library_items i
	    on i."Id"=a."NowPlayingItemId" or e."SeriesId"=i."Id"
      where i."ParentId"=$1
      and a."ActivityDateInserted" BETWEEN $2 AND $3
      order by a."ActivityDateInserted" desc;
      `,
      [libraryid, startDate, endDate]
    );

    const stats = rows.map((item) => {
      return {
        Id: item.NowPlayingItemId,
        UserId: item.UserId,
        UserName: item.UserName,
        Client: item.Client,
        DeviceName: item.DeviceName,
        NowPlayingItemName: item.NowPlayingItemName,
        EpisodeId: item.EpisodeId || null,
        SeasonId: item.SeasonId || null,
        StartTime: dayjs(item.ActivityDateInserted).subtract(item.PlaybackDuration, "seconds").format("YYYY-MM-DD HH:mm:ss"),
        EndTime: dayjs(item.ActivityDateInserted).format("YYYY-MM-DD HH:mm:ss"),
        PlaybackDuration: item.PlaybackDuration,
        PlayMethod: item.PlayMethod,
        TranscodedVideo: item.TranscodingInfo?.IsVideoDirect || false,
        TranscodedAudio: item.TranscodingInfo?.IsAudioDirect || false,
        ParentId: item.ParentId,
      };
    });

    let countedstats = countOverlapsPerHour(stats);

    let hoursRes = {
      types: [
        { Id: "Transcodes", Name: "Transcodes" },
        { Id: "DirectPlays", Name: "DirectPlays" },
      ],

      stats: Object.keys(countedstats).map((key) => {
        return {
          Key: key,
          Transcodes: countedstats[key].Transcodes,
          DirectPlays: countedstats[key].DirectPlays,
        };
      }),
    };
    res.send(hoursRes);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});

router.post("/getPlaybackMethodStats", async (req, res) => {
  try {
    const { days = 30 } = req.body;

    if (days < 0) {
      res.status(503);
      return res.send("Days cannot be less than 0");
    }

    const { rows } = await db.query(
      `select a."PlayMethod" "Name",count(a."PlayMethod") "Count"
      from jf_playback_activity a
      WHERE a."ActivityDateInserted" BETWEEN CURRENT_DATE - MAKE_INTERVAL(days => $1) AND NOW()
		  Group by a."PlayMethod"
      ORDER BY (count(*)) DESC;
      `,
      [days - 1]
    );

    res.send(rows);
  } catch (error) {
    console.log(error);
    res.send(error);
  }
});

router.post("/getLibraryLastPlayed", async (req, res) => {
  try {
    const { libraryid } = req.body;
    const { rows } = await db.query(`select * from fs_last_library_activity($1) limit 15`, [libraryid]);
    res.send(rows);
  } catch (error) {
    console.log(error);
    res.status(503);
    res.send(error);
  }
});

router.get("/getViewsOverTime", async (req, res) => {
  try {
    const { days } = req.query;
    let _days = days;
    if (days === undefined) {
      _days = 30;
    }
    const { rows: stats } = await db.query(`select * from fs_watch_stats_over_time($1)`, [_days]);

    const { rows: libraries } = await db.query(`select distinct "Id","Name" from jf_libraries where archived=false`);

    const reorganizedData = {};

    stats.forEach((item) => {
      const library = item.Library;
      const count = item.Count;
      const duration = item.Duration;
      const date = new Date(item.Date).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
        day: "2-digit",
      });

      if (!reorganizedData[date]) {
        reorganizedData[date] = {
          Key: date,
        };
      }

      reorganizedData[date] = { ...reorganizedData[date], [library]: { count, duration } };
    });
    const finalData = { libraries: libraries, stats: Object.values(reorganizedData) };
    res.send(finalData);
  } catch (error) {
    console.log(error);
    res.status(503);
    res.send(error);
  }
});

router.get("/getViewsByDays", async (req, res) => {
  try {
    const { days } = req.query;
    let _days = days;
    if (days === undefined) {
      _days = 30;
    }
    const { rows: stats } = await db.query(`select * from fs_watch_stats_popular_days_of_week($1)`, [_days]);

    const { rows: libraries } = await db.query(`select distinct "Id","Name" from jf_libraries where archived=false`);

    const reorganizedData = {};

    stats.forEach((item) => {
      const library = item.Library;
      const count = item.Count;
      const duration = item.Duration;
      const day = item.Day;

      if (!reorganizedData[day]) {
        reorganizedData[day] = {
          Key: day,
        };
      }

      reorganizedData[day] = { ...reorganizedData[day], [library]: { count, duration } };
    });
    const finalData = { libraries: libraries, stats: Object.values(reorganizedData) };
    res.send(finalData);
  } catch (error) {
    console.log(error);
    res.status(503);
    res.send(error);
  }
});

router.get("/getViewsByHour", async (req, res) => {
  try {
    const { days } = req.query;
    let _days = days;
    if (days === undefined) {
      _days = 30;
    }
    const { rows: stats } = await db.query(`select * from fs_watch_stats_popular_hour_of_day($1)`, [_days]);

    const { rows: libraries } = await db.query(`select distinct "Id","Name" from jf_libraries where archived=false`);

    const reorganizedData = {};

    stats.forEach((item) => {
      const library = item.Library;
      const count = item.Count;
      const duration = item.Duration;
      const hour = item.Hour;

      if (!reorganizedData[hour]) {
        reorganizedData[hour] = {
          Key: hour,
        };
      }

      reorganizedData[hour] = { ...reorganizedData[hour], [library]: { count, duration } };
    });
    const finalData = { libraries: libraries, stats: Object.values(reorganizedData) };
    res.send(finalData);
  } catch (error) {
    console.log(error);
    res.status(503);
    res.send(error);
  }
});

router.get("/getViewsByLibraryType", async (req, res) => {
  try {
    const { days = 30 } = req.query;

    const { rows } = await db.query(
      `
      SELECT COALESCE(i."Type", 'Other') AS type, COUNT(a."NowPlayingItemId") AS count
      FROM jf_playback_activity a LEFT JOIN jf_library_items i ON i."Id" = a."NowPlayingItemId"
      WHERE a."ActivityDateInserted" BETWEEN NOW() - CAST($1 || ' days' as INTERVAL) AND NOW()
      GROUP BY i."Type"
    `,
      [days]
    );

    const supportedTypes = new Set(["Audio", "Movie", "Series", "Other"]);
    /** @type {Map<string, number>} */
    const reorganizedData = new Map();

    rows.forEach((item) => {
      const { type, count } = item;

      if (!supportedTypes.has(type)) return;
      reorganizedData.set(type, count);
    });

    supportedTypes.forEach((type) => {
      if (reorganizedData.has(type)) return;
      reorganizedData.set(type, 0);
    });

    res.send(Object.fromEntries(reorganizedData));
  } catch (error) {
    console.log(error);
    res.status(503);
    res.send(error);
  }
});

router.get("/getGenreUserStats", async (req, res) => {
  try {
    const { size = 50, page = 1, userid } = req.query;

    if (userid === undefined) {
      res.status(400);
      res.send("No User ID provided");
      return;
    }

    const values = [];
    const query = {
      select: ["COALESCE(g.genre, 'No Genre') AS genre", `SUM(a."PlaybackDuration") AS duration`, "COUNT(*) AS plays"],
      table: "jf_playback_activity_with_metadata",
      alias: "a",
      joins: [
        {
          type: "inner",
          table: "jf_library_items",
          alias: "i",
          conditions: [{ first: "a.NowPlayingItemId", operator: "=", second: "i.Id" }],
        },
        {
          type: "left",
          table: `
                  LATERAL (
                    SELECT 
                      jsonb_array_elements_text(
                        CASE 
                          WHEN jsonb_array_length(COALESCE(i."Genres", '[]'::jsonb)) = 0 THEN '["No Genre"]'::jsonb
                          ELSE i."Genres"
                        END
                      ) AS genre
                )
                 `,
          alias: "g",
          conditions: [{ first: 1, operator: "=", value: 1, wrap: false }],
        },
      ],

      where: [[{ column: "a.UserId", operator: "=", value: `$${values.length + 1}` }]],
      group_by: [`COALESCE(g.genre, 'No Genre')`],
      order_by: "genre",
      sort_order: "asc",
      pageNumber: page,
      pageSize: size,
    };

    values.push(userid);

    query.values = values;

    const result = await dbHelper.query(query);

    const response = { current_page: page, pages: result.pages, size: size, results: result.results };

    res.send(response);
  } catch (error) {
    console.log(error);
    res.status(503);
    res.send(error);
  }
});

router.get("/getGenreLibraryStats", async (req, res) => {
  try {
    const { size = 50, page = 1, libraryid } = req.query;

    if (libraryid === undefined) {
      res.status(400);
      res.send("No Library ID provided");
      return;
    }

    const values = [];
    const query = {
      select: ["COALESCE(g.genre, 'No Genre') AS genre", `SUM(a."PlaybackDuration") AS duration`, "COUNT(*) AS plays"],
      table: "jf_playback_activity_with_metadata",
      alias: "a",
      joins: [
        {
          type: "inner",
          table: "jf_library_items",
          alias: "i",
          conditions: [{ first: "a.NowPlayingItemId", operator: "=", second: "i.Id" }],
        },
        {
          type: "left",
          table: `
                  LATERAL (
                    SELECT 
                      jsonb_array_elements_text(
                        CASE 
                          WHEN jsonb_array_length(COALESCE(i."Genres", '[]'::jsonb)) = 0 THEN '["No Genre"]'::jsonb
                          ELSE i."Genres"
                        END
                      ) AS genre
                )
                 `,
          alias: "g",
          conditions: [{ first: 1, operator: "=", value: 1, wrap: false }],
        },
      ],

      where: [[{ column: "a.ParentId", operator: "=", value: `$${values.length + 1}` }]],
      group_by: [`COALESCE(g.genre, 'No Genre')`],
      order_by: "genre",
      sort_order: "asc",
      pageNumber: page,
      pageSize: size,
    };

    values.push(libraryid);

    query.values = values;

    const result = await dbHelper.query(query);

    const response = { current_page: page, pages: result.pages, size: size, results: result.results };

    res.send(response);
  } catch (error) {
    console.log(error);
    res.status(503);
    res.send(error);
  }
});

// Handle other routes
router.use((req, res) => {
  res.status(404).send({ error: "Not Found" });
});

module.exports = router;
