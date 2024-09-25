exports.up = async function(knex) {
  try {
    const tableExists = await knex.schema.hasTable('jf_playback_reporting_plugin_data');
    if (!tableExists) {
      await knex.schema.createTable('jf_playback_reporting_plugin_data', function(table) {
        table.bigInteger('rowid').notNullable().primary();
        table.timestamp('DateCreated', { useTz: true });
        table.text('UserId');
        table.text('ItemId');
        table.text('ItemType');
        table.text('ItemName');
        table.text('PlaybackMethod');
        table.text('ClientName');
        table.text('DeviceName');
        table.bigInteger('PlayDuration');
      });

      await knex.raw(`ALTER TABLE IF EXISTS jf_playback_reporting_plugin_data OWNER TO "${process.env.POSTGRES_ROLE}";`);
    }
  } catch (error) {
    console.error(error);
  }
};

exports.down = async function(knex) {
  try {
    await knex.schema.dropTableIfExists('jf_playback_reporting_plugin_data');
  } catch (error) {
    console.error(error);
  }
};

