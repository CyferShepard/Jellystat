exports.up = function(knex) {
    return knex.raw(`
    DROP FUNCTION IF EXISTS fs_last_user_activity(text);
    CREATE OR REPLACE FUNCTION public.fs_last_user_activity(
      userid text)
        RETURNS TABLE("Id" text,"EpisodeId" text, "Name" text, "EpisodeName" text, "SeasonNumber" integer, "EpisodeNumber" integer, "PrimaryImageHash" text, "UserId" text, "UserName" text, "LastPlayed" interval) 
        LANGUAGE 'plpgsql'
        COST 100
        VOLATILE PARALLEL UNSAFE
        ROWS 1000
    
    AS $BODY$
          BEGIN
              RETURN QUERY
              SELECT *
              FROM (
                  SELECT DISTINCT ON (i."Name", e."Name")
                      i."Id",
               a."EpisodeId",
                      i."Name",
                      e."Name" AS "EpisodeName",
                      CASE WHEN a."SeasonId" IS NOT NULL THEN s."IndexNumber" ELSE NULL END AS "SeasonNumber",
                      CASE WHEN a."SeasonId" IS NOT NULL THEN e."IndexNumber" ELSE NULL END AS "EpisodeNumber",
                      i."PrimaryImageHash",
                      a."UserId",
                      a."UserName",
                      (NOW() - a."ActivityDateInserted") as "LastPlayed"
                  FROM jf_playback_activity a
                  JOIN jf_library_items i ON i."Id" = a."NowPlayingItemId"
                  LEFT JOIN jf_library_seasons s ON s."Id" = a."SeasonId"
                  LEFT JOIN jf_library_episodes e ON e."EpisodeId" = a."EpisodeId"
                  WHERE a."UserId" = userid
              ) AS latest_distinct_rows
              ORDER BY "LastPlayed";
          END;
          
    $BODY$;

      ALTER FUNCTION fs_last_user_activity(text)
        OWNER TO "${process.env.POSTGRES_ROLE}";
    `).catch(function(error) {
        console.error(error);
      });
  };
  
  exports.down = function(knex) {
    return knex.raw(`
      DROP FUNCTION IF EXISTS fs_last_user_activity(text);
      CREATE OR REPLACE FUNCTION fs_last_user_activity(
        userid text
      )
      RETURNS TABLE(
        "Id" text,
        "Name" text,
        "EpisodeName" text,
        "SeasonNumber" integer,
        "EpisodeNumber" integer,
        "PrimaryImageHash" text,
        "UserId" text,
        "UserName" text,
        "LastPlayed" interval
      ) 
      LANGUAGE 'plpgsql'
      COST 100
      VOLATILE PARALLEL UNSAFE
      ROWS 1000
      AS $BODY$
      BEGIN
          RETURN QUERY
          SELECT *
          FROM (
              SELECT DISTINCT ON (i."Name", e."Name")
                  i."Id",
                  i."Name",
                  e."Name" AS "EpisodeName",
                  CASE WHEN a."SeasonId" IS NOT NULL THEN s."IndexNumber" ELSE NULL END AS "SeasonNumber",
                  CASE WHEN a."SeasonId" IS NOT NULL THEN e."IndexNumber" ELSE NULL END AS "EpisodeNumber",
                  i."PrimaryImageHash",
                  a."UserId",
                  a."UserName",
                  (NOW() - a."ActivityDateInserted") as "LastPlayed"
              FROM jf_playback_activity a
              JOIN jf_library_items i ON i."Id" = a."NowPlayingItemId"
              LEFT JOIN jf_library_seasons s ON s."Id" = a."SeasonId"
              LEFT JOIN jf_library_episodes e ON e."EpisodeId" = a."EpisodeId"
              WHERE a."UserId" = userid
          ) AS latest_distinct_rows
          ORDER BY "LastPlayed";
      END;
      $BODY$;
      
      ALTER FUNCTION fs_last_user_activity(text)
        OWNER TO "${process.env.POSTGRES_ROLE}";
    `);
  };
  