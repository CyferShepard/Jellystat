import React from "react";
import {Tabs, Tab } from 'react-bootstrap';

import SettingsConfig from "./components/settings/settingsConfig";
import LibrarySync from "./components/settings/librarySync";

import BackupFiles from "./components/settings/backupfiles";

import TerminalComponent from "./components/settings/TerminalComponent";



import "./css/settings/settings.css";

export default function Settings() {


  return (
    <div className="settings my-2">
    <Tabs defaultActiveKey="tabGeneral"  variant='pills'>
          <Tab eventKey="tabGeneral" className='bg-transparent my-2' title='General Settings'  style={{minHeight:'500px'}}>
           <SettingsConfig/>
          </Tab>
          <Tab eventKey="tabTasks" className='bg-transparent  my-2' title='Tasks'  style={{minHeight:'500px'}}>
          <LibrarySync/>

          </Tab>
          <Tab eventKey="tabBackup" className='bg-transparent  my-2' title='Backup'  style={{minHeight:'500px'}}>
           <BackupFiles/>
          </Tab>
    </Tabs>
    
    <TerminalComponent/>
    
    </div>
  );
}
