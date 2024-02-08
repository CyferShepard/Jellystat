import {useState} from "react";
import axios from "axios";
import "../../css/error.css";
import { Button } from "react-bootstrap";
import Loading from "../general/loading";
import { Trans } from "react-i18next";

function ItemNotFound(props) {
  const [itemId] = useState(props.itemId);
  const [loading,setLoading] = useState(false);
  const token = localStorage.getItem('token');

  async function fetchItem() {
    setLoading(true);
    const result = await axios
    .post("/sync/fetchItem", {
      itemId:itemId
    }, {
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
    })
    .catch((error) => {
      setLoading(false);
      console.log(error);
    });

    if(result)
    {
     
      await props.fetchdataMethod();
      setLoading(false);
      
    }


  }

  if(loading)
  {
    return <Loading/>;
  }

  

  return (
    <div className="error">
      <h1 className="error-title">{props.message}</h1>

      <Button variant="primary"  className="mt-3" onClick={()=> fetchItem()}><Trans i18nKey="ERROR_MESSAGES.FETCH_THIS_ITEM"/></Button>
    </div>
  );
}

export default ItemNotFound;