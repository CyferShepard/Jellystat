import React, { useState, useEffect } from "react";
import axios from "axios";
import Config from "../../../lib/config";
import Loading from "../general/loading";
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import ToggleButton from 'react-bootstrap/ToggleButton';
import ToggleButtonGroup from 'react-bootstrap/ToggleButtonGroup';

import EyeFillIcon from 'remixicon-react/EyeFillIcon';
import EyeOffFillIcon from 'remixicon-react/EyeOffFillIcon';



import "../../css/settings/settings.css";
import {  InputGroup } from "react-bootstrap";

export default function SettingsConfig() {
  const [config, setConfig] = useState(null);
  const [showKey, setKeyState] = useState(false);
  const [formValues, setFormValues] = useState({});
  const [isSubmitted, setisSubmitted] = useState("");
  const [loadSate, setloadSate] = useState("Loading");
  const [submissionMessage, setsubmissionMessage] = useState("");
  const token = localStorage.getItem('token');
  const [twelve_hr, set12hr] = useState(localStorage.getItem('12hr') === 'true');

  const storage_12hr = localStorage.getItem('12hr');

  if(storage_12hr===null)
  {
    localStorage.setItem('12hr',false);
    set12hr(false);
  }else if(twelve_hr===null){
    set12hr(Boolean(storage_12hr));
  }

  useEffect(() => {
    Config()
      .then((config) => {
        setFormValues({ JF_HOST: config.hostUrl, JF_API_KEY: config.apiKey });
        setConfig(config);
        setloadSate("Loaded");
      })
      .catch((error) => {
        console.log("Error updating config:", error);
        setloadSate("Critical");
        setsubmissionMessage(
          "Error Retrieving Configuration. Unable to contact Backend Server"
        );
      });
  }, []);

  async function validateSettings(_url, _apikey) {
    const result = await axios
    .post("/api/validateSettings", {
      url:_url,
      apikey: _apikey

    }, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
    .catch((error) => {
      // let errorMessage= `Error : ${error}`;
    });

    let data=result.data;
    return { isValid:data.isValid, errorMessage:data.errorMessage} ;
  }

  async function handleFormSubmit(event) {
    event.preventDefault();
    let validation = await validateSettings(
      formValues.JF_HOST,
      formValues.JF_API_KEY
    );
    
    if (!validation.isValid) {
      setisSubmitted("Failed");
      setsubmissionMessage(validation.errorMessage);
      return;
    }

    setisSubmitted("");
    axios
      .post("/api/setconfig/", formValues, {
        headers: {
          Authorization: `Bearer ${config.token}`,
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        console.log("Config updated successfully:", response.data);
        setisSubmitted("Success");
        setsubmissionMessage("Successfully updated configuration");
      })
      .catch((error) => {
        console.log("Error updating config:", error);
        setisSubmitted("Failed");
        setsubmissionMessage("Error Updating Configuration: ", error);
      });
  }

  function handleFormChange(event) {
    setFormValues({ ...formValues, [event.target.name]: event.target.value });
  }
  if (loadSate === "Loading") {
    return <Loading />;
  }

  if (loadSate === "Critical") {
    return <div className="submit critical">{submissionMessage}</div>;
  }

    
  function toggle12Hr(is_12_hr){
    set12hr(is_12_hr);
    localStorage.setItem('12hr',is_12_hr);
  };




    return (
      <div>
        <h1>Settings</h1>
        <Form onSubmit={handleFormSubmit} className="settings-form">
          <Form.Group as={Row} className="mb-3" >
            <Form.Label column className="">
              Jellyfin Url
            </Form.Label>
            <Col sm="10">
              <Form.Control  id="JF_HOST"  name="JF_HOST" value={formValues.JF_HOST || ""} onChange={handleFormChange}  placeholder="http://127.0.0.1:8096 or http://example.jellyfin.server" />
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="mb-3">
            <Form.Label column  className="">
              API Key
            </Form.Label>
            <Col sm="10">
            <InputGroup>
              <Form.Control id="JF_API_KEY"  name="JF_API_KEY"  value={formValues.JF_API_KEY || ""} onChange={handleFormChange} type={showKey ? "text" : "password"} />
              <Button variant="outline-primary" type="button" onClick={() => setKeyState(!showKey)}>{showKey?<EyeFillIcon/>:<EyeOffFillIcon/>}</Button>
            </InputGroup> 
            </Col>
          </Form.Group>
          {isSubmitted !== "" ? (

                  isSubmitted === "Failed" ?
                        <Alert variant="danger">
                             {submissionMessage}
                        </Alert>
                  :
                        <Alert variant="success" >
                             {submissionMessage}
                        </Alert>
          ) : (
            <></>
          )}
          <div className="d-flex flex-column flex-md-row justify-content-end align-items-md-center">
          <Button variant="outline-success" type="submit"> Save </Button>
          </div>

        </Form>

        <Form className="settings-form">
         <Form.Group as={Row} className="mb-3">
           <Form.Label column  className="">Hour Format</Form.Label>
           <Col >
              <ToggleButtonGroup type="checkbox" className="d-flex" >
                  <ToggleButton variant="outline-primary" active={twelve_hr}  onClick={()=> {toggle12Hr(true);}}>12 Hours</ToggleButton>
                  <ToggleButton variant="outline-primary" active={!twelve_hr}  onClick={()=>{toggle12Hr(false);}}>24 Hours</ToggleButton>
               </ToggleButtonGroup>
            </Col>  
          </Form.Group>

        </Form>




      </div>
      );


}