exports.up = async function (knex) {
  try {
    await knex.schema.raw(`
      DROP MATERIALIZED VIEW  IF EXISTS public.js_latest_playback_activity;

      CREATE MATERIALIZED VIEW js_latest_playback_activity AS
      WITH latest_activity AS (
        SELECT 
          "NowPlayingItemId",
          "EpisodeId",
          "UserId",
          MAX("ActivityDateInserted") AS max_date
        FROM public.jf_playback_activity
        GROUP BY "NowPlayingItemId", "EpisodeId", "UserId"
        order by max_date desc
      )
      SELECT 
        a.*
      FROM public.jf_playback_activity_with_metadata a
      JOIN latest_activity u
      ON a."NowPlayingItemId" = u."NowPlayingItemId"
      AND COALESCE(a."EpisodeId", '1') = COALESCE(u."EpisodeId", '1')
      AND a."UserId" = u."UserId"
      AND a."ActivityDateInserted" = u.max_date
      order by a."ActivityDateInserted" desc;


     ALTER MATERIALIZED VIEW  public.js_latest_playback_activity
     OWNER TO "${process.env.POSTGRES_ROLE}";
    `);
  } catch (error) {
    console.error(error);
  }
};

exports.down = async function (knex) {
  try {
    await knex.schema.raw(`
    DROP MATERIALIZED VIEW  IF EXISTS public.js_latest_playback_activity;`);
  } catch (error) {
    console.error(error);
  }
};
