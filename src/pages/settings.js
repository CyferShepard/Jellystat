import React from "react";

import SettingsConfig from "./components/settings/settingsConfig";
import LibrarySync from "./components/settings/librarySync";

import TerminalComponent from "./components/settings/TerminalComponent";

import "./css/settings.css";

export default function Settings() {


  return (
    <div>
    <SettingsConfig/>
    <LibrarySync/>
    <TerminalComponent/>
    
    </div>
  );
}
