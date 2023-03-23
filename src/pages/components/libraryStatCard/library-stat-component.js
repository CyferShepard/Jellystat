import React from "react";

function LibraryStatComponent(props) {

  if (props.data.length === 0) {
    return <></>;
  }

  return (
    <div className="library-card">

    <div className="library-image">
      <div className="library-icons">
        {props.icon}
      </div>
    </div>

    <div className="library">
      <div className="library-header">
        <div>{props.heading}</div>
        <div className="library-header-count">{props.units}</div>
      </div>

      <div className="stats-list">
        {props.data
            .map((item, index) => (
              <div className="library-item" key={item.Id}>
                <p className="library-item-index">{index + 1}</p>
                <p className="library-item-name">{item.Name}</p>
                <p className="library-item-count">{item.CollectionType ==='tvshows'? (item.Library_Count+' / '+item.Season_Count+' / '+item.Episode_Count): item.Library_Count}</p>
              </div>
            ))}
      </div>
    </div>

  </div>
  );
}

export default LibraryStatComponent;
