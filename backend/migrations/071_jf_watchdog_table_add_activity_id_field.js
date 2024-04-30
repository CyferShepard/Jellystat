exports.up = async function (knex) {
  return knex.transaction(async (trx) => {
    try {
      const hasTable = await trx.schema.hasTable("jf_activity_watchdog");
      if (hasTable) {
        await trx("jf_activity_watchdog").truncate();
        await trx.schema.alterTable("jf_activity_watchdog", function (table) {
          table.text("ActivityId").notNullable();
        });
      }
    } catch (error) {
      console.error(error);
      throw error;
    }
  });
};

exports.down = async function (knex) {
  return knex.transaction(async (trx) => {
    try {
      await trx.schema.alterTable("jf_activity_watchdog", function (table) {
        table.dropColumn("ActivityId");
      });
    } catch (error) {
      console.error(error);
      throw error;
    }
  });
};
