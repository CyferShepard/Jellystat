exports.up = function(knex) {
    return knex.schema.raw(`
    CREATE OR REPLACE PROCEDURE jd_remove_orphaned_data() AS $$
    BEGIN
        DELETE FROM public.jf_library_episodes
        WHERE "SeriesId" NOT IN (
            SELECT "Id"
            FROM public.jf_library_items
        );
    
        DELETE FROM public.jf_library_seasons
        WHERE "SeriesId" NOT IN (
            SELECT "Id"
            FROM public.jf_library_items
        );
    
        DELETE FROM public.jf_item_info
        WHERE "Id" NOT IN (
            SELECT "Id"
            FROM public.jf_library_items
        )
        AND "Type" = 'Item';
    
        DELETE FROM public.jf_item_info
        WHERE "Id" NOT IN (
            SELECT "EpisodeId"
            FROM public.jf_library_episodes
        )
        AND "Type" = 'Episode';
    END;
    $$ LANGUAGE plpgsql;
    
    `).catch(function(error) {
        console.error(error);
      });
  };
  
  exports.down = function(knex) {
    return knex.schema.raw(`
      DROP PROCEDURE jd_remove_orphaned_data;
    `);
  };
  