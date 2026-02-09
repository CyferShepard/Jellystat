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
                  "ItemName" "NowPlayingItemName",
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
    await knex.raw(`
        MERGE INTO jf_playback_activity a
        USING jf_library_episodes e
        ON a."NowPlayingItemId" = e."EpisodeId"
        WHEN MATCHED
            AND a."NowPlayingItemId" = a."EpisodeId"
            AND a."imported" = true
            AND position('-' in a."Id") = 0
        THEN UPDATE SET "NowPlayingItemId" = e."SeriesId";
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

    // revert only the Playback plugin records back to the old NowPlayingId=EpisodeId
    await knex.raw(`
        UPDATE jf_playback_activity
        SET "NowPlayingItemId" = "EpisodeId"
        WHERE "EpisodeId" IS NOT NULL
        AND "NowPlayingItemId" != "EpisodeId"
        AND position('-' in "Id") = 0
        AND "imported" = true;
    `);
  } catch (error) {
    console.error(error);
  }
};
