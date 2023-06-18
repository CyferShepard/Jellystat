exports.up = async function(knex) {
  try
  {
  const hasTable = await knex.schema.hasTable('app_config');
  if (hasTable) {
    await knex.schema.alterTable('app_config', function(table) {
      table.boolean('REQUIRE_LOGIN').defaultTo(true);
    });
  }
}catch (error) {
  console.error(error);
}
};

exports.down = async function(knex) {
  try {
    await knex.schema.alterTable('app_config', function(table) {
      table.dropColumn('REQUIRE_LOGIN');
    });
  } catch (error) {
    console.error(error);
  }
};
