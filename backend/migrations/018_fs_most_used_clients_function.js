exports.up = async function(knex) {
    await knex.raw(`
      CREATE OR REPLACE FUNCTION fs_most_used_clients(
        days integer
      )
      RETURNS TABLE("Plays" bigint, "Client" text) 
      LANGUAGE 'plpgsql'
      COST 100
      VOLATILE PARALLEL UNSAFE
      ROWS 1000
  
      AS $BODY$
      BEGIN
          RETURN QUERY
          SELECT count(*) AS "Plays",
              jf_playback_activity."Client"
          FROM jf_playback_activity
          WHERE jf_playback_activity."ActivityDateInserted" BETWEEN CURRENT_DATE - MAKE_INTERVAL(days => days) AND NOW()
          GROUP BY jf_playback_activity."Client"
          ORDER BY (count(*)) DESC;
      END;
      $BODY$;
  
      ALTER FUNCTION fs_most_used_clients(integer)
          OWNER TO "${process.env.POSTGRES_ROLE}";
    `).catch(function(error) {
      console.error(error);
    });
  };
  
  exports.down = async function(knex) {
    await knex.raw(`DROP FUNCTION fs_most_used_clients(integer);`);
  };
  
