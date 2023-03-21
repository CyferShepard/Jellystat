import React, { useState, useEffect } from "react";
import axios from "axios";
import Config from "../../../lib/config";

import ComponentLoading from "../ComponentLoading";
import StatComponent from "./statsComponent";


function MVMusic(props) {
  const [data, setData] = useState([]);
  const [days, setDays] = useState(30); 

  const [config, setConfig] = useState(null);


  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const newConfig = await Config();
        setConfig(newConfig);
      } catch (error) {
        if (error.code === "ERR_NETWORK") {
          console.log(error);
        }
      }
    };

    const fetchLibraries = () => {
      if (config) {
        const url = `/stats/getMostViewedMovies`;

        axios
        .post(url, {days:props.days}, {
          headers: {
            "Content-Type": "application/json",
          },
        })
          .then((data) => {
            setData(data.data);
          })
          .catch((error) => {
            console.log(error);
          });
      }
    };
 

    if (!config) {
      fetchConfig();
    }

    if (!data || data.length===0) {
      fetchLibraries();
    }
    if (days !== props.days) {
      setDays(props.days);
      fetchLibraries();
    }
  

    const intervalId = setInterval(fetchLibraries, 60000 * 5);
    return () => clearInterval(intervalId);
  }, [data, config, days,props.days]);

  if (!data) {
    return(
      <div className="stats-card">
      <ComponentLoading />
      </div>
    );
  }
  if (data.length === 0) {
    return  <></>;
  }



  return (
    <div className="stats-card"
    style={{
        backgroundImage: `url(${
         config.hostUrl +
          "/Items/" +
          (data[0].Id) +
          "/Images/Backdrop/0?maxWidth=1000&quality=50"
        })`}}
    >
    
    <div className="popular-image">
    <img
          className="popular-banner-image"
          src={
            config.hostUrl +
              "/Items/" +
              (data[0].Id) +
              "/Images/Primary?quality=50"
          }
          alt=""
        ></img>

    </div>
    <StatComponent data={data} heading={"MOST VIEWED MOVIES"} units={"Plays"}/>
    

    </div>
  );
}

export default MVMusic;
