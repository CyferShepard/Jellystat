import React from "react";
import axios from "axios";
// import Config from "../../../lib/config";
// import Loading from "../loading";

import "../../css/settings.css";

export default function LibrarySync() {

    async function writeSeasonsAndEpisodes() {
        // Send a GET request to /system/configuration to test copnnection
        let isValid = false;
        let errorMessage = "";
        await axios
          .get("http://localhost:3003/sync/writeSeasonsAndEpisodes")
          .then((response) => {
            if (response.status === 200) {
              isValid = true;
            }
          })
          .catch((error) => {
             console.log(error);
          });
    
        return { isValid: isValid, errorMessage: errorMessage };
      }

    const handleClick = () => {
        writeSeasonsAndEpisodes();
        console.log('Button clicked!');
      }
    
      return (
        <div>
          <button onClick={handleClick}>Run Sync</button>
        </div>
      );


}