exports.up =async function(knex) {
    return knex.raw(`
      CREATE OR REPLACE FUNCTION fs_watch_stats_popular_days_of_week(
        days integer
      )
      RETURNS TABLE("Day" text, "Count" bigint, "Library" text) 
      LANGUAGE 'plpgsql'
      COST 100
      VOLATILE PARALLEL UNSAFE
      ROWS 1000
      AS $BODY$
      BEGIN
        RETURN QUERY
        WITH library_days AS (
          SELECT
            l."Name" AS "Library",
            d.day_of_week,
            d.day_name
          FROM
            jf_libraries l,
            (SELECT 0 AS "day_of_week", 'Sunday' AS "day_name" UNION ALL
             SELECT 1 AS "day_of_week", 'Monday' AS "day_name" UNION ALL
             SELECT 2 AS "day_of_week", 'Tuesday' AS "day_name" UNION ALL
             SELECT 3 AS "day_of_week", 'Wednesday' AS "day_name" UNION ALL
             SELECT 4 AS "day_of_week", 'Thursday' AS "day_name" UNION ALL
             SELECT 5 AS "day_of_week", 'Friday' AS "day_name" UNION ALL
             SELECT 6 AS "day_of_week", 'Saturday' AS "day_name"
            ) d
        )
        SELECT 
          library_days.day_name AS "Day",
          COALESCE(SUM(counts."Count"), 0)::bigint AS "Count",
          library_days."Library" AS "Library"
        FROM 
          library_days
          LEFT JOIN 
            (SELECT 
               DATE_TRUNC('day', a."ActivityDateInserted")::DATE AS "Date",
               COUNT(*) AS "Count",
               EXTRACT(DOW FROM a."ActivityDateInserted") AS "DOW",
               l."Name" AS "Library"
             FROM 
               jf_playback_activity a
               JOIN jf_library_items i ON i."Id" = a."NowPlayingItemId"
               JOIN jf_libraries l ON i."ParentId" = l."Id"
             WHERE 
               a."ActivityDateInserted" BETWEEN NOW() - CAST(days || ' days' as INTERVAL) AND NOW()
             GROUP BY 
               l."Name", EXTRACT(DOW FROM a."ActivityDateInserted"), DATE_TRUNC('day', a."ActivityDateInserted")
            ) counts 
            ON counts."DOW" = library_days.day_of_week AND counts."Library" = library_days."Library"
        GROUP BY
          library_days.day_name, library_days.day_of_week, library_days."Library"
        ORDER BY 
          library_days.day_of_week, library_days."Library";
      END;
      $BODY$;
      ALTER FUNCTION fs_watch_stats_popular_days_of_week(integer)
      OWNER TO "${process.env.POSTGRES_ROLE}";
    `).catch(function(error) {
        console.error(error);
      });
  };
  
  exports.down = function(knex) {
    return knex.raw('DROP FUNCTION IF EXISTS fs_watch_stats_popular_days_of_week(integer)');
  };
  