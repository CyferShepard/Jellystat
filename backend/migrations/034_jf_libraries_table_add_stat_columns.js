exports.up = async function (knex) {
  try {
    const hasTable = await knex.schema.hasTable("jf_libraries");
    if (hasTable) {
      await knex.schema.alterTable("jf_libraries", function (table) {
        table.bigInteger("total_play_time");
        table.bigInteger("item_count");
        table.bigInteger("season_count");
        table.bigInteger("episode_count");
      });
    }
  } catch (error) {
    console.error(error);
  }
};

exports.down = async function (knex) {
  try {
    await knex.schema.alterTable("jf_libraries", function (table) {
      table.dropColumn("total_play_time");
      table.dropColumn("item_count");
      table.dropColumn("season_count");
      table.dropColumn("episode_count");
    });
  } catch (error) {
    console.error(error);
  }
};
