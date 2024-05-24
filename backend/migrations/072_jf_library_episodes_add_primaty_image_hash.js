exports.up = async function (knex) {
  try {
    await knex.schema.alterTable("jf_library_episodes", function (table) {
      table.text("PrimaryImageHash");
    });
  } catch (error) {
    console.error(error);
  }
};

exports.down = async function (knex) {
  try {
    await knex.schema.alterTable("jf_library_episodes", function (table) {
      table.dropColumn("PrimaryImageHash");
    });
  } catch (error) {
    console.error(error);
  }
};
