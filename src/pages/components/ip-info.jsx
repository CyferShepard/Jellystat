import React from "react";
import Loading from "./general/loading";
import { Button, Modal } from "react-bootstrap";

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import axios from "../../lib/axios_instance";
import { Trans } from "react-i18next";

export default function IpInfoModal(props) {
  const token = localStorage.getItem("token");
  const [geodata, setGeodata] = React.useState(null);
  const fetchData = async () => {
    const result = await axios.post(
      `/utils/geolocateIp`,
      {
        ipAddress: props.ipAddress,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );

    setGeodata(result.data);
  };

  if (!geodata && props.show) {
    fetchData();
  }
  let modalBody = <Loading />;

  if (geodata) {
    modalBody = (
      <Modal.Body>
        <div className="StreamInfo">
          <TableContainer className="overflow-hidden">
            <Table aria-label="collapsible table">
              <TableHead>
                <TableRow>
                  <TableCell />
                  <TableCell></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {geodata.city?.names["en"] && (
                  <TableRow>
                    <TableCell className="py-0 pb-1">
                      <Trans i18nKey={"CITY"} />
                    </TableCell>
                    <TableCell>{geodata.city.names["en"]}</TableCell>
                  </TableRow>
                )}
                {geodata.country?.names["en"] && (
                  <TableRow>
                    <TableCell className="py-0 pb-1">
                      <Trans i18nKey={"COUNTRY"} />
                    </TableCell>
                    <TableCell>{geodata.country.names["en"]}</TableCell>
                  </TableRow>
                )}
                {geodata.postal?.code && (
                  <TableRow>
                    <TableCell className="py-0 pb-1">
                      <Trans i18nKey={"POSTCODE"} />
                    </TableCell>
                    <TableCell>{geodata.postal.code}</TableCell>
                  </TableRow>
                )}
                {geodata.traits?.autonomous_system_organization && (
                  <TableRow>
                    <TableCell className="py-0 pb-1">
                      <Trans i18nKey={"ISP"} />
                    </TableCell>
                    <TableCell>{geodata.traits.autonomous_system_organization}</TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
            {geodata.location?.latitude && geodata.location?.longitude && (
              <iframe
                width="100%"
                height="450"
                style={{ border: 0 }}
                loading="async"
                referrerPolicy="no-referrer-when-downgrade"
                src={`https://www.google.com/maps/embed/v1/place?key=AIzaSyAxp7Zvxi5FnTJJHwCnUR-OcZ-E1H2-gf4&q=${geodata.location?.latitude},${geodata.location?.longitude}&zoom=14`}
                allowFullScreen
              ></iframe>
            )}
          </TableContainer>
        </div>
      </Modal.Body>
    );
  }

  return (
    <Modal show={props.show} onHide={() => props.onHide()}>
      <Modal.Header closeButton>
        <Modal.Title>
          <Trans i18nKey={"GEOLOCATION_INFO_FOR"} /> {props.ipAddress}
        </Modal.Title>
      </Modal.Header>
      {modalBody}
      <Modal.Footer>
        <Button variant="outline-primary" onClick={() => props.onHide()}>
          <Trans i18nKey={"CLOSE"} />
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
