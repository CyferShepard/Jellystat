exports.up = async function(knex) {
    try {
      const hasTable = await knex.schema.hasTable('jf_logging');
      if (!hasTable) {
        await knex.schema.createTable('jf_logging', function(table) {
          table.text('Id').primary();
          table.text('Name').notNullable();
          table.text('Type').notNullable();
          table.text('ExecutionType');
          table.text('Duration').notNullable();
          table.timestamp('TimeRun').defaultTo(knex.fn.now());
          table.json('Log');
          table.text('Result');
        });
        await knex.raw(`ALTER TABLE jf_logging OWNER TO ${process.env.POSTGRES_USER};`);
      }
    } catch (error) {
      console.error(error);
    }
  };
  
  exports.down = async function(knex) {
    try {
      await knex.schema.dropTableIfExists('jf_logging');
    } catch (error) {
      console.error(error);
    }
  };
  