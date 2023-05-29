import React, { useState,useEffect } from "react";
import axios from "axios";
import Form from 'react-bootstrap/Form';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Button from 'react-bootstrap/Button';
import Alert from 'react-bootstrap/Alert';
import ToggleButton from 'react-bootstrap/ToggleButton';
import ToggleButtonGroup from 'react-bootstrap/ToggleButtonGroup';
import CryptoJS from 'crypto-js';
import EyeFillIcon from 'remixicon-react/EyeFillIcon';
import EyeOffFillIcon from 'remixicon-react/EyeOffFillIcon';

import Config from "../../../lib/config";




import "../../css/settings/settings.css";
import { InputGroup } from "react-bootstrap";

export default function SettingsConfig() {
  const [use_password, setuse_password] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [showCurrentPassword, setShowCurrentPassword] = useState(false);
  const [formValues, setFormValues] = useState({});
  const [isSubmitted, setisSubmitted] = useState("");
  const [config, setConfig] = useState(null);

  const [submissionMessage, setsubmissionMessage] = useState("");
  const token = localStorage.getItem('token');

  useEffect(() => {


    const fetchConfig = async () => {
        try {
          const newConfig = await Config();
          setConfig(newConfig);
          setuse_password(newConfig.requireLogin);
        } catch (error) {
            console.log(error);
        }
      };
  
  
  
    fetchConfig();
  
    const intervalId = setInterval(fetchConfig, 60000 * 5);
    return () => clearInterval(intervalId);
  }, []);


async function updatePassword(_current_password, _new_password) {
    const result = await axios
    .post("/api/updatePassword", {
      current_password:_current_password,
      new_password: _new_password

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

  async function setRequireLogin(requireLogin) {
     await axios
    .post("/api/setRequireLogin", {
        REQUIRE_LOGIN:requireLogin

    }, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
    .then((data)=>
    {
        setuse_password(requireLogin);
    }
    )
    .catch((error) => {
      // let errorMessage= `Error : ${error}`;

    });

  }



  async function handleFormSubmit(event) {
    event.preventDefault();
    setisSubmitted("");
    if(!formValues.JS_PASSWORD || formValues.JS_PASSWORD.length<6)
    {
        setisSubmitted("Failed");
        setsubmissionMessage("Unable to update password: New Password Must be at least 6 characters long");
        return;
    }
    let hashedOldPassword= CryptoJS.SHA3(formValues.JS_C_PASSWORD).toString();
    let hashedNewPassword= CryptoJS.SHA3(formValues.JS_PASSWORD).toString();
    let result = await updatePassword(
       hashedOldPassword,
       hashedNewPassword
    );

    if (result.isValid) {
        setisSubmitted("Success");
        setsubmissionMessage("Successfully updated password");
        return;
    }else
    {
        setisSubmitted("Failed");
        setsubmissionMessage("Unable to update password: "+ result.errorMessage);
        return;
    }
  
  }

  function handleFormChange(event) {
    setFormValues({ ...formValues, [event.target.name]: event.target.value });
  }

    
  function togglePasswordRequired(isRequired){
    // console.log(isRequired);
    setRequireLogin(isRequired);
  };




    return (
      <div>
        <h1>Security</h1>
        <Form onSubmit={handleFormSubmit} className="settings-form">
          <Form.Group as={Row} className="mb-3" >
            <Form.Label column className="">
              Current Password
            </Form.Label>
            <Col sm="10">
                <InputGroup>
                    <Form.Control  id="JS_C_PASSWORD"  name="JS_C_PASSWORD" value={formValues.JS_C_PASSWORD || ""} onChange={handleFormChange} type={showCurrentPassword ? "text" : "password"}/>
                    <Button variant="outline-primary" type="button" onClick={() => setShowCurrentPassword(!showCurrentPassword)}>{showCurrentPassword?<EyeFillIcon/>:<EyeOffFillIcon/>}</Button>
                </InputGroup>
            </Col>
          </Form.Group>

          <Form.Group as={Row} className="mb-3" >
            <Form.Label column className="">
              New Password
            </Form.Label>
            <Col sm="10">
              <InputGroup>
                <Form.Control  id="JS_PASSWORD"  name="JS_PASSWORD" value={formValues.JS_PASSWORD || ""} onChange={handleFormChange} type={showPassword ? "text" : "password"} />
                <Button variant="outline-primary" type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword?<EyeFillIcon/>:<EyeOffFillIcon/>}</Button>
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
              <Button variant="outline-success" type="submit"> Update </Button>
          </div>

        </Form>

        <Form className="settings-form">
         <Form.Group as={Row} className="mb-3">
           <Form.Label column  className="">Require Login</Form.Label>
           <Col >
              <ToggleButtonGroup type="checkbox" className="d-flex" >
                  <ToggleButton variant="outline-primary" active={use_password}  onClick={()=> {togglePasswordRequired(true);}}>Yes</ToggleButton>
                  <ToggleButton variant="outline-primary" active={!use_password}  onClick={()=>{togglePasswordRequired(false);}}>No</ToggleButton>
               </ToggleButtonGroup>
            </Col>  
          </Form.Group>

        </Form>




      </div>
      );


}