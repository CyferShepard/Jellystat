import React, { useState, useEffect } from "react";
import axios from "../lib/axios_instance";
import Config from "../lib/config";
import { Link } from "react-router-dom";
import AccountCircleFillIcon from "remixicon-react/AccountCircleFillIcon";
import CheckFillIcon from "remixicon-react/CheckFillIcon";
import CloseFillIcon from "remixicon-react/CloseFillIcon";
import { ButtonGroup, Button, FormControl, FormSelect } from "react-bootstrap";

import Table from "@mui/material/Table";
import TableBody from "@mui/material/TableBody";
import TableCell from "@mui/material/TableCell";
import TableContainer from "@mui/material/TableContainer";
import TableHead from "@mui/material/TableHead";
import TableRow from "@mui/material/TableRow";
import TableSortLabel from "@mui/material/TableSortLabel";
import Box from "@mui/material/Box";
import { visuallyHidden } from "@mui/utils";

import "./css/users/users.css";

import Loading from "./components/general/loading";
import i18next from "i18next";
import { Trans } from "react-i18next";

const token = localStorage.getItem("token");

function EnhancedTableHead(props) {
  const { order, orderBy, onRequestSort } = props;
  const createSortHandler = (property) => (event) => {
    onRequestSort(event, property);
  };

  const headCells = [
    {
      id: "UserName",
      numeric: false,
      disablePadding: true,
      label: i18next.t("USER"),
    },
    {
      id: "Tracked",
      numeric: false,
      disablePadding: true,
      label: i18next.t("LIBRARY_CARD.TRACKED"),
    },
    {
      id: "LastWatched",
      numeric: false,
      disablePadding: false,
      label: i18next.t("LAST_WATCHED"),
    },
    {
      id: "LastClient",
      numeric: false,
      disablePadding: false,
      label: i18next.t("USERS_PAGE.LAST_CLIENT"),
    },
    {
      id: "TotalPlays",
      numeric: false,
      disablePadding: false,
      label: i18next.t("UNITS.PLAYS"),
    },
    {
      id: "TotalWatchTime",
      numeric: false,
      disablePadding: false,
      label: i18next.t("WATCH_TIME"),
    },
    {
      id: "LastSeen",
      numeric: false,
      disablePadding: false,
      label: i18next.t("USERS_PAGE.LAST_SEEN"),
    },
  ];

  return (
    <TableHead>
      <TableRow>
        <TableCell />
        {headCells.map((headCell) => (
          <TableCell
            key={headCell.id}
            align={headCell.numeric ? "right" : "left"}
            padding={headCell.disablePadding ? "none" : "normal"}
            sortDirection={orderBy === headCell.id ? order : false}
          >
            <TableSortLabel
              active={orderBy === headCell.id}
              direction={orderBy === headCell.id ? order : "asc"}
              onClick={createSortHandler(headCell.id)}
            >
              {headCell.label}
              {orderBy === headCell.id ? (
                <Box component="span" sx={visuallyHidden}>
                  {order === "desc" ? "sorted descending" : "sorted ascending"}
                </Box>
              ) : null}
            </TableSortLabel>
          </TableCell>
        ))}
      </TableRow>
    </TableHead>
  );
}

function Row(row) {
  const { data } = row;
  const { updateTrackedState } = row;

  function formatTotalWatchTime(seconds) {
    const hours = Math.floor(seconds / 3600); // 1 hour = 3600 seconds
    const minutes = Math.floor((seconds % 3600) / 60); // 1 minute = 60 seconds
    let formattedTime = "";
    if (hours) {
      formattedTime += `${hours} ${i18next.t("UNITS.HOURS")}`;
    }
    if (minutes) {
      formattedTime += ` ${minutes} ${i18next.t("UNITS.MINUTES")}`;
    }

    return formattedTime;
  }

  function formatLastSeenTime(time) {
    const units = {
      days: [i18next.t("UNITS.DAY"), i18next.t("UNITS.DAYS")],
      hours: [i18next.t("UNITS.HOUR"), i18next.t("UNITS.HOUR")],
      minutes: [i18next.t("UNITS.MINUTE"), i18next.t("UNITS.MINUTES")],
      seconds: [i18next.t("UNITS.SECOND"), i18next.t("UNITS.SECONDS")],
    };

    let formattedTime = "";

    for (const unit in units) {
      if (time[unit]) {
        const unitName = units[unit][time[unit] > 1 ? 1 : 0];
        formattedTime += `${time[unit]} ${unitName} `;
      }
    }

    return `${formattedTime}`;
  }

  async function toggleTrackedState(userid) {
    const url = `/api/setUntrackedUsers`;

    await axios
      .post(
        url,
        {
          userId: userid,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )
      .then((response) => {
        const excluded = response.data;
        updateTrackedState(excluded);
      })
      .catch((error) => {
        console.log(error);
      });
  }

  return (
    <React.Fragment>
      <TableRow sx={{ "& > *": { borderBottom: "unset" } }}>
        <TableCell>
          {data.PrimaryImageTag ? (
            <img className="card-user-image" src={"proxy/Users/Images/Primary?id=" + data.UserId + "&quality=10"} alt="" />
          ) : (
            <AccountCircleFillIcon color="#fff" size={30} />
          )}
        </TableCell>
        <TableCell>
          <Link to={`/users/${data.UserId}`} className="text-decoration-none">
            {data.UserName}
          </Link>
        </TableCell>
        <TableCell>
          {data.Tracked ? (
            <Button className="p-0" variant="outline-dark" onClick={() => toggleTrackedState(data.UserId)}>
              <CheckFillIcon color={"#00A4DC"} />
            </Button>
          ) : (
            <Button className="p-0" variant="outline-dark" onClick={() => toggleTrackedState(data.UserId)}>
              <CloseFillIcon color={"rgb(165, 29, 42)"} />
            </Button>
          )}
        </TableCell>
        <TableCell style={{ textTransform: data.LastWatched ? "none" : "lowercase" }}>
          {data.NowPlayingItemId ? (
            <Link to={`/libraries/item/${data.NowPlayingItemId}`} className="text-decoration-none">
              {data.LastWatched || i18next.t("ERROR_MESSAGES.NEVER")}
            </Link>
          ) : (
            <span to={`/libraries/item/${data.NowPlayingItemId}`} className="text-decoration-none">
              {data.LastWatched || i18next.t("ERROR_MESSAGES.NEVER")}
            </span>
          )}
        </TableCell>
        <TableCell style={{ textTransform: data.LastClient ? "none" : "lowercase" }}>
          {data.LastClient || i18next.t("ERROR_MESSAGES.N/A")}
        </TableCell>
        <TableCell>{data.TotalPlays}</TableCell>
        <TableCell>{formatTotalWatchTime(data.TotalWatchTime) || `0 ${i18next.t("UNITS.MINUTES")}`}</TableCell>
        <TableCell style={{ textTransform: data.LastSeen ? "none" : "lowercase" }}>
          {data.LastSeen
            ? `${i18next.t("USERS_PAGE.AGO_ALT")} ${formatLastSeenTime(data.LastSeen)} ${i18next
                .t("USERS_PAGE.AGO")
                .toLocaleLowerCase()}`
            : i18next.t("ERROR_MESSAGES.NEVER")}
        </TableCell>
      </TableRow>
    </React.Fragment>
  );
}

function Users() {
  const [data, setData] = useState();
  const [config, setConfig] = useState(null);
  const [rowsPerPage, setRowsPerPage] = React.useState(10);
  const [page, setPage] = React.useState(0);

  const [itemCount, setItemCount] = useState(parseInt(localStorage.getItem("PREF_USER_ACTIVITY_ItemCount") ?? "10"));
  const [searchQuery, setSearchQuery] = useState("");

  const [order, setOrder] = React.useState("asc");
  const [orderBy, setOrderBy] = React.useState("LastSeen");

  function setItemLimit(limit) {
    setItemCount(limit);
    localStorage.setItem("PREF_USER_ACTIVITY_ItemCount", limit);
  }

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const newConfig = await Config.getConfig();
        setConfig(newConfig);
      } catch (error) {
        if (error.code === "ERR_NETWORK") {
          console.log(error);
        }
      }
    };

    const fetchData = () => {
      if (config) {
        const url = `/stats/getAllUserActivity`;
        const tracking_url = `/api/UntrackedUsers`;

        axios
          .get(url, {
            headers: {
              Authorization: `Bearer ${token}`,
              "Content-Type": "application/json",
            },
          })
          .then((data) => {
            axios
              .get(tracking_url, {
                headers: {
                  Authorization: `Bearer ${token}`,
                  "Content-Type": "application/json",
                },
              })
              .then((excluded) => {
                let dataWithTracking = data.data.map((item) => {
                  return {
                    ...item,
                    Tracked: !excluded.data.includes(item.UserId),
                  };
                });
                setData(dataWithTracking);
              })
              .catch((error) => {
                console.log(error);
              });
          })
          .catch((error) => {
            console.log(error);
          });
      }
    };

    fetchData();

    if (!config) {
      fetchConfig();
    }

    const intervalId = setInterval(fetchData, 60000);
    return () => clearInterval(intervalId);
  }, [config]);

  if (!data) {
    return <Loading />;
  }

  const handleNextPageClick = () => {
    setPage((prevPage) => prevPage + 1);
  };

  const handlePreviousPageClick = () => {
    setPage((prevPage) => prevPage - 1);
  };

  function formatLastSeenTime(time) {
    if (!time) {
      return " never";
    }
    const units = {
      days: [i18next.t("UNITS.DAY"), i18next.t("UNITS.DAYS")],
      hours: [i18next.t("UNITS.HOUR"), i18next.t("UNITS.HOUR")],
      minutes: [i18next.t("UNITS.MINUTE"), i18next.t("UNITS.MINUTES")],
      seconds: [i18next.t("UNITS.SECOND"), i18next.t("UNITS.SECONDS")],
    };

    let formattedTime = "";

    for (const unit in units) {
      if (time[unit]) {
        const unitName = units[unit][time[unit] > 1 ? 1 : 0];
        formattedTime += `${time[unit]} ${unitName} `;
      }
    }

    return `${formattedTime}`;
  }

  function descendingComparator(a, b, orderBy) {
    if (orderBy === "LastSeen") {
      let order_a = formatLastSeenTime(a[orderBy]);
      let order_b = formatLastSeenTime(b[orderBy]);
      if (order_b > order_a) {
        return -1;
      }
      if (order_a < order_b) {
        return 1;
      }
      return 0;
    }

    if (orderBy === "TotalPlays" || orderBy === "TotalWatchTime") {
      let order_a = parseInt(a[orderBy]);
      let order_b = parseInt(b[orderBy]);

      if (order_a < order_b) {
        return -1;
      }
      if (order_a > order_b) {
        return 1;
      }
      return 0;
    }

    if (b[orderBy] < a[orderBy]) {
      return -1;
    }
    if (b[orderBy] > a[orderBy]) {
      return 1;
    }
    return 0;
  }

  function getComparator(order, orderBy) {
    return order === "desc" ? (a, b) => descendingComparator(a, b, orderBy) : (a, b) => -descendingComparator(a, b, orderBy);
  }

  function stableSort(array, comparator) {
    const stabilizedThis = array.map((el, index) => [el, index]);

    stabilizedThis.sort((a, b) => {
      const order = comparator(a[0], b[0]);
      if (order !== 0) {
        return order;
      }
      return a[1] - b[1];
    });

    return stabilizedThis.map((el) => el[0]);
  }

  function updateTrackedState(excluded) {
    let updatedData = data.map((item) => {
      return {
        ...item,
        Tracked: !excluded.includes(item.UserId),
      };
    });

    setData(updatedData);
  }

  const visibleRows = stableSort(data, getComparator(order, orderBy)).slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage);

  const handleRequestSort = (event, property) => {
    const isAsc = orderBy === property && order === "asc";
    setOrder(isAsc ? "desc" : "asc");
    setOrderBy(property);
  };

  let filteredData = visibleRows;
  if (searchQuery) {
    filteredData = data.filter(
      (item) =>
        (item.LastWatched !== undefined &&
          item.LastWatched !== null &&
          item.LastWatched.toLowerCase().includes(searchQuery.toLowerCase())) ||
        item.UserName.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }
  return (
    <div className="Users">
      <div className="d-md-flex justify-content-between">
        <h1 className="my-3">
          <Trans i18nKey="USERS_PAGE.ALL_USERS" />
        </h1>

        <div className="d-flex flex-column flex-md-row" style={{ whiteSpace: "nowrap" }}>
          <div className="d-flex flex-row w-100">
            <div className="d-flex flex-col my-md-3 rounded-0 rounded-start  align-items-center px-2 bg-primary-1">
              <Trans i18nKey="UNITS.ITEMS" />
            </div>
            <FormSelect
              onChange={(event) => {
                setRowsPerPage(event.target.value);
                setPage(0);
                setItemLimit(event.target.value);
              }}
              value={itemCount}
              className="my-md-3 w-md-75 rounded-0 rounded-end"
            >
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </FormSelect>
          </div>
          <FormControl
            type="text"
            placeholder={i18next.t("SEARCH")}
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="ms-md-3 my-3 w-sm-100 w-md-75"
          />
        </div>
      </div>

      <TableContainer className="rounded-2">
        <Table aria-label="collapsible table">
          <EnhancedTableHead order={order} orderBy={orderBy} onRequestSort={handleRequestSort} rowCount={rowsPerPage} />
          <TableBody>
            {filteredData.map((row) => (
              <Row
                key={row.UserId}
                data={row}
                updateTrackedState={updateTrackedState}
                hostUrl={config.settings?.EXTERNAL_URL ?? config.hostUrl}
              />
            ))}
            {data.length === 0 ? (
              <tr>
                <td colSpan="8" style={{ textAlign: "center", fontStyle: "italic", color: "grey", height: "200px" }}>
                  No Users Found
                </td>
              </tr>
            ) : (
              ""
            )}
          </TableBody>
        </Table>
      </TableContainer>

      <div className="d-flex justify-content-end my-2">
        <ButtonGroup className="pagination-buttons">
          <Button className="page-btn" onClick={() => setPage(0)} disabled={page === 0}>
            <Trans i18nKey="TABLE_NAV_BUTTONS.FIRST" />
          </Button>

          <Button className="page-btn" onClick={handlePreviousPageClick} disabled={page === 0}>
            <Trans i18nKey="TABLE_NAV_BUTTONS.PREVIOUS" />
          </Button>

          <div className="page-number d-flex align-items-center justify-content-center">{`${page * rowsPerPage + 1}-${Math.min(
            page * rowsPerPage + 1 + (rowsPerPage - 1),
            data.length
          )} of ${data.length}`}</div>

          <Button className="page-btn" onClick={handleNextPageClick} disabled={page >= Math.ceil(data.length / rowsPerPage) - 1}>
            <Trans i18nKey="TABLE_NAV_BUTTONS.NEXT" />
          </Button>

          <Button
            className="page-btn"
            onClick={() => setPage(Math.ceil(data.length / rowsPerPage) - 1)}
            disabled={page >= Math.ceil(data.length / rowsPerPage) - 1}
          >
            <Trans i18nKey="TABLE_NAV_BUTTONS.LAST" />
          </Button>
        </ButtonGroup>
      </div>
    </div>
  );
}
export default Users;
