/* eslint-disable react/prop-types */
import React, { useEffect, useMemo } from "react";
import axios from "../../../lib/axios_instance";
import { enUS } from "@mui/material/locale";

import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";

import AddCircleFillIcon from "remixicon-react/AddCircleFillIcon";
import IndeterminateCircleFillIcon from "remixicon-react/IndeterminateCircleFillIcon";

import StreamInfo from "./stream_info";

import "../../css/activity/activity-table.css";
import i18next from "i18next";
import IpInfoModal from "../ip-info";
// import Loading from "../general/loading";
import { MRT_TablePagination, MaterialReactTable, useMaterialReactTable } from "material-react-table";
import { Box, ThemeProvider, Typography, createTheme } from "@mui/material";

import { Link } from "react-router-dom";
import { Button, Modal } from "react-bootstrap";
import { Trans } from "react-i18next";

function formatTotalWatchTime(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const remainingSeconds = seconds % 60;

  let timeString = "";

  if (hours > 0) {
    timeString += `${hours} ${hours === 1 ? "hr" : "hrs"} `;
  }

  if (minutes > 0) {
    timeString += `${minutes} ${minutes === 1 ? "min" : "mins"} `;
  }

  if (remainingSeconds > 0) {
    timeString += `${remainingSeconds} ${
      remainingSeconds === 1 ? i18next.t("UNITS.SECOND").toLowerCase() : i18next.t("UNITS.SECONDS").toLowerCase()
    }`;
  }

  return timeString.trim();
}

const colors = {
  primary: "#5a2da5",
  secondary: "#00A4DC",
  backgroundColor: "#1e1c22",
  secondaryBackgroundColor: "#2c2a2f",
  tertiaryBackgroundColor: "#2f2e31",
};
const token = localStorage.getItem("token");

export default function ActivityTable(props) {
  const twelve_hr = JSON.parse(localStorage.getItem("12hr"));
  const [data, setData] = React.useState(props.data ?? []);
  const uniqueUserNames = [...new Set(data.map((item) => item.UserName))];
  const uniqueClients = [...new Set(data.map((item) => item.Client))];

  const [rowSelection, setRowSelection] = React.useState({});
  const [pagination, setPagination] = React.useState({
    pageIndex: 0,
    pageSize: 10, //customize the default page size
  });

  const [modalState, setModalState] = React.useState(false);
  const [modalData, setModalData] = React.useState();

  //IP MODAL

  const ipv4Regex = new RegExp(
    /\b(?!(10\.|172\.(1[6-9]|2[0-9]|3[0-1])\.|192\.168))(?:(?:2(?:[0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9])\.){3}(?:(?:2([0-4][0-9]|5[0-5])|[0-1]?[0-9]?[0-9]))\b/
  );

  const [ipModalVisible, setIPModalVisible] = React.useState(false);
  const [confirmDeleteShow, setDeleteShow] = React.useState(false);
  const [ipAddressLookup, setIPAddressLookup] = React.useState();

  const isRemoteSession = (ipAddress) => {
    ipv4Regex.lastIndex = 0;
    if (ipv4Regex.test(ipAddress ?? ipAddressLookup)) {
      return true;
    }
    return false;
  };

  const openModal = (data) => {
    setModalData(data);
    setModalState(!modalState);
  };

  function showIPDataModal(ipAddress) {
    ipv4Regex.lastIndex = 0;
    setIPAddressLookup(ipAddress);
    if (!isRemoteSession) {
      return;
    }

    setIPModalVisible(true);
  }

  async function deleteActivity() {
    const url = `/api/deletePlaybackActivity`;

    axios
      .post(
        url,
        { ids: [...Object.keys(rowSelection)] },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        }
      )
      .then(() => {
        setData(data.filter((item) => !rowSelection[item.Id]));
        setRowSelection({});
      })
      .catch((error) => {
        console.log(error);
      });
  }

  // eslint-disable-next-line react/prop-types
  if (pagination.pageSize !== props.itemCount) {
    // eslint-disable-next-line react/prop-types
    setPagination({ pageIndex: 0, pageSize: props.itemCount });
  }

  const columns = [
    {
      accessorKey: "UserName",
      header: i18next.t("USER"),
      filterVariant: "select",
      filterSelectOptions: uniqueUserNames,
      Cell: ({ row }) => {
        row = row.original;
        return (
          <Link to={`/users/${row.UserId}`} className="text-decoration-none">
            {row.UserName}
          </Link>
        );
      },
    },
    {
      accessorKey: "RemoteEndPoint",
      header: i18next.t("ACTIVITY_TABLE.IP_ADDRESS"),

      Cell: ({ row }) => {
        row = row.original;
        if (
          isRemoteSession(row.RemoteEndPoint) &&
          (window.env?.JS_GEOLITE_ACCOUNT_ID ?? import.meta.env.JS_GEOLITE_ACCOUNT_ID) != undefined
        ) {
          return (
            <Link className="text-decoration-none" onClick={() => showIPDataModal(row.RemoteEndPoint)}>
              {row.RemoteEndPoint}
            </Link>
          );
        } else {
          return <span>{row.RemoteEndPoint || "-"}</span>;
        }
      },
    },
    {
      accessorFn: (row) =>
        `${
          !row?.SeriesName
            ? row.NowPlayingItemName
            : row.SeriesName + " : S" + row.SeasonNumber + "E" + row.EpisodeNumber + " - " + row.NowPlayingItemName
        }`,
      header: i18next.t("TITLE"),
      minSize: 300,
      Cell: ({ row }) => {
        row = row.original;
        return (
          <Link to={`/libraries/item/${row.EpisodeId || row.NowPlayingItemId}`} className="text-decoration-none">
            {!row.SeriesName
              ? row.NowPlayingItemName
              : row.SeriesName + " : S" + row.SeasonNumber + "E" + row.EpisodeNumber + " - " + row.NowPlayingItemName}
          </Link>
        );
      },
    },
    {
      accessorKey: "Client",
      header: i18next.t("ACTIVITY_TABLE.CLIENT"),
      filterVariant: "select",
      filterSelectOptions: uniqueClients,
      Cell: ({ row }) => {
        row = row.original;
        return (
          <Link onClick={() => openModal(row)} className="text-decoration-none">
            {row.Client}
          </Link>
        );
      },
    },
    {
      accessorKey: "DeviceName",
      header: i18next.t("ACTIVITY_TABLE.DEVICE"),
    },
    {
      accessorFn: (row) => new Date(row.ActivityDateInserted),
      header: i18next.t("DATE"),
      size: 110,
      filterVariant: "date-range",
      Cell: ({ row }) => {
        const options = {
          day: "numeric",
          month: "numeric",
          year: "numeric",
          hour: "numeric",
          minute: "numeric",
          second: "numeric",
          hour12: twelve_hr,
        };
        row = row.original;
        return <span>{Intl.DateTimeFormat("en-UK", options).format(new Date(row.ActivityDateInserted))}</span>;
      },
    },
    {
      accessorKey: "PlaybackDuration",
      header: i18next.t("ACTIVITY_TABLE.TOTAL_PLAYBACK"),
      minSize: 200,
      filterFn: (row, id, filterValue) => formatTotalWatchTime(row.getValue(id)).startsWith(filterValue),

      Cell: ({ cell }) => <span>{formatTotalWatchTime(cell.getValue())}</span>,
    },
    {
      accessorFn: (row) => Number(row.TotalPlays ?? 1),
      header: i18next.t("TOTAL_PLAYS"),
      filterFn: "betweenInclusive",

      Cell: ({ cell }) => <span>{cell.getValue() ?? 1}</span>,
    },
  ];

  useEffect(() => {
    setData(props.data);
  }, [props.data]);

  const table = useMaterialReactTable({
    columns,
    data,
    localization: {
      expand: i18next.t("ACTIVITY_TABLE.EXPAND"),
      collapse: i18next.t("ACTIVITY_TABLE.COLLAPSE"),
      sortByColumnAsc: `${i18next.t("ACTIVITY_TABLE.SORT_BY")} {column} - ${i18next.t("ACTIVITY_TABLE.ASCENDING")}`,
      sortByColumnDesc: `${i18next.t("ACTIVITY_TABLE.SORT_BY")} {column} - ${i18next.t("ACTIVITY_TABLE.DESCENDING")}`,
      clearFilter: i18next.t("ACTIVITY_TABLE.CLEAR_FILTER"),
      clearSort: i18next.t("ACTIVITY_TABLE.CLEAR_SORT"),
      filterByColumn: `${i18next.t("ACTIVITY_TABLE.FILTER_BY")} {column}`,
      toggleSelectAll: i18next.t("ACTIVITY_TABLE.TOGGLE_SELECT_ALL"),
      toggleSelectRow: i18next.t("ACTIVITY_TABLE.TOGGLE_SELECT_ROW"),
      columnActions: i18next.t("ACTIVITY_TABLE.COLUMN_ACTIONS"),
    },
    columnFilterDisplayMode: "popover",
    layoutMode: "grid",
    enableExpandAll: false,
    enableExpanding: true,
    enableDensityToggle: false,
    enableTopToolbar: Object.keys(rowSelection).length > 0,
    initialState: {
      expanded: false,
      showGlobalFilter: true,
      pagination: { pageSize: 10, pageIndex: 0 },
      sorting: [
        {
          id: "Date",
          desc: true,
        },
      ],
    },
    showAlertBanner: false,
    enableHiding: false,
    enableFullScreenToggle: false,
    enableGlobalFilter: false,
    enableBottomToolbar: false,
    enableRowSelection: (row) => row.original.Id,
    enableMultiRowSelection: true,
    enableBatchRowSelection: true,
    onRowSelectionChange: setRowSelection,
    positionToolbarAlertBanner: "bottom",
    renderTopToolbarCustomActions: () => {
      if (Object.keys(rowSelection).length > 0) {
        return (
          <Box sx={{ display: "flex", gap: "1rem", p: "0px" }}>
            <span>
              <Typography variant="h5">
                {i18next.t("X_ROWS_SELECTED").replace("{ROWS}", Object.keys(rowSelection).length)}
              </Typography>
            </span>
            <Button
              color="error"
              onClick={() => {
                setDeleteShow(true);
              }}
              variant="danger"
            >
              <Trans i18nKey="DELETE" />
            </Button>
          </Box>
        );
      }
    },
    renderEmptyRowsFallback: () => (
      <span style={{ textAlign: "center", fontStyle: "italic", color: "grey" }} className="py-5">
        <Trans i18nKey="ERROR_MESSAGES.NO_ACTIVITY" />
      </span>
    ),
    muiTableBodyRowProps: {
      sx: {
        "&:hover .MuiCheckbox-root": {
          opacity: 1,
          color: colors.primary,
        },
      },
    },
    muiSelectCheckboxProps: {
      sx: {
        opacity: 0,
        "&:hover": {
          opacity: 1,
        },
        "&.Mui-checked": {
          opacity: 1,
        },
      },
    },
    state: { rowSelection, pagination },
    filterFromLeafRows: true,
    getSubRows: (row) => {
      if (Array.isArray(row.results) && row.results.length == 1) {
        row.results.pop();
      }

      return row.results;
    },
    paginateExpandedRows: false,
    onPaginationChange: setPagination,
    getRowId: (row) => row.Id,
    muiExpandButtonProps: ({ row }) => ({
      children: row.getIsExpanded() ? <IndeterminateCircleFillIcon /> : <AddCircleFillIcon />,
      onClick: () => table.setExpanded({ [row.id]: !row.getIsExpanded() }),
      sx: {
        transform: row.getIsExpanded() ? "rotate(180deg)" : "rotate(-90deg)",
        transition: "transform 0.2s",
      },
    }),
    muiPaginationProps: {
      rowsPerPageOptions: [10, 25, 50, 100],
      variant: "outlined",
      showFirstButton: true,
      showLastButton: true,
      showRowsPerPage: false,
    },
    paginationDisplayMode: "pages",
    muiTableBodyCellProps: {
      sx: {
        backgroundColor: colors.tertiaryBackgroundColor,
      },
    },
    muiTableHeadCellProps: {
      sx: {
        backgroundColor: "rgba(200, 200, 200, 0)",
      },
    },
    muiFilterAutocompleteProps: {
      sx: {
        color: colors.primary,
      },
    },

    mrtTheme: () => ({
      baseBackgroundColor: "rgb(64, 62, 67)",
    }),
  });
  const theme = useMemo(
    () =>
      createTheme(
        {
          palette: {
            mode: "dark",
            primary: {
              main: colors.secondary,
            },
            secondary: {
              main: colors.primary,
            },
            info: {
              main: colors.primary,
            },
            warning: {
              main: colors.primary,
            },
          },
          components: {
            MuiTooltip: {
              styleOverrides: {
                tooltip: {
                  backgroundColor: colors.tertiaryBackgroundColor,
                },
              },
            },
          },
        },
        enUS
      ),
    []
  );

  return (
    <LocalizationProvider dateAdapter={AdapterDayjs}>
      <IpInfoModal show={ipModalVisible} onHide={() => setIPModalVisible(false)} ipAddress={ipAddressLookup} />
      <Modal
        show={confirmDeleteShow}
        onHide={() => {
          setDeleteShow(false);
        }}
      >
        <Modal.Header closeButton>
          <Modal.Title>
            <Trans i18nKey="ITEM_INFO.CONFIRM_ACTION" />
            {" - "}
            {i18next.t("X_ROWS_SELECTED").replace("{ROWS}", Object.keys(rowSelection).length)}
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>{i18next.t("PURGE_OPTIONS.PURGE_ACTIVITY")}</p>
        </Modal.Body>
        <Modal.Footer>
          <button
            className="btn btn-danger"
            onClick={() => {
              deleteActivity().then(() => setDeleteShow(false));
            }}
          >
            <Trans i18nKey="DELETE" />
          </button>
          <button
            className="btn btn-primary"
            onClick={() => {
              setDeleteShow(false);
            }}
          >
            <Trans i18nKey="CLOSE" />
          </button>
        </Modal.Footer>
      </Modal>
      <Modal show={modalState} onHide={() => setModalState(false)}>
        <Modal.Header>
          <Modal.Title>
            <Trans i18nKey="ACTIVITY_TABLE.MODAL.HEADER" />:
            {!modalData?.SeriesName
              ? modalData?.NowPlayingItemName
              : modalData?.SeriesName + " - " + modalData?.NowPlayingItemName}{" "}
            ({modalData?.UserName})
          </Modal.Title>
        </Modal.Header>
        <StreamInfo data={modalData} />
        <Modal.Footer>
          <Button variant="outline-primary" onClick={() => setModalState(false)}>
            <Trans i18nKey="CLOSE" />
          </Button>
        </Modal.Footer>
      </Modal>
      <ThemeProvider theme={theme}>
        <MaterialReactTable table={table} />
        <Box
          sx={{
            display: "flex",
            justifyContent: "end",
            alignItems: "center",
          }}
        >
          <MRT_TablePagination table={table} />
        </Box>
      </ThemeProvider>
    </LocalizationProvider>
  );
}
