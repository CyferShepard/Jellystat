exports.up = async function(knex) {
  try {
    const hasTable = await knex.schema.hasTable('jf_library_items');
    if (!hasTable) {
      await knex.schema.createTable('jf_library_items', function(table) {
        table.text('Id').primary();
        table.text('Name').notNullable();
        table.text('ServerId');
        table.timestamp('PremiereDate');
        table.timestamp('EndDate');
        table.double('CommunityRating');
        table.bigInteger('RunTimeTicks');
        table.integer('ProductionYear');
        table.boolean('IsFolder');
        table.text('Type').notNullable();
        table.text('Status');
        table.text('ImageTagsPrimary');
        table.text('ImageTagsBanner');
        table.text('ImageTagsLogo');
        table.text('ImageTagsThumb');
        table.text('BackdropImageTags');
        table.text('ParentId').notNullable().references('Id').inTable('jf_libraries').onDelete('SET NULL').onUpdate('NO ACTION');
        table.text('PrimaryImageHash');
      });
      await knex.raw(`ALTER TABLE IF EXISTS jf_library_items OWNER TO "${process.env.POSTGRES_ROLE}";`);

    }
  } catch (error) {
    console.error(error);
  }
};

exports.down = async function(knex) {
  try {
    await knex.schema.dropTableIfExists('jf_library_items');
  } catch (error) {
    console.error(error);
  }
};
