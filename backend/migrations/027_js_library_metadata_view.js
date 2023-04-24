exports.up = async function(knex) {
    await knex.raw(`
      CREATE OR REPLACE VIEW public.js_library_metadata AS
      select 
      l."Id",
      l."Name",
      sum(ii."Size") "Size",
      count(*) files
      from jf_libraries l
      join jf_library_items i
      on i."ParentId"=l."Id"
      left join jf_library_episodes e
      on e."SeriesId"=i."Id"
      left join jf_item_info ii
      on (ii."Id"=i."Id" or ii."Id"=e."EpisodeId")
      group by l."Id",l."Name"
    `).catch(function(error) {
        console.error(error);
      });
  };
  
  exports.down = async function(knex) {
    await knex.raw(`DROP VIEW js_library_metadata;`);
  };
  