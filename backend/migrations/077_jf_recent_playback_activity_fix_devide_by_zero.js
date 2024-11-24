exports.up = async function (knex) {
  try {
    await knex.schema.raw(`
DROP FUNCTION IF EXISTS public.jf_recent_playback_activity(integer);

CREATE OR REPLACE FUNCTION public.jf_recent_playback_activity(
	hour_offset integer)
    RETURNS TABLE("RunTimeTicks" bigint, "Progress" numeric, "Id" text, "IsPaused" boolean, "UserId" text, "UserName" text, "Client" text, "DeviceName" text, "DeviceId" text, "ApplicationVersion" text, "NowPlayingItemId" text, "NowPlayingItemName" text, "SeasonId" text, "SeriesName" text, "EpisodeId" text, "PlaybackDuration" bigint, "ActivityDateInserted" timestamp with time zone, "PlayMethod" text, "MediaStreams" json, "TranscodingInfo" json, "PlayState" json, "OriginalContainer" text, "RemoteEndPoint" text, "ServerId" text, "Imported" boolean, "RowNum" bigint) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
      BEGIN
          RETURN QUERY
          WITH rankedactivities AS (
               SELECT COALESCE(i."RunTimeTicks", e."RunTimeTicks") AS "RunTimeTicks",
			   CASE
      			WHEN COALESCE(i."RunTimeTicks"::numeric(100,0), e."RunTimeTicks"::numeric(100,0), 1.0) > 0 THEN ((a."PlaybackDuration" * 10000000)::numeric(100,0) / COALESCE(i."RunTimeTicks"::numeric(100,0), e."RunTimeTicks"::numeric(100,0), 1.0) * 100::numeric)::numeric(100,2)
      		   ELSE 1.0
    		   END AS "Progress",
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
                  row_number() OVER (PARTITION BY a."NowPlayingItemId",a."EpisodeId",a."UserId" ORDER BY a."ActivityDateInserted" DESC) AS rownum
                 FROM jf_playback_activity a
                   LEFT JOIN jf_library_items i ON a."NowPlayingItemId" = i."Id"
                   LEFT JOIN jf_library_episodes e ON a."EpisodeId" = e."EpisodeId"
                WHERE a."ActivityDateInserted" > (CURRENT_TIMESTAMP - (hour_offset || ' hours')::interval)
                ORDER BY a."ActivityDateInserted" DESC
              )
           SELECT * FROM rankedactivities WHERE rankedactivities.rownum = 1;
      END;
      
$BODY$;

ALTER FUNCTION public.jf_recent_playback_activity(integer)
     OWNER TO "${process.env.POSTGRES_ROLE}";
    `);
  } catch (error) {
    console.error(error);
  }
};

exports.down = async function (knex) {
  try {
    await knex.schema.raw(`
       DROP FUNCTION IF EXISTS public.jf_recent_playback_activity(integer);

CREATE OR REPLACE FUNCTION public.jf_recent_playback_activity(
	hour_offset integer)
    RETURNS TABLE("RunTimeTicks" bigint, "Progress" numeric, "Id" text, "IsPaused" boolean, "UserId" text, "UserName" text, "Client" text, "DeviceName" text, "DeviceId" text, "ApplicationVersion" text, "NowPlayingItemId" text, "NowPlayingItemName" text, "SeasonId" text, "SeriesName" text, "EpisodeId" text, "PlaybackDuration" bigint, "ActivityDateInserted" timestamp with time zone, "PlayMethod" text, "MediaStreams" json, "TranscodingInfo" json, "PlayState" json, "OriginalContainer" text, "RemoteEndPoint" text, "ServerId" text, "Imported" boolean, "RowNum" bigint) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
      BEGIN
          RETURN QUERY
          WITH rankedactivities AS (
               SELECT COALESCE(i."RunTimeTicks", e."RunTimeTicks") AS "RunTimeTicks",
               ((a."PlaybackDuration" * 10000000)::numeric(100,0) / COALESCE(i."RunTimeTicks"::numeric(100,0), e."RunTimeTicks"::numeric(100,0), 1.0) * 100::numeric)::numeric(100,2) AS "Progress",
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
                  row_number() OVER (PARTITION BY a."NowPlayingItemId",a."EpisodeId",a."UserId" ORDER BY a."ActivityDateInserted" DESC) AS rownum
                 FROM jf_playback_activity a
                   LEFT JOIN jf_library_items i ON a."NowPlayingItemId" = i."Id"
                   LEFT JOIN jf_library_episodes e ON a."EpisodeId" = e."EpisodeId"
                WHERE a."ActivityDateInserted" > (CURRENT_TIMESTAMP - (hour_offset || ' hours')::interval)
                ORDER BY a."ActivityDateInserted" DESC
              )
           SELECT * FROM rankedactivities WHERE rankedactivities.rownum = 1;
      END;
      
$BODY$;
  
      ALTER FUNCTION public.jf_recent_playback_activity(integer)
        OWNER TO "${process.env.POSTGRES_ROLE}";`);
  } catch (error) {
    console.error(error);
  }
};
