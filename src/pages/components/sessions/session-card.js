import React from "react";
import { Link } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';

import AccountCircleFillIcon from "remixicon-react/AccountCircleFillIcon";
import PlayFillIcon from "remixicon-react/PlayFillIcon";
import PauseFillIcon from "remixicon-react/PauseFillIcon";

import { clientData } from "../../../lib/devices";


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
function convertBitrate(bitrate) {
  if(!bitrate)
  {
    return 'N/A';
  }
  const kbps = (bitrate / 1000).toFixed(1);
  const mbps = (bitrate / 1000000).toFixed(1);

  if (kbps >= 1000) {
    return  mbps+' Mbps';
  } else {
    return  kbps+' Kbps';
  }
}

function sessionCard(props) {
  // Access data passed in as a prop using `props.data`

  const cardStyle = {
    backgroundImage: `url(Proxy/Items/Images/Backdrop?id=${(props.data.session.NowPlayingItem.SeriesId ? props.data.session.NowPlayingItem.SeriesId : props.data.session.NowPlayingItem.Id)}&fillHeight=320&fillWidth=213&quality=80), linear-gradient(to right, #00A4DC, #AA5CC3)`,
    height:'100%',
    backgroundSize: 'cover',
  };

  const cardBgStyle = {
    backdropFilter: 'blur(5px)',
    backgroundColor: 'rgb(0, 0, 0, 0.6)',
    height:'100%',
  };

  
  return (
    <Card className="stat-card" style={cardStyle}>
    <div style={cardBgStyle}>
      <Row className="h-100">
        <Col className="stat-card-banner">
              <Card.Img
                variant="top"
                className="stat-card-image rounded-0"
                src={"/Proxy/Items/Images/Primary?id=" + (props.data.session.NowPlayingItem.SeriesId ? props.data.session.NowPlayingItem.SeriesId : props.data.session.NowPlayingItem.Id) + "&fillHeight=320&fillWidth=213&quality=50"}
              />


        </Col>
        <Col  className="w-100 mt-auto ">

          <Card.Body  className="w-100 pb-2" >
            <Container className="p-0">
              <Row className="position-absolute top-0">
                  <Col className="col-auto d-flex justify-content-center">
                  <img
                   className="card-device-image"
                   src={
                  "/proxy/web/assets/img/devices/?devicename=" 
                  +
                  (props.data.session.Client.toLowerCase().includes("web") ? 
                  ( clientData.find(item => props.data.session.DeviceName.toLowerCase().includes(item)).replace('ios','apple') || "other")
                  :
                  ( clientData.find(item => props.data.session.Client.toLowerCase().includes(item)).replace('ios','apple') || "other")
                  )}
                  alt=""
                   />
                  </Col>
                 
                  <Col>
                    <Row> {props.data.session.DeviceName}</Row>
                    <Row>    {props.data.session.Client + " " + props.data.session.ApplicationVersion}</Row>
                    <Row>    {props.data.session.PlayState.PlayMethod+' '+ (props.data.session.NowPlayingItem.MediaStreams ? '( '+props.data.session.NowPlayingItem.MediaStreams.find(stream => stream.Level>0)?.Codec.toUpperCase()+(props.data.session.TranscodingInfo? ' - '+props.data.session.TranscodingInfo.VideoCodec.toUpperCase() : '')+' - '+convertBitrate(props.data.session.TranscodingInfo ? props.data.session.TranscodingInfo.Bitrate :props.data.session.NowPlayingItem.MediaStreams.find(stream => stream.Level>0)?.BitRate)+' )':'')}</Row>
                    
                  </Col>
              </Row>

              <Row className="justify-content-between">
                <Col>
                   <Card.Text>
                   <Link to={`/libraries/item/${props.data.session.NowPlayingItem.Id}`} target="_blank">
                     {props.data.session.NowPlayingItem.SeriesName ? (props.data.session.NowPlayingItem.SeriesName+" - "+ props.data.session.NowPlayingItem.Name) : (props.data.session.NowPlayingItem.Name)}
                   </Link> 
                   </Card.Text>
                </Col>


                <Col className="col-auto">
                   <Row className="d-flex">
                      <Col className="col-auto px-0">
                        {props.data.session.UserPrimaryImageTag !== undefined ? (
                          <img
                            className="card-user-image"
                            src={
                              "/Proxy/Users/Images/Primary?id=" +
                              props.data.session.UserId +
                              "&quality=50"
                            }
                            alt=""
                          />
                        ) : (
                          <AccountCircleFillIcon />
                        )}
                      </Col>

                      <Col className="col-auto">
                       <Card.Text className="text-end">
                           <Link to={`/users/${props.data.session.UserId}`}>{props.data.session.UserName}</Link> 
                       </Card.Text>
                      </Col>
           
                      </Row>
                </Col>
              </Row>

              {props.data.session.NowPlayingItem.Type==='Episode' ? 
                
                <Row>

                <Col className="col-auto">
                         <Card.Text className="text-end">
                            {'S'+props.data.session.NowPlayingItem.ParentIndexNumber +' - E'+ props.data.session.NowPlayingItem.IndexNumber}
                         </Card.Text>
                        </Col>
                </Row>
                :
                <></>
              
              }

              <Row className="d-flex">
                <Col className="col-auto">

                  {props.data.session.PlayState.IsPaused ?
                     <PauseFillIcon /> 
                      : 
                     <PlayFillIcon />
                    }

                </Col>

                <Col>
                <Card.Text className="text-end">
                    {ticksToTimeString(props.data.session.PlayState.PositionTicks)} /
                    {ticksToTimeString(props.data.session.NowPlayingItem.RunTimeTicks)}
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
              (props.data.session.PlayState.PositionTicks /
                props.data.session.NowPlayingItem.RunTimeTicks) *
              100
            }%`,
          }}
        ></div>
      </div>
      </Col>
      </Row>
  </div>
</Card>
  );
}

export default sessionCard;
