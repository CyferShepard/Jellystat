// api.js
const express = require("express");
const db = require("../db");
const moment = require("moment");

const router = express.Router();

//functions
function countOverlapsPerHour(records) {
  const hourCounts = {};

  records.forEach((record) => {
    const start = moment(record.StartTime).subtract(1, "hour");
    const end = moment(record.EndTime).add(1, "hour");

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
  try {
    const { rows } = await db.query("SELECT * FROM jf_playback_activity");
    res.send(rows);
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
    const { rows } = await db.query("select * from js_library_stats_overview");
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

    const { rows } = await db.query(`select * from js_library_stats_overview where "Id"=$1`, [libraryid]);
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
    let { libraryid, startDate, endDate = moment(), hours = 24 } = req.body;

    // Validate startDate and endDate using moment
    if (
      startDate !== undefined &&
      (!moment(startDate, moment.ISO_8601, true).isValid() || !moment(endDate, moment.ISO_8601, true).isValid())
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
      startDate = moment(endDate).subtract(hours, "hour").format("YYYY-MM-DD HH:mm:ss");
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
        StartTime: moment(item.ActivityDateInserted).subtract(item.PlaybackDuration, "seconds").format("YYYY-MM-DD HH:mm:ss"),
        EndTime: moment(item.ActivityDateInserted).format("YYYY-MM-DD HH:mm:ss"),
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

router.post("/getViewsOverTime", async (req, res) => {
  try {
    const { days } = req.body;
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

      reorganizedData[date] = { ...reorganizedData[date], [library]: count };
    });
    const finalData = { libraries: libraries, stats: Object.values(reorganizedData) };
    res.send(finalData);
  } catch (error) {
    console.log(error);
    res.status(503);
    res.send(error);
  }
});

router.post("/getViewsByDays", async (req, res) => {
  try {
    const { days } = req.body;
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
      const day = item.Day;

      if (!reorganizedData[day]) {
        reorganizedData[day] = {
          Key: day,
        };
      }

      reorganizedData[day] = { ...reorganizedData[day], [library]: count };
    });
    const finalData = { libraries: libraries, stats: Object.values(reorganizedData) };
    res.send(finalData);
  } catch (error) {
    console.log(error);
    res.status(503);
    res.send(error);
  }
});

router.post("/getViewsByHour", async (req, res) => {
  try {
    const { days } = req.body;
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
      const hour = item.Hour;

      if (!reorganizedData[hour]) {
        reorganizedData[hour] = {
          Key: hour,
        };
      }

      reorganizedData[hour] = { ...reorganizedData[hour], [library]: count };
    });
    const finalData = { libraries: libraries, stats: Object.values(reorganizedData) };
    res.send(finalData);
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
