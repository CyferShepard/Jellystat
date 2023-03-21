import React, { useState, useEffect } from "react";
import axios from "axios";
import Config from "../../../lib/config";
import StatComponent from "./statsComponent";


import ComponentLoading from "../ComponentLoading";

import AccountCircleFillIcon from "remixicon-react/AccountCircleFillIcon";

function MostActiveUsers(props) {
  const [data, setData] = useState([]);
  const [days, setDays] = useState(30); 
  const [imgError, setImgError] = useState(false);

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
        const url = `/stats/getMostActiveUsers`;

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



  const handleImageError = () => {
    setImgError(true);
  };

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
    >
    
    <div className="popular-image">
    {imgError ?

      <AccountCircleFillIcon size={'80%'}/>
      :

    <img
          className="popular-user-image"
          src={
            config.hostUrl +
              "/Users/" +
              (data[0].UserId) +
              "/Images/Primary?quality=50"
          }
          onError={handleImageError}
          alt=""
        ></img>
        }
    </div>
    <StatComponent data={data} heading={"MOST ACTIVE USERS"} units={"Plays"}/>

    </div>
  );
}

export default MostActiveUsers;
