exports.up = async function(knex) {
  try {
    const tableExists = await knex.schema.hasTable('jf_library_episodes');
    if (!tableExists) {
      await knex.schema.createTable('jf_library_episodes', function(table) {
        table.text('Id').primary();
        table.text('EpisodeId').notNullable();
        table.text('Name');
        table.text('ServerId');
        table.timestamp('PremiereDate');
        table.text('OfficialRating');
        table.double('CommunityRating');
        table.bigInteger('RunTimeTicks');
        table.integer('ProductionYear');
        table.integer('IndexNumber');
        table.integer('ParentIndexNumber');
        table.text('Type');
        table.text('ParentLogoItemId');
        table.text('ParentBackdropItemId');
        table.text('ParentBackdropImageTags');
        table.text('SeriesId');
        table.text('SeasonId');
        table.text('SeasonName');
        table.text('SeriesName');
      });

      await knex.raw(`ALTER TABLE IF EXISTS jf_library_episodes OWNER TO "${process.env.POSTGRES_ROLE}";`);
    }
  } catch (error) {
    console.error(error);
  }
};


// exports.down = function(knex) {
//   return knex.schema.hasTable('jf_library_episodes').then(function(exists) {
//     if (exists) {
//       return knex.schema.dropTable('jf_library_episodes');
//     }
//   }).catch(function(error) {
//     console.error(error);
//   });
// };

exports.down = async function(knex) {
  try {
    await knex.schema.dropTableIfExists('jf_library_episodes');
  } catch (error) {
    console.error(error);
  }
};

