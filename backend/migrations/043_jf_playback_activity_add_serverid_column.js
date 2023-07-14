exports.up = async function(knex) {
  try
  {
  const hasTable = await knex.schema.hasTable('jf_playback_activity');
  if (hasTable) {
    await knex.schema.alterTable('jf_playback_activity', function(table) {
      table.text('ServerId');
      table.boolean('imported').defaultTo(false);
    });
  }
}catch (error) {
  console.error(error);
}
};

exports.down = async function(knex) {
  try {
    await knex.schema.alterTable('jf_playback_activity', function(table) {
      table.dropColumn('ServerId');
      table.dropColumn('imported');
    });
  } catch (error) {
    console.error(error);
  }
};
