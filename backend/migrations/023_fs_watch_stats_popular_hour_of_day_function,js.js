exports.up =async function(knex) {
    return knex.raw(`
    CREATE OR REPLACE FUNCTION fs_watch_stats_popular_hour_of_day(
      days integer
    ) RETURNS TABLE("Hour" integer, "Count" integer, "Library" text)
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000
    AS $BODY$
    BEGIN
      RETURN QUERY
        SELECT
          h."Hour",
          COUNT(a."Id")::integer AS "Count",
          l."Name" AS "Library"
        FROM
          (
            SELECT
              generate_series(0, 23) AS "Hour"
          ) h
          CROSS JOIN jf_libraries l
          LEFT JOIN jf_library_items i ON i."ParentId" = l."Id"
          LEFT JOIN (
            SELECT
              "NowPlayingItemId",
              DATE_PART('hour', "ActivityDateInserted") AS "Hour",
              "Id"
            FROM
              jf_playback_activity
            WHERE
              "ActivityDateInserted" BETWEEN NOW() - CAST(days || ' days' AS INTERVAL) AND NOW()
          ) a ON a."NowPlayingItemId" = i."Id" AND a."Hour"::integer = h."Hour"
        WHERE
          l."Id" IN (SELECT "Id" FROM jf_libraries)
        GROUP BY
          h."Hour",
          l."Name"
        ORDER BY
          l."Name",
          h."Hour";
    END;
    $BODY$;
    ALTER FUNCTION fs_watch_stats_popular_hour_of_day(integer)
    OWNER TO "${process.env.POSTGRES_ROLE}";
    `).catch(function(error) {
        console.error(error);
      });
  };
  
  exports.down = function(knex) {
    return knex.raw('DROP FUNCTION IF EXISTS fs_watch_stats_popular_hour_of_day(integer)');
  };
  