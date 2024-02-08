import { useState, useEffect } from "react";
import axios from "axios";
import ActivityTable from "../activity/activity-table";
import { Trans } from "react-i18next";

function UserActivity(props) {
  const [data, setData] = useState();
  const token = localStorage.getItem('token');
  const [itemCount,setItemCount] = useState(10);

  useEffect(() => {

    const fetchData = async () => {
      try {
        const itemData = await axios.post(`/api/getUserHistory`, {
         userid: props.UserId,
        }, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        setData(itemData.data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchData();

    const intervalId = setInterval(fetchData, 60000 * 5);
    return () => clearInterval(intervalId);
  }, [ props.UserId,token]);


  if (!data) {
    return <></>;
  }

  return (
    <div className="Activity">
    <div className="Heading">
    <h1><Trans i18nKey="USERS_PAGE.USER_ACTIVITY"/></h1>
    <div className="pagination-range">
        <div className="header"><Trans i18nKey="UNITS.ITEMS"/></div>
        <select value={itemCount} onChange={(event) => {setItemCount(event.target.value);}}>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
      </div>
    </div>
    <div className="Activity">
      <ActivityTable data={data} itemCount={itemCount}/>


  </div>
  </div>
  );
}

export default UserActivity;
