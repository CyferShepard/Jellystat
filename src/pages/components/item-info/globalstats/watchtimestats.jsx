import "../../../css/globalstats.css";
import i18next from "i18next";
import { Trans } from "react-i18next";

function WatchTimeStats(props) {
  function formatTime(totalSeconds, numberClassName, labelClassName) {
    const units = [
      { label: "UNITS.DAY", seconds: 86400 },
      { label: "UNITS.HOUR", seconds: 3600 },
      { label: "UNITS.MINUTE", seconds: 60 },
    ];

    const parts = units.reduce((result, { label, seconds }) => {
      const value = Math.floor(totalSeconds / seconds);
      if (value) {
        const formattedValue = <p className={numberClassName}>{value}</p>;
        const labelPlural = label.toUpperCase() + "S";
        const formattedLabel = <span className={labelClassName}>{value === 1 ? i18next.t(label) : i18next.t(labelPlural)}</span>;
        result.push(
          <span key={label} className="time-part">
            {formattedValue} {formattedLabel}
          </span>
        );
        totalSeconds -= value * seconds;
      }
      return result;
    }, []);

    if (parts.length === 0) {
      return (
        <>
          <p className={numberClassName}>0</p>{" "}
          <p className={labelClassName}>
            <Trans i18nKey="UNITS.MINUTES" />
          </p>
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
        <p className="stat-unit">
          <Trans i18nKey="UNITS.PLAYS" /> /
        </p>

        <>{formatTime(props.data.total_playback_duration || 0, "stat-value", "stat-unit")}</>
      </div>
    </div>
  );
}

export default WatchTimeStats;
