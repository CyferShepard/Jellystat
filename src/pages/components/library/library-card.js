import React from "react";
import { Link } from "react-router-dom";
import "../../css/library/library-card.css";

import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

function LibraryCard(props) {

  function formatTotalWatchTime(seconds) {
    const hours = Math.floor(seconds / 3600); // 1 hour = 3600 seconds
    const minutes = Math.floor((seconds % 3600) / 60); // 1 minute = 60 seconds
    let formattedTime='';
    if(hours)
    {
      formattedTime+=`${hours} hours`;
    }
    if(minutes)
    {
      formattedTime+=` ${minutes} minutes`;
    }
    if(!hours && !minutes)
    {
      formattedTime=`0 minutes`;
    }
  
    return formattedTime ;
  }

  function formatLastActivityTime(time) {
    const units = {
      days: ['Day', 'Days'],
      hours: ['Hour', 'Hours'],
      minutes: ['Minute', 'Minutes']
    };
  
    let formattedTime = '';
  
    for (const unit in units) {
      if (time[unit]) {
        const unitName = units[unit][time[unit] > 1 ? 1 : 0];
        formattedTime += `${time[unit]} ${unitName} `;
      }
    }
  
    return `${formattedTime}ago`;
  }
  return (
      <Card className="bg-transparent lib-card border-0">
          <Link to={`/libraries/${props.data.Id}`}>
            <div className="library-card-image">
              <Card.Img
                  variant="top"
                  className="library-card-banner"
                  src={props.base_url + "/Items/" + props.data.Id + "/Images/Primary/?fillWidth=800&quality=50"}
              />
            </div>
          </Link>

       <Link to={`/libraries/${props.data.Id}`}>
            <div
              className="library-card-banner"
              style={{
                backgroundImage: `url(${
                  props.base_url +
                  "/Items/" +
                  props.data.Id +
                  "/Images/Primary/?fillWidth=400&quality=90"
                })`,
              }}
            />
      </Link>

          <Card.Body className="library-card-details">
            <Row className="space-between-end card-row">
              <Col className="card-label">Library</Col>
              <Col className="text-end">{props.data.Name}</Col>
            </Row>

            <Row className="space-between-end card-row">
              <Col className="card-label">Type</Col>
              <Col className="text-end">{props.data.CollectionType==='tvshows' ? 'Series' : "Movies"}</Col>
            </Row>

            <Row className="space-between-end card-row">
              <Col className="card-label">Total Plays</Col>
              <Col className="text-end">{props.data.Plays}</Col>
            </Row>

            <Row className="space-between-end card-row">
              <Col className="card-label">Total Playback</Col>
              <Col className="text-end">{formatTotalWatchTime(props.data.total_playback_duration)}</Col>
            </Row>

            <Row className="space-between-end card-row">
              <Col className="card-label">Last Played</Col>
              <Col className="text-end">{props.data.ItemName ? props.data.ItemName : 'n/a'}</Col>
            </Row>

            <Row className="space-between-end card-row">
              <Col className="card-label">Last Activity</Col>
              <Col className="text-end">{props.data.LastActivity ? formatLastActivityTime(props.data.LastActivity) : 'never'}</Col>
            </Row>

            <Row className="space-between-end card-row">
              <Col className="card-label">{props.data.CollectionType==='tvshows' ? 'Series' : "Movies"}</Col>
              <Col className="text-end">{props.data.Library_Count}</Col>
            </Row>

            <Row className="space-between-end card-row" style={{opacity:props.data.CollectionType==='tvshows' ? '1' :'0'}}>
              <Col className="card-label">Seasons</Col>
              <Col className="text-end">{props.data.CollectionType==='tvshows' ? props.data.Season_Count : ''}</Col>
            </Row>

            <Row className="space-between-end card-row" style={{opacity:props.data.CollectionType==='tvshows' ? '1' :'0'}}>
              <Col className="card-label">Episodes</Col>
              <Col className="text-end">{props.data.CollectionType==='tvshows' ? props.data.Episode_Count : ''}</Col>
            </Row>
          </Card.Body>

      </Card>
  );
}

export default LibraryCard;
