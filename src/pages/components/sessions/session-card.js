import React, {useState} from "react";
import { Link } from 'react-router-dom';
import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Container from 'react-bootstrap/Container';

import AccountCircleFillIcon from "remixicon-react/AccountCircleFillIcon";
import PlayFillIcon from "remixicon-react/PlayFillIcon";
import PauseFillIcon from "remixicon-react/PauseFillIcon";

import { clientData } from "../../../lib/devices";
import  Tooltip  from "@mui/material/Tooltip";
import IpInfoModal from '../ip-info';

import axios from 'axios';

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

function getETAFromTicks(ticks) {

  // Get current date
  const currentDate = Date.now();

  // Calculate ETA
  const etaMillis = currentDate + ticks/10000;
  const eta = new Date(etaMillis);

  // Return formated string in user locale
  return eta.toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'});
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

function SessionCard(props) {
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

  const token = localStorage.getItem('token');

  const [modalVisible, setModalVisible] = useState(false);
  const [modalData, setModalData] = useState();

  function showModal() {
    const fetchData = async () => {
      const result = await axios.post(`/utils/geolocateIp`, {
          ipAddress: props.data.session.RemoteEndPoint
      }, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          }
      });
      setModalData(result.data);
    };

    if(!modalData) {
      fetchData();
    }

    setModalVisible(true);
  }

  function hideModal() {
    setModalVisible(false);
  }
  
  return (
    <Card className="stat-card" style={cardStyle}>
      <IpInfoModal
        show={modalVisible}
        onHide={hideModal}
        ipAddress={props.data.session.RemoteEndPoint}
        geodata={modalData}/>
    <div style={cardBgStyle} className="rounded-top">
      <Row className="h-100">
        <Col className="d-none d-lg-block stat-card-banner">
              <Card.Img
                variant="top"
                className="stat-card-image rounded-0 rounded-start"
                src={"/Proxy/Items/Images/Primary?id=" + (props.data.session.NowPlayingItem.SeriesId ? props.data.session.NowPlayingItem.SeriesId : props.data.session.NowPlayingItem.Id) + "&fillHeight=320&fillWidth=213&quality=50"}
              />


        </Col>
        <Col  className="w-100 h-100">

          <Card.Body  className="w-100 h-100 p-1 pb-2" >
            <Container className="h-100 d-flex flex-column">
              <Row className="d-flex justify-content-end" style={{fontSize: "smaller"}}>

                  <Col className="col-10">
                    <Row className="ellipse"> {props.data.session.DeviceName}</Row>
                    <Row className="ellipse card-client-version"> {props.data.session.Client + " " + props.data.session.ApplicationVersion}</Row>
                    <Row className="d-flex flex-column flex-md-row">    
                      <Col className="px-0 col-auto ellipse">{props.data.session.PlayState.PlayMethod}</Col> 
                      <Col className="px-0 px-md-2 col-auto ellipse">{(props.data.session.NowPlayingItem.MediaStreams ? '( '+props.data.session.NowPlayingItem.MediaStreams.find(stream => stream.Type==='Video')?.Codec.toUpperCase()+(props.data.session.TranscodingInfo? ' - '+props.data.session.TranscodingInfo.VideoCodec.toUpperCase() : '')+' - '+convertBitrate(props.data.session.TranscodingInfo ? props.data.session.TranscodingInfo.Bitrate :props.data.session.NowPlayingItem.MediaStreams.find(stream => stream.Type==='Video')?.BitRate)+' )':'')}</Col>                      
                      <Col className="px-0 col-auto ellipse">
                        <Tooltip title={props.data.session.NowPlayingItem.SubtitleStream}>
                          <span>
                            {props.data.session.NowPlayingItem.SubtitleStream}
                          </span>
                        </Tooltip>
                      </Col>                      
                    </Row>
                    <Row>
                      <Col className="px-0 col-auto ellipse">
                        <Card.Text>IP Address: <Link onClick={showModal}>{props.data.session.RemoteEndPoint}</Link></Card.Text>
                      </Col>
                    </Row>
                  </Col>


                  <Col className="col-2 d-flex justify-content-center">
                    <img
                     className="card-device-image"
                     src={
                    "/proxy/web/assets/img/devices/?devicename=" 
                    +
                    (props.data.session.Client.toLowerCase().includes("web") ? 
                    ( clientData.find(item => props.data.session.DeviceName.toLowerCase().includes(item)) || "other")
                    :
                    ( clientData.find(item => props.data.session.Client.toLowerCase().includes(item)) || "other")
                    )}
                    alt=""
                     />
                  </Col>
                 
              </Row>

              {props.data.session.NowPlayingItem.Type==='Episode' ? 
                <Row className="d-flex flex-row justify-content-between">
                  <Col className="p-0">
                     <Card.Text>
                     <Link to={`/libraries/item/${props.data.session.NowPlayingItem.Id}`} target="_blank"  className="item-name"> 
                       {props.data.session.NowPlayingItem.SeriesName ? (props.data.session.NowPlayingItem.SeriesName+" - "+ props.data.session.NowPlayingItem.Name) : (props.data.session.NowPlayingItem.Name)}
                     </Link> 
                     </Card.Text>
                  </Col>
                </Row>
                :
                <></>
              }

             
                
                <Row className="d-flex flex-row justify-content-between">
                    {props.data.session.NowPlayingItem.Type==='Episode' ? 
                      <Col className="col-auto p-0">
                               <Card.Text >
                                  {'S'+props.data.session.NowPlayingItem.ParentIndexNumber +' - E'+ props.data.session.NowPlayingItem.IndexNumber}
                               </Card.Text>
                      </Col>

                    :
                      <Col className="p-0">
                          <Card.Text>
                          <Link to={`/libraries/item/${props.data.session.NowPlayingItem.Id}`} target="_blank"  className="item-name"> 
                            {props.data.session.NowPlayingItem.SeriesName ? (props.data.session.NowPlayingItem.SeriesName+" - "+ props.data.session.NowPlayingItem.Name) : (props.data.session.NowPlayingItem.Name)}
                          </Link> 
                          </Card.Text>
                      </Col>
                    }

                <Col className="d-flex flex-row justify-content-end text-end col-auto">

                {props.data.session.UserPrimaryImageTag !== undefined ? (
                    <img
                      className="session-card-user-image"
                      src={
                        "/Proxy/Users/Images/Primary?id=" +
                        props.data.session.UserId +
                        "&quality=50"
                      }
                      alt=""
                    />
                  ) : (
                    <AccountCircleFillIcon  className="session-card-user-image"/>
                  )}
                 <Card.Text >
                    <Tooltip title={props.data.session.UserName} >
                       <Link to={`/users/${props.data.session.UserId}`} className="item-name" style={{maxWidth:'15ch'}}>{props.data.session.UserName}</Link> 
                    </Tooltip>
                 </Card.Text>
                  
                </Col>

              </Row>

              <Row className="d-flex">
                <Col className="col-auto p-0">

                  {props.data.session.PlayState.IsPaused ?
                     <PauseFillIcon /> 
                      : 
                     <PlayFillIcon />
                    }

                </Col>

                <Col>
               
                <Card.Text className="text-end">
                  <Tooltip title={`Ends at ${getETAFromTicks(props.data.session.NowPlayingItem.RunTimeTicks - props.data.session.PlayState.PositionTicks)}`}>
                    <span> 
                      {ticksToTimeString(props.data.session.PlayState.PositionTicks)} /
                      {ticksToTimeString(props.data.session.NowPlayingItem.RunTimeTicks)} 
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

export default SessionCard;
