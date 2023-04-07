import React, { useState } from "react";
import axios from "axios";


import "../../css/settings.css";

export default function LibrarySync() {
  const [processing, setProcessing] = useState(false);
  const token = localStorage.getItem('token');
    async function beginSync() {


        setProcessing(true);

        await axios
        .get("/sync/beingSync", {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
        .then((response) => {
          if (response.status === 200) {
            // isValid = true;
          }
        })
        .catch((error) => {
           console.log(error);
        });
          setProcessing(false);
        // return { isValid: isValid, errorMessage: errorMessage };
      }

    const handleClick = () => {

         beginSync();
        console.log('Button clicked!');
      }
    
      return (
        <div className="settings-form">
          <button style={{backgroundColor: !processing? '#2196f3':'darkgrey',cursor: !processing? 'pointer':'default'  }} disabled={processing} onClick={handleClick}>Run Sync</button>
        </div>
      );


}