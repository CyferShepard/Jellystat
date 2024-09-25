exports.up = function(knex) {
    return knex.raw(`
      CREATE OR REPLACE FUNCTION fs_most_active_user(
        days integer)
        RETURNS TABLE("Plays" bigint, "UserId" text, "Name" text) 
        LANGUAGE 'plpgsql'
        COST 100
        VOLATILE PARALLEL UNSAFE
        ROWS 1000
      AS $BODY$
      BEGIN
          RETURN QUERY
          SELECT count(*) AS "Plays",
              jf_playback_activity."UserId",
              jf_playback_activity."UserName" AS "Name"
          FROM jf_playback_activity
          WHERE jf_playback_activity."ActivityDateInserted" BETWEEN CURRENT_DATE - MAKE_INTERVAL(days => days) AND NOW()
          GROUP BY jf_playback_activity."UserId", jf_playback_activity."UserName"
          ORDER BY (count(*)) DESC;
      END;
      $BODY$;
      ALTER FUNCTION fs_most_active_user(integer)
      OWNER TO "${process.env.POSTGRES_ROLE}";
    `).catch(function(error) {
      console.error(error);
    });
  };
  
  exports.down = function(knex) {
    return knex.raw('DROP FUNCTION IF EXISTS fs_most_active_user(integer)');
  };
  
