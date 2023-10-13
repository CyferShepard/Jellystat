import React, { useState, useEffect } from "react";
import axios from "axios";
import ItemStatComponent from "./ItemStatComponent";

import ComputerLineIcon from "remixicon-react/ComputerLineIcon";

function MostUsedClient(props) {
  const [data, setData] = useState();
  const [days, setDays] = useState(30);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchLibraries = () => {
      const url = `/stats/getMostUsedClient`;

      axios
        .post(
          url,
          { days: props.days },
          {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          },
        )
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
  }, [data, days, props.days, token]);

  if (!data || data.length === 0) {
    return <></>;
  }

  return (
    <ItemStatComponent
      icon={<ComputerLineIcon color="white" size={"100%"} />}
      data={data}
      heading={"MOST USED CLIENTS"}
      units={"Plays"}
    />
  );
}

export default MostUsedClient;
