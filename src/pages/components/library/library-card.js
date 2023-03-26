import React from "react";
import { Link } from "react-router-dom";
import "../../css/library/library-card.css";

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
    <div className="library-card">

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

      <div className="library-card-details">
        <div>
          <p className="label">Library</p>
          <p>{props.data.Name}</p>
        </div>
        <div>
          <p className="label">Type</p>
          <p>{props.data.CollectionType==='tvshows' ? 'Series' : "Movies"}</p>
        </div>
        <div>
          <p className="label">Total Plays</p>
          <p>{props.data.Plays}</p>
        </div>
        <div>
          <p className="label">Total Playback</p>
          <p>{formatTotalWatchTime(props.data.total_playback_duration)}</p>
        </div>

        <div>
          <p className="label">Last Played</p>
          <p>{props.data.ItemName ? props.data.ItemName : 'n/a'}</p>
        </div>

        <div>
          <p className="label">Last Activity</p>
          <p>{props.data.LastActivity ? formatLastActivityTime(props.data.LastActivity) : 'never'}</p>
        </div>

        <div>
          <p className="label">{props.data.CollectionType==='tvshows' ? 'Series' : "Movies"}</p>
          <p>{props.data.Library_Count}</p>
        </div>

        <div>
              <p className="label">Seasons</p>
              <p>{props.data.CollectionType==='tvshows' ? props.data.Season_Count : ''}</p>
        </div>
        
        <div>
              <p className="label">Episodes</p>
              <p>{props.data.CollectionType==='tvshows' ? props.data.Episode_Count : ''}</p>
        </div>
      


       
       
      </div>
    </div>
  );
}

export default LibraryCard;
