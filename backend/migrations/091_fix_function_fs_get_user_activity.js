exports.up = function (knex) {
  return knex.schema.raw(`
        DROP FUNCTION IF EXISTS fs_get_user_activity;

        CREATE OR REPLACE FUNCTION fs_get_user_activity(
                user_id TEXT,
                library_ids TEXT[]
            )
            RETURNS TABLE (
                "UserName" TEXT,
                "Title" TEXT,
                "EpisodeCount" BIGINT, 
                "FirstActivityDate" TIMESTAMPTZ,
                "LastActivityDate" TIMESTAMPTZ,
                "TotalPlaybackDuration" BIGINT,
                "SeasonName" TEXT,
                "MediaType" TEXT,
                "NowPlayingItemId" TEXT
            ) AS $$
            BEGIN
            RETURN QUERY
            WITH DateDifferences AS (
                SELECT
                    jp."UserName" AS "UserNameCol",
                    CASE
                        WHEN jp."SeriesName" IS NOT NULL THEN jp."SeriesName"
                        ELSE jp."NowPlayingItemName"
                    END AS "TitleCol",
                    jp."EpisodeId" AS "EpisodeIdCol",
                    jp."ActivityDateInserted" AS "ActivityDateInsertedCol",
                    jp."PlaybackDuration" AS "PlaybackDurationCol",
                    ls."Name" AS "SeasonNameCol",
                    jl."CollectionType" AS "MediaTypeCol",
                    jp."NowPlayingItemId" AS "NowPlayingItemIdCol",
                    LAG(jp."ActivityDateInserted") OVER (PARTITION BY jp."UserName", CASE WHEN jp."SeriesName" IS NOT NULL THEN jp."SeriesName" ELSE jp."NowPlayingItemName" END ORDER BY jp."ActivityDateInserted") AS prev_date
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
            ),
            GroupedEntries AS (
                SELECT
                    "UserNameCol",
                    "TitleCol",
                    "EpisodeIdCol",
                    "ActivityDateInsertedCol",
                    "PlaybackDurationCol",
                    "SeasonNameCol",
                    "MediaTypeCol",
                    "NowPlayingItemIdCol",
                    prev_date,
                    CASE
                        WHEN prev_date IS NULL OR "ActivityDateInsertedCol" > prev_date + INTERVAL '1 month' THEN 1 -- Pick whatever interval you want here, I'm biased as I don't monitor music / never intended this feature to be used for music
                        ELSE 0
                    END AS new_group
                FROM
                    DateDifferences
            ),
            FinalGroups AS (
                SELECT
                    "UserNameCol",
                    "TitleCol",
                    "EpisodeIdCol",
                    "ActivityDateInsertedCol",
                    "PlaybackDurationCol",
                    "SeasonNameCol",
                    "MediaTypeCol",
                    "NowPlayingItemIdCol",
                    SUM(new_group) OVER (PARTITION BY "UserNameCol", "TitleCol" ORDER BY "ActivityDateInsertedCol") AS grp
                FROM
                    GroupedEntries
            )
            SELECT
                "UserNameCol" AS "UserName",
                "TitleCol" AS "Title",
                COUNT(DISTINCT "EpisodeIdCol") AS "EpisodeCount",
                MIN("ActivityDateInsertedCol") AS "FirstActivityDate",
                MAX("ActivityDateInsertedCol") AS "LastActivityDate",
                SUM("PlaybackDurationCol")::bigint AS "TotalPlaybackDuration",
                "SeasonNameCol" AS "SeasonName",
                MAX("MediaTypeCol") AS "MediaType",
                "NowPlayingItemIdCol" AS "NowPlayingItemId"
            FROM
                FinalGroups
            GROUP BY
                "UserNameCol",
                "TitleCol",
                "SeasonNameCol",
                "NowPlayingItemIdCol",
                grp
            HAVING
                NOT (MAX("MediaTypeCol") = 'Shows' AND "SeasonNameCol" IS NULL)
                AND SUM("PlaybackDurationCol") >= 20
            ORDER BY
                MAX("ActivityDateInsertedCol") DESC;
            END;
            $$ LANGUAGE plpgsql;
    
`);
};

exports.down = function (knex) {
  return knex.schema.raw(`

    DROP FUNCTION IF EXISTS fs_get_user_activity;
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
