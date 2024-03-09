exports.up = async function (knex) {
  try {
    // Drop the primary key constraint temporarily
    await knex.schema.raw('ALTER TABLE "app_config" DROP CONSTRAINT app_config_pkey');

    // Alter the column with the desired modifications
    await knex.schema.alterTable("app_config", function (table) {
      table.integer("ID").alter().defaultTo(null).notNullable();
    });

    // Add the primary key constraint back
    await knex.schema.raw('ALTER TABLE "app_config" ADD PRIMARY KEY ("ID")');
  } catch (error) {
    console.error(error);
  }
};

exports.down = async function (knex) {
  try {
    // Drop the primary key constraint temporarily
    await knex.schema.raw('ALTER TABLE "app_config" DROP CONSTRAINT app_config_pkey');

    // Alter the column back to its original state
    await knex.schema.alterTable("app_config", function (table) {
      table.integer("ID").alter().defaultTo(null).notNullable(); // Modify this line if needed
    });

    // Add the primary key constraint back
    await knex.schema.raw('ALTER TABLE "app_config" ADD PRIMARY KEY ("ID")');
  } catch (error) {
    console.error(error);
  }
};
