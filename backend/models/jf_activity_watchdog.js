const dayjs = require("dayjs");
const { randomUUID } = require("crypto");

const jf_activity_watchdog_columns = [
  "Id",
  "ActivityId",
  "IsPaused",
  "UserId",
  "UserName",
  "Client",
  "DeviceName",
  "DeviceId",
  "ApplicationVersion",
  "NowPlayingItemId",
  "NowPlayingItemName",
  "EpisodeId",
  "SeasonId",
  "SeriesName",
  "PlaybackDuration",
  "PlayMethod",
  "ActivityDateInserted",
  { name: "MediaStreams", mod: ":json" },
  { name: "TranscodingInfo", mod: ":json" },
  { name: "PlayState", mod: ":json" },
  "OriginalContainer",
  "RemoteEndPoint",
  "ServerId",
];

const jf_activity_watchdog_mapping = (item) => ({
  Id: item.Id,
  ActivityId: item.ActivityId !== undefined ? item.ActivityId : randomUUID(),
  IsPaused: item.PlayState.IsPaused !== undefined ? item.PlayState.IsPaused : item.IsPaused,
  UserId: item.UserId,
  UserName: item.UserName,
  Client: item.Client,
  DeviceName: item.DeviceName,
  DeviceId: item.DeviceId,
  ApplicationVersion: item.ApplicationVersion,
  NowPlayingItemId: item.NowPlayingItem.SeriesId !== undefined ? item.NowPlayingItem.SeriesId : item.NowPlayingItem.Id,
  NowPlayingItemName: item.NowPlayingItem.Name,
  EpisodeId: item.NowPlayingItem.SeriesId !== undefined ? item.NowPlayingItem.Id : null,
  SeasonId: item.NowPlayingItem.SeasonId || null,
  SeriesName: item.NowPlayingItem.SeriesName || null,
  PlaybackDuration: item.PlaybackDuration !== undefined ? item.PlaybackDuration : 0,
  PlayMethod: item.PlayState.PlayMethod,
  ActivityDateInserted:
    item.ActivityDateInserted !== undefined ? item.ActivityDateInserted : dayjs().format("YYYY-MM-DD HH:mm:ss.SSSZ"),
  MediaStreams: item.NowPlayingItem.MediaStreams ? item.NowPlayingItem.MediaStreams : null,
  TranscodingInfo: item.TranscodingInfo ? item.TranscodingInfo : null,
  PlayState: item.PlayState ? item.PlayState : null,
  OriginalContainer: item.NowPlayingItem && item.NowPlayingItem.Container ? item.NowPlayingItem.Container : null,
  RemoteEndPoint: item.RemoteEndPoint || null,
  ServerId: item.ServerId || null,
});

module.exports = {
  jf_activity_watchdog_columns,
  jf_activity_watchdog_mapping,
};
