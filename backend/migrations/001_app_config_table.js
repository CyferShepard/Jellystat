exports.up = async function(knex) {
  try
  {
  const hasTable = await knex.schema.hasTable('app_config');
  if (!hasTable) {
    await knex.schema.createTable('app_config', function(table) {
      table.increments('ID').primary();
      table.text('JF_HOST');
      table.text('JF_API_KEY');
      table.text('APP_USER');
      table.text('APP_PASSWORD');
    });
    await knex.raw(`ALTER TABLE app_config OWNER TO "${process.env.POSTGRES_ROLE}";`);
  }
}catch (error) {
  console.error(error);
}
};

exports.down = async function(knex) {
  try {
    await knex.schema.dropTableIfExists('app_config');
  } catch (error) {
    console.error(error);
  }
};
