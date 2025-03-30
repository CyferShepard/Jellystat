exports.up = async function (knex) {
  try {
    const hasTable = await knex.schema.hasTable("jf_library_items");
    if (hasTable) {
      await knex.schema.alterTable("jf_library_items", function (table) {
        table.jsonb("Genres").defaultTo(JSON.stringify([]));
      });
    }
  } catch (error) {
    console.error(error);
  }
};

exports.down = async function (knex) {
  try {
    const hasTable = await knex.schema.hasTable("jf_library_items");
    if (hasTable) {
      await knex.schema.alterTable("jf_library_items", function (table) {
        table.dropColumn("Genres"); // Drop the column during rollback
      });
    }
  } catch (error) {
    console.error(error);
  }
};
