exports.up = function (knex) {
  const query = `
    CREATE OR REPLACE VIEW jf_library_items_with_playcount_playtime AS
    SELECT 
    i."Id", 
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
    count(a."NowPlayingItemId") times_played,
    coalesce(sum(a."PlaybackDuration"),0) total_play_time
    FROM jf_library_items i
    left join jf_playback_activity a
    on i."Id"=a."NowPlayingItemId"
    group by i."Id"
    order by times_played desc
  `;

  return knex.schema.raw(query).catch(function (error) {
    console.error(error);
  });
};

exports.down = function (knex) {
  return knex.schema.raw(
    `DROP VIEW public.jf_library_items_with_playcount_playtime;`,
  );
};
