import React, { useState, useEffect } from "react";
import axios from "axios";
// import  Button  from "react-bootstrap/Button";
// import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Loading from "./components/general/loading";


import "./css/about.css";
import { Card } from "react-bootstrap";

export default function SettingsAbout() {

  const token = localStorage.getItem('token');
  const [data, setData] = useState();
  useEffect(() => {

    const fetchVersion = () => {
      if (token) {
        const url = `/api/CheckForUpdates`;

        axios
        .get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        })
          .then((data) => {
            setData(data.data);
          })
          .catch((error) => {
            console.log(error);
          });
      }
    };

    if(!data)
    {
        fetchVersion();
    }

    const intervalId = setInterval(fetchVersion, 60000 * 5);
    return () => clearInterval(intervalId);
  }, [data,token]);
    

  if(!data)
  {
    return <Loading/>;
  }


    return (
      <div className="tasks">
        <h1 className="py-3">About Jellystat</h1>
    <Card  className="about p-0" >
       <Card.Body >
            <Row>
                 <Col className="px-0">
                  Version:
                 </Col>
                 <Col>
                 {data.current_version}
                 </Col>
             </Row>
             <Row style={{color:(data.update_available ? "#00A4DC": "White")}}>
                 <Col className="px-0">
                  Update Available:
                 </Col>
                 <Col>
                 {data.message}
                 </Col>
             </Row>
             <Row style={{height:'20px'}}></Row>
             <Row>
                 <Col className="px-0">
                  Github:
                 </Col>
                 <Col>
                 <a href="https://github.com/CyferShepard/Jellystat" target="_blank" rel="noreferrer" > https://github.com/CyferShepard/Jellystat</a>
                 </Col>
             </Row>
       </Card.Body>
   </Card>
   </div>
    );


}
