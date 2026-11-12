import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button, FormControl, FormSelect, Table } from "react-bootstrap";
import { Trans } from "react-i18next";
import i18next from "i18next";

import axios from "../lib/axios_instance";
import Config from "../lib/config";
import Loading from "./components/general/loading";
import "./css/activity.css";

// Events from the Jellyfin activity log: who downloaded what and when, logins, devices and clients.
const typeLabel = (type) => i18next.t(`EVENTS_PAGE.TYPES.${type}`, { defaultValue: type });

function Events() {
  const [config, setConfig] = useState(null);
  const [data, setData] = useState(null);
  const [type, setType] = useState(localStorage.getItem("PREF_EVENTS_Type") ?? "All");
  const [size, setSize] = useState(parseInt(localStorage.getItem("PREF_EVENTS_Size") ?? "50"));
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState("");
  const [debounced, setDebounced] = useState("");
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const h = setTimeout(() => setDebounced(search.trim()), 300);
    return () => clearTimeout(h);
  }, [search]);

  useEffect(() => {
    if (!config) {
      Config.getConfig()
        .then(setConfig)
        .catch((e) => console.log(e));
      return;
    }
    const load = () => {
      setBusy(true);
      axios
        .get("/api/getActivityLog", {
          params: { type, size, page, search: debounced },
          headers: { Authorization: `Bearer ${config.token}` },
        })
        .then((res) => setData(res.data))
        .catch((e) => console.log(e))
        .finally(() => setBusy(false));
    };
    load();
    const id = setInterval(load, 60000);
    return () => clearInterval(id);
  }, [config, type, size, page, debounced]);

  if (!data) return <Loading />;

  const types = data.types ?? [];
  const fmt = (d) =>
    new Date(d).toLocaleString(i18next.language || undefined, {
      day: "numeric",
      month: "numeric",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: config?.settings?.time_format === "12hr",
    });

  return (
    <div className="Activity">
      <div className="d-md-flex justify-content-between">
        <h1 className="my-3">
          <Trans i18nKey="MENU_TABS.EVENTS" />
        </h1>
        <div className="d-flex flex-column flex-md-row" style={{ whiteSpace: "nowrap" }}>
          <div className="d-flex flex-row w-100 ms-md-3 mb-3 my-md-3">
            <div className="d-flex flex-col rounded-0 rounded-start align-items-center px-2 bg-primary-1">
              <Trans i18nKey="TYPE" />
            </div>
            <FormSelect
              value={type}
              className="rounded-0 rounded-end"
              onChange={(e) => {
                setType(e.target.value);
                setPage(1);
                localStorage.setItem("PREF_EVENTS_Type", e.target.value);
              }}
            >
              <option value="All">{i18next.t("ALL")}</option>
              {!types.some((t) => t.Type === type) && type !== "All" && <option value={type}>{typeLabel(type)}</option>}
              {types.map((t) => (
                <option key={t.Type} value={t.Type}>
                  {typeLabel(t.Type)} ({t.n})
                </option>
              ))}
            </FormSelect>
          </div>
          <div className="d-flex flex-row w-100 ms-md-3 mb-3 my-md-3">
            <div className="d-flex flex-col rounded-0 rounded-start align-items-center px-2 bg-primary-1">
              <Trans i18nKey="UNITS.ITEMS" />
            </div>
            <FormSelect
              value={size}
              className="rounded-0 rounded-end"
              onChange={(e) => {
                setSize(parseInt(e.target.value));
                setPage(1);
                localStorage.setItem("PREF_EVENTS_Size", e.target.value);
              }}
            >
              {[25, 50, 100, 250].map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </FormSelect>
          </div>
          <FormControl
            type="text"
            placeholder={i18next.t("SEARCH")}
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              setPage(1);
            }}
            className="ms-md-3 mb-3 my-md-3"
          />
        </div>
      </div>

      <p className="text-secondary small">
        <Trans i18nKey="EVENTS_PAGE.INFO" />
      </p>

      {data.results.length === 0 ? (
        <h4 className="my-4">
          <Trans i18nKey="ERROR_MESSAGES.NO_EVENTS" />
        </h4>
      ) : (
        <div style={{ overflowX: "auto", opacity: busy ? 0.6 : 1 }}>
          <Table variant="dark" hover size="sm" className="bg-primary-1">
            <thead>
              <tr>
                <th><Trans i18nKey="DATE" /></th>
                <th><Trans i18nKey="USER" /></th>
                <th><Trans i18nKey="EVENTS_PAGE.EVENT" /></th>
                <th><Trans i18nKey="EVENTS_PAGE.ITEM" /></th>
                <th><Trans i18nKey="EVENTS_PAGE.LIBRARY" /></th>
                <th><Trans i18nKey="ACTIVITY_TABLE.CLIENT" /></th>
                <th><Trans i18nKey="ACTIVITY_TABLE.DEVICE" /></th>
                <th><Trans i18nKey="ACTIVITY_TABLE.IP_ADDRESS" /></th>
              </tr>
            </thead>
            <tbody>
              {data.results.map((r) => (
                <tr key={r.Id} title={r.Name + (r.ShortOverview ? "\n" + r.ShortOverview : "")}>
                  <td style={{ whiteSpace: "nowrap" }}>{fmt(r.Date)}</td>
                  <td>{r.UserId ? <Link to={`/users/${r.UserId}`}>{r.UserName ?? r.UserId}</Link> : ""}</td>
                  <td style={{ whiteSpace: "nowrap" }}>{typeLabel(r.Type)}</td>
                  <td>
                    {r.ItemId && r.ItemKnown ? (
                      <Link to={`/libraries/item/${r.ItemId}`}>{r.ItemName ?? r.ItemId}</Link>
                    ) : (
                      r.ItemName ?? r.Name
                    )}
                  </td>
                  <td>{r.LibraryName ?? ""}</td>
                  <td>{r.Client ?? ""}</td>
                  <td>{r.DeviceName ?? ""}</td>
                  <td>{r.RemoteAddress ?? ""}</td>
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}

      <div className="d-flex justify-content-end align-items-center gap-2 my-3">
        <Button variant="outline-primary" size="sm" disabled={page <= 1} onClick={() => setPage(1)}>
          <Trans i18nKey="TABLE_NAV_BUTTONS.FIRST" />
        </Button>
        <Button variant="outline-primary" size="sm" disabled={page <= 1} onClick={() => setPage(page - 1)}>
          <Trans i18nKey="TABLE_NAV_BUTTONS.PREVIOUS" />
        </Button>
        <span>
          {page} / {data.pages} ({data.total})
        </span>
        <Button variant="outline-primary" size="sm" disabled={page >= data.pages} onClick={() => setPage(page + 1)}>
          <Trans i18nKey="TABLE_NAV_BUTTONS.NEXT" />
        </Button>
        <Button variant="outline-primary" size="sm" disabled={page >= data.pages} onClick={() => setPage(data.pages)}>
          <Trans i18nKey="TABLE_NAV_BUTTONS.LAST" />
        </Button>
      </div>
    </div>
  );
}

export default Events;
