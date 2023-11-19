import  {useState} from "react";
import { Blurhash } from 'react-blurhash';
import { Link } from "react-router-dom";
import { useParams } from 'react-router-dom';
import ArchiveDrawerFillIcon from 'remixicon-react/ArchiveDrawerFillIcon';
import "../../../css/lastplayed.css";



function MoreItemCards(props) {
  const { Id } = useParams();
  const [loaded, setLoaded] = useState(props.data.archived);
  const [fallback, setFallback] = useState(false);

  return (
    <div className={props.data.Type==="Episode" ? "last-card episode-card" : "last-card"}>
     <Link to={`/libraries/item/${ (props.data.Type==="Episode" ? props.data.EpisodeId :  props.data.Id) }`} className="text-decoration-none">
      <div className={props.data.Type==="Episode" ? "last-card-banner episode" : "last-card-banner"}>
        {((props.data.ImageBlurHashes && props.data.ImageBlurHashes!=null) || (props.data.PrimaryImageHash && props.data.PrimaryImageHash!=null) ) && !loaded ? <Blurhash hash={props.data.PrimaryImageHash || props.data.ImageBlurHashes.Primary[props.data.ImageTags.Primary] } width={'100%'}   height={'100%'} className="rounded-top-3 overflow-hidden"/> : null}


        {!props.data.archived ?
        (fallback ?
        <img
          src={
            `${
                "/proxy/Items/Images/Primary?id=" +
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
                "/proxy/Items/Images/Primary?id=" +
                (props.data.Type==="Episode" ? props.data.EpisodeId :  props.data.Id) +
                "&fillHeight=320&fillWidth=213&quality=50"}`
          }
          alt=""
          onLoad={() => setLoaded(true)}
          onError={() => setFallback(true)}
          style={loaded ? { backgroundImage: `url(path/to/image.jpg)` } : { display: 'none' }}
        />
        )
          :
          <div className="d-flex flex-column justify-content-center align-items-center position-relative" style={{height: '100%'}}>
            {((props.data.ImageBlurHashes && props.data.ImageBlurHashes!=null) || (props.data.PrimaryImageHash && props.data.PrimaryImageHash!=null) )?
                    <Blurhash hash={props.data.PrimaryImageHash || props.data.ImageBlurHashes.Primary[props.data.ImageTags.Primary] } width={'100%'}   height={'100%'} className="rounded-top-3 overflow-hidden position-absolute"/>
                    :
                    null
            }
            <div className="d-flex flex-column justify-content-center align-items-center position-absolute">
              <ArchiveDrawerFillIcon className="w-100 h-100 mb-2"/>
              <span>Archived</span>
            </div>
          </div>
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
