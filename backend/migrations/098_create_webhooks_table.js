exports.up = function (knex) {
  return knex.schema.createTable("webhooks", (table) => {
    table.increments("id").primary();
    table.string("name").notNullable();
    table.string("url").notNullable();
    table.text("headers").defaultTo("{}");
    table.text("payload").defaultTo("{}");
    table.string("method").defaultTo("POST");
    table.string("trigger_type").notNullable();
    table.string("webhook_type").defaultTo("generic");
    table.string("schedule").nullable();
    table.string("event_type").nullable();
    table.boolean("enabled").defaultTo(true);
    table.timestamp("last_triggered").nullable();
    table.boolean("retry_on_failure").defaultTo(false);
    table.integer("max_retries").defaultTo(3);
    table.timestamps(true, true);
  });
};

exports.down = function (knex) {
  return knex.schema.dropTable("webhooks");
};
