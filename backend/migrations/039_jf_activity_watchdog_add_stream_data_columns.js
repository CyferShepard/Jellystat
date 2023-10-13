exports.up = async function (knex) {
  try {
    const hasTable = await knex.schema.hasTable("jf_activity_watchdog");
    if (hasTable) {
      await knex.schema.alterTable("jf_activity_watchdog", function (table) {
        table.json("MediaStreams");
        table.json("TranscodingInfo");
        table.json("PlayState");
        table.text("OriginalContainer");
        table.text("RemoteEndPoint");
      });
    }
  } catch (error) {
    console.error(error);
  }
};

exports.down = async function (knex) {
  try {
    await knex.schema.alterTable("jf_activity_watchdog", function (table) {
      table.dropColumn("MediaStreams");
      table.dropColumn("TranscodingInfo");
      table.dropColumn("PlayState");
      table.dropColumn("OriginalContainer");
      table.dropColumn("RemoteEndPoint");
    });
  } catch (error) {
    console.error(error);
  }
};
