exports.up = async function (knex) {
  try {
    await knex.schema.raw(`
    CREATE OR REPLACE FUNCTION refresh_js_library_stats_overview()
    RETURNS TRIGGER AS $$
    BEGIN
      REFRESH MATERIALIZED VIEW js_library_stats_overview;
      RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;


     ALTER MATERIALIZED VIEW  public.js_library_stats_overview
     OWNER TO "${process.env.POSTGRES_ROLE}";
    `);
  } catch (error) {
    console.error(error);
  }
};

exports.down = async function (knex) {
  try {
    await knex.schema.raw(`
    DROP FUNCTION IF EXISTS public.refresh_js_library_stats_overview;`);
  } catch (error) {
    console.error(error);
  }
};
