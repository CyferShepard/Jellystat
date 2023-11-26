      ////////////////////////// pn delete move to playback
      const jf_library_episodes_columns = [
        "Id",
        "EpisodeId",
        "Name",
        "ServerId",
        "PremiereDate",
        "OfficialRating",
        "CommunityRating",
        "RunTimeTicks",
        "ProductionYear",
        "IndexNumber",
        "ParentIndexNumber",
        "Type",
        "ParentLogoItemId",
        "ParentBackdropItemId",
        "ParentBackdropImageTags",
        "SeriesId",
        "SeasonId",
        "SeasonName",
        "SeriesName",
        "archived",
      ];
      
    const jf_library_episodes_mapping = (item) => ({
        Id: item.Id + item.SeasonId,
        EpisodeId: item.Id,
        Name: item.Name,
        ServerId: item.ServerId,
        PremiereDate: item.PremiereDate,
        OfficialRating: item.OfficialRating,
        CommunityRating: item.CommunityRating,
        RunTimeTicks: item.RunTimeTicks,
        ProductionYear: item.ProductionYear,
        IndexNumber: item.IndexNumber,
        ParentIndexNumber: item.ParentIndexNumber,
        Type: item.Type,
        ParentLogoItemId: item.ParentLogoItemId,
        ParentBackdropItemId: item.ParentBackdropItemId,
        ParentBackdropImageTags:
          item.ParentBackdropImageTags !== undefined
            ? item.ParentBackdropImageTags[0]
            : null,
        SeriesId: item.SeriesId,
        SeasonId: item.SeasonId,
        SeasonName: item.SeasonName,
        SeriesName: item.SeriesName,
        archived: false,
      });

  module.exports = {
    jf_library_episodes_columns,
    jf_library_episodes_mapping,
  };