      ////////////////////////// pn delete move to playback
      const jf_libraries_columns = [
        "Id",
        "Name",
        "ServerId",
        "IsFolder",
        "Type",
        "CollectionType",
        "ImageTagsPrimary",
        "archived",
      ];

      const jf_libraries_mapping = (item) => ({
        Id: item.Id,
        Name: item.Name,
        ServerId: item.ServerId,
        IsFolder: item.IsFolder,
        Type: item.Type,
        CollectionType: item.CollectionType? item.CollectionType : 'mixed',
        ImageTagsPrimary:
          item.ImageTags && item.ImageTags.Primary ? item.ImageTags.Primary : null,
        archived: false,
      });

  module.exports = {
    jf_libraries_columns,
    jf_libraries_mapping,
  };