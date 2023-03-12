import React from "react";

import AccountCircleFillIcon from "remixicon-react/AccountCircleFillIcon";
import PlayFillIcon from "remixicon-react/PlayFillIcon";
import PauseFillIcon from "remixicon-react/PauseFillIcon";

function ticksToTimeString(ticks) {
  // Convert ticks to seconds
  const seconds = Math.floor(ticks / 10000000);

  // Calculate hours, minutes, and remaining seconds
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  // Format the time string as hh:MM:ss
  const timeString = `${hours.toString().padStart(2, "0")}:${minutes
    .toString()
    .padStart(2, "0")}:${remainingSeconds.toString().padStart(2, "0")}`;

  return timeString;
}

function sessionCard(props) {
  // Access data passed in as a prop using `props.data`

  if (props.data.session.NowPlayingItem === undefined) {
    return (
      <div key={props.data.session.Id} className="session-card">
        <div className="card-banner"></div>

        <div className="card-details">
          <div className="card-device">
            <img
              className="card-device-image"
              src={
                props.data.base_url +
                "/web/assets/img/devices/" +
                (props.data.session.DeviceName.toLowerCase().includes("ios") ||
                props.data.session.Client.toLowerCase().includes("ios")
                  ? "ios"
                  : props.data.session.DeviceName.toLowerCase().includes(
                      "android"
                    ) ||
                    props.data.session.Client.toLowerCase().includes("android")
                  ? "android"
                  : props.data.session.DeviceName.replace(
                      " ",
                      ""
                    ).toLowerCase()) +
                ".svg"
              }
              alt=""
            ></img>
            <div className="card-device-name">
              {" "}
              {props.data.session.DeviceName}
            </div>
            <div className="card-client">
              {props.data.session.Client +
                " " +
                props.data.session.ApplicationVersion}
            </div>
          </div>

          <div className="card-user">
            {props.data.session.UserPrimaryImageTag !== undefined ? (
              <img
                className="card-user-image"
                src={
                  props.data.base_url +
                  "/Users/" +
                  props.data.session.UserId +
                  "/Images/Primary?tag=" +
                  props.data.session.UserPrimaryImageTag +
                  "&quality=50"
                }
                alt=""
              />
            ) : (
              <AccountCircleFillIcon />
            )}
            <div className="card-username"> {props.data.session.UserName}</div>
          </div>

          <div className="card-play-state"></div>
          <div className="card-item-name"> </div>

          <div className="card-playback-position"> </div>
        </div>

        <div className="progress-bar">
          <div className="progress" style={{ width: `0%` }}></div>
        </div>
      </div>
    );
  }

  return (
    <div
      key={props.data.session.Id}
      className="session-card"
      style={{
        backgroundImage: `url(${
          props.data.base_url +
          "/Items/" +
          (props.data.session.NowPlayingItem.SeriesId
            ? props.data.session.NowPlayingItem.SeriesId
            : props.data.session.NowPlayingItem.Id) +
          "/Images/Backdrop/0?maxWidth=1000&tag=" +
          (props.data.session.NowPlayingItem.SeriesId
            ? props.data.session.NowPlayingItem.ParentBackdropImageTags[0]
            : props.data.session.NowPlayingItem.BackdropImageTags[0]) +
          "&quality=50"
        })`,
      }}
    >
      <div className="card-banner">
        <img
          className="card-banner-image"
          src={
            props.data.base_url +
              "/Items/" +
              (props.data.session.NowPlayingItem.SeriesId
                ? props.data.session.NowPlayingItem.SeriesId
                : props.data.session.NowPlayingItem.Id) +
              "/Images/Primary?quality=50&tag=" +
              props.data.session.NowPlayingItem.SeriesPrimaryImageTag ||
            props.data.session.NowPlayingItem.ImageTags.Primary
          }
          alt=""
        ></img>
      </div>

      <div className="card-details">
        <div className="card-device">
          <img
            className="card-device-image"
            src={
              props.data.base_url +
              "/web/assets/img/devices/" +
              (props.data.session.DeviceName.toLowerCase().includes("ios") ||
              props.data.session.Client.toLowerCase().includes("ios")
                ? "ios"
                : props.data.session.DeviceName.toLowerCase().includes(
                    "android"
                  ) ||
                  props.data.session.Client.toLowerCase().includes("android")
                ? "android"
                : props.data.session.DeviceName.replace(
                    " ",
                    ""
                  ).toLowerCase()) +
              ".svg"
            }
            alt=""
          ></img>
          <div className="card-device-name">
            {" "}
            {props.data.session.DeviceName}
          </div>
          <div className="card-client">
            {props.data.session.Client +
              " " +
              props.data.session.ApplicationVersion}
          </div>
        </div>

        <div className="card-user">
          {props.data.session.UserPrimaryImageTag !== undefined ? (
            <img
              className="card-user-image"
              src={
                props.data.base_url +
                "/Users/" +
                props.data.session.UserId +
                "/Images/Primary?tag=" +
                props.data.session.UserPrimaryImageTag +
                "&quality=50"
              }
              alt=""
            />
          ) : (
            <AccountCircleFillIcon />
          )}
          <div className="card-username"> {props.data.session.UserName}</div>
        </div>

        <div className="card-play-state">
          {props.data.session.PlayState.IsPaused ? (
            <PauseFillIcon />
          ) : (
            <PlayFillIcon />
          )}
        </div>
        <div className="card-item-name">
          {" "}
          {props.data.session.NowPlayingItem.Name}
        </div>

        <div className="card-playback-position">
          {" "}
          {ticksToTimeString(props.data.session.PlayState.PositionTicks)} /{" "}
          {ticksToTimeString(props.data.session.NowPlayingItem.RunTimeTicks)}
        </div>
      </div>

      <div className="progress-bar">
        <div
          className="progress"
          style={{
            width: `${
              (props.data.session.PlayState.PositionTicks /
                props.data.session.NowPlayingItem.RunTimeTicks) *
              100
            }%`,
          }}
        ></div>
      </div>
    </div>
  );
}

export default sessionCard;
