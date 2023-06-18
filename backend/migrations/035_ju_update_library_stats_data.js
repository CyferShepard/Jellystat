exports.up = function(knex) {
    return knex.schema.raw(`
    CREATE OR REPLACE PROCEDURE ju_update_library_stats_data()
    LANGUAGE plpgsql
    AS $$
    BEGIN
      UPDATE jf_libraries l
      SET
        total_play_time = (
          SELECT COALESCE(SUM(COALESCE(i_1."RunTimeTicks", e_1."RunTimeTicks")), 0) AS sum
          FROM jf_library_items i_1
          LEFT JOIN jf_library_episodes e_1 ON i_1."Id" = e_1."SeriesId"
          WHERE i_1."ParentId" = l."Id"
            AND (
              (i_1."Type" <> 'Series'::text AND e_1."Id" IS NULL)
              OR (i_1."Type" = 'Series'::text AND e_1."Id" IS NOT NULL)
            )
        ),
        item_count = COALESCE(cv."Library_Count", 0::bigint),
        season_count = COALESCE(cv."Season_Count", 0::bigint),
        episode_count = COALESCE(cv."Episode_Count", 0::bigint)
      FROM jf_library_count_view cv
      WHERE cv."Id" = l."Id";
    END;
    $$;
    
    `).catch(function(error) {
        console.error(error);
      });
  };
  
  exports.down = function(knex) {
    return knex.schema.raw(`
      DROP PROCEDURE ju_update_library_stats_data;
    `);
  };
  