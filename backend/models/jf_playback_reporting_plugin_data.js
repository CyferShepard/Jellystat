////////////////////////// pn delete move to playback
const columnsPlaybackReporting = [
  "rowid",
  "DateCreated",
  "UserId",
  "ItemId",
  "ItemType",
  "ItemName",
  "PlaybackMethod",
  "ClientName",
  "DeviceName",
  "PlayDuration",
];

const mappingPlaybackReporting = (item) => ({
  rowid: item[0],
  DateCreated: item[1],
  UserId: item[2],
  ItemId: item[3],
  ItemType: item[4],
  ItemName: item[5],
  PlaybackMethod: item[6],
  ClientName: item[7],
  DeviceName: item[8],
  PlayDuration: item[9],
});

module.exports = {
  columnsPlaybackReporting,
  mappingPlaybackReporting,
};
