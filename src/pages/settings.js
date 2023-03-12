import React from "react";

import SettingsConfig from "./components/settings/settingsConfig";
import LibrarySync from "./components/settings/librarySync";
import WebSocketComponent from "./components/settings/WebSocketComponent ";

import "./css/settings.css";

export default function Settings() {


  return (
    <div>
    <SettingsConfig/>
    <LibrarySync/>
    <WebSocketComponent/>
    
    </div>
  );
}
