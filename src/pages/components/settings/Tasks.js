import React, { useState } from "react";
import axios from "axios";
import  Button  from "react-bootstrap/Button";


import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';


import "../../css/settings/settings.css";

export default function Tasks() {
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
        <div className="tasks">
          <h1 className="py-3">Tasks</h1>

<TableContainer className='rounded-2'>
                    <Table aria-label="collapsible table" >
                      <TableHead>
                        <TableRow>
                          <TableCell>Task</TableCell>
                          <TableCell>Type</TableCell>
                          <TableCell></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>

                            <TableRow>
                              <TableCell>Synchronize with Jellyfin</TableCell>
                              <TableCell>Import</TableCell>
                              <TableCell className="d-flex justify-content-center"> <Button variant={!processing ? "outline-primary" : "outline-light"} disabled={processing} onClick={handleClick}>Start</Button></TableCell>
                            </TableRow>

                            <TableRow>
                              <TableCell>Backup Jellystat</TableCell>
                              <TableCell>Process</TableCell>
                              <TableCell  className="d-flex justify-content-center"><Button variant={!processing ? "outline-primary" : "outline-light"} disabled={processing} onClick={createBackup}>Start</Button></TableCell>
                            </TableRow>
                            
                      </TableBody>
                    </Table>
            </TableContainer>
         
        </div>
      );


}
