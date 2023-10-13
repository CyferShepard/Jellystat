import React, { useState, useEffect } from "react";

import axios from "axios";
import Config from "../lib/config";
import CryptoJS from 'crypto-js';
import "./css/setup.css";
import Loading from "./components/general/loading";
import Form from 'react-bootstrap/Form';
import Button from 'react-bootstrap/Button';
import { InputGroup,Row } from "react-bootstrap";

import EyeFillIcon from 'remixicon-react/EyeFillIcon';
import EyeOffFillIcon from 'remixicon-react/EyeOffFillIcon';
import logo_dark from './images/icon-b-512.png';



function Signup() {
  const [config, setConfig] = useState(null);
  const [formValues, setFormValues] = useState({});
  const [processing, setProcessing] = useState(false);
  const [submitButtonText, setsubmitButtonText] = useState("Create User");
  const [showPassword, setShowPassword] = useState(false);

  function handleFormChange(event) {
    setFormValues({ ...formValues, [event.target.name]: event.target.value });
  }


  async function handleFormSubmit(event) {
    setProcessing(true);
    event.preventDefault();

    let hashedPassword= CryptoJS.SHA3(formValues.JS_PASSWORD).toString();

    // Send a POST request to /api/setconfig/ with the updated configuration
    axios
      .post("/auth/createuser",
      {
        username:formValues.JS_USERNAME,
        password: hashedPassword

      }, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then(async (response) => {

        localStorage.setItem('token',response.data.token);
        setsubmitButtonText("Settings Saved");
        setProcessing(false);
        window.location.reload();
        return;
      })
      .catch((error) => {
        let errorMessage= `Error : ${error.response.status}`;
        if (error.code === "ERR_NETWORK") {
          errorMessage = `Unable to connect to Jellyfin Server`;
        } else if (error.response.status === 401) {
          errorMessage = `Error ${error.response.status} Unauthorized`;
        } else if (error.response.status === 404) {
          errorMessage = `Error ${error.response.status}: The requested URL was not found.`;
        }
        setsubmitButtonText(errorMessage);
        setProcessing(false);
      });
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

    if (!config) {
      fetchConfig();
    }
  }, [config]);

  if(!config)
  {
    return <Loading/>;
  }

  return (
    <section>
    <div className="form-box d-flex flex-column">
    <img src={logo_dark} style={{height:"100px"}} className="px-2" alt=''/>
    <h1>Jellystat</h1>
    <span className="fts-text">First Time Setup Step 1 of 2</span>

      <Form onSubmit={handleFormSubmit} className="mt-5">
        <Form.Group as={Row} className="inputbox" >

          
            <Form.Control  id="JS_USERNAME"  name="JS_USERNAME" value={formValues.JS_USERNAME || ""} onChange={handleFormChange} placeholder=" "/>
          
          <Form.Label column>
            Username
          </Form.Label>
        </Form.Group>

        <Form.Group as={Row} className="inputbox" >

          <InputGroup >
            <Form.Control className="px-0"  id="JS_PASSWORD"  name="JS_PASSWORD" value={formValues.JS_PASSWORD || ""} onChange={handleFormChange} type={showPassword ? "text" : "password"} placeholder=" " />
            <Button className="login-show-password" type="button" onClick={() => setShowPassword(!showPassword)}>{showPassword?<EyeFillIcon/>:<EyeOffFillIcon/>}</Button>
            <Form.Label column >
            Password
          </Form.Label>
          </InputGroup>

        </Form.Group>


        <Button type="submit" className="setup-button">
            {processing ? "Validating..." : submitButtonText}
        </Button>

      </Form>
      </div>
    </section>
  );
}

export default Signup;
