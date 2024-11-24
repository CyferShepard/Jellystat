exports.up = async function(knex) {
  try {
    const tableExists = await knex.schema.hasTable('jf_item_info');
    if (!tableExists) {
      await knex.schema.createTable('jf_item_info', function(table) {
        table.text('Id').notNullable().primary();
        table.text('Path');
        table.text('Name');
        table.bigInteger('Size');
        table.bigInteger('Bitrate');
        table.json('MediaStreams');
        table.text('Type');
      });

      await knex.raw(`ALTER TABLE IF EXISTS jf_item_info OWNER TO "${process.env.POSTGRES_ROLE}";`);
    }
  } catch (error) {
    console.error(error);
  }
};

exports.down = async function(knex) {
  try {
    await knex.schema.dropTableIfExists('jf_item_info');
  } catch (error) {
    console.error(error);
  }
};

