import { Tabs, Tab } from "react-bootstrap";
import { useState } from "react";

import SettingsConfig from "./components/settings/settingsConfig";
import Tasks from "./components/settings/Tasks";
import SecuritySettings from "./components/settings/security";
import ApiKeys from "./components/settings/apiKeys";
import WebhooksSettings from "./components/settings/webhooks";
import LibrarySelector from "./library_selector";
import ActivityMonitorSettings from "./components/settings/ActivityMonitorSettings";

import Logs from "./components/settings/logs";

import "./css/settings/settings.css";
import { Trans } from "react-i18next";
import BackupPage from "./components/settings/backup_page";

export default function Settings() {
  const [activeTab, setActiveTab] = useState(localStorage.getItem(`PREF_SETTINGS_LAST_SELECTED_TAB`) ?? "tabGeneral");

  function setTab(tabName) {
    setActiveTab(tabName);
    localStorage.setItem(`PREF_SETTINGS_LAST_SELECTED_TAB`, tabName);
  }

  return (
    <div className="settings my-2">
      <Tabs defaultActiveKey={activeTab} activeKey={activeTab} onSelect={setTab} variant="pills">
        <Tab
          eventKey="tabGeneral"
          className="bg-transparent my-2"
          title={<Trans i18nKey={"SETTINGS_PAGE.SETTINGS"} />}
          style={{ minHeight: "500px" }}
        >
          <SettingsConfig />
          <SecuritySettings />
          <ActivityMonitorSettings />
          <Tasks />
        </Tab>

        <Tab
          eventKey="tabLibraries"
          className="bg-transparent  my-2"
          title={<Trans i18nKey={"SETTINGS_PAGE.LIBRARY_SETTINGS"} />}
          style={{ minHeight: "500px" }}
        >
          <LibrarySelector />
        </Tab>

        <Tab
          eventKey="tabKeys"
          className="bg-transparent  my-2"
          title={<Trans i18nKey={"SETTINGS_PAGE.API_KEY"} />}
          style={{ minHeight: "500px" }}
        >
          <ApiKeys />
        </Tab>

        {/* <Tab
          eventKey="tabWebhooks"
          className="bg-transparent  my-2"
          title={<Trans i18nKey={"SETTINGS_PAGE.WEBHOOKS"} />}
          style={{ minHeight: "500px" }}
        >
            <WebhooksSettings />
        </Tab> */}

        <Tab
          eventKey="tabBackup"
          className="bg-transparent  my-2"
          title={<Trans i18nKey={"SETTINGS_PAGE.BACKUP"} />}
          style={{ minHeight: "500px" }}
        >
          <BackupPage />
        </Tab>

        <Tab
          eventKey="tabLogs"
          className="bg-transparent  my-2"
          title={<Trans i18nKey={"SETTINGS_PAGE.LOGS"} />}
          style={{ minHeight: "500px" }}
        >
          <Logs />
        </Tab>
      </Tabs>
    </div>
  );
}
