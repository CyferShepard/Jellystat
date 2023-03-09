import React from 'react';

function getLastPlayedTimeString(datetime) {
    const now = new Date();
    const lastPlayed = new Date(datetime);
  
    const timeDifference = Math.abs(now.getTime() - lastPlayed.getTime());
    const yearsDifference = Math.floor(timeDifference / (1000 * 3600 * 24 * 365));
    const weeksDifference = Math.floor(
      (timeDifference % (1000 * 3600 * 24 * 365)) / (1000 * 3600 * 24 * 7)
    );
    const daysDifference = Math.floor(
      (timeDifference % (1000 * 3600 * 24 * 7)) / (1000 * 3600 * 24)
    );
    const hoursDifference = Math.floor(
      (timeDifference % (1000 * 3600 * 24)) / (1000 * 3600)
    );
    const minutesDifference = Math.floor(
      (timeDifference % (1000 * 3600)) / (1000 * 60)
    );
  
    const timeUnits = [
        { label: "year", pluralLabel: "years", value: yearsDifference },
        { label: "week", pluralLabel: "weeks", value: weeksDifference },
        { label: "day", pluralLabel: "days", value: daysDifference },
        { label: "hour", pluralLabel: "hours", value: hoursDifference },
        { label: "minute", pluralLabel: "minutes", value: minutesDifference },
      ];
    
      const timeString = timeUnits
        .filter((unit) => unit.value > 0)
        .map((unit, index, array) => {
          const label = unit.value === 1 ? unit.label : unit.pluralLabel;
          if (index === array.length - 1 && array.length > 1) {
            // Special case for last time unit
            return `and ${unit.value} ${label}`;
          } else {
            return `${unit.value} ${label}`;
          }
        })
        .join(" ");
    
      return `Watched ${timeString} ago`;
  }



function RecentCard(props) {
    

  return (
    <div key={props.data.recent.Id} className='recent-card' >


      <div className='recent-card-banner'
       style={{ backgroundImage: `url(${props.data.base_url + '/Items/' + (props.data.recent.SeriesId ? props.data.recent.SeriesId : props.data.recent.Id) + '/Images/Primary?quality=50&tag=' + props.data.recent.SeriesPrimaryImageTag || props.data.recent.ImageTags.Primary})` }}
      >
        </div>

      <div className='recent-card-details' >
        <div className='recent-card-item-name'> {props.data.recent.Name}</div> 
        <div className='recent-card-last-played'> {getLastPlayedTimeString(props.data.recent.UserData.LastPlayedDate)}</div> 
      </div>

    </div>
  );
}

export default RecentCard;