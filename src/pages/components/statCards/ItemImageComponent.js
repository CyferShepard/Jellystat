import React, {useState} from "react";
import { Blurhash } from 'react-blurhash';


function ItemImage(props) {
    const [loaded, setLoaded] = useState(false);
  return (
      <div className="popular-image">
        {loaded ? null : <Blurhash hash={props.data.PrimaryImageHash} width={'100%'}   height={'100%'}/>}
        <img
        className="popular-banner-image"
           src={
            props.base_url +
              "/Items/" +
              (props.data.Id) +
              "/Images/Primary?fillHeight=320&fillWidth=213&quality=50"
          }
          onLoad={() => setLoaded(true)}
        />
        </div>
  );
}

export default ItemImage;
