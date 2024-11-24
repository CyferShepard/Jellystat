import React, { useEffect } from "react";
import axios from "../../../lib/axios_instance";
import {ButtonGroup, Button } from 'react-bootstrap';

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import Collapse from '@mui/material/Collapse';
import IconButton from '@mui/material/IconButton';
import Box from '@mui/material/Box';

import AddCircleFillIcon from 'remixicon-react/AddCircleFillIcon';
import IndeterminateCircleFillIcon from 'remixicon-react/IndeterminateCircleFillIcon';



import "../../css/settings/backups.css";

import TerminalComponent from "./TerminalComponent";
import { Trans } from "react-i18next";

const token = localStorage.getItem('token');


function Row(logs) {
  const { data } = logs;
  const [open, setOpen] = React.useState(false);


  const twelve_hr = JSON.parse(localStorage.getItem('12hr'));

  const options = {
    day: "numeric",
    month: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "numeric",
    second: "numeric",
    hour12: twelve_hr,
  };


  
function formatDurationTime(seconds) {
  if(seconds==='0')
  {
    return '0 second'; 
  }

  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  let timeString = '';

  if (hours > 0) {
    timeString += `${hours} ${hours === 1 ? 'hr' : 'hrs'} `;
  }

  if (minutes > 0) {
    timeString += `${minutes} ${minutes === 1 ? 'min' : 'mins'} `;
  }

  if (remainingSeconds > 0) {
    timeString += `${remainingSeconds} ${remainingSeconds === 1 ? 'second' : 'seconds'}`;
  }

  return timeString.trim();
}


  return (
    <React.Fragment>
      <TableRow sx={{ '& > *': { borderBottom: 'unset' } }}>
        <TableCell>
          <IconButton
            aria-label="expand row"
            size="small"
            onClick={() => {if(data.Log !== null && data.Log.length>0){setOpen(!open);}}}
            >
              {!open ? <AddCircleFillIcon opacity={data.Log !== null && data.Log.length>0 ?1 : 0} cursor={data.Log !== null && data.Log.length>1 ? "pointer":"default"}/> : <IndeterminateCircleFillIcon />}
          </IconButton>
        </TableCell>
        <TableCell>{data.Name}</TableCell>
        <TableCell>{data.Type}</TableCell>
        <TableCell>{Intl.DateTimeFormat('en-UK', options).format(new Date(data.TimeRun))}</TableCell>
        <TableCell>{formatDurationTime(data.Duration)}</TableCell>
        <TableCell>{data.ExecutionType}</TableCell>
        <TableCell><div className={`badge ${ data.Result.toLowerCase() ==='success' ? 'text-bg-success' : data.Result.toLowerCase() ==='running' ? 'text-bg-warning' : 'text-bg-danger '} rounded-pill text-uppercase`} >{data.Result}</div></TableCell>

      </TableRow>
      <TableRow>
        <TableCell style={{ paddingBottom: 0, paddingTop: 0 }} colSpan={7}>
          <Collapse in={open} timeout="auto" unmountOnExit>
            <Box sx={{ margin: 1 }}>

              <Table aria-label="sub-activity" className='rounded-2'>

                <TableBody>
                <TableRow key={data.Id}>
                        <TableCell colSpan="7" ><TerminalComponent data={data.Log}/></TableCell>
                    </TableRow>
                </TableBody>
              </Table>
            </Box>
          </Collapse>
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}


export default function Logs() {

    const [data, setData]=React.useState([]);
    const [rowsPerPage] = React.useState(10);
    const [page, setPage] = React.useState(0);





useEffect(() => {
    const fetchData = async () => {
      try {
        const logs = await axios.get(`/logs/getLogs`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        setData(logs.data);
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
      

    
      return (
        <div>
          <h1 className="my-2"><Trans i18nKey={"SETTINGS_PAGE.LOGS"}/></h1>

            <TableContainer className='rounded-2'>
                    <Table aria-label="collapsible table" >
                      <TableHead>
                        <TableRow>
                        <TableCell/>
                          <TableCell><Trans i18nKey={"SETTINGS_PAGE.NAME"}/></TableCell>
                          <TableCell><Trans i18nKey={"TYPE"}/></TableCell>
                          <TableCell><Trans i18nKey={"DATE"}/></TableCell>
                          <TableCell><Trans i18nKey={"SETTINGS_PAGE.DURATION"}/></TableCell>
                          <TableCell><Trans i18nKey={"SETTINGS_PAGE.EXECUTION_TYPE"}/></TableCell>
                          <TableCell><Trans i18nKey={"SETTINGS_PAGE.RESULTS"}/></TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {data && data.sort((a, b) =>new Date(b.TimeRun) - new Date(a.TimeRun)).slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                          .map((log,index) => (
                            <Row key={index} data={log} />
                          ))}
                          {data.length===0 ? <tr><td colSpan="7" style={{ textAlign: "center", fontStyle: "italic" ,color:"grey"}}  className='py-2'><Trans i18nKey={"ERROR_MESSAGES.NO_LOGS"}/></td></tr> :''}

                            
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

                    <div className="page-number d-flex align-items-center justify-content-center">{`${page *rowsPerPage + 1}-${Math.min((page * rowsPerPage+ 1 ) +  (rowsPerPage - 1),data.length)} of ${data.length}`}</div>

                    <Button className="page-btn" onClick={handleNextPageClick}  disabled={page >= Math.ceil(data.length / rowsPerPage) - 1}>
                    <Trans i18nKey={"TABLE_NAV_BUTTONS.NEXT"}/>
                    </Button>

                    <Button className="page-btn" onClick={()=>setPage(Math.ceil(data.length / rowsPerPage) - 1)} disabled={page >= Math.ceil(data.length / rowsPerPage) - 1}>
                    <Trans i18nKey={"TABLE_NAV_BUTTONS.LAST"}/>
                    </Button>
                </ButtonGroup>
            </div>       
        </div>
      );


}