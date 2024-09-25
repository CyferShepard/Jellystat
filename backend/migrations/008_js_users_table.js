  exports.up = async function(knex) {
    try {
      const tableExists = await knex.schema.hasTable('jf_users');
      if (!tableExists) {
        await knex.schema.createTable('jf_users', function(table) {
          table.text('Id').primary().notNullable().collate('default');
          table.text('Name').collate('default');
          table.text('PrimaryImageTag').collate('default');
          table.timestamp('LastLoginDate', { useTz: true });
          table.timestamp('LastActivityDate', { useTz: true });
          table.boolean('IsAdministrator');
        });
  
        await knex.raw(`ALTER TABLE IF EXISTS jf_users OWNER TO "${process.env.POSTGRES_ROLE}";`);;
      }
    } catch (error) {
      console.error(error);
    }
  };
  
  exports.down = async function(knex) {
    try {
      await knex.schema.dropTableIfExists('jf_users');
    } catch (error) {
      console.error(error);
    }
  };
  
  
