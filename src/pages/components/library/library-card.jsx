import {useState} from "react";
import { Link } from "react-router-dom";
import "../../css/library/library-card.css";

import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

import TvLineIcon from "remixicon-react/TvLineIcon";
import FilmLineIcon from "remixicon-react/FilmLineIcon";
import FileMusicLineIcon from "remixicon-react/FileMusicLineIcon";
import CheckboxMultipleBlankLineIcon from "remixicon-react/CheckboxMultipleBlankLineIcon";
import { Trans } from "react-i18next";
import i18next from "i18next";
import baseUrl from "../../../lib/baseurl";

function LibraryCard(props) {
  const [imageLoaded, setImageLoaded] = useState(true);
  const SeriesIcon=<TvLineIcon size={"50%"} color="white"/> ;
  const MovieIcon=<FilmLineIcon size={"50%"} color="white"/> ;
  const MusicIcon=<FileMusicLineIcon size={"50%"}    color="white"/> ;
  const MixedIcon=<CheckboxMultipleBlankLineIcon size={"50%"}    color="white"/> ;

  const default_image=<div className="default_library_image default_library_image_hover d-flex justify-content-center align-items-center">{props.data.CollectionType==='tvshows' ? SeriesIcon : props.data.CollectionType==='movies'? MovieIcon : props.data.CollectionType==='music'? MusicIcon : MixedIcon} </div>;

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

    const units = {
      months: [i18next.t("UNITS.MONTH"), i18next.t("UNITS.MONTHS")],
      days: [i18next.t("UNITS.DAY"), i18next.t("UNITS.DAYS")],
      hours: [i18next.t("UNITS.HOUR"), i18next.t("UNITS.HOURS")],
      minutes: [i18next.t("UNITS.MINUTE"), i18next.t("UNITS.MINUTES")]
    };
    
    let formattedTime = '';
    if (days) {
      formattedTime += `${days} ${days > 1 ? units.days[1] : units.days[0]}`;
    }
    
    if (hours) {
      formattedTime += ` ${hours} ${hours > 1 ?  units.hours[1] : units.hours[0]}`;
    }
    
    if (minutes) {      formattedTime += ` ${minutes} ${minutes > 1 ?  units.minutes[1] : units.minutes[0]}`;
    }
    
    if (!days && !hours && !minutes) {
      formattedTime =`0 ${units.minutes[1]}`;
    }
    
    return formattedTime;
    
  }
  function ticksToTimeString(ticks) {
    const seconds = Math.floor(ticks / 10000000);
    const months = Math.floor(seconds / (86400 * 30)); // 1 month = 86400 seconds
    const days = Math.floor((seconds % (86400 * 30)) / 86400); // 1 day = 86400 seconds
    const hours = Math.floor((seconds % 86400) / 3600); // 1 hour = 3600 seconds
    const minutes = Math.floor((seconds % 3600) / 60); // 1 minute = 60 seconds
  
    const timeComponents = [];

    const units = {
      months: [i18next.t("UNITS.MONTH"), i18next.t("UNITS.MONTHS")],
      days: [i18next.t("UNITS.DAY"), i18next.t("UNITS.DAYS")],
      hours: [i18next.t("UNITS.HOUR"), i18next.t("UNITS.HOURS")],
      minutes: [i18next.t("UNITS.MINUTE"), i18next.t("UNITS.MINUTES")]
    };
  
    if (months) {
      timeComponents.push(`${months} ${months > 1 ? units.months[1] : units.months[0] }`);
    }
  
    if (days) {
      timeComponents.push(`${days} ${days > 1 ? units.days[1] : units.days[0]}`);
    }
  
    if (hours) {
      timeComponents.push(`${hours} ${hours > 1 ? units.hours[1] : units.hours[0]}`);
    }
  
    if (!months && minutes) {
      timeComponents.push(`${minutes} ${minutes > 1 ? units.minutes[1] : units.minutes[0]}`);
    }
  
    const formattedTime = timeComponents.length > 0 ? timeComponents.join(' ') : `0 ${units.minutes[1]}`;
    return formattedTime;
  }
  

  function formatLastActivityTime(time) {
    const units = {
      days: [i18next.t("UNITS.DAY"), i18next.t("UNITS.DAYS")],
      hours: [i18next.t("UNITS.HOUR"), i18next.t("UNITS.HOURS")],
      minutes: [i18next.t("UNITS.MINUTE"), i18next.t("UNITS.MINUTES")]
    };
  
    let formattedTime = '';
  
    for (const unit in units) {
      if (time[unit]) {
        const unitName = units[unit][time[unit] > 1 ? 1 : 0];
        formattedTime += `${time[unit]} ${unitName} `;
      }
    }
  
    return formattedTime;
  }
  
  return (
      <Card className="bg-transparent lib-card rounded-3">
          <Link to={`/libraries/${props.data.Id}`}>
            <div className="library-card-image">

              {imageLoaded?

               <Card.Img
               variant="top"
               className="library-card-banner library-card-banner-hover"
               src={baseUrl+"/proxy/Items/Images/Primary?id=" + props.data.Id + "&fillWidth=800&quality=50"}
               onError={() =>setImageLoaded(false)}
               />
               :
              default_image
              }
            </div>
          </Link>


          <Card.Body className="library-card-details" style={{whiteSpace: "nowrap"}}>
            <Row className="space-between-end card-row">
              <Col className="card-label"><Trans i18nKey="LIBRARY_CARD.LIBRARY" /></Col>
              <Col className="text-end">{props.data.Name}</Col>
            </Row>

            <Row className="space-between-end card-row">
              <Col className="card-label"><Trans i18nKey="TYPE" /></Col>
              <Col className="text-end">{props.data.CollectionType==='tvshows' ? <Trans i18nKey="SERIES" /> : props.data.CollectionType==='movies'? <Trans i18nKey="MOVIES" /> : props.data.CollectionType==='music'? <Trans i18nKey="MUSIC" /> : 'Mixed'}</Col>
            </Row>

            <Row className="space-between-end card-row">
              <Col className="card-label"><Trans i18nKey="LIBRARY_CARD.TOTAL_TIME" /></Col>
              <Col className="text-end">{ticksToTimeString(props.data && props.data.total_play_time ? props.data.total_play_time:0)}</Col>
            </Row>

            <Row className="space-between-end card-row">
              <Col className="card-label"><Trans i18nKey="LIBRARY_CARD.TOTAL_FILES" /></Col>
              <Col className="text-end">{props.metadata && props.metadata.files  ? props.metadata.files :0}</Col>
            </Row>

            <Row className="space-between-end card-row">
              <Col className="card-label"><Trans i18nKey="LIBRARY_CARD.LIBRARY_SIZE" /></Col>
              <Col className="text-end">{formatFileSize(props.metadata && props.metadata.Size ? props.metadata.Size:0)}</Col>
            </Row>

            <Row className="space-between-end card-row">
              <Col className="card-label"><Trans i18nKey="TOTAL_PLAYS" /></Col>
              <Col className="text-end">{props.data.Plays}</Col>
            </Row>

            <Row className="space-between-end card-row">
              <Col className="card-label"><Trans i18nKey="LIBRARY_CARD.TOTAL_PLAYBACK" /></Col>
              <Col className="text-end">{formatTotalWatchTime(props.data.total_playback_duration)}</Col>
            </Row>

            <Row className="space-between-end card-row">
              <Col className="card-label"><Trans i18nKey="LIBRARY_CARD.LAST_PLAYED" /></Col>
              <Col className="text-end">{props.data.ItemName || `${i18next.t("ERROR_MESSAGES.N/A")}`}</Col>
            </Row>

            <Row className="space-between-end card-row">
              <Col className="card-label"><Trans i18nKey="LIBRARY_CARD.LAST_ACTIVITY" /></Col>
              <Col className="text-end">{props.data.LastActivity ?`${i18next.t("USERS_PAGE.AGO_ALT")} ${ formatLastActivityTime(props.data.LastActivity)} ${i18next.t("USERS_PAGE.AGO").toLocaleLowerCase()}` : i18next.t("ERROR_MESSAGES.NEVER")}</Col>
            </Row>

            <Row className="space-between-end card-row">
              <Col className="card-label">{props.data.CollectionType==='tvshows' ? i18next.t("SERIES") : props.data.CollectionType==='movies'? i18next.t("MOVIES") : props.data.CollectionType==='music'? i18next.t("SONGS") : i18next.t("FILES")}</Col>
              <Col className="text-end">{props.data.Library_Count}</Col>
            </Row>

            <Row className="space-between-end card-row" style={{opacity:props.data.CollectionType==='tvshows' ? '1' :'0'}}>
              <Col className="card-label"><Trans i18nKey="SEASONS" /></Col>
              <Col className="text-end">{props.data.CollectionType==='tvshows' ? props.data.Season_Count : ''}</Col>
            </Row>

            <Row className="space-between-end card-row" style={{opacity:props.data.CollectionType==='tvshows' ? '1' :'0'}}>
              <Col className="card-label"><Trans i18nKey="EPISODES" /></Col>
              <Col className="text-end">{props.data.CollectionType==='tvshows' ? props.data.Episode_Count : ''}</Col>
            </Row>
            
          </Card.Body>

      </Card>
  );
}

export default LibraryCard;
