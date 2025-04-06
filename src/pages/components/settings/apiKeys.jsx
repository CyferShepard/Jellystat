import React, { useState,useEffect } from "react";
import axios from "../../../lib/axios_instance";
import {Form, Row, Col,ButtonGroup, Button } from 'react-bootstrap';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';



import  Alert  from "react-bootstrap/Alert";



import "../../css/settings/backups.css";
import { Trans } from "react-i18next";

const token = localStorage.getItem('token');


function CustomRow(key) {
  const { data } = key;

  

  async function deleteKey(keyvalue) {
    const url=`/api/keys`;
    axios
    .delete(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      data: {
        key: keyvalue,
      },
    })
    .then((response) => {
      const alert={visible:true,title:'Success',type:'success',message:response.data};
      key.handleRowActionMessage(alert);
    })
    .catch((error) => {
      const alert={visible:true,title:'Error',type:'danger',message:error.response.data};
      key.handleRowActionMessage(alert);
    });


  }



  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>{data.name}</TableCell>
        <TableCell>{data.key}</TableCell>
  
        <TableCell className="">
          <div className="d-flex justify-content-center">
          <Button variant="primary" onClick={()=>deleteKey(data.key)}><Trans i18nKey={"DELETE"}/></Button>
        </div>

        </TableCell>

      </TableRow>
    </React.Fragment>
  );
}


export default function ApiKeys() {
    const [keys, setKeys] = useState([]);
    const [showAlert, setshowAlert] = useState({visible:false,type:'danger',title:'Error',message:''});
    const [rowsPerPage] = React.useState(10);
    const [page, setPage] = React.useState(0);
    const [formValues, setFormValues] = useState({});




    
function handleCloseAlert() {
  setshowAlert({visible:false});
}


useEffect(() => {
    const fetchData = async () => {
      try {
        const apiKeyData = await axios.get(`/api/keys`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        setKeys(apiKeyData.data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchData();

    const intervalId = setInterval(fetchData, 1000 * 5);
    return () => clearInterval(intervalId);
  }, []);


const handleNextPageClick = () => {
  setPage((prevPage) => prevPage + 1);
};

const handlePreviousPageClick = () => {
  setPage((prevPage) => prevPage - 1);
};

const handleRowActionMessage= (alertState) => {
  console.log(alertState);
  setshowAlert({visible:alertState.visible,title:alertState.title,type:alertState.type,message:alertState.message});
};

function handleFormChange(event) {
  setFormValues({ ...formValues, [event.target.name]: event.target.value });
}

async function handleFormSubmit(event) {
  event.preventDefault();
  axios
    .post("/api/keys/", formValues, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
    .then((response) => {
      console.log("API key added successfully:", response.data);
    })
    .catch((error) => {
      console.log("Error adding key:", error);
    });
}

      

    
      return (
        <div>
          <h1 className="my-2"><Trans i18nKey={"SETTINGS_PAGE.API_KEYS"}/></h1>
            {showAlert && showAlert.visible && (
                <Alert bg="dark" data-bs-theme="dark" variant={showAlert.type} onClose={handleCloseAlert} dismissible>
                  <Alert.Heading>{showAlert.title}</Alert.Heading>
                  <p>
                  {showAlert.message}
                  </p>
                </Alert>
            )}


        <Form onSubmit={handleFormSubmit} className="settings-form">
          
          <Form.Group as={Row} className="mb-3" >
            <Form.Label column>
            <Trans i18nKey={"SETTINGS_PAGE.KEY_NAME"} style={{textTransform:"uppercase"}}/>
            </Form.Label>
            <Col sm="6" md="8">
              <Form.Control className="w-100"  id="name"  name="name" value={formValues.name || ""} onChange={handleFormChange}  placeholder="API Name" />
            </Col>
            <Col sm="4" md="2" className="mt-2 mt-sm-0">
            <Button variant="outline-primary" type="submit" className="w-100"><Trans i18nKey={"SETTINGS_PAGE.ADD_KEY"}/></Button>
            </Col>

          </Form.Group>


        </Form>

            <TableContainer className='rounded-2'>
                    <Table aria-label="collapsible table" >
                      <TableHead>
                        <TableRow>
                          <TableCell><Trans i18nKey={"SETTINGS_PAGE.NAME"}/></TableCell>
                          <TableCell><Trans i18nKey={"SETTINGS_PAGE.KEY"}/></TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {keys && keys.sort((a, b) => a.name-b.name).slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                          .map((apikey,index) => (
                            <CustomRow key={index} data={apikey} handleRowActionMessage={handleRowActionMessage}/>
                          ))}
                          {keys.length===0 ? <tr><td colSpan="3" style={{ textAlign: "center", fontStyle: "italic" ,color:"grey", height:"200px"}}  className='py-2'><Trans i18nKey={"ERROR_MESSAGES.NO_API_KEYS"}/></td></tr> :''}

                      </TableBody>
                    </Table>
            </TableContainer>

            <div className='d-flex justify-content-end my-2'>
              


                <ButtonGroup className="pagination-buttons">
                    <Button className="page-btn" onClick={()=>setPage(0)} disabled={page === 0}>
                    <Trans i18nKey={"TABLE_NAV_BUTTONS.FIRST"}/>
                    </Button>

                    <Button className="page-btn" onClick={handlePreviousPageClick}  disabled={page === 0}>
                    <Trans i18nKey={"TABLE_NAV_BUTTONS.PREVIOUS"}/>
                    </Button>

                    <div className="page-number d-flex align-items-center justify-content-center">{`${page *rowsPerPage + 1}-${Math.min((page * rowsPerPage+ 1 ) +  (rowsPerPage - 1),keys.length)} of ${keys.length}`}</div>

                    <Button className="page-btn" onClick={handleNextPageClick}  disabled={page >= Math.ceil(keys.length / rowsPerPage) - 1}>
                    <Trans i18nKey={"TABLE_NAV_BUTTONS.NEXT"}/>
                    </Button>

                    <Button className="page-btn" onClick={()=>setPage(Math.ceil(keys.length / rowsPerPage) - 1)} disabled={page >= Math.ceil(keys.length / rowsPerPage) - 1}>
                    <Trans i18nKey={"TABLE_NAV_BUTTONS.LAST"}/>
                    </Button>
                </ButtonGroup>
            </div>       
        </div>
      );


}