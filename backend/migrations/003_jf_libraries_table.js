exports.up = async function(knex) {
    try {
      const hasTable = await knex.schema.hasTable('jf_libraries');
      if (!hasTable) {
        await knex.schema.createTable('jf_libraries', function(table) {
          table.text('Id').primary();
          table.text('Name').notNullable();
          table.text('ServerId');
          table.boolean('IsFolder').notNullable().defaultTo(true);
          table.text('Type').notNullable().defaultTo('CollectionFolder');
          table.text('CollectionType').notNullable();
          table.text('ImageTagsPrimary');
        });
        await knex.raw(`ALTER TABLE jf_libraries OWNER TO "${process.env.POSTGRES_ROLE}";`);
      }
    } catch (error) {
      console.error(error);
    }
  };
  
  exports.down = async function(knex) {
    try {
      await knex.schema.dropTableIfExists('jf_libraries');
    } catch (error) {
      console.error(error);
    }
  };
  
