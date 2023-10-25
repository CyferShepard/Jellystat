import React from "react";
import Loading from "./general/loading";
import Modal from 'react-bootstrap/Modal';

export default function IpInfoModal(props) {
    let modalBody = <Loading/>;

    if(props.geodata) {
        modalBody = <Modal.Body className="card">
                        <p className="card-text">City: {props.geodata.city.names['en']}</p>
                        <p className="card-text">Country: {props.geodata.country.names['en']}</p>
                        <p className="card-text">Postcode: {props.geodata.postal.code}</p>
                        <p className="card-text">ISP: {props.geodata.traits.autonomous_system_organization}</p>
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
            </Modal>
        </div>
    );
}