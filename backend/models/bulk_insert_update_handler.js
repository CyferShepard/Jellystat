

  const update_query = [
    {table:'jf_activity_watchdog',query:' ON CONFLICT DO NOTHING'},
    {table:'jf_item_info',query:' ON CONFLICT ("Id") DO UPDATE SET "Path" = EXCLUDED."Path", "Name" = EXCLUDED."Name", "Size" = EXCLUDED."Size", "Bitrate" = EXCLUDED."Bitrate", "MediaStreams" = EXCLUDED."MediaStreams"'},
    {table:'jf_libraries',query:' ON CONFLICT ("Id") DO UPDATE SET "Name" = EXCLUDED."Name", "Type" = EXCLUDED."Type", "CollectionType" = EXCLUDED."CollectionType", "ImageTagsPrimary" = EXCLUDED."ImageTagsPrimary"'},
    {table:'jf_library_episodes',query:' ON CONFLICT ("Id") DO UPDATE SET "Name" = EXCLUDED."Name", "PremiereDate" = EXCLUDED."PremiereDate", "OfficialRating" = EXCLUDED."OfficialRating", "CommunityRating" = EXCLUDED."CommunityRating", "RunTimeTicks" = EXCLUDED."RunTimeTicks", "ProductionYear" = EXCLUDED."ProductionYear", "IndexNumber" = EXCLUDED."IndexNumber", "ParentIndexNumber" = EXCLUDED."ParentIndexNumber", "Type" = EXCLUDED."Type", "ParentLogoItemId" = EXCLUDED."ParentLogoItemId", "ParentBackdropItemId" = EXCLUDED."ParentBackdropItemId", "ParentBackdropImageTags" = EXCLUDED."ParentBackdropImageTags", "SeriesId" = EXCLUDED."SeriesId", "SeasonId" = EXCLUDED."SeasonId", "SeasonName" = EXCLUDED."SeasonName", "SeriesName" = EXCLUDED."SeriesName"'},
    {table:'jf_library_items',query:' ON CONFLICT ("Id") DO UPDATE SET "Name" = EXCLUDED."Name", "PremiereDate" = EXCLUDED."PremiereDate", "EndDate" = EXCLUDED."EndDate", "CommunityRating" = EXCLUDED."CommunityRating", "RunTimeTicks" = EXCLUDED."RunTimeTicks", "ProductionYear" = EXCLUDED."ProductionYear", "Type" = EXCLUDED."Type", "Status" = EXCLUDED."Status", "ImageTagsPrimary" = EXCLUDED."ImageTagsPrimary", "ImageTagsBanner" = EXCLUDED."ImageTagsBanner", "ImageTagsLogo" = EXCLUDED."ImageTagsLogo", "ImageTagsThumb" = EXCLUDED."ImageTagsThumb", "BackdropImageTags" = EXCLUDED."BackdropImageTags", "ParentId" = EXCLUDED."ParentId", "PrimaryImageHash" = EXCLUDED."PrimaryImageHash"'},
    {table:'jf_library_seasons',query:' ON CONFLICT ("Id") DO UPDATE SET "Name" = EXCLUDED."Name", "ParentLogoItemId" = EXCLUDED."ParentLogoItemId", "ParentBackdropItemId" = EXCLUDED."ParentBackdropItemId", "ParentBackdropImageTags" = EXCLUDED."ParentBackdropImageTags", "SeriesPrimaryImageTag" = EXCLUDED."SeriesPrimaryImageTag"'},
    {table:'jf_logging',query:' ON CONFLICT DO NOTHING'},
    {table:'jf_playback_activity',query:' ON CONFLICT DO NOTHING'},
    {table:'jf_playback_reporting_plugin_data',query:' ON CONFLICT DO NOTHING'},
    {table:'jf_users',query:' ON CONFLICT ("Id") DO UPDATE SET "Name" = EXCLUDED."Name", "PrimaryImageTag" = EXCLUDED."PrimaryImageTag", "LastLoginDate" = EXCLUDED."LastLoginDate", "LastActivityDate" = EXCLUDED."LastActivityDate"'}
  ]; 
  module.exports = {
    update_query
  };