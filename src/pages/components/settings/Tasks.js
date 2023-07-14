import React, { useState } from "react";
import axios from "axios";
import  Button  from "react-bootstrap/Button";


import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

import { taskList } from "../../../lib/tasklist";


import "../../css/settings/settings.css";

export default function Tasks() {
  const [processing, setProcessing] = useState(false);
  const token = localStorage.getItem('token');

      async function executeTask(url) {


        setProcessing(true);

        await axios
        .get(url, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }).catch((error) => {
           console.log(error);
        });
          setProcessing(false);

      }

    const beginTask = (url) => {

         executeTask(url);
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
      
                        {taskList &&
                         taskList.map((task) => (
                            <TableRow key={task.id}>
                              <TableCell>{task.name}</TableCell>
                              <TableCell>{task.type}</TableCell>
                              <TableCell className="d-flex justify-content-center"> <Button variant={!processing ? "outline-primary" : "outline-light"} disabled={processing} onClick={() => beginTask(task.link)}>Start</Button></TableCell>
                            </TableRow>

                        ))}

                      </TableBody>
                    </Table>
            </TableContainer>
         
        </div>
      );


}
