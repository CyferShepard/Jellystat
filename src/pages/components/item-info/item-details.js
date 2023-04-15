import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Blurhash } from 'react-blurhash';
import { Row, Col } from "react-bootstrap";


import "../../css/items/item-details.css";



function ItemDetails(props) {

  const [loaded, setLoaded] = useState(false);


  function formatFileSize(sizeInBytes) {
    const sizeInMB = sizeInBytes / 1048576; // 1 MB = 1048576 bytes
    if (sizeInMB < 1000) {
      return `${sizeInMB.toFixed(2)} MB`;
    } else {
      const sizeInGB = sizeInMB / 1024; // 1 GB = 1024 MB
      return `${sizeInGB.toFixed(2)} GB`;
    }
  }

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



  return (
    <div className="item-detail-container">
      <Row className="justify-content-center justify-content-md-start">
        <Col className="col-auto my-4 my-md-0">
        {props.data.PrimaryImageHash && !loaded ? <Blurhash hash={props.data.PrimaryImageHash} width={'200px'}   height={'300px'}/> : null}
        <img
            className="item-image"
            src={
              props.hostUrl +
              "/Items/" +
             (props.data.Type==="Episode"? props.data.SeriesId : props.data.Id) +
              "/Images/Primary?fillWidth=200&quality=90"
            }
            alt=""
            style={{
              display: loaded ? "block" :"none"
            }}
            onLoad={() => setLoaded(true)}
         />
        </Col>

        <Col >
        <div className="item-details">
       <h1 className="">
          {props.data.SeriesId?
             <Link to={`/item/${props.data.SeriesId}`}>{props.data.SeriesName || props.data.Name}</Link>
          :
            props.data.SeriesName || props.data.Name
          }

        </h1>

        <div className="my-3">
            {props.data.CommunityRating ? <p style={{color:"lightgrey", fontSize:"0.8em", fontStyle:"italic"}}>Community Rating: {props.data.CommunityRating}</p> :<></>}
            {props.data.Type==="Episode"? <p><Link to={`/item/${props.data.SeasonId}`} className="fw-bold">{props.data.SeasonName}</Link> Episode {props.data.IndexNumber} - {props.data.Name}</p> : <></> }
            {props.data.Type==="Season"? <p>{props.data.Name}</p> : <></> }
            {props.data.FileName ?  <p style={{color:"lightgrey"}} className="fst-italic fs-6">File Name: {props.data.FileName}</p> :<></>}      
            {props.data.Path ? <p style={{color:"lightgrey"}} className="fst-italic fs-6">File Path: {props.data.Path}</p> :<></>}
            {props.data.RunTimeTicks ?  <p style={{color:"lightgrey"}} className="fst-italic fs-6">{props.data.Type==="Series"?"Average Runtime" : "Runtime"}: {ticksToTimeString(props.data.RunTimeTicks)}</p> :<></>}
            {props.data.Size ? <p style={{color:"lightgrey"}} className="fst-italic fs-6">File Size: {formatFileSize(props.data.Size)}</p> :<></>}

        </div>


      </div>
      
        </Col>
      </Row>


    </div>
  );
}

export default ItemDetails;
