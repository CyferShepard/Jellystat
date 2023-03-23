import React, { useState, useEffect } from "react";
import axios from "axios";
import AccountCircleFillIcon from "remixicon-react/AccountCircleFillIcon";
import Config from "../../../lib/config";
import "../../css/users/user-details.css";

function UserDetails(props) {
  const [data, setData] = useState();
  const [imgError, setImgError] = useState(false);
  const [config, setConfig] = useState();


  useEffect(() => {

    const fetchConfig = async () => {
        try {
          const newConfig = await Config();
          setConfig(newConfig);
        } catch (error) {
            console.log(error);
        }
      };

    const fetchData = async () => {
      try {
        const userData = await axios.post(`/stats/getUserDetails`, {
          userid: props.UserId,
        });
        setData(userData.data);
      } catch (error) {
        console.log(error);
      }
    };

    if (!data) {
      fetchData();
    }

    if (!config) {
        fetchConfig();
    }

    const intervalId = setInterval(fetchData, 60000 * 5);
    return () => clearInterval(intervalId);
  }, [data,config, props.UserId]);

  const handleImageError = () => {
    setImgError(true);
  };

  if (!data || !config) {
    return <></>;
  }

  return (
    <div className="user-detail-container">
      <div className="user-image-container">
        {imgError ? (
          <AccountCircleFillIcon size={"100%"} />
        ) : (
          <img
            className="user-image"
            src={
              config.hostUrl +
              "/Users/" +
              data.Id +
              "/Images/Primary?quality=50"
            }
            onError={handleImageError}
            alt=""
          ></img>
        )}
      </div>
      <p className="user-name">{data.Name}</p>
    </div>
  );
}

export default UserDetails;
