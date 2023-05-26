import React from "react";
import { Link } from "react-router-dom";
import "../../css/library/library-card.css";

import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

function LibraryCard(props) {

  function formatFileSize(sizeInBytes) {
    const sizeInKB = sizeInBytes / 1024; // 1 KB = 1024 bytes
    if (sizeInKB < 1024) {
      return `${sizeInKB.toFixed(2)} KB`;
    } else {
      const sizeInMB = sizeInKB / 1024; // 1 MB = 1024 KB
      if (sizeInMB < 1024) {
        return `${sizeInMB.toFixed(2)} MB`;
      } else {
        const sizeInGB = sizeInMB / 1024; // 1 GB = 1024 MB
        if (sizeInGB < 1024) {
          return `${sizeInGB.toFixed(2)} GB`;
        } else {
          const sizeInTB = sizeInGB / 1024; // 1 TB = 1024 GB
          if (sizeInTB < 1024) {
            return `${sizeInTB.toFixed(2)} TB`;
          } else {
            const sizeInPB = sizeInTB / 1024; // 1 PB = 1024 TB
            return `${sizeInPB.toFixed(2)} PB`;
          }
        }
      }
    }
  }
  


  function formatTotalWatchTime(seconds) {
    const days = Math.floor(seconds / 86400); // 1 day = 86400 seconds
    const hours = Math.floor((seconds % 86400) / 3600); // 1 hour = 3600 seconds
    const minutes = Math.floor(((seconds % 86400) % 3600) / 60); // 1 minute = 60 seconds
    
    let formattedTime = '';
    if (days) {
      formattedTime += `${days} day${days > 1 ? 's' : ''}`;
    }
    
    if (hours) {
      formattedTime += ` ${hours} hour${hours > 1 ? 's' : ''}`;
    }
    
    if (minutes) {
      formattedTime += ` ${minutes} minute${minutes > 1 ? 's' : ''}`;
    }
    
    if (!days && !hours && !minutes) {
      formattedTime = '0 minutes';
    }
    
    return formattedTime;
    
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
      <Card className="bg-transparent lib-card rounded-3">
          <Link to={`/libraries/${props.data.Id}`}>
            <div className="library-card-image">
              <Card.Img
                  variant="top"
                  className="library-card-banner"
                  src={"/proxy/Items/Images/Primary?id=" + props.data.Id + "&fillWidth=800&quality=50"}
              />
            </div>
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
              <Col className="card-label">Total Files</Col>
              <Col className="text-end">{props.metadata.files}</Col>
            </Row>

            <Row className="space-between-end card-row">
              <Col className="card-label">Library Size</Col>
              <Col className="text-end">{formatFileSize(props.metadata.Size)}</Col>
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
