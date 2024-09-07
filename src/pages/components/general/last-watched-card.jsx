import { useState } from "react";
import { Link } from "react-router-dom";
import { Blurhash } from "react-blurhash";
import ArchiveDrawerFillIcon from "remixicon-react/ArchiveDrawerFillIcon";

import "../../css/lastplayed.css";
import { Trans } from "react-i18next";
import i18next from "i18next";
import baseUrl from "../../../lib/baseurl";

function formatTime(time) {
  const units = {
    days: [i18next.t("UNITS.DAY"), i18next.t("UNITS.DAYS")],
    hours: [i18next.t("UNITS.HOUR"), i18next.t("UNITS.HOUR")],
    minutes: [i18next.t("UNITS.MINUTE"), i18next.t("UNITS.MINUTES")],
    seconds: [i18next.t("UNITS.SECOND"), i18next.t("UNITS.SECONDS")],
  };

  let formattedTime = "";

  if (time.days) {
    formattedTime = `${time.days} ${units.days[time.days > 1 ? 1 : 0]}`;
  } else if (time.hours) {
    formattedTime = `${time.hours} ${units.hours[time.hours > 1 ? 1 : 0]}`;
  } else if (time.minutes) {
    formattedTime = `${time.minutes} ${units.minutes[time.minutes > 1 ? 1 : 0]}`;
  } else {
    formattedTime = `${time.seconds} ${units.seconds[time.seconds > 1 ? 1 : 0]}`;
  }

  return formattedTime;
}

function LastWatchedCard(props) {
  const [loaded, setLoaded] = useState(false);

  return (
    <div className="last-card">
      <Link to={`/libraries/item/${props.data.EpisodeId || props.data.Id}`}>
        <div className="last-card-banner">
          {props.data.archived && loaded && props.data.PrimaryImageHash && props.data.PrimaryImageHash != null ? (
            <Blurhash hash={props.data.PrimaryImageHash} width={"100%"} height={"100%"} className="rounded-3 overflow-hidden" />
          ) : null}
          {!props.data.archived ? (
            <img
              src={`${baseUrl+"/proxy/Items/Images/Primary?id=" + props.data.Id + "&fillHeight=320&fillWidth=213&quality=50"}`}
              alt=""
              onLoad={() => setLoaded(true)}
              style={loaded ? { display: "block" } : { display: "none" }}
            />
          ) : (
            <div
              className="d-flex flex-column justify-content-center align-items-center position-relative"
              style={{ height: "100%" }}
            >
              {(props.data.ImageBlurHashes && props.data.ImageBlurHashes != null) ||
              (props.data.PrimaryImageHash && props.data.PrimaryImageHash != null) ? (
                <Blurhash
                  hash={props.data.PrimaryImageHash || props.data.ImageBlurHashes.Primary[props.data.ImageTags.Primary]}
                  width={"100%"}
                  height={"100%"}
                  className="rounded-top-3 overflow-hidden position-absolute"
                />
              ) : null}
              <div className="d-flex flex-column justify-content-center align-items-center position-absolute">
                <ArchiveDrawerFillIcon className="w-100 h-100 mb-2" />
                <span>
                  <Trans i18nKey="ARCHIVED" />
                </span>
              </div>
            </div>
          )}
        </div>
      </Link>

      <div className="last-item-details">
        <div className="last-last-played">{`${i18next.t("USERS_PAGE.AGO_ALT")} ${formatTime(props.data.LastPlayed)} ${i18next.t("USERS_PAGE.AGO").toLocaleLowerCase()}`}</div>

        <div className="pb-2">
          <Link to={`/users/${props.data.UserId}`}>{props.data.UserName}</Link>
        </div>

        <div className="last-item-name">
          <Link to={`/libraries/item/${props.data.Id}`}>{props.data.Name}</Link>
        </div>
        <div className="last-item-episode">
          <Link to={`/libraries/item/${props.data.EpisodeId}`}>{props.data.EpisodeName}</Link>
        </div>
      </div>
      {props.data.SeasonNumber ? (
        <div className="last-item-episode number">
          {" "}
          S{props.data.SeasonNumber} - E{props.data.EpisodeNumber}
        </div>
      ) : (
        <></>
      )}
    </div>
  );
}

export default LastWatchedCard;
