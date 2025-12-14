exports.up = async function (knex) {
  try {
    await knex.schema.raw(`
      DROP MATERIALIZED VIEW  IF EXISTS public.js_library_items_with_playcount_playtime;

      CREATE MATERIALIZED VIEW public.js_library_items_with_playcount_playtime
       AS
        SELECT * 
        FROM "jf_library_items_with_playcount_playtime";


     ALTER MATERIALIZED VIEW  public.js_library_items_with_playcount_playtime
     OWNER TO "${process.env.POSTGRES_ROLE}";
    `);
  } catch (error) {
    console.error(error);
  }
};

exports.down = async function (knex) {
  try {
    await knex.schema.raw(`
      DROP MATERIALIZED VIEW  IF EXISTS public.js_library_items_with_playcount_playtime;
`);
  } catch (error) {
    console.error(error);
  }
};
