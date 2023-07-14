exports.up = async function(knex) {
  try
  {
  const hasTable = await knex.schema.hasTable('jf_playback_activity');
  if (hasTable) {
    await knex.schema.alterTable('jf_playback_activity', function(table) {
      table.json('MediaStreams');
      table.json('TranscodingInfo');
      table.json('PlayState');
      table.text('OriginalContainer');
      table.text('RemoteEndPoint');
    });
  }
}catch (error) {
  console.error(error);
}
};

exports.down = async function(knex) {
  try {
    await knex.schema.alterTable('jf_playback_activity', function(table) {
      table.dropColumn('MediaStreams');
      table.dropColumn('TranscodingInfo');
      table.dropColumn('PlayState');
      table.dropColumn('OriginalContainer');
      table.dropColumn('RemoteEndPoint');
    });
  } catch (error) {
    console.error(error);
  }
};
