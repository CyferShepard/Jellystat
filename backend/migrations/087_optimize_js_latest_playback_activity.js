exports.up = async function (knex) {
  try {
    await knex.schema.raw(`
      DROP MATERIALIZED VIEW  IF EXISTS public.js_latest_playback_activity;

      CREATE MATERIALIZED VIEW js_latest_playback_activity AS
      WITH ranked_activity AS (
        SELECT 
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
          "MediaStreams",
          "TranscodingInfo",
          "PlayState",
          "OriginalContainer",
          "RemoteEndPoint",
          "ServerId",
          imported,
          "EpisodeNumber",
          "SeasonNumber",
          "ParentId",
          ROW_NUMBER() OVER (
            PARTITION BY "NowPlayingItemId", COALESCE("EpisodeId", '1'), "UserId"
            ORDER BY "ActivityDateInserted" DESC
          ) AS rn
        FROM jf_playback_activity_with_metadata
      )
      SELECT 
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
        "MediaStreams",
        "TranscodingInfo",
        "PlayState",
        "OriginalContainer",
        "RemoteEndPoint",
        "ServerId",
        imported,
        "EpisodeNumber",
        "SeasonNumber",
        "ParentId"
      FROM ranked_activity
      WHERE rn = 1
      ORDER BY "ActivityDateInserted" DESC;


     ALTER MATERIALIZED VIEW  public.js_latest_playback_activity
     OWNER TO "${process.env.POSTGRES_ROLE}";
    `);
  } catch (error) {
    console.error(error);
  }
};

exports.down = async function (knex) {
  try {
    await knex.schema.raw(`
   DROP MATERIALIZED VIEW  IF EXISTS public.js_latest_playback_activity;

      CREATE MATERIALIZED VIEW js_latest_playback_activity AS
      WITH latest_activity AS (
        SELECT 
          "NowPlayingItemId",
          "EpisodeId",
          "UserId",
          MAX("ActivityDateInserted") AS max_date
        FROM public.jf_playback_activity
        GROUP BY "NowPlayingItemId", "EpisodeId", "UserId"
        order by max_date desc
      )
      SELECT 
        a.*
      FROM public.jf_playback_activity_with_metadata a
      JOIN latest_activity u
      ON a."NowPlayingItemId" = u."NowPlayingItemId"
      AND COALESCE(a."EpisodeId", '1') = COALESCE(u."EpisodeId", '1')
      AND a."UserId" = u."UserId"
      AND a."ActivityDateInserted" = u.max_date
      order by a."ActivityDateInserted" desc;


     ALTER MATERIALIZED VIEW  public.js_latest_playback_activity
     OWNER TO "${process.env.POSTGRES_ROLE}";
      `);
  } catch (error) {
    console.error(error);
  }
};
