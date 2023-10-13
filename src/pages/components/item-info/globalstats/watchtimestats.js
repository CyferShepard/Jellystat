import React from "react";

import "../../../css/globalstats.css";

function WatchTimeStats(props) {
  function formatTime(totalSeconds, numberClassName, labelClassName) {
    const units = [
      { label: "Day", seconds: 86400 },
      { label: "Hour", seconds: 3600 },
      { label: "Minute", seconds: 60 },
    ];

    const parts = units.reduce((result, { label, seconds }) => {
      const value = Math.floor(totalSeconds / seconds);
      if (value) {
        const formattedValue = <p className={numberClassName}>{value}</p>;
        const formattedLabel = (
          <span className={labelClassName}>
            {label}
            {value === 1 ? "" : "s"}
          </span>
        );
        result.push(
          <span key={label} className="time-part">
            {formattedValue} {formattedLabel}
          </span>,
        );
        totalSeconds -= value * seconds;
      }
      return result;
    }, []);

    if (parts.length === 0) {
      return (
        <>
          <p className={numberClassName}>0</p>{" "}
          <p className={labelClassName}>Minutes</p>
        </>
      );
    }

    return parts;
  }

  return (
    <div className="global-stats">
      <div className="stats-header">
        <div>{props.heading}</div>
      </div>

      <div className="play-duration-stats" key={props.data.ItemId}>
        <p className="stat-value"> {props.data.Plays || 0}</p>
        <p className="stat-unit">Plays /</p>

        <>
          {formatTime(
            props.data.total_playback_duration || 0,
            "stat-value",
            "stat-unit",
          )}
        </>
      </div>
    </div>
  );
}

export default WatchTimeStats;
