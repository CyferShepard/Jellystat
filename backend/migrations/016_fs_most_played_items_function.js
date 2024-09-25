exports.up = async function(knex) {
    await knex.raw(`
      CREATE OR REPLACE FUNCTION fs_most_played_items(
        days integer,
        itemtype text
      )
      RETURNS TABLE(
        "Plays" bigint,
        total_playback_duration numeric,
        "Name" text,
        "Id" text,
        "PrimaryImageHash" text
      ) 
      LANGUAGE 'plpgsql'
      COST 100
      VOLATILE PARALLEL UNSAFE
      ROWS 1000
      AS $BODY$
      BEGIN
        RETURN QUERY
        SELECT 
          t.plays,
          t.total_playback_duration,
          i."Name",
          i."Id",
          i."PrimaryImageHash"
        FROM (
          SELECT 
            count(*) AS plays,
            sum(jf_playback_activity."PlaybackDuration") AS total_playback_duration,
            jf_playback_activity."NowPlayingItemId"
          FROM 
            jf_playback_activity
          WHERE 
            jf_playback_activity."ActivityDateInserted" BETWEEN CURRENT_DATE - MAKE_INTERVAL(days => days) and NOW()
          GROUP BY 
            jf_playback_activity."NowPlayingItemId"
          ORDER BY 
            count(*) DESC
        ) t
        JOIN jf_library_items i 
          ON t."NowPlayingItemId" = i."Id" 
          AND i."Type" = itemtype
        ORDER BY 
          t.plays DESC;
      END;
      $BODY$;
  
      ALTER FUNCTION fs_most_played_items(integer, text)
        OWNER TO "${process.env.POSTGRES_ROLE}";
    `).catch(function(error) {
        console.error(error);
      });
  };
  
  exports.down = async function(knex) {
    await knex.raw('DROP FUNCTION IF EXISTS fs_most_played_items(integer, text)');
  };
  
