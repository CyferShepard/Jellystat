import React, {useState} from "react";
import { Blurhash } from 'react-blurhash';
import { Link } from "react-router-dom";
import Card from 'react-bootstrap/Card';

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


  return (
    <Card  style={cardStyle}>
      <div  style={cardBgStyle} >

      
        {props.icon ?
        <div className="stat-card-image">
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
              className="stat-card-image"
              src={props.base_url + "/Items/" + props.data[0].Id + "/Images/Primary?fillWidth=400&quality=90"}
              style={{ display: loaded ? 'block' : 'none' }}
              onLoad={handleImageLoad}
              onError={() => setLoaded(false)}
            />
          </>
        }
      
        <Card.Body className="px-1">
          <Card.Header className="d-flex justify-content-between border-0 bg-transparent">
            <div>
              <Card.Subtitle className="stat-items">{props.heading}</Card.Subtitle>
            </div>
            <div>
              <Card.Subtitle className="stat-items">{props.units}</Card.Subtitle>
            </div>
          </Card.Header>

          {props.data &&
          props.data.map((item, index) => (
            <div className="d-flex justify-content-between p-1 stat-items" key={item.Id || index}>

              <div className="d-flex justify-content-between" key={item.Id || index}>
                <Card.Text className="stat-item-index">{index + 1}</Card.Text>
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
        </div>
    </Card>
  );
}

export default ItemStatComponent;
