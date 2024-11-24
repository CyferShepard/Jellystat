exports.up = async function(knex) {
  try {
    const tableExists = await knex.schema.hasTable('jf_library_seasons');
    if (!tableExists) {
      await knex.schema.createTable('jf_library_seasons', function(table) {
        table.text('Id').notNullable().primary();
        table.text('Name');
        table.text('ServerId');
        table.integer('IndexNumber');
        table.text('Type');
        table.text('ParentLogoItemId');
        table.text('ParentBackdropItemId');
        table.text('ParentBackdropImageTags');
        table.text('SeriesName');
        table.text('SeriesId');
        table.text('SeriesPrimaryImageTag');
      });

      await knex.raw(`ALTER TABLE IF EXISTS jf_library_seasons OWNER TO "${process.env.POSTGRES_ROLE}";`);
    }
  } catch (error) {
    console.error(error);
  }
};

exports.down = async function(knex) {
  try {
    await knex.schema.dropTableIfExists('jf_library_seasons');
  } catch (error) {
    console.error(error);
  }
};

