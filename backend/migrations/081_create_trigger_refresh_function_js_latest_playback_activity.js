exports.up = async function (knex) {
  try {
    await knex.schema.raw(`
    CREATE OR REPLACE FUNCTION refresh_js_latest_playback_activity()
    RETURNS TRIGGER AS $$
    BEGIN
      REFRESH MATERIALIZED VIEW js_latest_playback_activity;
      RETURN NULL;
    END;
    $$ LANGUAGE plpgsql;


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
    DROP FUNCTION IF EXISTS public.refresh_js_latest_playback_activity;`);
  } catch (error) {
    console.error(error);
  }
};
