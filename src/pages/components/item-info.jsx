/* eslint-disable react/prop-types */
import { useState, useEffect } from "react";
import axios from "../../lib/axios_instance";
import { useParams } from "react-router-dom";
import { Link } from "react-router-dom";
import { Blurhash } from "react-blurhash";
import { Row, Col, Tabs, Tab, Button, ButtonGroup } from "react-bootstrap";

import ExternalLinkFillIcon from "remixicon-react/ExternalLinkFillIcon";
import ArchiveDrawerFillIcon from "remixicon-react/ArchiveDrawerFillIcon";
import ArrowLeftSLineIcon from "remixicon-react/ArrowLeftSLineIcon";

import "../css/items/item-details.css";

import MoreItems from "./item-info/more-items";
import ItemActivity from "./item-info/item-activity";
import ItemNotFound from "./item-info/item-not-found";

import Config from "../../lib/config";
import Loading from "./general/loading";
import ItemOptions from "./item-info/item-options";
import { Trans } from "react-i18next";
import i18next from "i18next";
import TvLineIcon from "remixicon-react/TvLineIcon";
import FilmLineIcon from "remixicon-react/FilmLineIcon";
import FileMusicLineIcon from "remixicon-react/FileMusicLineIcon";
import CheckboxMultipleBlankLineIcon from "remixicon-react/CheckboxMultipleBlankLineIcon";
import baseUrl from "../../lib/baseurl";
import GlobalStats from "./general/globalStats";
import ErrorBoundary from "./general/ErrorBoundary.jsx";

function ItemInfo() {
  const { Id } = useParams();
  const [data, setData] = useState();
  const [config, setConfig] = useState();
  const [refresh, setRefresh] = useState(true);
  const [activeTab, setActiveTab] = useState("tabOverview");

  const [loaded, setLoaded] = useState(false);
  const [fallback, setFallback] = useState(false);

  const SeriesIcon = <TvLineIcon size={"50%"} />;
  const MovieIcon = <FilmLineIcon size={"50%"} />;
  const MusicIcon = <FileMusicLineIcon size={"50%"} />;
  const MixedIcon = <CheckboxMultipleBlankLineIcon size={"50%"} />;

  const currentLibraryDefaultIcon =
    data?.Type === "Movie" ? MovieIcon : data?.Type === "Episode" ? SeriesIcon : data?.Type === "Audio" ? MusicIcon : MixedIcon;

  function formatFileSize(sizeInBytes) {
    const sizeInMB = sizeInBytes / 1048576; // 1 MB = 1048576 bytes
    if (sizeInMB < 1000) {
      return `${sizeInMB.toFixed(2)} MB`;
    } else {
      const sizeInGB = sizeInMB / 1024; // 1 GB = 1024 MB
      return `${sizeInGB.toFixed(2)} GB`;
    }
  }

  function ticksToTimeString(ticks) {
    const seconds = Math.floor(ticks / 10000000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;
    const timeString = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}:${remainingSeconds
      .toString()
      .padStart(2, "0")}`;

    return timeString;
  }

  const fetchData = async () => {
    if (config) {
      setRefresh(true);
      try {
        const itemData = await axios.post(
          `/api/getItemDetails`,
          {
            Id: Id,
          },
          {
            headers: {
              Authorization: `Bearer ${config.token}`,
              "Content-Type": "application/json",
            },
          }
        );

        setData(itemData.data[0]);
      } catch (error) {
        setData({ notfound: true, message: error.response.data });
        console.log(error);
      }
      setRefresh(false);
    }
  };

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const newConfig = await Config.getConfig();
        setConfig(newConfig);
      } catch (error) {
        console.log(error);
      }
    };

    fetchData();

    if (!config) {
      fetchConfig();
    }

    const intervalId = setInterval(fetchData, 60000 * 5);
    return () => clearInterval(intervalId);
    // eslint-disable-next-line
  }, [config, Id]);

  if (!data || refresh) {
    return <Loading />;
  }

  if (data && data.notfound) {
    return <ItemNotFound message="Item not found" itemId={Id} fetchdataMethod={fetchData} />;
  }

  const cardStyle = {
    backgroundImage: `url(/proxy/Items/Images/Backdrop?id=${
      ["Episode", "Season"].includes(data.Type) ? data.SeriesId : data.Id
    }&fillWidth=800&quality=90)`,
    height: "100%",
    backgroundSize: "cover",
  };

  const cardBgStyle = {
    backgroundColor: "rgb(0, 0, 0, 0.8)",
  };

  return (
    <div>
      <div className="item-detail-container rounded-3" style={cardStyle}>
        <Row className="justify-content-center justify-content-md-start rounded-3 g-0 p-4" style={cardBgStyle}>
          {data.ParentId && (
            <Row className="mb-3">
              <Col className="col-auto pe-0">
                <Link to={`/libraries/${data.ParentId}`}>
                  <Button className="d-inline-block" variant={"outline-primary"}>
                    {data.LibraryName}
                  </Button>
                </Link>
              </Col>
              {["Episode", "Season"].includes(data.Type) && (
                <>
                  <Col className="col-auto px-0 d-flex justify-content-center align-items-center">
                    <ArrowLeftSLineIcon />
                  </Col>
                  <Col className="col-auto px-0">
                    <Link to={`/libraries/item/${data.SeriesId}`}>
                      <Button className="d-inline-block" variant={"outline-primary"}>
                        {data.SeriesName}
                      </Button>
                    </Link>
                  </Col>
                </>
              )}
              {data.Type === "Episode" && (
                <>
                  <Col className="col-auto px-0 d-flex justify-content-center align-items-center">
                    <ArrowLeftSLineIcon />
                  </Col>
                  <Col className="col-auto px-0">
                    <Link to={`/libraries/item/${data.SeasonId}`}>
                      <Button className="d-inline-block" variant={"outline-primary"}>
                        {data.SeasonName}
                      </Button>
                    </Link>
                  </Col>
                </>
              )}
            </Row>
          )}

          <Row>
            <Col className="col-auto my-4 my-md-0 item-banner-image">
              {!data.archived && data.PrimaryImageHash && data.PrimaryImageHash != null && !loaded ? (
                <div
                  className="d-flex flex-column justify-content-center align-items-center position-relative"
                  style={{ height: "100%", width: "200px" }}
                >
                  {data.PrimaryImageHash && data.PrimaryImageHash != null ? (
                    <Blurhash
                      hash={data.PrimaryImageHash}
                      width={"100%"}
                      height={"100%"}
                      className="rounded-3 overflow-hidden position-absolute"
                      style={{ display: "block" }}
                    />
                  ) : null}

                  {fallback ? (
                    <div className="d-flex flex-column justify-content-center align-items-center position-absolute">
                      {currentLibraryDefaultIcon}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {!data.archived ? (
                <img
                  className="item-image"
                  src={
                    baseUrl +
                    "/proxy/Items/Images/Primary?id=" +
                    (["Episode", "Season"].includes(data.Type) ? data.SeriesId : data.Id) +
                    "&fillWidth=200&quality=90"
                  }
                  alt=""
                  style={{
                    display: loaded ? "block" : "none",
                  }}
                  onLoad={() => setLoaded(true)}
                  onError={() => setFallback(true)}
                />
              ) : (
                <div
                  className="d-flex flex-column justify-content-center align-items-center position-relative"
                  style={{ height: "300px", width: "200px" }}
                >
                  {data.PrimaryImageHash && data.PrimaryImageHash != null ? (
                    <Blurhash
                      hash={data.PrimaryImageHash}
                      width={"200px"}
                      height={"300px"}
                      className="rounded-3 overflow-hidden position-absolute"
                      style={{ display: "block" }}
                    />
                  ) : null}
                  <div className="d-flex flex-column justify-content-center align-items-center position-absolute">
                    <ArchiveDrawerFillIcon className="w-100 h-100 mb-2" />
                    <span>
                      <Trans i18nKey="ARCHIVED" />
                    </span>
                  </div>
                </div>
              )}
            </Col>

            <Col>
              <div className="item-details">
                <div className="d-flex">
                  <h1 className="">
                    {data.SeriesId ? (
                      <Link to={`/libraries/item/${data.SeriesId}`}>{data.SeriesName || data.Name}</Link>
                    ) : (
                      data.SeriesName || data.Name
                    )}
                  </h1>
                  <Link
                    className="px-2"
                    to={
                      (config.settings?.EXTERNAL_URL ?? config.hostUrl) +
                      `/web/index.html#!/${config.IS_JELLYFIN ? "details" : "item"}?id=` +
                      (data.EpisodeId || data.Id) +
                      (config.settings.ServerID ? "&serverId=" + config.settings.ServerID : "")
                    }
                    title={i18next.t("ITEM_INFO.OPEN_IN_JELLYFIN")}
                    target="_blank"
                  >
                    <ExternalLinkFillIcon />
                  </Link>
                </div>

                <div className="my-3">
                  {data.Type === "Episode" ? (
                    <p>
                      <Link to={`/libraries/item/${data.SeasonId}`} className="fw-bold">
                        {data.SeasonName}
                      </Link>{" "}
                      <Trans i18nKey="EPISODE" /> {data.IndexNumber} - {data.Name}
                    </p>
                  ) : (
                    <></>
                  )}
                  {data.Type === "Season" ? <p>{data.Name}</p> : <></>}
                  {data.FileName ? (
                    <p style={{ color: "lightgrey" }} className="fst-italic fs-6">
                      <Trans i18nKey="FILE_NAME" />: {data.FileName}
                    </p>
                  ) : (
                    <></>
                  )}
                  {data.Path ? (
                    <p style={{ color: "lightgrey" }} className="fst-italic fs-6">
                      <Trans i18nKey="ITEM_INFO.FILE_PATH" />: {data.Path}
                    </p>
                  ) : (
                    <></>
                  )}
                  {data.RunTimeTicks ? (
                    <p style={{ color: "lightgrey" }} className="fst-italic fs-6">
                      {data.Type === "Series" ? i18next.t("ITEM_INFO.AVERAGE_RUNTIME") : i18next.t("ITEM_INFO.RUNTIME")}:{" "}
                      {ticksToTimeString(data.RunTimeTicks)}
                    </p>
                  ) : (
                    <></>
                  )}
                  {data.Size ? (
                    <p style={{ color: "lightgrey" }} className="fst-italic fs-6">
                      <Trans i18nKey="ITEM_INFO.FILE_SIZE" />: {formatFileSize(data.Size)}
                    </p>
                  ) : (
                    <></>
                  )}
                </div>
                <ButtonGroup>
                  <Button
                    onClick={() => setActiveTab("tabOverview")}
                    active={activeTab === "tabOverview"}
                    variant="outline-primary"
                    type="button"
                  >
                    <Trans i18nKey="TAB_CONTROLS.OVERVIEW" />
                  </Button>
                  <Button
                    onClick={() => setActiveTab("tabActivity")}
                    active={activeTab === "tabActivity"}
                    variant="outline-primary"
                    type="button"
                  >
                    <Trans i18nKey="TAB_CONTROLS.ACTIVITY" />
                  </Button>

                  {data.archived && (
                    <Button
                      onClick={() => setActiveTab("tabOptions")}
                      active={activeTab === "tabOptions"}
                      variant="outline-primary"
                      type="button"
                    >
                      <Trans i18nKey="TAB_CONTROLS.OPTIONS" />
                    </Button>
                  )}
                </ButtonGroup>
              </div>
            </Col>
          </Row>
        </Row>
      </div>

      <Tabs defaultActiveKey="tabOverview" activeKey={activeTab} variant="pills" className="hide-tab-titles">
        <Tab eventKey="tabOverview" title="Overview" className="bg-transparent">
          <GlobalStats
            id={Id}
            param={"itemid"}
            endpoint={"getGlobalItemStats"}
            title={<Trans i18nKey="GLOBAL_STATS.ITEM_STATS" />}
          />
          {["Series", "Season"].includes(data && data.Type) ? <MoreItems data={data} /> : <></>}
        </Tab>
        <Tab eventKey="tabActivity" title="Activity" className="bg-transparent">
          <ErrorBoundary>
            <ItemActivity itemid={Id} />
          </ErrorBoundary>
        </Tab>
        <Tab eventKey="tabOptions" title="Options" className="bg-transparent">
          <ItemOptions itemid={Id} />
        </Tab>
      </Tabs>
    </div>
  );
}
export default ItemInfo;
