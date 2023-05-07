import React, { useState } from "react";
import axios from "axios";
import  Button  from "react-bootstrap/Button";
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';


import "../../css/settings/settings.css";

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

      async function createBackup() {


        setProcessing(true);

        await axios
        .get("/data/backup", {
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
              Synchronize with Jellyfin
            </Form.Label>

            <Col sm="10">
            <Button variant={!processing ? "outline-primary" : "outline-light"} disabled={processing} onClick={handleClick}>Start</Button>
            </Col>
          </Row>

          <Row className="mb-3">

            <Form.Label column sm="2">
              Create Backup
            </Form.Label>

            <Col sm="10">
            <Button variant={!processing ? "outline-primary" : "outline-light"} disabled={processing} onClick={createBackup}>Start</Button>
            </Col>
          </Row>
         
        </div>
      );


}
