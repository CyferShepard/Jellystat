exports.up = function (knex) {
  return knex
    .raw(
      `
      CREATE OR REPLACE VIEW jf_library_count_view
       AS
       SELECT l."Id",
          l."Name",
          l."CollectionType",
          count(DISTINCT i."Id") AS "Library_Count",
          count(DISTINCT s."Id") AS "Season_Count",
          count(DISTINCT e."Id") AS "Episode_Count"
         FROM jf_libraries l
           JOIN jf_library_items i ON i."ParentId" = l."Id"
           LEFT JOIN jf_library_seasons s ON s."SeriesId" = i."Id"
           LEFT JOIN jf_library_episodes e ON e."SeasonId" = s."Id"
        GROUP BY l."Id", l."Name"
        ORDER BY (count(DISTINCT i."Id")) DESC;
    `,
    )
    .catch(function (error) {
      console.error(error);
    });
};

exports.down = function (knex) {
  return knex.raw(`
      DROP VIEW jf_library_count_view;
    `);
};
