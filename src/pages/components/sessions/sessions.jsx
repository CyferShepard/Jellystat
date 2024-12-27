import { useState, useEffect } from "react";
import axios from "../../../lib/axios_instance";
import Config from "../../../lib/config";
// import API from "../../../classes/jellyfin-api";

import "../../css/sessions.css";
import ErrorBoundary from "../general/ErrorBoundary";
import SessionCard from "./session-card";

import Loading from "../general/loading";
import { Trans } from "react-i18next";
import socket from "../../../socket";

function convertBitrate(bitrate) {
  if (!bitrate) {
    return "N/A";
  }
  const kbps = (bitrate / 1000).toFixed(1);
  const mbps = (bitrate / 1000000).toFixed(1);

  if (kbps >= 1000) {
    return mbps + " Mbps";
  } else {
    return kbps + " Kbps";
  }
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
          s.NowPlayingItem.VideoStream = getVideoStream(s);
          s.NowPlayingItem.AudioStream = getAudioStream(s);
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

  const getVideoStream = (row) => {
    let videoStream = row.NowPlayingItem.MediaStreams.find((stream) => stream.Type === "Video");

    if (videoStream === undefined) {
      return "";
    }

    let transcodeType = "Direct Stream";
    let transcodeVideoCodec = "";
    if (row.TranscodingInfo && !row.TranscodingInfo.IsVideoDirect){
      transcodeType = "Transcode";
      transcodeVideoCodec = ` -> ${row.TranscodingInfo.VideoCodec.toUpperCase()}`;
    }
    let bitRate = convertBitrate(
      row.TranscodingInfo
        ? row.TranscodingInfo.Bitrate
        : videoStream.BitRate);

    const originalVideoCodec = videoStream.Codec.toUpperCase();
    
    return `Video: ${transcodeType} (${originalVideoCodec}${transcodeVideoCodec} - ${bitRate})`;
  }

  const getAudioStream = (row) => {
    let result = "";

    let streamIndex = row.PlayState.AudioStreamIndex;
    if (streamIndex === undefined || streamIndex === -1) {
      return result;
    }

    let transcodeType = "Direct Stream";
    let transcodeCodec = "";
    if (row.TranscodingInfo && !row.TranscodingInfo.IsAudioDirect){
      transcodeType = "Transcode";
      transcodeCodec = ` -> ${row.TranscodingInfo.AudioCodec.toUpperCase()}`;
    }

    let originalCodec = "";
    if (row.NowPlayingItem.MediaStreams && row.NowPlayingItem.MediaStreams.length && streamIndex < row.NowPlayingItem.MediaStreams.length) {
      originalCodec = row.NowPlayingItem.MediaStreams[streamIndex].Codec.toUpperCase();
    }

    return originalCodec != "" ? `Audio: ${transcodeType} (${originalCodec}${transcodeCodec})`
                               : `Audio: ${transcodeType}`;
  }

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
      result = `Subtitles: ${row.NowPlayingItem.MediaStreams[subStreamIndex].DisplayTitle}`;
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
