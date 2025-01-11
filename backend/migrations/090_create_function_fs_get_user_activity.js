exports.up = function(knex) {
  return knex.schema.raw(`
    CREATE OR REPLACE FUNCTION fs_get_user_activity(
        user_id text,
        library_ids text[]  
    )
    RETURNS TABLE (
        "UserName" text,
        "Title" text,
        "EpisodeCount" bigint, 
        "FirstActivityDate" timestamptz,
        "LastActivityDate" timestamptz,
        "TotalPlaybackDuration" bigint,
        "SeasonName" text,
        "MediaType" text,
        "NowPlayingItemId" text
    ) AS $$
    BEGIN
        RETURN QUERY
        SELECT 
            jp."UserName",
            CASE 
                WHEN jp."SeriesName" IS NOT NULL THEN jp."SeriesName"
                ELSE jp."NowPlayingItemName"
            END AS "Title",
            COUNT(DISTINCT jp."EpisodeId") AS "EpisodeCount", 
            MIN(jp."ActivityDateInserted") AS "FirstActivityDate",
            MAX(jp."ActivityDateInserted") AS "LastActivityDate",
            SUM(jp."PlaybackDuration")::bigint AS "TotalPlaybackDuration", 
            ls."Name" AS "SeasonName",
            CASE 
              WHEN jp."SeriesName" IS NOT NULL THEN 'Show'
              ELSE 'Movie'
          END AS "MediaType",
            jp."NowPlayingItemId"
        FROM 
            public.jf_playback_activity AS jp
        JOIN 
            public.jf_library_items AS jli ON jp."NowPlayingItemId" = jli."Id"
        JOIN 
            public.jf_libraries AS jl ON jli."ParentId" = jl."Id"
        LEFT JOIN 
            public.jf_library_seasons AS ls ON jp."SeasonId" = ls."Id"
        WHERE 
            jp."UserId" = user_id
            AND jl."Id" = ANY(library_ids) 
        GROUP BY 
            jp."UserName", 
            CASE 
                WHEN jp."SeriesName" IS NOT NULL THEN jp."SeriesName"
                ELSE jp."NowPlayingItemName"
            END,
            jp."SeriesName",
            jp."SeasonId",
            ls."Name",
            jp."NowPlayingItemId"
        HAVING
            NOT (MAX(jl."Name") = 'Shows' AND ls."Name" IS NULL)
        ORDER BY 
            MAX(jp."ActivityDateInserted") DESC;
    END;
    $$ LANGUAGE plpgsql;
`);
};

exports.down = function(knex) {
  return knex.schema.raw(`
    DROP FUNCTION IF EXISTS fs_get_user_activity;
  `);
};