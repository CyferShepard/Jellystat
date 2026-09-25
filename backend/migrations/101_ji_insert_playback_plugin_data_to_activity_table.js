exports.up = async function (knex) {
  try {
    // Update the procedure to use SeriesId for shows
    await knex.schema.raw(`
    CREATE OR REPLACE PROCEDURE public.ji_insert_playback_plugin_data_to_activity_table(
      )
    LANGUAGE 'plpgsql'
    AS $BODY$
            BEGIN
                insert into jf_playback_activity
                  SELECT 
                  rowid, 
                  false "IsPaused",
                  pb."UserId",
                  u."Name",
                  pb."ClientName",
                  pb."DeviceName",
                  null "DeviceId",
                  null "ApplicationVersion",
                  CASE WHEN e."EpisodeId"=pb."ItemId" THEN e."SeriesId" ELSE "ItemId" END "NowPlayingItemId",
                  CASE WHEN e."EpisodeId"=pb."ItemId" THEN e."Name" ELSE "ItemName" END "NowPlayingItemName",
                  CASE WHEN e."EpisodeId"=pb."ItemId" THEN e."SeasonId" ELSE null END  "SeasonId",
                  CASE WHEN i."Id"=e."SeriesId" THEN i."Name" ELSE null END  "SeriesName",
                  CASE WHEN e."EpisodeId"=pb."ItemId" THEN e."EpisodeId" ELSE null END "EpisodeId",
                  "PlayDuration" "PlaybackDuration",
                  pb."DateCreated" "ActivityDateInserted", 
                  "PlaybackMethod" "PlayMethod",
                  null "MediaStreams",
                  null "TranscodingInfo",
                  null "PlayState",
                  null "OriginalContainer",
                  null "RemoteEndPoint",
                  null "ServerId",
                  true "imported"
                    FROM public.jf_playback_reporting_plugin_data pb
                    LEFT JOIN public.jf_users u
                    on u."Id"=pb."UserId"
                  
                    LEFT JOIN public.jf_library_episodes e
                    on e."EpisodeId"=pb."ItemId"
                  
                    LEFT JOIN public.jf_library_items i
                    on i."Id"=pb."ItemId"
                    or i."Id"=e."SeriesId"
                  
                    WHERE NOT EXISTS
                    (
                      SELECT "Id" "rowid"
                      FROM jf_playback_activity
                      WHERE imported=true
                    )
                    AND
                    (i."Type" is not null OR (i."Type"='Series' and e."SeasonId" is not null and  e."Id" is not null ));
                      END;
                      
        
    $BODY$;
    ALTER PROCEDURE public.ji_insert_playback_plugin_data_to_activity_table()
    OWNER TO "${process.env.POSTGRES_ROLE}";
    `);

    // Update all existing playback plugin data to have the correct NowPlayingItemId=SeriesId
    // and set the NowPlayingItemName to the jf_library_episode."Name"
    // UPDATE ... FROM is used instead of MERGE because MERGE requires PostgreSQL 15+
    // and fails when jf_library_episodes contains more than one row per EpisodeId.
    // DISTINCT ON picks exactly one episode row per EpisodeId so the result is deterministic.
    await knex.raw(`
        UPDATE jf_playback_activity a
        SET "NowPlayingItemId" = e."SeriesId", "NowPlayingItemName" = e."Name"
        FROM (
            SELECT DISTINCT ON ("EpisodeId") "EpisodeId", "SeriesId", "Name"
            FROM jf_library_episodes
            ORDER BY "EpisodeId", "Id"
        ) e
        WHERE a."NowPlayingItemId" = e."EpisodeId"
            AND a."NowPlayingItemId" = a."EpisodeId"
            AND a."imported" = true
            AND position('-' in a."Id") = 0;
    `);
  } catch (error) {
    console.error(error);
  }
};

exports.down = async function (knex) {
  try {
    // Revert the procedure to the previous state
    await knex.schema.raw(`
    CREATE OR REPLACE PROCEDURE public.ji_insert_playback_plugin_data_to_activity_table(
      )
    LANGUAGE 'plpgsql'
    AS $BODY$
            BEGIN
                insert into jf_playback_activity
                  SELECT 
                  rowid, 
                  false "IsPaused",
                  pb."UserId",
                  u."Name",
                  pb."ClientName",
                  pb."DeviceName",
                  null "DeviceId",
                  null "ApplicationVersion",
                  "ItemId" "NowPlayingItemId",
                  "ItemName" "NowPlayingItemName",
                  CASE WHEN e."EpisodeId"=pb."ItemId" THEN e."SeasonId" ELSE null END "SeasonId",
                  CASE WHEN i."Id"=e."SeriesId" THEN i."Name" ELSE null END  "SeriesName",
                  CASE WHEN e."EpisodeId"=pb."ItemId" THEN e."EpisodeId" ELSE null END "EpisodeId",
                  "PlayDuration" "PlaybackDuration",
                  pb."DateCreated" "ActivityDateInserted", 
                  "PlaybackMethod" "PlayMethod",
                  null "MediaStreams",
                  null "TranscodingInfo",
                  null "PlayState",
                  null "OriginalContainer",
                  null "RemoteEndPoint",
                  null "ServerId",
                  true "imported"
                    FROM public.jf_playback_reporting_plugin_data pb
                    LEFT JOIN public.jf_users u
                    on u."Id"=pb."UserId"
                  
                    LEFT JOIN public.jf_library_episodes e
                    on e."EpisodeId"=pb."ItemId"
                  
                    LEFT JOIN public.jf_library_items i
                    on i."Id"=pb."ItemId"
                    or i."Id"=e."SeriesId"
                  
                    WHERE NOT EXISTS
                    (
                      SELECT "Id" "rowid"
                      FROM jf_playback_activity
                      WHERE imported=true
                    )
                    AND
                    (i."Type" is not null OR (i."Type"='Series' and e."SeasonId" is not null and  e."Id" is not null ));
                      END;
                      
        
    $BODY$;
    ALTER PROCEDURE public.ji_insert_playback_plugin_data_to_activity_table()
    OWNER TO "${process.env.POSTGRES_ROLE}";
    `);

    // revert only the Playback plugin records back to the old NowPlayingId=EpisodeId
    // and reset the NowPlayingItemName to the original playback reporting name
    // UPDATE ... FROM instead of MERGE for PostgreSQL < 15 compatibility (rowid is unique, so one match per row)
    await knex.raw(`
        UPDATE jf_playback_activity a
        SET "NowPlayingItemId" = a."EpisodeId", "NowPlayingItemName" = p."ItemName"
        FROM jf_playback_reporting_plugin_data p
        WHERE a."Id" = p."rowid"::TEXT
            AND a."EpisodeId" IS NOT NULL
            AND a."NowPlayingItemId" != a."EpisodeId"
            AND position('-' in a."Id") = 0
            AND a."imported" = true;
    `);
  } catch (error) {
    console.error(error);
  }
};
