process.env.POSTGRES_USER = process.env.POSTGRES_USER ?? "postgres";
process.env.POSTGRES_ROLE =
  process.env.POSTGRES_ROLE ?? process.env.POSTGRES_USER;

module.exports = {
    development: {
      client: 'pg',
      connection: {
        host: process.env.POSTGRES_IP,
        user: process.env.POSTGRES_USER,
        password: process.env.POSTGRES_PASSWORD,
        port:process.env.POSTGRES_PORT,
        database: process.env.POSTGRES_DB || 'jfstat',
        createDatabase: true,
      },
      migrations: {
        directory: __dirname + '/migrations',
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
          }
        }
      }
    },
    production: {
      client: 'pg',
      connection: {
        host: process.env.DB_HOST,
        user: process.env.DB_USER,
        password: process.env.DB_PASSWORD,
        port:process.env.POSTGRES_PORT,
        database: process.env.POSTGRES_DB || 'jfstat',
        createDatabase: true,
      },
      migrations: {
        directory: __dirname + '/migrations',
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
          }
        }
      }
    }
  };
  
