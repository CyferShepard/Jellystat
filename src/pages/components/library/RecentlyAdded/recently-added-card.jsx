import { useState } from "react";
import { Blurhash } from "react-blurhash";
import { Link } from "react-router-dom";

import "../../../css/lastplayed.css";
import { Trans } from "react-i18next";
import TvLineIcon from "remixicon-react/TvLineIcon";
import FilmLineIcon from "remixicon-react/FilmLineIcon";
import FileMusicLineIcon from "remixicon-react/FileMusicLineIcon";
import CheckboxMultipleBlankLineIcon from "remixicon-react/CheckboxMultipleBlankLineIcon";
import baseUrl from "../../../../lib/baseurl";

function RecentlyAddedCard(props) {
  const [loaded, setLoaded] = useState(false);
  const [fallback, setFallback] = useState(false);
  const twelve_hr = JSON.parse(localStorage.getItem("12hr"));
  const localization = localStorage.getItem("i18nextLng");

  const options = {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    // second: "numeric",
    hour12: twelve_hr,
  };

  const SeriesIcon = <TvLineIcon size={"75%"} />;
  const MovieIcon = <FilmLineIcon size={"75%"} />;
  const MusicIcon = <FileMusicLineIcon size={"75%"} />;
  const MixedIcon = <CheckboxMultipleBlankLineIcon size={"75%"} />;

  const currentLibraryDefaultIcon =
    props.data.Type === "Movie"
      ? MovieIcon
      : props.data.Type === "Episode"
      ? SeriesIcon
      : props.data.Type === "Audio"
      ? MusicIcon
      : MixedIcon;

  return (
    <div className="last-card">
      <Link
        to={`/libraries/item/${
          (props.data.NewEpisodeCount != undefined ? props.data.SeasonId : props.data.EpisodeId) ?? props.data.Id
        }`}
      >
        <div
          className={
            (props.data.Type === "Audio" ? "last-card-banner audio" : "last-card-banner") +
            "  d-flex justify-content-center align-items-center"
          }
        >
          {fallback ? (
            <div
              className="d-flex flex-column justify-content-center align-items-center position-relative"
              style={{ height: "100%", width: "200px" }}
            >
              {props.data.PrimaryImageHash && props.data.PrimaryImageHash != null ? (
                <Blurhash
                  hash={props.data.PrimaryImageHash}
                  width={"100%"}
                  height={"100%"}
                  className="rounded-top-3 overflow-hidden position-absolute"
                  style={{ display: "block" }}
                />
              ) : null}
              <div className="d-flex flex-column justify-content-center align-items-center position-absolute">
                {currentLibraryDefaultIcon}
              </div>
            </div>
          ) : null}
          <img
            src={`${
              baseUrl+"/proxy/Items/Images/Primary?id=" +
              (props.data.Type === "Episode" ? props.data.SeriesId : props.data.Id) +
              "&fillHeight=320&fillWidth=213&quality=50"
            }`}
            alt=""
            onLoad={() => setLoaded(true)}
            onError={() => setFallback(true)}
            style={loaded ? {} : { display: "none" }}
          />
        </div>
      </Link>

      <div className="last-item-details">
        <div className="last-last-played">
          {Intl.DateTimeFormat(localization, options).format(new Date(props.data.DateCreated))}
        </div>

        <div className="last-item-name">
          <Link to={`/libraries/item/${props.data.SeriesId ?? props.data.Id}`}>{props.data.SeriesName ?? props.data.Name}</Link>
        </div>
        {props.data.Type === "Episode" && props.data.NewEpisodeCount == undefined && (
          <div className="last-item-episode">
            <Link to={`/libraries/item/${props.data.EpisodeId}`}>{props.data.Name}</Link>
          </div>
        )}
      </div>

      {props.data.SeasonNumber && props.data.NewEpisodeCount == undefined && (
        <div className="last-item-episode number">
          S{props.data.SeasonNumber} - E{props.data.EpisodeNumber}
        </div>
      )}

      {props.data.SeasonNumber && props.data.NewEpisodeCount != undefined && (
        <div className="last-item-episode number pt-0 pb-1">
          <Trans i18nKey="SEASON" /> {props.data.SeasonNumber}
        </div>
      )}

      {props.data.NewEpisodeCount && (
        <div className="last-item-episode number pt-0">
          {props.data.NewEpisodeCount} <Trans i18nKey="EPISODES" />
        </div>
      )}
    </div>
  );
}

export default RecentlyAddedCard;
