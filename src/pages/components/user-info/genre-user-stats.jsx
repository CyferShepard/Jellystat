import { useState, useEffect } from "react";
import { Row, Col } from "react-bootstrap";
import GenreStatCard from "../statCards/genre-stat-card.jsx";
import { Trans } from "react-i18next";
import "../../css/genres.css";
import Config from "../../../lib/config";
import axios from "../../../lib/axios_instance";

function GenreUserStats(props) {
  const [data, setData] = useState();
  const [config, setConfig] = useState();

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const newConfig = await Config.getConfig();
        setConfig(newConfig);
      } catch (error) {
        console.log(error);
      }
    };

    const fetchData = async () => {
      if (config) {
        try {
          const itemData = await axios.get(`/stats/getGenreUserStats`, {
            params: {
              userid: props.UserId,
            },
            headers: {
              Authorization: `Bearer ${config.token}`,
              "Content-Type": "application/json",
            },
          });
          const results = itemData.data.results || [];
          setData(results);
        } catch (error) {
          console.log(error);
        }
      }
    };

    if (!data) {
      fetchData();
    }

    if (!config) {
      fetchConfig();
    }

    const intervalId = setInterval(fetchData, 60000 * 5);
    return () => clearInterval(intervalId);
  }, [data, config, props.UserId]);

  if (!data || data.length == 0 || !config) {
    return <></>;
  }
  return (
    <div className="genre">
      <h1 className="my-3">
        <Trans i18nKey="GENRES" />
      </h1>
      <div className="genre-container d-flex flex-row justify-content-between">
        <Row className="w-100 pb-5">
          <Col className="p-0 auto">
            <GenreStatCard data={data} dataKey="duration" />
          </Col>
          <Col className="p-0 auto">
            <GenreStatCard data={data} dataKey="plays" />
          </Col>
        </Row>
      </div>
    </div>
  );
}

export default GenreUserStats;
