import React, { useState, useEffect } from "react";
import axios from "axios";

import StatComponent from "./statsComponent";


import ComponentLoading from "../ComponentLoading";
import ComputerLineIcon from "remixicon-react/ComputerLineIcon";

function MostUsedClient(props) {
  const [data, setData] = useState([]);
  const [days, setDays] = useState(30); 


  useEffect(() => {

    const fetchLibraries = () => {
        const url = `/stats/getMostUsedClient`;

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
    };
 

    if (!data || data.length===0) {
      fetchLibraries();
    }
    if (days !== props.days) {
      setDays(props.days);
      fetchLibraries();
    }


    const intervalId = setInterval(fetchLibraries, 60000 * 5);
    return () => clearInterval(intervalId);
  }, [data, days,props.days]);

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
        <div  className="library-icons">
        <ComputerLineIcon size={'80%'}/>
        </div>
    </div>
    <StatComponent data={data} heading={"MOST USED CLIENTS"} units={"Plays"}/>

    </div>
  );
}

export default MostUsedClient;
