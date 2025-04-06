exports.up = function (knex) {
  return knex.schema.raw(`
        CREATE OR REPLACE FUNCTION public.fs_get_user_activity(user_id text, library_ids text[])
        RETURNS TABLE(
            "UserName" text, 
            "Title" text, 
            "EpisodeCount" bigint, 
            "FirstActivityDate" timestamp with time zone, 
            "LastActivityDate" timestamp with time zone, 
            "TotalPlaybackDuration" bigint, 
            "SeasonName" text, 
            "MediaType" text, 
            "NowPlayingItemId" text
        )
        LANGUAGE plpgsql
        AS $function$
        BEGIN
            RETURN QUERY
            WITH DateDifferences AS (
                SELECT
                    jp."UserName" AS "UserNameCol",
                    COALESCE(jp."SeriesName", jp."NowPlayingItemName") AS "TitleCol",
                    jp."EpisodeId" AS "EpisodeIdCol",
                    jp."ActivityDateInserted" AS "ActivityDateInsertedCol",
                    jp."PlaybackDuration" AS "PlaybackDurationCol",
                    ls."Name" AS "SeasonNameCol",
                    jl."CollectionType" AS "MediaTypeCol",
                    jp."NowPlayingItemId" AS "NowPlayingItemIdCol",
                    LAG(jp."ActivityDateInserted") OVER (PARTITION BY jp."UserName" ORDER BY jp."ActivityDateInserted") AS prev_date,
                    LAG(COALESCE(jp."SeriesName", jp."NowPlayingItemName")) OVER (PARTITION BY jp."UserName" ORDER BY jp."ActivityDateInserted") AS prev_title
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
                    prev_title,
                    CASE 
                        WHEN prev_title IS DISTINCT FROM "TitleCol" THEN 1  -- Start a new group when Title changes
                        WHEN prev_date IS NULL OR "ActivityDateInsertedCol" > prev_date + INTERVAL '1 month' THEN 1
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
                    SUM(new_group) OVER (PARTITION BY "UserNameCol" ORDER BY "ActivityDateInsertedCol") AS grp
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
        $function$;
`);
};

exports.down = function (knex) {
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
