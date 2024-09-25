exports.up = async function(knex) {
    await knex.raw(`
      CREATE OR REPLACE FUNCTION fs_user_stats(
        hours integer,
        userid text
      )
      RETURNS TABLE(
        "Plays" bigint,
        total_playback_duration numeric,
        "UserId" text,
        "Name" text
      )
      LANGUAGE 'plpgsql'
      COST 100
      VOLATILE PARALLEL UNSAFE
      ROWS 1000
      AS $BODY$
      BEGIN
          RETURN QUERY
          SELECT
              count(*) AS "Plays",
              sum(jf_playback_activity."PlaybackDuration") AS total_playback_duration,
              jf_playback_activity."UserId",
              jf_playback_activity."UserName" AS "Name"
          FROM jf_playback_activity
          WHERE
              jf_playback_activity."ActivityDateInserted" BETWEEN CURRENT_DATE - INTERVAL '1 hour' * hours AND NOW()
              AND jf_playback_activity."UserId" = userid
          GROUP BY jf_playback_activity."UserId", jf_playback_activity."UserName"
          ORDER BY count(*) DESC;
      END;
      $BODY$;
  
      ALTER FUNCTION fs_user_stats(integer, text)
      OWNER TO "${process.env.POSTGRES_ROLE}";
    `).catch(function(error) {
        console.error(error);
      });
  };
  
  exports.down = async function(knex) {
    await knex.raw(`DROP FUNCTION IF EXISTS fs_user_stats(integer, text);`);
  };
  