import React from "react";

import "../../../css/globalstats.css";
import { Trans } from "react-i18next";

function WatchTimeStats(props) {
  function formatTime(totalSeconds, numberClassName, labelClassName) {
    const units = [
      { label: "Year", seconds: 31557600 },
      { label: "Month", seconds: 2629743 },
      { label: "Day", seconds: 86400 },
      { label: "Hour", seconds: 3600 },
      { label: "Minute", seconds: 60 },
      { label: "Second", seconds: 1 },
    ];

    const parts = units.reduce((result, { label, seconds }) => {
      const value = Math.floor(totalSeconds / seconds);
      if (value) {
        const formattedValue = <p className={numberClassName}>{value}</p>;
        const formattedLabel = (
          <span className={labelClassName}>
            <Trans i18nKey={`UNITS.${(label + (value === 1 ? "" : "s")).toUpperCase()}`} />
          </span>
        );
        result.push(
          <span key={label} className="time-part">
            {formattedValue} {formattedLabel}
          </span>
        );
        totalSeconds -= value * seconds;
      }
      return result;
    }, []);

    // Filter out minutes if months are included
    const hasMonths = parts.some((part) => part.key === "Month");
    let filteredParts = hasMonths ? parts.filter((part) => part.key !== "Minute") : parts;

    const hasDays = filteredParts.some((part) => part.key === "Day");
    filteredParts = hasDays ? filteredParts.filter((part) => part.key !== "Second") : filteredParts;

    if (filteredParts.length === 0) {
      return (
        <>
          <p className={numberClassName}>0</p>{" "}
          <p className={labelClassName}>
            <Trans i18nKey="UNITS.SECONDS" />
          </p>
        </>
      );
    }

    return filteredParts;
  }

  return (
    <div className="global-stats">
      <div className="stats-header">
        <div>{props.heading}</div>
      </div>

      <div className="play-duration-stats" key={props.data.UserId}>
        <div className={"d-flex flex-row"}>
          <p className="stat-value"> {props.data.Plays || 0}</p>
          <p className="stat-unit">
            <Trans i18nKey={`UNITS.PLAYS`} />
          </p>
        </div>

        <div className="d-flex flex-row">{formatTime(props.data.total_playback_duration || 0, "stat-value", "stat-unit")}</div>
      </div>
    </div>
  );
}

export default WatchTimeStats;
