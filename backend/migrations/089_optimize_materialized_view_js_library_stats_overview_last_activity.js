exports.up = async function (knex) {
  try {
    await knex.schema.raw(`
      DROP MATERIALIZED VIEW  IF EXISTS public.js_library_stats_overview;

      CREATE MATERIALIZED VIEW public.js_library_stats_overview
       AS
        SELECT l."Id",
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
           FROM jf_playback_activity_with_metadata a
          WHERE a."ParentId" = l."Id") AS "Plays",
    ( SELECT sum(a."PlaybackDuration") AS sum
           FROM jf_playback_activity_with_metadata a
          WHERE a."ParentId" = l."Id") AS total_playback_duration,
    l.total_play_time::numeric AS total_play_time,
    l.item_count AS "Library_Count",
    l.season_count AS "Season_Count",
    l.episode_count AS "Episode_Count",
    l.archived,
    latest_activity."ActivityDateInserted"
   FROM jf_libraries l
     LEFT JOIN ( SELECT jso."Id",
            jso."NowPlayingItemId",
            jso."SeasonId",
            jso."EpisodeId",
            jso."ParentId",
            jso."ActivityDateInserted"
           FROM js_latest_playback_activity jso
             JOIN ( SELECT js_latest_playback_activity."ParentId",
                    max(js_latest_playback_activity."ActivityDateInserted") AS max_date
                   FROM js_latest_playback_activity
                  GROUP BY js_latest_playback_activity."ParentId") latest 
				  ON jso."ParentId" = latest."ParentId" AND jso."ActivityDateInserted" = latest.max_date ) 
				  latest_activity ON l."Id" = latest_activity."ParentId"
				  
     LEFT JOIN jf_library_items i ON i."Id" = latest_activity."NowPlayingItemId"
     LEFT JOIN jf_library_seasons s ON s."Id" = latest_activity."SeasonId"
     LEFT JOIN jf_library_episodes e ON e."EpisodeId" = latest_activity."EpisodeId"
  ORDER BY l."Id", latest_activity."ActivityDateInserted" DESC;


     ALTER MATERIALIZED VIEW  public.js_library_stats_overview
     OWNER TO "${process.env.POSTGRES_ROLE}";
    `);
  } catch (error) {
    console.error(error);
  }
};

exports.down = async function (knex) {
  try {
    await knex.schema.raw(`
      DROP MATERIALIZED VIEW  IF EXISTS public.js_library_stats_overview;

      CREATE MATERIALIZED VIEW public.js_library_stats_overview
       AS
        SELECT l."Id",
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
           FROM jf_playback_activity_with_metadata a
          WHERE a."ParentId" = l."Id") AS "Plays",
    ( SELECT sum(a."PlaybackDuration") AS sum
           FROM jf_playback_activity_with_metadata a
          WHERE a."ParentId" = l."Id") AS total_playback_duration,
    l.total_play_time::numeric AS total_play_time,
    l.item_count AS "Library_Count",
    l.season_count AS "Season_Count",
    l.episode_count AS "Episode_Count",
    l.archived,
    now() - latest_activity."ActivityDateInserted" AS "LastActivity"
   FROM jf_libraries l
     LEFT JOIN ( SELECT jso."Id",
            jso."NowPlayingItemId",
            jso."SeasonId",
            jso."EpisodeId",
            jso."ParentId",
            jso."ActivityDateInserted"
           FROM js_latest_playback_activity jso
             JOIN ( SELECT js_latest_playback_activity."ParentId",
                    max(js_latest_playback_activity."ActivityDateInserted") AS max_date
                   FROM js_latest_playback_activity
                  GROUP BY js_latest_playback_activity."ParentId") latest 
				  ON jso."ParentId" = latest."ParentId" AND jso."ActivityDateInserted" = latest.max_date ) 
				  latest_activity ON l."Id" = latest_activity."ParentId"
				  
     LEFT JOIN jf_library_items i ON i."Id" = latest_activity."NowPlayingItemId"
     LEFT JOIN jf_library_seasons s ON s."Id" = latest_activity."SeasonId"
     LEFT JOIN jf_library_episodes e ON e."EpisodeId" = latest_activity."EpisodeId"
  ORDER BY l."Id", latest_activity."ActivityDateInserted" DESC;


     ALTER MATERIALIZED VIEW  public.js_library_stats_overview
     OWNER TO "${process.env.POSTGRES_ROLE}";`);
  } catch (error) {
    console.error(error);
  }
};
