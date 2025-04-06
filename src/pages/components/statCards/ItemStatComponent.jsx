/* eslint-disable react/prop-types */
import { useState } from "react";
import { Blurhash } from "react-blurhash";
import { Link } from "react-router-dom";
import Card from "react-bootstrap/Card";
import Row from "react-bootstrap/Row";
import Col from "react-bootstrap/Col";
import Tooltip from "@mui/material/Tooltip";
import ArchiveDrawerFillIcon from "remixicon-react/ArchiveDrawerFillIcon";
import "../../css/items/item-stat-component.css";
import "../../css/statCard.css";

function ItemStatComponent(props) {
  const [loaded, setLoaded] = useState(false);

  const handleImageLoad = () => {
    setLoaded(true);
  };

  const backgroundImage = `/proxy/Items/Images/Backdrop?id=${props.data[0].Id}&fillWidth=300&quality=10`;

  const cardStyle = {
    backgroundImage: `url(${backgroundImage}), linear-gradient(to right, #00A4DC, #AA5CC3)`,
    height: "100%",
    backgroundSize: "cover",
  };

  const cardBgStyle = {
    backdropFilter: props.base_url ? "blur(5px)" : "blur(0px)",
    backgroundColor: "rgb(0, 0, 0, 0.6)",
    height: "100%",
  };

  if (props.data.length === 0) {
    return <></>;
  }

  return (
    <Card className="stat-card rounded-2" style={cardStyle}>
      <div style={cardBgStyle} className="rounded-2">
        <Row className="row-max-witdh rounded-2 no-gutters">
          <Col className="d-none d-lg-block stat-card-banner px-0">
            {props.icon ? (
              <div className="stat-card-icon">{props.icon}</div>
            ) : (
              <>
                {!props.data[0].archived &&
                  props.data &&
                  props.data[0] &&
                  props.data[0].PrimaryImageHash &&
                  props.data[0].PrimaryImageHash != null &&
                  !loaded && (
                    <div className="position-absolute w-100 h-100">
                      <Blurhash hash={props.data[0].PrimaryImageHash} height={"100%"} className="rounded-3 overflow-hidden" />
                    </div>
                  )}
                {!props.data[0].archived ? (
                  <Card.Img
                    className={
                      props.isAudio ? "stat-card-image-audio rounded-0 rounded-start" : "stat-card-image rounded-0 rounded-start"
                    }
                    src={"proxy/Items/Images/Primary?id=" + props.data[0].Id + "&fillWidth=400&quality=90"}
                    style={{ display: loaded ? "block" : "none" }}
                    onLoad={handleImageLoad}
                    onError={() => setLoaded(false)}
                  />
                ) : (
                  <div>
                    {props.data && props.data[0] && props.data[0].PrimaryImageHash && props.data[0].PrimaryImageHash != null && (
                      <Blurhash
                        hash={props.data[0].PrimaryImageHash}
                        height={"180px"}
                        className="rounded-3 overflow-hidden position-absolute"
                      />
                    )}
                    <div className="d-flex flex-column justify-content-center align-items-center  stat-card-image position-absolute">
                      <ArchiveDrawerFillIcon className="w-100 h-100" />
                      <span>Archived</span>
                    </div>
                  </div>
                )}
              </>
            )}
          </Col>
          <Col className="stat-card-details px-0">
            <Card.Body className="w-100">
              <Card.Header className="d-flex justify-content-between border-0 p-0 bg-transparent">
                <div>
                  <Card.Subtitle className="stat-items">{props.heading}</Card.Subtitle>
                </div>
                <div>
                  <Card.Subtitle className="stat-items fw-lighter text-end">{props.units}</Card.Subtitle>
                </div>
              </Card.Header>
              {props.data &&
                props.data.slice(0, 5).map((item, index) => (
                  <div className="d-flex justify-content-between  stat-items" key={item.Id || index}>
                    <div className="d-flex justify-content-between" key={item.Id || index}>
                      <Card.Text className="stat-item-index m-0">{index + 1}</Card.Text>
                      {item.UserId ? (
                        <Link to={`/users/${item.UserId}`} className="item-name">
                          <Tooltip title={item.Name}>
                            <Card.Text className="item-text">{item.Name}</Card.Text>
                          </Tooltip>
                        </Link>
                      ) : !item.Client && !props.icon ? (
                        <Link to={`/libraries/item/${item.Id}`} className="item-name">
                          <Tooltip title={item.Name}>
                            <Card.Text className="item-text">{item.Name}</Card.Text>
                          </Tooltip>
                        </Link>
                      ) : !item.Client && props.icon ? (
                        item.Id ? (
                          <Link to={`/libraries/${item.Id}`} className="item-name">
                            <Tooltip title={item.Name}>
                              <Card.Text className="item-text">{item.Name}</Card.Text>
                            </Tooltip>
                          </Link>
                        ) : (
                          <Tooltip title={item.Name}>
                            <Card.Text className="item-text">{item.Name}</Card.Text>
                          </Tooltip>
                        )
                      ) : (
                        <Tooltip title={item.Client}>
                          <Card.Text className="item-text">{item.Client}</Card.Text>
                        </Tooltip>
                      )}
                    </div>

                    <Card.Text className="stat-item-count">{item.Plays || item.unique_viewers || item.Count}</Card.Text>
                  </div>
                ))}
            </Card.Body>
          </Col>
        </Row>
      </div>
    </Card>
  );
}

export default ItemStatComponent;
