exports.up = async function(knex) {
  try
  {
  const hasTable = await knex.schema.hasTable('app_config');
  if (hasTable) {
    await knex.schema.alterTable('app_config', function(table) {
      table.json('api_keys');
    });
  }
}catch (error) {
  console.error(error);
}
};

exports.down = async function(knex) {
  try {
    await knex.schema.alterTable('app_config', function(table) {
      table.dropColumn('api_keys');
    });
  } catch (error) {
    console.error(error);
  }
};
