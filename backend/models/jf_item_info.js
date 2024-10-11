const jf_item_info_columns = ["Id", "Path", "Name", "Size", "Bitrate", "MediaStreams", "Type"];

const jf_item_info_mapping = (item, typeOverride) => ({
  Id: item.ItemId || item.EpisodeId || item.Id,
  Path: item.Path,
  Name: item.Name,
  Size: item.Size,
  Bitrate: item.Bitrate,
  MediaStreams: JSON.stringify(item.MediaStreams),
  Type: typeOverride !== undefined ? typeOverride : item.Type,
});

module.exports = {
  jf_item_info_columns,
  jf_item_info_mapping,
};
