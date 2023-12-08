exports.up = async function(knex) {
  try
  {
     await knex.schema.raw(`
     DROP FUNCTION IF EXISTS public.fs_most_played_items(integer, text);

      CREATE OR REPLACE FUNCTION public.fs_most_played_items(
      	days integer,
      	itemtype text)
          RETURNS TABLE("Plays" bigint, total_playback_duration numeric, "Name" text, "Id" text, "PrimaryImageHash" text, archived boolean)
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
                i."PrimaryImageHash",
      		  i.archived
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

      $BODY$;`);

}catch (error) {
  console.error(error);
}
};

exports.down = async function(knex) {
  try {
      await knex.schema.raw(`
      DROP FUNCTION IF EXISTS public.fs_most_played_items(integer, text);

      CREATE OR REPLACE FUNCTION public.fs_most_played_items(
      	days integer,
      	itemtype text)
          RETURNS TABLE("Plays" bigint, total_playback_duration numeric, "Name" text, "Id" text, "PrimaryImageHash" text)
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

      $BODY$;`);
  } catch (error) {
    console.error(error);
  }
};
