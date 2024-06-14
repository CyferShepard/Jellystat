exports.up = async function(knex) {
  try
  {
     await knex.schema.raw(`
     CREATE OR REPLACE FUNCTION jf_recent_playback_activity(hour_offset INT)
      RETURNS TABLE (
          "RunTimeTicks" BIGINT,
          "Progress" NUMERIC,
          "Id" TEXT,
          "IsPaused" BOOLEAN,
          "UserId" TEXT,
          "UserName" TEXT,
          "Client" TEXT,
          "DeviceName" TEXT,
          "DeviceId" TEXT,
          "ApplicationVersion" TEXT,
          "NowPlayingItemId" TEXT,
          "NowPlayingItemName" TEXT,
          "SeasonId" TEXT,
          "SeriesName" TEXT,
          "EpisodeId" TEXT,
          "PlaybackDuration" BIGINT,
          "ActivityDateInserted" timestamptz,
          "PlayMethod" TEXT,
          "MediaStreams" JSON,
          "TranscodingInfo" JSON,
          "PlayState" JSON,
          "OriginalContainer" TEXT,
          "RemoteEndPoint" TEXT,
          "ServerId" TEXT,
          "Imported" BOOLEAN,
          "RowNum" BIGINT
      )
      AS $$
      BEGIN
          RETURN QUERY
          WITH rankedactivities AS (
               SELECT COALESCE(i."RunTimeTicks", e."RunTimeTicks") AS "RunTimeTicks",
               ((a."PlaybackDuration" * 10000000)::numeric(100,0) / COALESCE(i."RunTimeTicks"::numeric(100,0), e."RunTimeTicks"::numeric(100,0), 1.0) * 100::numeric)::numeric(10,2) AS "Progress",
                  a."Id",
                  a."IsPaused",
                  a."UserId",
                  a."UserName",
                  a."Client",
                  a."DeviceName",
                  a."DeviceId",
                  a."ApplicationVersion",
                  a."NowPlayingItemId",
                  a."NowPlayingItemName",
                  a."SeasonId",
                  a."SeriesName",
                  a."EpisodeId",
                  a."PlaybackDuration",
                  a."ActivityDateInserted",
                  a."PlayMethod",
                  a."MediaStreams",
                  a."TranscodingInfo",
                  a."PlayState",
                  a."OriginalContainer",
                  a."RemoteEndPoint",
                  a."ServerId",
                  a.imported,
                  row_number() OVER (PARTITION BY a."NowPlayingItemId",a."UserId" ORDER BY a."ActivityDateInserted" DESC) AS rownum
                 FROM jf_playback_activity a
                   LEFT JOIN jf_library_items i ON a."NowPlayingItemId" = i."Id"
                   LEFT JOIN jf_library_episodes e ON a."EpisodeId" = e."EpisodeId"
                WHERE a."ActivityDateInserted" > (CURRENT_TIMESTAMP - (hour_offset || ' hours')::interval)
                ORDER BY a."ActivityDateInserted" DESC
              )
           SELECT * FROM rankedactivities WHERE rankedactivities.rownum = 1;
      END;
      $$ LANGUAGE plpgsql;
          
     `
           );

}catch (error) {
  console.error(error);
}
};

exports.down = async function(knex) {
  try {
    await knex.raw(`     
    
    CREATE OR REPLACE FUNCTION jf_recent_playback_activity(hour_offset INT)
      RETURNS TABLE (
          "RunTimeTicks" BIGINT,
          "Progress" NUMERIC,
          "Id" TEXT,
          "IsPaused" BOOLEAN,
          "UserId" TEXT,
          "UserName" TEXT,
          "Client" TEXT,
          "DeviceName" TEXT,
          "DeviceId" TEXT,
          "ApplicationVersion" TEXT,
          "NowPlayingItemId" TEXT,
          "NowPlayingItemName" TEXT,
          "SeasonId" TEXT,
          "SeriesName" TEXT,
          "EpisodeId" TEXT,
          "PlaybackDuration" BIGINT,
          "ActivityDateInserted" timestamptz,
          "PlayMethod" TEXT,
          "MediaStreams" JSON,
          "TranscodingInfo" JSON,
          "PlayState" JSON,
          "OriginalContainer" TEXT,
          "RemoteEndPoint" TEXT,
          "ServerId" TEXT,
          "Imported" BOOLEAN,
          "RowNum" BIGINT
      )
      AS $$
      BEGIN
          RETURN QUERY
          WITH rankedactivities AS (
               SELECT COALESCE(i."RunTimeTicks", e."RunTimeTicks") AS "RunTimeTicks",
                  (a."PlaybackDuration"::numeric(100,0) / COALESCE(i."RunTimeTicks"::numeric(100,0), e."RunTimeTicks"::numeric(100,0), 1.0) * 100::numeric)::numeric(10,2) AS "Progress",
                  a."Id",
                  a."IsPaused",
                  a."UserId",
                  a."UserName",
                  a."Client",
                  a."DeviceName",
                  a."DeviceId",
                  a."ApplicationVersion",
                  a."NowPlayingItemId",
                  a."NowPlayingItemName",
                  a."SeasonId",
                  a."SeriesName",
                  a."EpisodeId",
                  a."PlaybackDuration",
                  a."ActivityDateInserted",
                  a."PlayMethod",
                  a."MediaStreams",
                  a."TranscodingInfo",
                  a."PlayState",
                  a."OriginalContainer",
                  a."RemoteEndPoint",
                  a."ServerId",
                  a.imported,
                  row_number() OVER (PARTITION BY a."NowPlayingItemId",a."UserId" ORDER BY a."ActivityDateInserted" DESC) AS rownum
                 FROM jf_playback_activity a
                   LEFT JOIN jf_library_items i ON a."NowPlayingItemId" = i."Id"
                   LEFT JOIN jf_library_episodes e ON a."EpisodeId" = e."EpisodeId"
                WHERE a."ActivityDateInserted" > (CURRENT_TIMESTAMP - (hour_offset || ' hours')::interval)
                ORDER BY a."ActivityDateInserted" DESC
              )
           SELECT * FROM rankedactivities WHERE rankedactivities.rownum = 1;
      END;
      $$ LANGUAGE plpgsql;
        
   `);
  } catch (error) {
    console.error(error);
  }
};
