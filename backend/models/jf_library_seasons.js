      ////////////////////////// pn delete move to playback
      const jf_library_seasons_columns = [
        "Id",
        "Name",
        "ServerId",
        "IndexNumber",
        "Type",
        "ParentLogoItemId",
        "ParentBackdropItemId",
        "ParentBackdropImageTags",
        "SeriesName",
        "SeriesId",
        "SeriesPrimaryImageTag",
      ];
      
    const jf_library_seasons_mapping = (item) => ({
        Id: item.Id,
        Name: item.Name,
        ServerId: item.ServerId,
        IndexNumber: item.IndexNumber,
        Type: item.Type,
        ParentLogoItemId: item.ParentLogoItemId,
        ParentBackdropItemId: item.ParentBackdropItemId,
        ParentBackdropImageTags:
          item.ParentBackdropImageTags !== undefined
            ? item.ParentBackdropImageTags[0]
            : null,
        SeriesName: item.SeriesName,
        SeriesId: item.SeriesId,
        SeriesPrimaryImageTag: item.SeriesPrimaryImageTag ? item.SeriesPrimaryImageTag : null,
      });

  module.exports = {
    jf_library_seasons_columns,
    jf_library_seasons_mapping,
  };