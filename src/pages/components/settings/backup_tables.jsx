import { useState, useEffect } from "react";
import axios from "../../../lib/axios_instance";

import "../../css/settings/backups.css";
import { Trans } from "react-i18next";
import { Button } from "react-bootstrap";

const token = localStorage.getItem("token");

export default function BackupTables() {
  const [tables, setTables] = useState([]);

  const setTableExclusion = async (table) => {
    const tableData = await axios.post(
      `/api/setExcludedBackupTable`,
      {
        table: table,
      },
      {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      }
    );
    if (tableData.data) {
      setTables(tableData.data ?? []);
    }
    return;
  };

  useEffect(() => {
    const fetchData = async () => {
      try {
        const backupTables = await axios.get(`/api/getBackupTables`, {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json",
          },
        });
        setTables(backupTables.data);
      } catch (error) {
        console.log(error);
      }
    };

    fetchData();

    const intervalId = setInterval(fetchData, 60000 * 5);
    return () => clearInterval(intervalId);
  }, []);

  function toggleTable(table) {
    setTableExclusion(table);
  }

  return (
    <div>
      <h1 className="my-2">
        <Trans i18nKey={"TAB_CONTROLS.OPTIONS"} />
      </h1>
      <div>
        {tables.length > 0 &&
          tables.map((table, index) => (
            <Button
              key={index}
              table={table.name}
              variant={table.Excluded ? "danger" : "primary"}
              onClick={() => toggleTable(table.value)}
              className="me-2 mb-2"
            >
              {table.name}
            </Button>
          ))}
      </div>
    </div>
  );
}
