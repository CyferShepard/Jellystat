import { useState, useEffect } from "react";
import axios from "../../../lib/axios_instance";
import Config from "../../../lib/config";
// import API from "../../../classes/jellyfin-api";

import "../../css/sessions.css";
import ErrorBoundary from "../general/ErrorBoundary";
import SessionCard from "./session-card";

import Loading from "../general/loading";
import { Trans } from "react-i18next";
import i18next from "i18next";
import socket from "../../../socket";

function convertBitrate(bitrate) {
  if (!bitrate) {
    return i18next.t("ERROR_MESSAGES.N/A");
  }
  const kbps = (bitrate / 1000).toFixed(1);
  const mbps = (bitrate / 1000000).toFixed(1);

  if (kbps >= 1000) {
    return mbps + " Mbps";
  } else {
    return kbps + " Kbps";
  }
}

function getVideoResolution(videoHeight) {
  let videoResolution = "";
  if (videoHeight > 2160) {
    videoResolution = "8K";
  } else if (videoHeight > 1080) {
    videoResolution = "4K";
  } else if (videoHeight > 720) {
    videoResolution = "1080p";
  } else if (videoHeight > 480) {
    videoResolution = "720p";
  } else if (videoHeight > 360) {
    videoResolution = "480p";
  } else if (videoHeight > 240) {
    videoResolution = "360p";
  } else {
    videoResolution = "240p";
  }
  return videoResolution;
}

function Sessions() {
  const [data, setData] = useState();
  const [config, setConfig] = useState();

  useEffect(() => {
    socket.on("sessions", (data) => {
      if (typeof data === "object" && Array.isArray(data)) {
        let toSet = data.filter((row) => row.NowPlayingItem !== undefined);
        toSet.forEach((s) => {
          handleLiveTV(s);
          s.NowPlayingItem.ContainerStream = getContainerStream(s);
          s.NowPlayingItem.VideoStream = getVideoStream(s);
          s.NowPlayingItem.VideoBitrateStream = getVideoBitrateStream(s);
          s.NowPlayingItem.AudioStream = getAudioStream(s);
          s.NowPlayingItem.AudioBitrateStream = getAudioBitrateStream(s);
          s.NowPlayingItem.SubtitleStream = getSubtitleStream(s);
        });
        setData(toSet);
      }
    });
    return () => {
      socket.off("sessions");
    };
  }, [config]);

  const handleLiveTV = (row) => {
    let nowPlaying = row.NowPlayingItem;
    if (!nowPlaying.RunTimeTicks && nowPlaying?.CurrentProgram) {
      nowPlaying.RunTimeTicks = 0;
      nowPlaying.Name = `${nowPlaying.Name}: ${nowPlaying.CurrentProgram.Name}`;
    }
  };

  const getContainerStream = (row) => {
    let transcodeContainer = "";
    if (row.TranscodingInfo) transcodeContainer = ` -> ${row.TranscodingInfo.Container.toUpperCase()}`;

    let NowPlayingItemContainer = "";
    if (row.NowPlayingItem.Container == undefined) {
      if (row.NowPlayingItem.Type != undefined && row.NowPlayingItem.Type == "TvChannel") {
        NowPlayingItemContainer = "LiveTV";
      }
    } else {
      NowPlayingItemContainer = row.NowPlayingItem.Container;
    }
    return `${NowPlayingItemContainer.toUpperCase()}${transcodeContainer}`;
  };

  const getVideoStream = (row) => {
    let videoStream = row.NowPlayingItem.MediaStreams.find((stream) => stream.Type === "Video");

    if (videoStream === undefined) {
      return "";
    }

    let transcodeType = i18next.t("SESSIONS.DIRECT_PLAY");
    let transcodeVideoCodec = "";
    let transcodeVideoResolution = "";
    if (row.TranscodingInfo && !row.TranscodingInfo.IsVideoDirect) {
      transcodeType = i18next.t("SESSIONS.TRANSCODE");
      transcodeVideoResolution = getVideoResolution(row.TranscodingInfo.Height);
      transcodeVideoCodec = ` -> ${row.TranscodingInfo.VideoCodec.toUpperCase()}-${transcodeVideoResolution}`;
    }

    const originalVideoCodec = videoStream.Codec.toUpperCase();
    let videoResolution = getVideoResolution(videoStream.Height);

    return `${transcodeType} (${originalVideoCodec}-${videoResolution}${transcodeVideoCodec})`;
  };

  const getVideoBitrateStream = (row) => {
    let videoStream = row.NowPlayingItem.MediaStreams.find((stream) => stream.Type === "Video");
    if (videoStream === undefined) {
      return "";
    }

    let transcodeBitrate = "";
    if (row.TranscodingInfo && !row.TranscodingInfo.IsVideoDirect) {
      if (row.TranscodingInfo.VideoBitrate) {
        transcodeBitrate = ` -> ${convertBitrate(row.TranscodingInfo.VideoBitrate)}`;
      } else if (row.TranscodingInfo.Bitrate) {
        transcodeBitrate = ` -> ${convertBitrate(row.TranscodingInfo.Bitrate)}`;
      }
    }

    let originalBitrate = "";
    if (videoStream.BitRate) {
      originalBitrate = convertBitrate(videoStream.BitRate);
    }

    return `${originalBitrate}${transcodeBitrate}`;
  };

  const getAudioStream = (row) => {
    let mediaTypeAudio = row.NowPlayingItem.Type === "Audio";
    let streamIndex = row.PlayState.AudioStreamIndex;
    if ((streamIndex === undefined || streamIndex === -1) && !mediaTypeAudio) {
      return "";
    }

    let transcodeType = i18next.t("SESSIONS.DIRECT_PLAY");
    let transcodeCodec = "";
    if (row.TranscodingInfo && !row.TranscodingInfo.IsAudioDirect) {
      transcodeType = i18next.t("SESSIONS.TRANSCODE");
      transcodeCodec = ` -> ${row.TranscodingInfo.AudioCodec.toUpperCase()}-${row.TranscodingInfo.AudioChannels}Ch`;
    }

    let originalCodec = "";
    if (mediaTypeAudio) {
      originalCodec = `${row.NowPlayingItem.Container.toUpperCase()}`;
    } else if (
      row.NowPlayingItem.MediaStreams &&
      row.NowPlayingItem.MediaStreams.length &&
      streamIndex < row.NowPlayingItem.MediaStreams.length
    ) {
      originalCodec = `${row.NowPlayingItem.MediaStreams[streamIndex].Codec.toUpperCase()}-${
        row.NowPlayingItem.MediaStreams[streamIndex].Channels
      }Ch`;
    }

    return originalCodec != "" ? `${transcodeType} (${originalCodec}${transcodeCodec})` : `${transcodeType}`;
  };

  const getAudioBitrateStream = (row) => {
    let mediaTypeAudio = row.NowPlayingItem.Type === "Audio";
    let streamIndex = row.PlayState.AudioStreamIndex;
    if ((streamIndex === undefined || streamIndex === -1) && !mediaTypeAudio) {
      return "";
    }

    let transcodeBitRate = "";
    if (row.TranscodingInfo && row.TranscodingInfo.AudioBitrate) {
      transcodeBitRate = " -> " + convertBitrate(row.TranscodingInfo.AudioBitrate);
    }

    let originalBitrate = "";
    if (mediaTypeAudio) {
      originalBitrate = convertBitrate(row.NowPlayingItem.Bitrate);
    } else if (
      row.NowPlayingItem.MediaStreams &&
      row.NowPlayingItem.MediaStreams.length &&
      streamIndex < row.NowPlayingItem.MediaStreams.length &&
      row.NowPlayingItem.MediaStreams[streamIndex].BitRate
    ) {
      originalBitrate = convertBitrate(row.NowPlayingItem.MediaStreams[streamIndex].BitRate);
    } else if (transcodeBitRate) {
      originalBitrate = i18next.t("ERROR_MESSAGES.N/A");
    }
    return `${originalBitrate}${transcodeBitRate}`;
  };

  const getSubtitleStream = (row) => {
    let result = "";

    if (!row.PlayState) {
      return result;
    }

    let subStreamIndex = row.PlayState.SubtitleStreamIndex;

    if (subStreamIndex === undefined || subStreamIndex === -1) {
      return result;
    }

    if (row.NowPlayingItem.MediaStreams && row.NowPlayingItem.MediaStreams.length) {
      result = `${row.NowPlayingItem.MediaStreams[subStreamIndex].DisplayTitle}`;
    }

    return result;
  };

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const newConfig = await Config.getConfig();
        setConfig(newConfig);
      } catch (error) {
        console.log(error);
      }
    };

    if (!config) {
      fetchConfig();
    }
  }, [config]);

  if (!data && !config) {
    return <Loading />;
  }

  if ((!data && config) || data.length === 0) {
    return (
      <div>
        <h1 className="my-3">
          <Trans i18nKey="HOME_PAGE.SESSIONS" />
        </h1>
        <div style={{ color: "grey", fontSize: "0.8em", fontStyle: "italic" }}>
          <Trans i18nKey="SESSIONS.NO_SESSIONS" />
        </div>
      </div>
    );
  }

  return (
    <div>
      <h1 className="my-3">
        <Trans i18nKey="HOME_PAGE.SESSIONS" />
      </h1>
      <div className="sessions-container">
        {data &&
          data.length > 0 &&
          data
            .sort((a, b) => a.Id.padStart(12, "0").localeCompare(b.Id.padStart(12, "0")))
            .map((session) => (
              <ErrorBoundary key={session.Id}>
                <SessionCard data={{ session: session, base_url: config.base_url }} />
              </ErrorBoundary>
            ))}
      </div>
    </div>
  );
}

export default Sessions;
