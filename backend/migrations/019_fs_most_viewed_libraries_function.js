exports.up = function(knex) {
    return knex.raw(`
      CREATE OR REPLACE FUNCTION fs_most_viewed_libraries(
        days integer
      ) RETURNS TABLE(
        "Plays" numeric, 
        "Id" text, 
        "Name" text, 
        "ServerId" text, 
        "IsFolder" boolean, 
        "Type" text, 
        "CollectionType" text, 
        "ImageTagsPrimary" text
      ) 
      LANGUAGE 'plpgsql'
      COST 100
      VOLATILE PARALLEL UNSAFE
      ROWS 1000
      AS $BODY$
      BEGIN
        RETURN QUERY
        SELECT 
          sum(t."Plays"),
          l."Id",
          l."Name",
          l."ServerId",
          l."IsFolder",
          l."Type",
          l."CollectionType",
          l."ImageTagsPrimary"
        FROM (
          SELECT count(*) AS "Plays",
            sum(jf_playback_activity."PlaybackDuration") AS "TotalPlaybackDuration",
            jf_playback_activity."NowPlayingItemId"
          FROM jf_playback_activity
          WHERE 
            jf_playback_activity."ActivityDateInserted" BETWEEN CURRENT_DATE - MAKE_INTERVAL(days => days) and NOW()
  
          GROUP BY jf_playback_activity."NowPlayingItemId"
          ORDER BY "Plays" DESC
        ) t
        JOIN jf_library_items i 
          ON i."Id" = t."NowPlayingItemId"
        JOIN jf_libraries l 
          ON l."Id" = i."ParentId"
        GROUP BY 
          l."Id"
        ORDER BY 
          (sum( t."Plays")) DESC;
      END;
      $BODY$;
  
      ALTER FUNCTION fs_most_viewed_libraries(integer)
        OWNER TO "${process.env.POSTGRES_ROLE}";
    `).catch(function(error) {
        console.error(error);
      });
  };
  
  exports.down = function(knex) {
    return knex.raw(`
      DROP FUNCTION IF EXISTS fs_most_viewed_libraries(integer);
    `);
  };
  
