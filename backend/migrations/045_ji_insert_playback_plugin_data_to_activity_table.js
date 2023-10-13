exports.up = function (knex) {
  return knex.schema
    .raw(
      `
    CREATE OR REPLACE PROCEDURE ji_insert_playback_plugin_data_to_activity_table() AS $$
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
          CASE WHEN e."EpisodeId"=pb."ItemId" THEN e."Id" ELSE null END "EpisodeId",
          "PlayDuration" "PlaybackDuration",
          "DateCreated" "ActivityDateInserted", 
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
          	);
              END;
              $$ LANGUAGE plpgsql;
    `,
    )
    .catch(function (error) {
      console.error(error);
    });
};

exports.down = function (knex) {
  return knex.schema.raw(`
      DROP PROCEDURE ji_insert_playback_plugin_data_to_activity_table;
    `);
};
