      const columnsPlayback = [
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
        { name: 'MediaStreams', mod: ':json' },
        { name: 'TranscodingInfo', mod: ':json' },
        { name: 'PlayState', mod: ':json' },
        "OriginalContainer",
        "RemoteEndPoint"
      ]; 


      const mappingPlayback = (item) => ({
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
        PlayMethod: item.PlayState.PlayMethod  !== undefined ?  item.PlayState.PlayMethod : item.PlayMethod ,
        ActivityDateInserted: item.ActivityDateInserted !== undefined ?  item.ActivityDateInserted: new Date().toISOString(),
        MediaStreams: item.MediaStreams ? item.MediaStreams : null ,
        TranscodingInfo: item.TranscodingInfo? item.TranscodingInfo : null,
        PlayState: item.PlayState? item.PlayState : null,
        OriginalContainer: item.OriginalContainer ? item.OriginalContainer : null,
        RemoteEndPoint: item.RemoteEndPoint ? item.RemoteEndPoint : null
      });

  module.exports = {
    columnsPlayback,
    mappingPlayback,
  };