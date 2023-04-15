import React, { useState } from "react";
import axios from "axios";
import  Button  from "react-bootstrap/Button";
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';


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
          <h1 className="my-2">Tasks</h1>
          <Row className="mb-3">

            <Form.Label column sm="2">
              Syncronize with Jellyfin
            </Form.Label>

            <Col sm="10">
            <Button variant={!processing ? "outline-primary" : "outline-light"} disabled={processing} onClick={handleClick}>Run Sync</Button>
            </Col>
          </Row>
         
        </div>
      );


}