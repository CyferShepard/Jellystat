import React, { useState, useEffect } from "react";
import axios from "axios";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Loading from "./components/general/loading";

import "./css/about.css";
import { Card } from "react-bootstrap";

export default function SettingsAbout() {
  const token = localStorage.getItem("token");
  const [data, setData] = useState();

  return (
    <div className="tasks">
      <h1 className="py-3">About Jellystat</h1>
      <Card className="about p-0">
        <Card.Body>
          <Row>
            <Col className="px-0">Github:</Col>
            <Col>
              <a
                href="https://github.com/opspotes/Jellystat"
                target="_blank"
                rel="noreferrer"
              >
                {" "}
                https://github.com/opspotes/Jellystat
              </a>
            </Col>
          </Row>
        </Card.Body>
      </Card>
    </div>
  );
}
