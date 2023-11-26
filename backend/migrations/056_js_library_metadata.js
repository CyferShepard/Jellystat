exports.up = async function(knex) {
  try
  {
     await knex.schema.raw(`
     CREATE OR REPLACE VIEW public.js_library_metadata
     AS
     SELECT l."Id",
        l."Name",
        sum(ii."Size") AS "Size",
        count(*) AS files
       FROM jf_libraries l
         JOIN jf_library_items i ON i."ParentId" = l."Id" AND i.archived=false
         LEFT JOIN jf_library_episodes e ON e."SeriesId" = i."Id" AND e.archived=false
         LEFT JOIN jf_item_info ii ON ii."Id" = i."Id" OR ii."Id" = e."EpisodeId" 
      GROUP BY l."Id", l."Name";`);

}catch (error) {
  console.error(error);
}
};

exports.down = async function(knex) {
  try {
      await knex.schema.raw(`
      CREATE OR REPLACE VIEW public.js_library_metadata
      AS
      SELECT l."Id",
         l."Name",
         sum(ii."Size") AS "Size",
         count(*) AS files
        FROM jf_libraries l
          JOIN jf_library_items i ON i."ParentId" = l."Id"
          LEFT JOIN jf_library_episodes e ON e."SeriesId" = i."Id"
          LEFT JOIN jf_item_info ii ON ii."Id" = i."Id" OR ii."Id" = e."EpisodeId"
       GROUP BY l."Id", l."Name";`);
  } catch (error) {
    console.error(error);
  }
};
