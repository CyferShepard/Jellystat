exports.up = async function(knex) {
    await knex.raw(`
      CREATE OR REPLACE FUNCTION fs_most_popular_items(
        days integer,
        itemtype text
      )
      RETURNS TABLE(
        unique_viewers bigint,
        latest_activity_date timestamp with time zone,
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
            t.unique_viewers,
            t.latest_activity_date,
            i."Name",
            i."Id",
            i."PrimaryImageHash"
        FROM (
            SELECT 
                jf_playback_activity."NowPlayingItemId",
                count(DISTINCT jf_playback_activity."UserId") AS unique_viewers,
                latest_activity_date.latest_date AS latest_activity_date
            FROM 
                jf_playback_activity
                JOIN (
                    SELECT 
                        jf_playback_activity_1."NowPlayingItemId",
                        max(jf_playback_activity_1."ActivityDateInserted") AS latest_date
                    FROM 
                        jf_playback_activity jf_playback_activity_1
                    GROUP BY jf_playback_activity_1."NowPlayingItemId"
                ) latest_activity_date 
                ON jf_playback_activity."NowPlayingItemId" = latest_activity_date."NowPlayingItemId"
            WHERE 
                jf_playback_activity."ActivityDateInserted" BETWEEN CURRENT_DATE - MAKE_INTERVAL(days => days) and NOW()
            GROUP BY 
                jf_playback_activity."NowPlayingItemId", latest_activity_date.latest_date
        ) t
        JOIN jf_library_items i 
            ON t."NowPlayingItemId" = i."Id" 
            AND i."Type" = itemtype
        ORDER BY 
            t.unique_viewers DESC, t.latest_activity_date DESC;
      END;
      $BODY$;
      ALTER FUNCTION fs_most_popular_items(integer, text)
      OWNER TO "${process.env.POSTGRES_ROLE}";
    `).catch(function(error) {
        console.error(error);
      });
  };
  
  exports.down = async function(knex) {
    await knex.raw(`DROP FUNCTION fs_most_popular_items(integer, text);`);
  };
  
