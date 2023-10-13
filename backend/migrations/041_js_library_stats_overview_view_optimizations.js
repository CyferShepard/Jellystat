exports.up = function (knex) {
  const query = `
  CREATE OR REPLACE VIEW public.js_library_stats_overview
 AS
 SELECT DISTINCT ON (l."Id") l."Id",
    l."Name",
    l."ServerId",
    l."IsFolder",
    l."Type",
    l."CollectionType",
    l."ImageTagsPrimary",
    i."Id" AS "ItemId",
    i."Name" AS "ItemName",
    i."Type" AS "ItemType",
    i."PrimaryImageHash",
    s."IndexNumber" AS "SeasonNumber",
    e."IndexNumber" AS "EpisodeNumber",
    e."Name" AS "EpisodeName",
    ( SELECT count(*) AS count
           FROM jf_playback_activity a
             JOIN jf_library_items i_1 ON a."NowPlayingItemId" = i_1."Id"
          WHERE i_1."ParentId" = l."Id") AS "Plays",
    ( SELECT sum(a."PlaybackDuration") AS sum
           FROM jf_playback_activity a
             JOIN jf_library_items i_1 ON a."NowPlayingItemId" = i_1."Id"
          WHERE i_1."ParentId" = l."Id") AS total_playback_duration,
    l.total_play_time::numeric AS total_play_time,
    l.item_count AS "Library_Count",
    l.season_count AS "Season_Count",
    l.episode_count AS "Episode_Count",
    now() - latest_activity."ActivityDateInserted" AS "LastActivity"
   FROM jf_libraries l
     LEFT JOIN ( SELECT DISTINCT ON (i_1."ParentId") jf_playback_activity."Id",
            jf_playback_activity."IsPaused",
            jf_playback_activity."UserId",
            jf_playback_activity."UserName",
            jf_playback_activity."Client",
            jf_playback_activity."DeviceName",
            jf_playback_activity."DeviceId",
            jf_playback_activity."ApplicationVersion",
            jf_playback_activity."NowPlayingItemId",
            jf_playback_activity."NowPlayingItemName",
            jf_playback_activity."SeasonId",
            jf_playback_activity."SeriesName",
            jf_playback_activity."EpisodeId",
            jf_playback_activity."PlaybackDuration",
            jf_playback_activity."ActivityDateInserted",
            jf_playback_activity."PlayMethod",
            i_1."ParentId"
           FROM jf_playback_activity
             JOIN jf_library_items i_1 ON i_1."Id" = jf_playback_activity."NowPlayingItemId"
          ORDER BY i_1."ParentId", jf_playback_activity."ActivityDateInserted" DESC) latest_activity ON l."Id" = latest_activity."ParentId"
     LEFT JOIN jf_library_items i ON i."Id" = latest_activity."NowPlayingItemId"
     LEFT JOIN jf_library_seasons s ON s."Id" = latest_activity."SeasonId"
     LEFT JOIN jf_library_episodes e ON e."EpisodeId" = latest_activity."EpisodeId"
  ORDER BY l."Id", latest_activity."ActivityDateInserted" DESC;
  `;

  return knex.schema.raw(query).catch(function (error) {
    console.error(error);
  });
};

exports.down = function (knex) {
  return knex.schema.raw(`
    CREATE OR REPLACE VIEW public.js_library_stats_overview
 AS
 SELECT DISTINCT ON (l."Id") l."Id",
    l."Name",
    l."ServerId",
    l."IsFolder",
    l."Type",
    l."CollectionType",
    l."ImageTagsPrimary",
    i."Id" AS "ItemId",
    i."Name" AS "ItemName",
    i."Type" AS "ItemType",
    i."PrimaryImageHash",
    s."IndexNumber" AS "SeasonNumber",
    e."IndexNumber" AS "EpisodeNumber",
    e."Name" AS "EpisodeName",
    ( SELECT count(*) AS count
           FROM jf_playback_activity a
             JOIN jf_library_items i_1 ON a."NowPlayingItemId" = i_1."Id"
          WHERE i_1."ParentId" = l."Id") AS "Plays",
    ( SELECT sum(a."PlaybackDuration") AS sum
           FROM jf_playback_activity a
             JOIN jf_library_items i_1 ON a."NowPlayingItemId" = i_1."Id"
          WHERE i_1."ParentId" = l."Id") AS total_playback_duration,
    l.total_play_time::numeric AS total_play_time,
    l.item_count AS "Library_Count",
    l.season_count AS "Season_Count",
    l.episode_count AS "Episode_Count",
    now() - latest_activity."ActivityDateInserted" AS "LastActivity"
   FROM jf_libraries l
     LEFT JOIN jf_library_count_view cv ON cv."Id" = l."Id"
     LEFT JOIN ( SELECT jf_playback_activity."Id",
            jf_playback_activity."IsPaused",
            jf_playback_activity."UserId",
            jf_playback_activity."UserName",
            jf_playback_activity."Client",
            jf_playback_activity."DeviceName",
            jf_playback_activity."DeviceId",
            jf_playback_activity."ApplicationVersion",
            jf_playback_activity."NowPlayingItemId",
            jf_playback_activity."NowPlayingItemName",
            jf_playback_activity."SeasonId",
            jf_playback_activity."SeriesName",
            jf_playback_activity."EpisodeId",
            jf_playback_activity."PlaybackDuration",
            jf_playback_activity."ActivityDateInserted",
            jf_playback_activity."PlayMethod",
            i_1."ParentId"
           FROM jf_playback_activity
             JOIN jf_library_items i_1 ON i_1."Id" = jf_playback_activity."NowPlayingItemId"
          ORDER BY jf_playback_activity."ActivityDateInserted" DESC) latest_activity ON l."Id" = latest_activity."ParentId"
     LEFT JOIN jf_library_items i ON i."Id" = latest_activity."NowPlayingItemId"
     LEFT JOIN jf_library_seasons s ON s."Id" = latest_activity."SeasonId"
     LEFT JOIN jf_library_episodes e ON e."EpisodeId" = latest_activity."EpisodeId"
  ORDER BY l."Id", latest_activity."ActivityDateInserted" DESC;
    `);
};
