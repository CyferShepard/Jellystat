exports.up = async function (knex) {
  try {
    const hasTable = await knex.schema.hasTable("app_config");
    if (hasTable) {
      await knex.schema.alterTable("jf_playback_activity", function (table) {
        table.unique("Id");
      });
    }
  } catch (error) {
    console.error(error);
  }
};

exports.down = async function (knex) {
  try {
    await knex.schema.alterTable("jf_playback_activity", function (table) {
      table.jf_playback_activity("Id");
    });
  } catch (error) {
    console.error(error);
  }
};
