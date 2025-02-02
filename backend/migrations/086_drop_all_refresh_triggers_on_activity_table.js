exports.up = async function (knex) {
  try {
    await knex.schema.raw(`
     DROP TRIGGER IF EXISTS refresh_js_library_stats_overview_trigger ON public.jf_playback_activity;
     DROP TRIGGER IF EXISTS refresh_js_latest_playback_activity_trigger ON public.jf_playback_activity;
    `);
  } catch (error) {
    console.error(error);
  }
};

exports.down = async function (knex) {
  try {
    await knex.schema.raw(`
    DROP TRIGGER IF EXISTS refresh_js_library_stats_overview_trigger ON public.jf_playback_activity;
    DROP TRIGGER IF EXISTS refresh_js_latest_playback_activity_trigger ON public.jf_playback_activity;
     `);
  } catch (error) {
    console.error(error);
  }
};
