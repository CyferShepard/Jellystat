import React from "react";

import SettingsConfig from "./components/settings/settingsConfig";
import LibrarySync from "./components/settings/librarySync";

import BackupFiles from "./components/settings/backupfiles";

import TerminalComponent from "./components/settings/TerminalComponent";



import "./css/settings/settings.css";

export default function Settings() {


  return (
    <div>
    <SettingsConfig/>
    <BackupFiles/>
    <LibrarySync/>

    <TerminalComponent/>
    
    </div>
  );
}
