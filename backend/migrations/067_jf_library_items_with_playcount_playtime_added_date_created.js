exports.up = async function (knex) {
  try {
    await knex.schema.raw(`
      DROP VIEW public.jf_library_items_with_playcount_playtime;
      CREATE OR REPLACE VIEW public.jf_library_items_with_playcount_playtime
      AS
      SELECT i."Id",
         i."Name",
         i."ServerId",
         i."PremiereDate",
         i."DateCreated",
         i."EndDate",
         i."CommunityRating",
         i."RunTimeTicks",
         i."ProductionYear",
         i."IsFolder",
         i."Type",
         i."Status",
         i."ImageTagsPrimary",
         i."ImageTagsBanner",
         i."ImageTagsLogo",
         i."ImageTagsThumb",
         i."BackdropImageTags",
         i."ParentId",
         i."PrimaryImageHash",
         i.archived,
         COALESCE(ii."Size",(SELECT SUM(im."Size") FROM jf_library_seasons s JOIN jf_library_episodes e on s."Id"=e."SeasonId" JOIN jf_item_info im ON im."Id" = e."EpisodeId" WHERE s."SeriesId" = i."Id") )"Size",
         count(a."NowPlayingItemId") AS times_played,
         COALESCE(sum(a."PlaybackDuration"), 0::numeric) AS total_play_time
        FROM jf_library_items i
          LEFT JOIN jf_playback_activity a ON i."Id" = a."NowPlayingItemId"
          LEFT JOIN jf_item_info ii ON ii."Id" = i."Id"
       GROUP BY i."Id", "Size"
       ORDER BY (count(a."NowPlayingItemId")) DESC;`);
  } catch (error) {
    console.error(error);
  }
};

exports.down = async function (knex) {
  try {
    await knex.schema.raw(`
    DROP VIEW public.jf_library_items_with_playcount_playtime;
    CREATE OR REPLACE VIEW public.jf_library_items_with_playcount_playtime
    AS
    SELECT i."Id",
       i."Name",
       i."ServerId",
       i."PremiereDate",
       i."EndDate",
       i."CommunityRating",
       i."RunTimeTicks",
       i."ProductionYear",
       i."IsFolder",
       i."Type",
       i."Status",
       i."ImageTagsPrimary",
       i."ImageTagsBanner",
       i."ImageTagsLogo",
       i."ImageTagsThumb",
       i."BackdropImageTags",
       i."ParentId",
       i."PrimaryImageHash",
       i.archived,
       COALESCE(ii."Size",(SELECT SUM(im."Size") FROM jf_library_seasons s JOIN jf_library_episodes e on s."Id"=e."SeasonId" JOIN jf_item_info im ON im."Id" = e."EpisodeId" WHERE s."SeriesId" = i."Id") )"Size",
       count(a."NowPlayingItemId") AS times_played,
       COALESCE(sum(a."PlaybackDuration"), 0::numeric) AS total_play_time
      FROM jf_library_items i
        LEFT JOIN jf_playback_activity a ON i."Id" = a."NowPlayingItemId"
        LEFT JOIN jf_item_info ii ON ii."Id" = i."Id"
     GROUP BY i."Id", "Size"
     ORDER BY (count(a."NowPlayingItemId")) DESC;`);
  } catch (error) {
    console.error(error);
  }
};
