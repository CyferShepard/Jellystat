/* eslint-disable react/prop-types */
import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import Card from "react-bootstrap/Card";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Container from "react-bootstrap/Container";

import AccountCircleFillIcon from "remixicon-react/AccountCircleFillIcon";
import PlayFillIcon from "remixicon-react/PlayFillIcon";
import PauseFillIcon from "remixicon-react/PauseFillIcon";
import TvLineIcon from "remixicon-react/TvLineIcon";

import { clientData } from "../../../lib/devices";
import Tooltip from "@mui/material/Tooltip";
import IpInfoModal from "../ip-info";
import { Trans } from "react-i18next";
import baseUrl from "../../../lib/baseurl";

function ticksToTimeString(ticks) {
  // Convert ticks to seconds
  const seconds = Math.floor(ticks / 10000000);
  // Calculate hours, minutes, and remaining seconds
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;
  // Format the time string as hh:MM:ss
  const timeString = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${remainingSeconds
    .toString()
    .padStart(2, "0")}`;

  return timeString;
}

function getETA(NowPlayingItem, PlayState) {
  if (NowPlayingItem.ChannelType && NowPlayingItem.ChannelType === "TV") {
    return NowPlayingItem.CurrentProgram.EndDate
      ? new Date(NowPlayingItem.CurrentProgram.EndDate).toLocaleTimeString([], {
          hour: "2-digit",
          minute: "2-digit",
          hour12: JSON.parse(localStorage.getItem("12hr")),
        })
      : "";
  }
  let ticks = NowPlayingItem.RunTimeTicks - PlayState.PositionTicks;
  return getETAFromTicks(ticks);
}

function getETAFromTicks(ticks) {
  // Get current date
  const currentDate = Date.now();

  // Calculate ETA
  const etaMillis = currentDate + ticks / 10000;
  const eta = new Date(etaMillis);
  const twelve_hr = JSON.parse(localStorage.getItem("12hr"));

  // Return formated string in user locale
  return eta.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit", hour12: twelve_hr });
}

function SessionCard(props) {
  const cardStyle = {
    backgroundImage: `url(proxy/Items/Images/Backdrop?id=${
      props.data.session.NowPlayingItem.SeriesId
        ? props.data.session.NowPlayingItem.SeriesId
        : props.data.session.NowPlayingItem.Id
    }&fillHeight=320&fillWidth=213&quality=80), linear-gradient(to right, #00A4DC, #AA5CC3)`,
    height: "100%",
    backgroundSize: "cover",
  };

  const cardBgStyle = {
    backdropFilter: "blur(5px)",
    backgroundColor: "rgb(0, 0, 0, 0.6)",
    height: "100%",
  };

  const ipv4Regex = new RegExp(
    /\b(?!(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168))(?:(?:2(?:[0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9])\.){3}(?:(?:2([0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9]))\b/
  );

  const [ipModalVisible, setIPModalVisible] = React.useState(false);
  const [ipAddressLookup, setIPAddressLookup] = React.useState();

  const isRemoteSession = (ipAddress) => {
    ipv4Regex.lastIndex = 0;
    if (ipv4Regex.test(ipAddress ?? ipAddressLookup)) {
      return true;
    }
    return false;
  };

  function showIPDataModal(ipAddress) {
    ipv4Regex.lastIndex = 0;
    setIPAddressLookup(ipAddress);
    if (!isRemoteSession) {
      return;
    }

    setIPModalVisible(true);
  }

  return (
    <Card className="session-card" style={cardStyle}>
      <div className="card-device-image-overlay">
        <img
          className="card-device-image"
          src={
            baseUrl +
            "/proxy/web/assets/img/devices/?devicename=" +
            (props.data.session.Client.toLowerCase() === "jellyfin ios"
              ? "apple"
              : props.data.session.Client.toLowerCase().includes("web")
              ? clientData.find((item) => props.data.session.DeviceName.toLowerCase().includes(item)) || "other"
              : clientData.find((item) => props.data.session.Client.toLowerCase().includes(item)) || "other")
          }
          alt=""
        />
      </div>
      <IpInfoModal show={ipModalVisible} onHide={() => setIPModalVisible(false)} ipAddress={ipAddressLookup} />
      <div style={cardBgStyle} className="rounded-top">
        <Row className="h-100 p-0 m-0">
          <Col className="d-none d-lg-block session-card-banner-image">
            <Card.Img
              variant="top"
              className={
                props.data.session.NowPlayingItem.Type === "Audio"
                  ? "stat-card-image-audio rounded-0 rounded-start"
                  : "session-card-item-image"
              }
              src={
                baseUrl +
                "/proxy/Items/Images/Primary?id=" +
                (props.data.session.NowPlayingItem.SeriesId
                  ? props.data.session.NowPlayingItem.SeriesId
                  : props.data.session.NowPlayingItem.Id) +
                "&fillHeight=320&fillWidth=213&quality=50"
              }
            />
          </Col>
          <Col className="w-100 h-100 m-0 px-0">
            <Card.Body className="w-100 h-100 p-1 pb-2">
              <Container className="h-100 d-flex flex-column justify-content-between g-0">
                <Row className="mt-2 d-flex justify-content-start session-details" style={{ fontSize: "0.7em" }}>
                  <Col className="col-auto">
                    <Row>
                      <Col className="col-auto session-details-title text-end text-uppercase">
                        <Trans i18nKey="ACTIVITY_TABLE.DEVICE" />
                      </Col>
                      <Col
                        className="col-auto ellipse"
                        style={{
                          maxWidth: "200px",
                        }}
                      >
                        <Tooltip title={props.data.session.DeviceName}>
                          <span
                            style={{
                              display: "-webkit-box",
                              WebkitBoxOrient: "vertical",
                              WebkitLineClamp: 1,
                            }}
                          >
                            {props.data.session.DeviceName}
                          </span>
                        </Tooltip>
                      </Col>
                    </Row>
                    <Row>
                      <Col className="col-auto session-details-title text-end text-uppercase">
                        <Trans i18nKey="ACTIVITY_TABLE.CLIENT" />
                      </Col>
                      <Col
                        className="col-auto ellipse"
                        style={{
                          maxWidth: "200px",
                        }}
                      >
                        <Tooltip title={props.data.session.Client + " " + props.data.session.ApplicationVersion}>
                          <span
                            style={{
                              display: "-webkit-box",
                              WebkitBoxOrient: "vertical",
                              WebkitLineClamp: 1,
                            }}
                          >
                            {props.data.session.Client + " " + props.data.session.ApplicationVersion}
                          </span>
                        </Tooltip>
                      </Col>
                    </Row>
                    {props.data.session.NowPlayingItem.ContainerStream !== "" && (
                      <Row className="mt-2">
                        <Col className="col-auto session-details-title text-end text-uppercase">
                          <Trans i18nKey="CONTAINER" />
                        </Col>
                        <Col
                          className="col-auto ellipse"
                          style={{
                            maxWidth: "270px",
                          }}
                        >
                          <Tooltip title={props.data.session.NowPlayingItem.ContainerStream}>
                            <span
                              style={{
                                display: "-webkit-box",
                                WebkitBoxOrient: "vertical",
                                WebkitLineClamp: 1,
                              }}
                            >
                              {props.data.session.NowPlayingItem.ContainerStream}
                            </span>
                          </Tooltip>
                        </Col>
                      </Row>
                    )}
                    {props.data.session.NowPlayingItem.VideoStream !== "" && (
                      <Row>
                        <Col className="col-auto session-details-title text-end text-uppercase">
                          <Trans i18nKey="VIDEO" />
                        </Col>
                        <Col
                          className="col-auto ellipse"
                          style={{
                            maxWidth: "270px",
                          }}
                        >
                          <Tooltip title={props.data.session.NowPlayingItem.VideoStream}>
                            <span
                              style={{
                                display: "-webkit-box",
                                WebkitBoxOrient: "vertical",
                                WebkitLineClamp: 1,
                              }}
                            >
                              {props.data.session.NowPlayingItem.VideoStream}
                            </span>
                          </Tooltip>
                        </Col>
                      </Row>
                    )}
                    {props.data.session.NowPlayingItem.VideoBitrateStream !== "" && (
                      <Row>
                        <Col className="col-auto session-details-title text-end text-uppercase" />
                        <Col
                          className="col-auto ellipse"
                          style={{
                            maxWidth: "270px",
                          }}
                        >
                          <Tooltip title={props.data.session.NowPlayingItem.VideoBitrateStream}>
                            <span
                              style={{
                                display: "-webkit-box",
                                WebkitBoxOrient: "vertical",
                                WebkitLineClamp: 1,
                              }}
                            >
                              {props.data.session.NowPlayingItem.VideoBitrateStream}
                            </span>
                          </Tooltip>
                        </Col>
                      </Row>
                    )}
                    {props.data.session.NowPlayingItem.AudioStream !== "" && (
                      <Row>
                        <Col className="col-auto session-details-title text-end text-uppercase">
                          <Trans i18nKey="AUDIO" />
                        </Col>
                        <Col
                          className="col-auto ellipse"
                          style={{
                            maxWidth: "270px",
                          }}
                        >
                          <Tooltip title={props.data.session.NowPlayingItem.AudioStream}>
                            <span
                              style={{
                                display: "-webkit-box",
                                WebkitBoxOrient: "vertical",
                                WebkitLineClamp: 1,
                              }}
                            >
                              {props.data.session.NowPlayingItem.AudioStream}
                            </span>
                          </Tooltip>
                        </Col>
                      </Row>
                    )}
                    {props.data.session.NowPlayingItem.AudioBitrateStream !== "" && (
                      <Row>
                        <Col className="col-auto session-details-title text-end text-uppercase" />
                        <Col
                          className="col-auto ellipse"
                          style={{
                            maxWidth: "270px",
                          }}
                        >
                          <Tooltip title={props.data.session.NowPlayingItem.AudioBitrateStream}>
                            <span
                              style={{
                                display: "-webkit-box",
                                WebkitBoxOrient: "vertical",
                                WebkitLineClamp: 1,
                              }}
                            >
                              {props.data.session.NowPlayingItem.AudioBitrateStream}
                            </span>
                          </Tooltip>
                        </Col>
                      </Row>
                    )}
                    {props.data.session.NowPlayingItem.SubtitleStream !== "" && (
                      <Row>
                        <Col className="col-auto session-details-title text-end text-uppercase">
                          <Trans i18nKey="SUBTITLES" />
                        </Col>
                        <Col
                          className="col-auto ellipse"
                          style={{
                            maxWidth: "270px",
                          }}
                        >
                          <Tooltip title={props.data.session.NowPlayingItem.SubtitleStream}>
                            <span
                              style={{
                                display: "-webkit-box",
                                WebkitBoxOrient: "vertical",
                                WebkitLineClamp: 1,
                              }}
                            >
                              {props.data.session.NowPlayingItem.SubtitleStream}
                            </span>
                          </Tooltip>
                        </Col>
                      </Row>
                    )}

                    <Row className="mt-2">
                      <Col className="col-auto session-details-title text-end text-uppercase">
                        <Trans i18nKey="ACTIVITY_TABLE.IP_ADDRESS" />
                      </Col>
                      <Col
                        className="col-auto ellipse"
                        style={{
                          maxWidth: "270px",
                        }}
                      >
                        {isRemoteSession(props.data.session.RemoteEndPoint) &&
                        (window.env.JS_GEOLITE_ACCOUNT_ID ?? import.meta.env.JS_GEOLITE_ACCOUNT_ID) ? (
                          <Link
                            className="text-decoration-none text-white"
                            onClick={() => showIPDataModal(props.data.session.RemoteEndPoint)}
                          >
                            {props.data.session.RemoteEndPoint}
                          </Link>
                        ) : (
                          <span>{props.data.session.RemoteEndPoint}</span>
                        )}
                      </Col>
                    </Row>

                    <Row>
                      <Col className="col-auto session-details-title text-end text-uppercase">ETA</Col>
                      <Col className="col-auto ellipse">
                        {props.data.session.NowPlayingItem.RunTimeTicks ||
                        props.data.session.NowPlayingItem.ChannelType === "TV" ? (
                          getETA(props.data.session.NowPlayingItem, props.data.session.PlayState)
                        ) : (
                          <Trans i18nKey="ERROR_MESSAGES.N/A" />
                        )}
                      </Col>
                    </Row>
                  </Col>
                </Row>

                <Row className="p-0 m-0">
                  <Col>
                    <Card.Text className="text-end">
                      <Tooltip
                        title={`Ends at ${
                          props.data.session.NowPlayingItem.RunTimeTicks ||
                          props.data.session.NowPlayingItem.ChannelType === "TV" ? (
                            getETA(props.data.session.NowPlayingItem, props.data.session.PlayState)
                          ) : (
                            <Trans i18nKey="ERROR_MESSAGES.N/A" />
                          )
                        }`}
                      >
                        <span>
                          {ticksToTimeString(props.data.session.PlayState.PositionTicks)}
                          {props.data.session.NowPlayingItem.RunTimeTicks
                            ? "/" + ticksToTimeString(props.data.session.NowPlayingItem.RunTimeTicks)
                            : ""}
                        </span>
                      </Tooltip>
                    </Card.Text>
                  </Col>
                </Row>
              </Container>
            </Card.Body>
          </Col>
        </Row>
        <Row>
          <Col>
            <div className="progress-bar">
              <div
                className="progress-custom"
                style={{
                  width: `${
                    (props.data.session.PlayState.PositionTicks / props.data.session.NowPlayingItem.RunTimeTicks) * 100
                  }%`,
                }}
              ></div>
            </div>
          </Col>
        </Row>
        <Row className="p-0 m-0 mt-1">
          <Col
            className="col-1 p-0"
            style={{
              maxWidth: "20px",
              marginRight: "10px",
            }}
          >
            <Row>{props.data.session.PlayState.IsPaused ? <PauseFillIcon /> : <PlayFillIcon />}</Row>
            {props.data.session.NowPlayingItem.Type === "Episode" && (
              <Row>
                <TvLineIcon color="white" />
              </Row>
            )}
          </Col>
          <Col className="col-7 p-0">
            {props.data.session.NowPlayingItem.Type === "Episode" ? (
              <Row className="d-flex flex-row justify-content-start p-0">
                <Card.Text>
                  <Link to={`/libraries/item/${props.data.session.NowPlayingItem.Id}`} target="_blank" className="item-name">
                    {props.data.session.NowPlayingItem.SeriesName
                      ? props.data.session.NowPlayingItem.SeriesName + " - " + props.data.session.NowPlayingItem.Name
                      : props.data.session.NowPlayingItem.Name}
                  </Link>
                </Card.Text>
              </Row>
            ) : props.data.session.NowPlayingItem.Type === "Audio" && props.data.session.NowPlayingItem.Artists.length > 0 ? (
              <Col className="col-auto p-0">
                <Card.Text>{props.data.session.NowPlayingItem.Artists[0]}</Card.Text>
              </Col>
            ) : (
              <></>
            )}
            <Row className="d-flex flex-row justify-content-start p-0">
              {props.data.session.NowPlayingItem.Type === "Episode" ? (
                <Card.Text>
                  {"S" +
                    props.data.session.NowPlayingItem.ParentIndexNumber +
                    " - E" +
                    props.data.session.NowPlayingItem.IndexNumber}
                </Card.Text>
              ) : (
                <Card.Text>
                  <Link to={`/libraries/item/${props.data.session.NowPlayingItem.Id}`} target="_blank" className="item-name">
                    {props.data.session.NowPlayingItem.SeriesName
                      ? props.data.session.NowPlayingItem.SeriesName + " - " + props.data.session.NowPlayingItem.Name
                      : props.data.session.NowPlayingItem.Name}
                  </Link>
                </Card.Text>
              )}
            </Row>
          </Col>
          <Col className="d-flex justify-content-end text-end me-0 pe-0">
            <Card.Text>
              <Tooltip title={props.data.session.UserName}>
                <Link to={`/users/${props.data.session.UserId}`} className="item-name" style={{ maxWidth: "15ch" }}>
                  {props.data.session.UserName}
                </Link>
              </Tooltip>
            </Card.Text>
            {props.data.session.UserPrimaryImageTag !== undefined ? (
              <img
                className="session-card-user-image"
                src={baseUrl + "/proxy/Users/Images/Primary?id=" + props.data.session.UserId + "&quality=50"}
                alt=""
              />
            ) : (
              <AccountCircleFillIcon className="session-card-user-image" />
            )}
          </Col>
        </Row>
      </div>
    </Card>
  );
}

export default SessionCard;
