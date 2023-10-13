exports.up = async function (knex) {
  try {
    const hasTable = await knex.schema.hasTable("app_config");
    if (hasTable) {
      await knex.schema.alterTable("app_config", function (table) {
        table.json("settings").defaultTo({ time_format: "12hr" });
      });
    }
  } catch (error) {
    console.error(error);
  }
};

exports.down = async function (knex) {
  try {
    await knex.schema.alterTable("app_config", function (table) {
      table.dropColumn("settings");
    });
  } catch (error) {
    console.error(error);
  }
};
