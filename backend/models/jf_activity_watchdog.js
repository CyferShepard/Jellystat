const jf_activity_watchdog_columns = [
    "Id",
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
  ]; 


  const jf_activity_watchdog_mapping = (item) => ({
    Id: item.Id ,
    IsPaused: item.PlayState.IsPaused  !== undefined ? item.PlayState.IsPaused : item.IsPaused,
    UserId: item.UserId,
    UserName: item.UserName,
    Client: item.Client,
    DeviceName: item.DeviceName,
    DeviceId: item.DeviceId,
    ApplicationVersion: item.ApplicationVersion,
    NowPlayingItemId: item.NowPlayingItem.SeriesId !== undefined ? item.NowPlayingItem.SeriesId : item.NowPlayingItem.Id,
    NowPlayingItemName: item.NowPlayingItem.Name,
    EpisodeId: item.NowPlayingItem.SeriesId !== undefined ? item.NowPlayingItem.Id: null, 
    SeasonId: item.NowPlayingItem.SeasonId || null, 
    SeriesName: item.NowPlayingItem.SeriesName || null,
    PlaybackDuration: item.PlaybackDuration !== undefined ? item.PlaybackDuration: 0,
    PlayMethod:item.PlayState.PlayMethod,
    ActivityDateInserted: item.ActivityDateInserted !== undefined ?  item.ActivityDateInserted: new Date().toISOString(),
  });

  module.exports = {
    jf_activity_watchdog_columns, 
    jf_activity_watchdog_mapping 
  };