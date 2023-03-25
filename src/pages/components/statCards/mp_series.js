import React, { useState, useEffect } from "react";
import axios from "axios";
import Config from "../../../lib/config";
import ItemImage from "./ItemImageComponent";
import StatComponent from "./statsComponent";



function MPSeries(props) {
  const [data, setData] = useState();
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
        const url = `/stats/getMostPopularSeries`;
       
        axios
          .post(url, { days: props.days }, {
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
  
    if (!data) {
      fetchLibraries();
    }

    if (days !== props.days) {
      setDays(props.days);
      fetchLibraries();
    }
  
    const intervalId = setInterval(fetchLibraries, 60000 * 5);
    return () => clearInterval(intervalId);
  }, [data, config, days,props.days]);

  if (!data || data.length === 0) {
    return  <></>;
  }



  return (
    <div className="stats-card"
    style={{
        backgroundImage: `url(${
         config.hostUrl +
          "/Items/" +
          (data[0].Id) +
          "/Images/Backdrop/?fillWidth=300&quality=10"
        })`}}
    >
    
    <ItemImage data={data[0]} base_url={config.hostUrl}/>
    <StatComponent data={data} heading={"MOST POPULAR SERIES"} units={"Users"}/>
    

    </div>
  );
}

export default MPSeries;
