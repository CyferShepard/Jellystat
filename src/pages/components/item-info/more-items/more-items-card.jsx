import { useState } from "react";
import { Blurhash } from "react-blurhash";
import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import ArchiveDrawerFillIcon from "remixicon-react/ArchiveDrawerFillIcon";
import "../../../css/lastplayed.css";
import { Trans } from "react-i18next";
import TvLineIcon from "remixicon-react/TvLineIcon";
import FilmLineIcon from "remixicon-react/FilmLineIcon";
import FileMusicLineIcon from "remixicon-react/FileMusicLineIcon";
import CheckboxMultipleBlankLineIcon from "remixicon-react/CheckboxMultipleBlankLineIcon";
import baseUrl from "../../../../lib/baseurl";

function MoreItemCards(props) {
  const { Id } = useParams();
  const [loaded, setLoaded] = useState(props.data.archived);
  const [fallback, setFallback] = useState(false);

  const SeriesIcon = <TvLineIcon size={"50%"} />;
  const MovieIcon = <FilmLineIcon size={"50%"} />;
  const MusicIcon = <FileMusicLineIcon size={"50%"} />;
  const MixedIcon = <CheckboxMultipleBlankLineIcon size={"50%"} />;

  const currentLibraryDefaultIcon =
    props.data.Type === "Movie"
      ? MovieIcon
      : props.data.Type === "Episode"
      ? SeriesIcon
      : props.data.Type === "Audio"
      ? MusicIcon
      : MixedIcon;

  function formatFileSize(sizeInBytes) {
    const sizeInMB = sizeInBytes / 1048576; // 1 MB = 1048576 bytes
    if (sizeInMB < 1000) {
      return `${sizeInMB.toFixed(2)} MB`;
    } else {
      const sizeInGB = sizeInMB / 1024; // 1 GB = 1024 MB
      return `${sizeInGB.toFixed(2)} GB`;
    }
  }

  return (
    <div className={props.data.Type === "Episode" ? "last-card episode-card" : "last-card"}>
      <Link
        to={`/libraries/item/${props.data.Type === "Episode" ? props.data.EpisodeId : props.data.Id}`}
        className="text-decoration-none"
      >
        <div
          className={
            (props.data.Type === "Episode"
              ? "last-card-banner episode"
              : props.data.Type === "Audio"
              ? "last-card-banner audio"
              : "last-card-banner") + "  d-flex justify-content-center align-items-center"
          }
        >
          {((props.data.ImageBlurHashes && props.data.ImageBlurHashes != null) ||
            (props.data.PrimaryImageHash && props.data.PrimaryImageHash != null)) &&
          !loaded &&
          !fallback ? (
            <Blurhash
              hash={props.data.PrimaryImageHash || props.data.ImageBlurHashes.Primary[props.data.ImageTags.Primary]}
              width={"100%"}
              height={"100%"}
              className="rounded-top-3 overflow-hidden"
            />
          ) : null}

          {!props.data.archived ? (
            fallback ? (
              Id == undefined ? (
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
              ) : (
                <img
                  src={`${baseUrl+"/proxy/Items/Images/Primary?id=" + Id + "&fillHeight=320&fillWidth=213&quality=50"}`}
                  alt=""
                  onLoad={() => setLoaded(true)}
                  style={loaded ? { display: "block" } : { display: "none" }}
                />
              )
            ) : (
              <img
                src={`${baseUrl+
                  "/proxy/Items/Images/Primary?id=" +
                  (props.data.Type === "Episode" ? props.data.EpisodeId : props.data.Id) +
                  (props.data.Type === "Audio"
                    ? "&fillHeight=300&fillWidth=300&quality=50"
                    : "&fillHeight=320&fillWidth=213&quality=50")
                }`}
                alt=""
                onLoad={() => setLoaded(true)}
                onError={() => setFallback(true)}
                style={loaded ? { display: "block" } : { display: "none" }}
              />
            )
          ) : (
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
                <ArchiveDrawerFillIcon className="w-100 h-100 mb-2" />
                <span>
                  <Trans i18nKey="ARCHIVED" />
                </span>
              </div>
            </div>
          )}
          {props.data.Size && <div className="size-tag">{props.data.Size ? formatFileSize(props.data.Size) : ""}</div>}
        </div>
      </Link>

      <div className="last-item-details">
        {props.data.Type === "Season" && (
          <div className="last-last-played">
            {props.data.Episodes} <Trans i18nKey="EPISODES" />
          </div>
        )}
        <div className="last-item-name"> {props.data.Name}</div>

        {props.data.Type === "Episode" ? (
          <div className="last-item-name">
            S{props.data.ParentIndexNumber || 0} - E{props.data.IndexNumber || 0}
          </div>
        ) : (
          <></>
        )}
      </div>
    </div>
  );
}

export default MoreItemCards;
