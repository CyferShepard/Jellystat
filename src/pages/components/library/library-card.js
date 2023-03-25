import React from "react";
import "../../css/library/library-card.css";

  

function LibraryCard(props) {
  return (
      <div
        className="library-card-banner"
        style={{
          backgroundImage: `url(${
            props.base_url +
              "/Items/" +
              props.data.Id +
              "/Images/Primary/?fillWidth=300&quality=90"})`,
        }}
      >    
      </div>

  );
}

export default LibraryCard;
