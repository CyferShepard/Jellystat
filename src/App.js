// import logo from './logo.svg';
import './App.css';
import React, { useState, useEffect } from 'react';
import {
  Routes,
  Route,
} from "react-router-dom";

import Config from './lib/config';

import Loading from './pages/components/loading';

import Setup from './pages/setup';


import SideNav from './pages/components/sidenav';
import Home from './pages/home';
import Settings from './pages/settings';
import Activity from './pages/activity';
import UserActivity from './pages/useractivity';
import Libraries from './pages/libraries';

import RecentlyPlayed from './pages/components/recentlyplayed';

import UserData from './pages/userdata';

function App() {

  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {


    const fetchConfig = async () => {
        try {
            const newConfig = await Config();
            setConfig(newConfig);
            setLoading(false);
        } catch (error) {
            if (error.code === 'ERR_NETWORK') {
                console.log(error);
            }
        }
    };

    if (!config) {
        fetchConfig();
    }

}, [config]);

if (loading) {
  return <Loading />;
}

if (!config || config.apiKey ==null) {
  return <Setup />;
}



  return (
    <div className="App">
      <SideNav />
      <div>
      <main>
        <Routes>
        <Route path="/" element={<Home />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/activity" element={<Activity />} />
          <Route path="/libraries" element={<Libraries />} />
          <Route path="/usersactivity" element={<UserActivity />} />
          <Route path="/userdata" element={<UserData />} />
          <Route path="/recent" element={<RecentlyPlayed />} />
        </Routes>
      </main>
      </div>

    </div>

  );
}

export default App;
