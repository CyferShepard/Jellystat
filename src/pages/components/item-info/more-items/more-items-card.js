import React, {useState} from "react";
import { Blurhash } from 'react-blurhash';
import { Link } from "react-router-dom";
import { useParams } from 'react-router-dom';

import "../../../css/lastplayed.css";

 

function MoreItemCards(props) {
  const { Id } = useParams();
  const [loaded, setLoaded] = useState(false);
  const [fallback, setFallback] = useState(false);

  return (
    <div className={props.data.Type==="Episode" ? "last-card episode-card" : "last-card"}>
     <Link to={`/libraries/item/${ (props.data.Type==="Episode" ? props.data.EpisodeId :  props.data.Id) }`}>
      <div className={props.data.Type==="Episode" ? "last-card-banner episode" : "last-card-banner"}>
        {(props.data.ImageBlurHashes || props.data.PrimaryImageHash )&& !loaded ? <Blurhash hash={props.data.PrimaryImageHash || props.data.ImageBlurHashes.Primary[props.data.ImageTags.Primary] } width={'100%'}   height={'100%'} className="rounded-3 overflow-hidden"/> : null}

        {fallback ? 
        <img
        src={
          `${
              "/Proxy/Items/Images/Primary?id=" +
              Id +
              "&fillHeight=320&fillWidth=213&quality=50"}`
        }
        alt=""
        onLoad={() => setLoaded(true)}
        style={loaded ? { backgroundImage: `url(path/to/image.jpg)` } : { display: 'none' }}
      />
        : 
        <img
        src={
          `${
              "/Proxy/Items/Images/Primary?id=" +
              (props.data.Type==="Episode" ? props.data.EpisodeId :  props.data.Id) +
              "&fillHeight=320&fillWidth=213&quality=50"}`
        }
        alt=""
        onLoad={() => setLoaded(true)}
        onError={() => setFallback(true)}
        style={loaded ? { backgroundImage: `url(path/to/image.jpg)` } : { display: 'none' }}
      />
         }

      </div>
    </Link>

      <div className="last-item-details">
        <div className="last-item-name"> {props.data.Name}</div>
        {props.data.Type==="Episode"?
          <div className="last-item-name"> S{props.data.ParentIndexNumber || 0} - E{props.data.IndexNumber || 0}</div>
          :
          <></>
        }
       
      </div>

      
    </div>
  );
}

export default MoreItemCards;
