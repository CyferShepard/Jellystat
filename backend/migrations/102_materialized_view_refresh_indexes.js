const indexes = [
  {
    name: "js_latest_playback_activity_id_idx",
    view: "js_latest_playback_activity",
  },
  {
    name: "js_library_items_with_playcount_playtime_id_idx",
    view: "js_library_items_with_playcount_playtime",
  },
];

exports.up = async function (knex) {
  for (const { name, view } of indexes) {
    await knex.schema.raw(`
      CREATE UNIQUE INDEX IF NOT EXISTS ${name}
      ON public.${view} ("Id");
    `);
  }
};

exports.down = async function (knex) {
  for (const { name } of indexes) {
    await knex.schema.raw(`DROP INDEX IF EXISTS public.${name};`);
  }
};
