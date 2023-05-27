import React from "react";
import { Link } from "react-router-dom";
import { Row, Col, Card } from "react-bootstrap";

function LibraryStatComponent(props) {

  if (props.data.length === 0) {
    return <></>;
  }

  const cardStyle = {
    backgroundImage: `url(${props.base_url}/Items/${props.data[0].Id}/Images/Backdrop/?fillWidth=300&quality=10), linear-gradient(to right, #00A4DC, #AA5CC3)`,
    height:'100%',
    backgroundSize: 'cover',
  };

  const cardBgStyle = {
    // backdropFilter: 'blur(5px)',
    backgroundColor: 'rgb(0, 0, 0, 0.6)',
    height:'100%',
  };


  return (
    <Card className="stat-card rounded-3" style={cardStyle}>
    <div style={cardBgStyle} className="rounded-3">
      <Row className="h-100">
        
        <Col className="d-none d-lg-block stat-card-banner">
          <div className="stat-card-icon">
              {props.icon} 
          </div>
        </Col>

        <Col  className="w-100">
          <Card.Body  className="w-100" >
          <Card.Header className="d-flex justify-content-between border-0 p-0 bg-transparent stat-header">
              <div>
                <Card.Subtitle className="stat-items">{props.heading}</Card.Subtitle>
              </div>
              <div>
                <Card.Subtitle className="stat-items fw-lighter text-end">{props.units}</Card.Subtitle>
              </div>
            </Card.Header>
            {props.data &&
            props.data.map((item, index) => (
              <div className="d-flex justify-content-between  stat-items" key={item.Id || index}>
              
                <div className="d-flex justify-content-between">
                  <Card.Text className="stat-item-index m-0">{index + 1}</Card.Text>
                  <Link to={`/libraries/${item.Id}`}><Card.Text>{item.Name}</Card.Text></Link>
                </div>
                
                <Card.Text className="stat-item-count">
                {item.CollectionType ==='tvshows'? (item.Library_Count+' / '+item.Season_Count+' / '+item.Episode_Count): item.Library_Count}
                </Card.Text>
                
              </div>
            ))}
          </Card.Body>
        </Col>
      </Row>
  </div>
</Card>
  );
}

export default LibraryStatComponent;
