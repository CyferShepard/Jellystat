const indexes = [
  {
    name: "jf_library_seasons_series_id_idx",
    table: "jf_library_seasons",
    column: "SeriesId",
  },
  {
    name: "jf_library_episodes_season_id_idx",
    table: "jf_library_episodes",
    column: "SeasonId",
  },
  {
    name: "jf_playback_activity_now_playing_item_id_idx",
    table: "jf_playback_activity",
    column: "NowPlayingItemId",
  },
];

exports.up = async function (knex) {
  for (const { name, table, column } of indexes) {
    await knex.schema.raw(`
      CREATE INDEX IF NOT EXISTS ${name}
      ON public.${table} ("${column}");
    `);
  }
};

exports.down = async function (knex) {
  for (const { name } of indexes) {
    await knex.schema.raw(`DROP INDEX IF EXISTS public.${name};`);
  }
};
