-- FUNCTION: public.fs_most_played_items(integer, text)

-- DROP FUNCTION IF EXISTS public.fs_most_played_items(integer, text);

CREATE OR REPLACE FUNCTION public.fs_most_played_items(
	days integer,
	itemtype text)
    RETURNS TABLE("Plays" bigint, total_playback_duration numeric, "Name" text, "Id" text) 
    LANGUAGE 'plpgsql'
    COST 100
    VOLATILE PARALLEL UNSAFE
    ROWS 1000

AS $BODY$
BEGIN
    RETURN QUERY
    SELECT 
        t.plays,
        t.total_playback_duration,
        i."Name",
        i."Id"
    FROM (
        SELECT 
            count(*) AS plays,
            sum(jf_playback_activity."PlaybackDuration") AS total_playback_duration,
            jf_playback_activity."NowPlayingItemId"
        FROM 
            jf_playback_activity
        WHERE 
            jf_playback_activity."ActivityDateInserted" BETWEEN CURRENT_DATE - MAKE_INTERVAL(days => days) and NOW()
        GROUP BY 
            jf_playback_activity."NowPlayingItemId"
        ORDER BY 
            count(*) DESC
    ) t
    JOIN jf_library_items i 
        ON t."NowPlayingItemId" = i."Id" 
        AND i."Type" = itemType
    ORDER BY 
        t.plays DESC;
END;
$BODY$;

ALTER FUNCTION public.fs_most_played_items(integer, text)
    OWNER TO postgres;
