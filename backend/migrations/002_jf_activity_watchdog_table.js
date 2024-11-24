exports.up = async function(knex) {
  try {
    const hasTable = await knex.schema.hasTable('jf_activity_watchdog');
    if (!hasTable) {
      await knex.schema.createTable('jf_activity_watchdog', function(table) {
        table.text('Id').primary();
        table.boolean('IsPaused').defaultTo(false);
        table.text('UserId');
        table.text('UserName');
        table.text('Client');
        table.text('DeviceName');
        table.text('DeviceId');
        table.text('ApplicationVersion');
        table.text('NowPlayingItemId');
        table.text('NowPlayingItemName');
        table.text('SeasonId');
        table.text('SeriesName');
        table.text('EpisodeId');
        table.bigInteger('PlaybackDuration');
        table.timestamp('ActivityDateInserted').defaultTo(knex.fn.now());
        table.text('PlayMethod');
      });
      await knex.raw(`ALTER TABLE jf_activity_watchdog OWNER TO "${process.env.POSTGRES_ROLE}";`);
    }
  } catch (error) {
    console.error(error);
  }
};

exports.down = async function(knex) {
  try {
    await knex.schema.dropTableIfExists('jf_activity_watchdog');
  } catch (error) {
    console.error(error);
  }
};
