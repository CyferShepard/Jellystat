exports.up = async function(knex) {
  try {
    const tableExists = await knex.schema.hasTable('jf_playback_activity');
    if (!tableExists) {
      await knex.schema.createTable('jf_playback_activity', function(table) {
        table.text('Id').notNullable().primary();
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

      await knex.raw(`ALTER TABLE IF EXISTS jf_playback_activity OWNER TO "${process.env.POSTGRES_ROLE}";`);
    }
  } catch (error) {
    console.error(error);
  }
};

exports.down = async function(knex) {
  try {
    await knex.schema.dropTableIfExists('jf_playback_activity');
  } catch (error) {
    console.error(error);
  }
};

