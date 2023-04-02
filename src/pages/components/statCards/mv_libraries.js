import React, { useState, useEffect } from "react";
import axios from "axios";

import StatComponent from "./statsComponent";

import TvLineIcon from "remixicon-react/TvLineIcon";
import FilmLineIcon from "remixicon-react/FilmLineIcon";

function MVLibraries(props) {
  const [data, setData] = useState();
  const [days, setDays] = useState(30); 

  const token = localStorage.getItem('token');

  useEffect(() => {

    const fetchLibraries = () => {
        const url = `/stats/getMostViewedLibraries`;

        axios
        .post(url, {days:props.days}, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
          .then((data) => {
            setData(data.data);
          })
          .catch((error) => {
            console.log(error);
          });
    };
 


    if (!data) {
      fetchLibraries();
    }
    if (days !== props.days) {
      setDays(props.days);
      fetchLibraries();
    }

    const intervalId = setInterval(fetchLibraries, 60000 * 5);
    return () => clearInterval(intervalId);
  }, [data, days,props.days,token]);

  if (!data || data.length === 0) {
    return  <></>;
  }


  return (
    <div className="stats-card"
    >
    
    <div className="popular-image">
        <div  className="library-icons">
          {data[0].CollectionType==="tvshows" ?
          
          <TvLineIcon size={'80%'}/>
          :
          <FilmLineIcon size={'80%'}/>
        }

        </div>
    </div>
    <StatComponent data={data} heading={"MOST VIEWED LIBRARIES"} units={"Plays"}/>
    

    </div>
  );
}

export default MVLibraries;
