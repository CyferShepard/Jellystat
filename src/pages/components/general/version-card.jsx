import { useState, useEffect } from "react";
import axios from "../../../lib/axios_instance";
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

import "../../css/settings/version.css";
import { Card } from "react-bootstrap";
import { Trans } from "react-i18next";

export default function VersionCard() {

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
    return <></>;
  }


    return (
    <Card  className="d-none d-md-block version rounded-0 border-0" >
       <Card.Body>
            <Row>
                 <Col><Trans i18nKey="JELLYSTAT"/> {data.current_version}</Col>
             </Row>
             

            {data.update_available?
              <Row>
                   <Col ><a href="https://github.com/CyferShepard/Jellystat" target="_blank"  rel="noreferrer"  style={{color:'#00A4DC'}}><Trans i18nKey="NEW_VERSION_AVAILABLE"/>: {data.latest_version}</a></Col>
               </Row>
               :
               <></>
            }

       </Card.Body>
   </Card>
    );


}
