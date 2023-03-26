import React, { useState, useEffect } from "react";
import axios from "axios";
import TvLineIcon from "remixicon-react/TvLineIcon";
import FilmLineIcon from "remixicon-react/FilmLineIcon";

// import "../../css/users/user-details.css";

function LibraryDetails(props) {
  const [data, setData] = useState();

  useEffect(() => {

    const fetchData = async () => {
      try {
        const libraryrData = await axios.post(`/stats/getLibraryDetails`, {
          libraryid: props.LibraryId,
        });
        setData(libraryrData.data);
      } catch (error) {
        console.log(error);
      }
    };

    if (!data) {
      fetchData();
    }

    const intervalId = setInterval(fetchData, 60000 * 5);
    return () => clearInterval(intervalId);
  }, [data, props.LibraryId]);


  if (!data) {
    return <></>;
  }

  return (
    <div className="user-detail-container">
      <div className="user-image-container">
      {data.CollectionType==="tvshows" ?
          
          <TvLineIcon size={'100%'}/>
          :
          <FilmLineIcon size={'100%'}/>
        }
      </div>
      <p className="user-name">{data.Name}</p>
    </div>
  );
}

export default LibraryDetails;
