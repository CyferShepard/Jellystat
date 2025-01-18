exports.up = function (knex) {
  return knex.schema.raw(`
    create or replace
        function fs_get_user_activity(
            user_id text,
            library_ids text[]  
        )
        returns table (
            "UserName" text,
            "Title" text,
            "EpisodeCount" bigint, 
            "FirstActivityDate" timestamptz,
            "LastActivityDate" timestamptz,
            "TotalPlaybackDuration" bigint,
            "SeasonName" text,
            "MediaType" text,
            "NowPlayingItemId" text
        ) as $$
        begin
            return QUERY
            select
            jp."UserName",
            case
                when jp."SeriesName" is not null then jp."SeriesName"
                else jp."NowPlayingItemName"
            end as "Title",
            COUNT(distinct jp."EpisodeId") as "EpisodeCount",
            MIN(jp."ActivityDateInserted") as "FirstActivityDate",
            MAX(jp."ActivityDateInserted") as "LastActivityDate",
            SUM(jp."PlaybackDuration")::bigint as "TotalPlaybackDuration",
            ls."Name" as "SeasonName",
            MAX(jl."CollectionType") as "MediaType",
            jp."NowPlayingItemId"
        from
            public.jf_playback_activity as jp
        join 
                public.jf_library_items as jli on
            jp."NowPlayingItemId" = jli."Id"
        join 
                public.jf_libraries as jl on
            jli."ParentId" = jl."Id"
        left join 
                public.jf_library_seasons as ls on
            jp."SeasonId" = ls."Id"
        where
            jp."UserId" = user_id
            and jl."Id" = any(library_ids)
        group by
            jp."UserName",
            case
                when jp."SeriesName" is not null then jp."SeriesName"
                else jp."NowPlayingItemName"
            end,
            jp."SeriesName",
            jp."SeasonId",
            ls."Name",
            jp."NowPlayingItemId"
        having
            not (MAX(jl."Name") = 'Shows'
                and ls."Name" is null)
            and SUM(jp."PlaybackDuration") >= 30
        order by
            MAX(jp."ActivityDateInserted") desc;
        end;
        $$ language plpgsql;
`);
};

exports.down = function (knex) {
  return knex.schema.raw(`
    DROP FUNCTION IF EXISTS fs_get_user_activity;
  `);
};
