import React from "react";
import Loading from "./general/loading";
import { Button, Modal } from "react-bootstrap";

import Table from '@mui/material/Table';
import TableBody from '@mui/material/TableBody';
import TableCell from '@mui/material/TableCell';
import TableContainer from '@mui/material/TableContainer';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';

export default function IpInfoModal(props) {
    let modalBody = <Loading/>;

    if(props.geodata) {
        modalBody = <Modal.Body>
                        <div className="StreamInfo"> 
                            <TableContainer className="overflow-hidden">
                                <Table aria-label="collapsible table" >
                                    <TableHead>
                                        <TableRow>
                                            <TableCell/>
                                            <TableCell></TableCell>
                                        </TableRow>
                                    </TableHead>
                                    <TableBody>
                                        <TableRow>
                                            <TableCell className="py-0 pb-1">City</TableCell>
                                            <TableCell>{props.geodata.city.names['en']}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="py-0 pb-1">Country</TableCell>
                                            <TableCell>{props.geodata.country.names['en']}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="py-0 pb-1">Postcode</TableCell>
                                            <TableCell>{props.geodata.postal.code}</TableCell>
                                        </TableRow>
                                        <TableRow>
                                            <TableCell className="py-0 pb-1">ISP</TableCell>
                                            <TableCell>{props.geodata.traits.autonomous_system_organization}</TableCell>
                                        </TableRow>
                                    </TableBody>
                                </Table>
                            </TableContainer>
                        </div>
                    </Modal.Body>
    }

    return (
        <div>
            <Modal show={props.show} onHide={() => props.onHide()}>
                <Modal.Header closeButton>
                    <Modal.Title>
                        Geolocation info for {props.ipAddress}
                    </Modal.Title>
                </Modal.Header>                
                {modalBody}
                <Modal.Footer>
                    <Button variant="outline-primary" onClick={()=>props.onHide()}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>
        </div>
    );
}