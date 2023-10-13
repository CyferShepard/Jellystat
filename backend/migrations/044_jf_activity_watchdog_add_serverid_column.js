exports.up = async function (knex) {
  try {
    const hasTable = await knex.schema.hasTable("jf_activity_watchdog");
    if (hasTable) {
      await knex.schema.alterTable("jf_activity_watchdog", function (table) {
        table.text("ServerId");
      });
    }
  } catch (error) {
    console.error(error);
  }
};

exports.down = async function (knex) {
  try {
    await knex.schema.alterTable("jf_activity_watchdog", function (table) {
      table.dropColumn("ServerId");
    });
  } catch (error) {
    console.error(error);
  }
};
