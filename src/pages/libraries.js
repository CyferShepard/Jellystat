import React, { useState, useEffect } from "react";
import axios from "axios";
import Config from "../lib/config";

import "./css/libraries.css";
import "./css/users.css";

import Loading from "./components/loading";

// import PlaybackActivity from "./components/playbackactivity";

function Libraries() {
  const [data, setData] = useState([]);
  const [items, setItems] = useState([]);
  const [config, setConfig] = useState(null);

  async function fetchLibraryData(libraryId) {
    console.log("data: "+libraryId);
    if (config) {
      const url = `/api/getLibraryItems`;
      await axios
      .post(url, {}, {
        headers: {
          "id": libraryId,
        }
      })
      .then((response) => {
        console.log("data");
        setItems(response.data);
        console.log(response);
      })
      .catch((error) => {
        console.log(error);
      });
    }

    

   
  }

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
        const url = `${config.hostUrl}/Library/MediaFolders`;
        const apiKey = config.apiKey;

        axios
          .get(url, {
            headers: {
              "X-MediaBrowser-Token": apiKey,
            },
          })
          .then((data) => {
            console.log("data");
            setData(data.data.Items);
            console.log(data);
          })
          .catch((error) => {
            console.log(error);
          });
      }
    };
 

    if (!config) {
      fetchConfig();
    }

    if (data.length === 0) {
      fetchLibraries();
    }

    const intervalId = setInterval(fetchLibraries, 60000 * 60);
    return () => clearInterval(intervalId);
  }, [data, config]);

  if (!data || data.length === 0) {
    return <Loading />;
  }
  const handleClick = (event) => {
    fetchLibraryData(event.target.value);
    console.log(event.target.value);
    // console.log('Button clicked!');
  }

  return (
    <div className="Activity">
      <h1>Libraries</h1>
      <ul>
        {data &&
          data
            .filter((collection) =>
              ["tvshows", "movies"].includes(collection.CollectionType)
            )
            .map((item) => (
              <li key={item.Id}>
                <div className='ActivityDetail'> {item.Name}</div>
          <button  onClick={handleClick} value= {item.Id}> {item.Name}</button>

              </li>
            ))}
      </ul>
      <h1>Library Data</h1>
      <table className="user-activity-table">
        <thead>
          <tr>
            <th >Id</th>
            <th>Name</th>
            <th>Type</th>

          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.Id}>
              <td>{item.Id}</td>
              <td>{item.Name}</td>
              <td>{item.Type}</td>
            </tr>
          ))}
        </tbody>
      </table>
      {/* <ul>
        {items &&
          items.map((item) => (
              <li key={item.Id}>
                <p className='ActivityDetail'> {item.Name}</p>
                <p className='ActivityDetail'> {item.Id}</p>

              </li>
            ))}
      </ul> */}
    </div>
  );
}

export default Libraries;
