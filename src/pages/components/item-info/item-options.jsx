
import axios from "axios";
import { useState } from "react";
import { Container, Row,Col, Modal } from "react-bootstrap";
import { useNavigate } from "react-router-dom";


function ItemOptions(props) {

  const token = localStorage.getItem('token');
  const [show, setShow] = useState(false);
  const options=[{description:"Purge Cached Item",withActivity:false},{description:"Purge Cached Item and Playback Activity",withActivity:true}];
  const [selectedOption, setSelectedOption] = useState(options[0]);
  const navigate = useNavigate();



  async function execPurge(withActivity) {
    const url=`/api/item/purge`;

    return await axios.delete(url,

        {
        data:{
                id: props.itemid,
                withActivity:withActivity,
            },
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }).then((response) => {
        console.log(response);
        setShow(false);
        navigate(-1);
      }).catch((error) => {
        console.log({error:error,token:token});
      });
  }



  return (
    <div className="Activity">
        <div className="Heading mb-3">
            <h1>Archived Data Options</h1>
        </div>
        <Container className="p-0 m-0">
            {options.map((option, index) => (
                <Row key={index} className="mb-2 me-0">
                    <Col>
                        <span>{option.description}</span>
                    </Col>

                    <Col>
                        <button className="btn btn-danger w-25" onClick={()=>{setSelectedOption(option);setShow(true);}}>Purge</button>
                    </Col>

                </Row>

                ))}

            <Modal show={show} onHide={() =>{setShow(false);}}>
                <Modal.Header closeButton>
                  <Modal.Title>Confirm Action</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>{"Are you sure you want to Purge this item"+(selectedOption.withActivity ? " and Associated Playback Activity?" : "?")}</p>
                </Modal.Body>
                <Modal.Footer>
                  <button className="btn btn-danger" onClick={() => {execPurge(selectedOption.withActivity);}}>
                      Purge
                  </button>
                  <button className="btn btn-primary" onClick={()=>{setShow(false);}}>
                    Close
                  </button>
                </Modal.Footer>
            </Modal>

        </Container>


    </div>
  );
}

export default ItemOptions;
