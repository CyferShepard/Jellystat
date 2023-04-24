import React, { useState, useEffect } from "react";
import axios from "axios";
import Config from "../../../lib/config";
import ItemStatComponent from "./ItemStatComponent";


import AccountCircleFillIcon from "remixicon-react/AccountCircleFillIcon";

function MostActiveUsers(props) {
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
        const url = `/stats/getMostActiveUsers`;

        axios
        .post(url, {days:props.days}, {
          headers: {
            Authorization: `Bearer ${config.token}`,
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



  // const handleImageError = () => {
  //   setImgError(true);
  // };


  if (!data || data.length === 0) {
    return  <></>;
  }


  return (
    <ItemStatComponent base_url={config.hostUrl} icon={<AccountCircleFillIcon color="white" size={"100%"}/>} data={data} heading={"MOST ACTIVE USERS"} units={"Plays"}/>
  );
}

export default MostActiveUsers;
