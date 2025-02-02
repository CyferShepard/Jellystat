exports.up = async function (knex) {
  try {
    await knex.schema.raw(`
      DROP VIEW IF EXISTS public.jf_playback_activity_with_metadata;

      CREATE VIEW jf_playback_activity_with_metadata AS
      select a.*,e."IndexNumber" as "EpisodeNumber",e."ParentIndexNumber" as "SeasonNumber",i."ParentId"
      FROM "jf_playback_activity" AS "a"
      LEFT JOIN jf_library_episodes AS e 
      	ON  "a"."EpisodeId" = "e"."EpisodeId" 
      	AND "a"."SeasonId" = "e"."SeasonId" 
      LEFT JOIN jf_library_items AS i 
      	ON  "i"."Id" = "a"."NowPlayingItemId" OR "e"."SeriesId" = "i"."Id" 
      order by a."ActivityDateInserted" desc;


     ALTER VIEW  public.jf_playback_activity_with_metadata
     OWNER TO "${process.env.POSTGRES_ROLE}";
    `);
  } catch (error) {
    console.error(error);
  }
};

exports.down = async function (knex) {
  try {
    await knex.schema.raw(`
    DROP VIEW IF EXISTS public.jf_playback_activity_with_metadata;`);
  } catch (error) {
    console.error(error);
  }
};
