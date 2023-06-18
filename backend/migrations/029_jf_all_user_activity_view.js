exports.up = async function(knex) {
    await knex.raw(`
    DROP VIEW jf_all_user_activity;
    CREATE OR REPLACE VIEW jf_all_user_activity AS
    SELECT u."Id" AS "UserId",
           u."PrimaryImageTag",
           u."Name" AS "UserName",
           CASE
             WHEN j."SeriesName" IS NULL THEN j."NowPlayingItemName"
             ELSE (j."SeriesName" || ' - '::text) || j."NowPlayingItemName"
           END AS "LastWatched",
       CASE
             WHEN j."SeriesName" IS NULL THEN j."NowPlayingItemId"
             ELSE j."EpisodeId"
           END AS "NowPlayingItemId",
           j."ActivityDateInserted" AS "LastActivityDate",
           (j."Client" || ' - '::text) || j."DeviceName" AS "LastClient",
           plays."TotalPlays",
           plays."TotalWatchTime",
           now() - j."ActivityDateInserted" AS "LastSeen"
         FROM (
           SELECT jf_users."Id",
             jf_users."Name",
             jf_users."PrimaryImageTag",
             jf_users."LastLoginDate",
             jf_users."LastActivityDate",
             jf_users."IsAdministrator"
           FROM jf_users
         ) u
         LEFT JOIN LATERAL (
           SELECT jf_playback_activity."Id",
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
             jf_playback_activity."ActivityDateInserted"
           FROM jf_playback_activity
           WHERE jf_playback_activity."UserId" = u."Id"
           ORDER BY jf_playback_activity."ActivityDateInserted" DESC
           LIMIT 1
         ) j ON true
         LEFT JOIN LATERAL (
           SELECT count(*) AS "TotalPlays",
             sum(jf_playback_activity."PlaybackDuration") AS "TotalWatchTime"
           FROM jf_playback_activity
           WHERE jf_playback_activity."UserId" = u."Id"
         ) plays ON true
         ORDER BY (now() - j."ActivityDateInserted");
    `).catch(function(error) {
        console.error(error);
      });
  };
  
  exports.down = async function(knex) {
    await knex.raw(`DROP VIEW jf_all_user_activity;`);
  };
  