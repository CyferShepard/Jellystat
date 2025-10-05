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

const mappingPlaybackReporting = (item) => {
  let duration = item[9];

  if (duration === null || duration === undefined || duration < 0) {
    duration = 0;
  }

  return {
    rowid: item[0],
    DateCreated: item[1],
    UserId: item[2],
    ItemId: item[3],
    ItemType: item[4],
    ItemName: item[5],
    PlaybackMethod: item[6],
    ClientName: item[7],
    DeviceName: item[8],
    PlayDuration: duration,
  };
};

module.exports = {
  columnsPlaybackReporting,
  mappingPlaybackReporting,
};
