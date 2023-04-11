import React, {useState} from "react";
import { Blurhash } from 'react-blurhash';
import { Link } from "react-router-dom";
import Card from 'react-bootstrap/Card';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';

function ItemStatComponent(props) {
  const [loaded, setLoaded] = useState(false);

  const handleImageLoad = () => {
    setLoaded(true);
  }



  const cardStyle = {
    backgroundImage: `url(${props.base_url}/Items/${props.data[0].Id}/Images/Backdrop/?fillWidth=300&quality=10), linear-gradient(to right, #00A4DC, #AA5CC3)`,
    height:'100%',
    backgroundSize: 'cover',
  };

  const cardBgStyle = {
    backdropFilter: 'blur(10px)',
    backgroundColor: 'rgb(0, 0, 0, 0.6)',
    height:'100%',
  };


  if (props.data.length === 0) {
    return <></>;
  }


  return (
    <Card className="stat-card" style={cardStyle}>
      <div style={cardBgStyle}>
        <Row className="h-100">
          <Col className="d-none d-lg-block stat-card-banner">
          {props.icon ?
            <div className="stat-card-icon">
                {props.icon} 
            </div>
              :
              <>
                {!loaded && (
                  <div className="position-absolute w-100 h-100">
                    <Blurhash hash={props.data[0].PrimaryImageHash} width="100%" height="100%" />
                  </div>
                )}
                <Card.Img
                  variant="top"
                  className="stat-card-image rounded-0"
                  src={props.base_url + "/Items/" + props.data[0].Id + "/Images/Primary?fillWidth=400&quality=90"}
                  style={{ display: loaded ? 'block' : 'none' }}
                  onLoad={handleImageLoad}
                  onError={() => setLoaded(false)}
                />
              </>
            }

          </Col>
          <Col  className="stat-card-info w-100">
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
                
                  <div className="d-flex justify-content-between" key={item.Id || index}>
                    <Card.Text className="stat-item-index m-0">{index + 1}</Card.Text>
                    {item.UserId ? 
                    <Link to={`/users/${item.UserId}`}>
                      <Card.Text>{item.Name}</Card.Text>
                    </Link>
                    :
                    <Card.Text>{item.Name || item.Client}</Card.Text>
                    }
                  </div>
                  
                  <Card.Text className="stat-item-count">
                  {item.Plays || item.unique_viewers}
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

export default ItemStatComponent;
