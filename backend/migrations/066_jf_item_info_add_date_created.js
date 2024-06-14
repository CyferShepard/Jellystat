exports.up = async function (knex) {
  try {
    await knex.schema.alterTable("jf_library_items", function (table) {
      table.timestamp("DateCreated");
    });
    await knex.schema.alterTable("jf_library_episodes", function (table) {
      table.timestamp("DateCreated");
    });
  } catch (error) {
    console.error(error);
  }
};

exports.down = async function (knex) {
  try {
    await knex.schema.alterTable("jf_library_items", function (table) {
      table.dropColumn("DateCreated");
    });
    await knex.schema.alterTable("jf_library_episodes", function (table) {
      table.dropColumn("DateCreated");
    });
  } catch (error) {
    console.error(error);
  }
};
