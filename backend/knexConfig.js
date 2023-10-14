module.exports = {
  development: {
    client: "pg",
    connection: {
      host: process.env.POSTGRES_IP,
      user: process.env.POSTGRES_USER,
      password: process.env.POSTGRES_PASSWORD,
      port: process.env.POSTGRES_PORT,
      database: process.env.POSTGRES_DATABASE || "jfstat"
    },
    migrations: {
      directory: __dirname + "/migrations",
      migrationSource: {
        // Use a sequential index naming convention for migration files
        pattern: /^([0-9]+)_.*\.js$/,
        sortDirsSeparately: true,
        load: (filename) => {
          const migration = require(filename);
          if (migration.up && migration.down) {
            return migration;
          } else {
            throw new Error(`Invalid migration file: ${filename}`);
          }
        },
      },
    },
  },
};
