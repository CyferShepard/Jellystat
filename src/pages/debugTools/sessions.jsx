import { useState, useEffect } from "react";
import Config from "../../lib/config";

import "../css/sessions.css";
import ErrorBoundary from "../components/general/ErrorBoundary";
import SessionCard from "./session-card";

import Loading from "../components/general/loading";
import { Trans } from "react-i18next";
import socket from "../../socket";

function Sessions() {
  const [data, setData] = useState();
  const [config, setConfig] = useState();

  useEffect(() => {
    socket.on("sessions", (data) => {
      if (typeof data === "object" && Array.isArray(data)) {
        let toSet = data.filter((row) => row.NowPlayingItem !== undefined);
        toSet.forEach((s) => {
          handleLiveTV(s);
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
