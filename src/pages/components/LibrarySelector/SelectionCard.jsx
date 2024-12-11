import {useState} from "react";
import axios from "../../../lib/axios_instance";
import "../../css/library/library-card.css";

import { Form  ,Card,Row,Col } from 'react-bootstrap';

import TvLineIcon from "remixicon-react/TvLineIcon";
import FilmLineIcon from "remixicon-react/FilmLineIcon";
import FileMusicLineIcon from "remixicon-react/FileMusicLineIcon";
import CheckboxMultipleBlankLineIcon from "remixicon-react/CheckboxMultipleBlankLineIcon";
import { Trans } from "react-i18next";
import baseUrl from "../../../lib/baseurl";

function SelectionCard(props) {
  const [imageLoaded, setImageLoaded] = useState(true);
  const [checked, setChecked] = useState(props.data.Tracked);
  const SeriesIcon=<TvLineIcon size={"50%"} color="white"/> ;
  const MovieIcon=<FilmLineIcon size={"50%"} color="white"/> ;
  const MusicIcon=<FileMusicLineIcon size={"50%"}    color="white"/> ;
  const MixedIcon=<CheckboxMultipleBlankLineIcon size={"50%"}    color="white"/> ;
  const token = localStorage.getItem('token');

  const default_image=<div className="default_library_image-inv d-flex justify-content-center align-items-center">{props.data.CollectionType==='tvshows' ? SeriesIcon : props.data.CollectionType==='movies'? MovieIcon : props.data.CollectionType==='music'? MusicIcon : MixedIcon} </div>;

  const handleChange = async () => {
    await axios
    .post("/api/setExcludedLibraries", {
      libraryID:props.data.Id
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
    .then(()=>
    {
      setChecked(!checked);
    })
    .catch((error) => {
      console.error(error);
    });


  
  };


  return (
      <Card className="bg-transparent lib-card rounded-3">

            <div className="library-card-image">

              {imageLoaded?

               <Card.Img
               variant="top"
               className="library-card-banner default_library_image"
               src={baseUrl+"/proxy/Items/Images/Primary?id=" + props.data.Id + "&fillWidth=800&quality=50"}
               onError={() =>setImageLoaded(false)}
               />
               :
              default_image
              }
            </div>
 


          <Card.Body className="library-card-details-inv rounded-bottom">
            <Row className="space-between-end card-row">
              <Col className="card-label"><Trans i18nKey={"LIBRARY_CARD.LIBRARY"}/></Col>
              <Col className="text-end">{props.data.Name}</Col>
            </Row>

            <Row className="space-between-end card-row">
              <Col className="card-label"><Trans i18nKey={"TYPE"}/></Col>
              <Col className="text-end">{props.data.CollectionType==='tvshows' ? <Trans i18nKey="SERIES" /> : props.data.CollectionType==='movies'? <Trans i18nKey="MOVIES" /> : props.data.CollectionType==='music'? <Trans i18nKey="MUSIC" /> : 'Mixed'}</Col>
            </Row>

            <Row className="space-between-end card-row">

                <Col className="card-label"><Trans i18nKey={"LIBRARY_CARD.TRACKED"}/></Col>
                <Col className="text-end">                    
                    <Form>
                      <Form.Check
                        type="switch"
                        checked={checked}
                        onChange={handleChange}
                      />
                    </Form>
                </Col>
            </Row>

            
          </Card.Body>

      </Card>
  );
}

export default SelectionCard;
