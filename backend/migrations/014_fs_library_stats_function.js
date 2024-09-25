exports.up = async function(knex) {
    await knex.raw(`
      CREATE OR REPLACE FUNCTION fs_library_stats(
        hours integer,
        libraryid text)
        RETURNS TABLE("Plays" bigint, total_playback_duration numeric, "Id" text, "Name" text) 
        LANGUAGE 'plpgsql'
        COST 100
        VOLATILE PARALLEL UNSAFE
        ROWS 1000
      AS $BODY$
      BEGIN
          RETURN QUERY
          SELECT count(*) AS "Plays",
            sum(a."PlaybackDuration") AS total_playback_duration,
              l."Id",
              l."Name"
          FROM jf_playback_activity a
          join jf_library_items i
          on a."NowPlayingItemId"=i."Id"
          join jf_libraries l
          on i."ParentId"=l."Id"
          WHERE a."ActivityDateInserted" BETWEEN CURRENT_DATE - MAKE_INTERVAL(hours => hours) AND NOW()
          and  l."Id"=libraryid
          GROUP BY l."Id", l."Name"
          ORDER BY (count(*)) DESC;
      END;
      $BODY$;
  
      ALTER FUNCTION fs_library_stats(integer, text)
          OWNER TO "${process.env.POSTGRES_ROLE}";
    `).catch(function(error) {
        console.error(error);
      });
  };
  
  exports.down = async function(knex) {
    await knex.raw(`
      DROP FUNCTION IF EXISTS fs_library_stats(integer, text);
    `);
  };
  
