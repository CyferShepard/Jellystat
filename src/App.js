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


import Navbar from './pages/components/navbar';
import Home from './pages/home';
import Settings from './pages/settings';
import Users from './pages/users';
import UserInfo from './pages/components/user-info';
import Libraries from './pages/libraries';
import ErrorPage from './pages/components/error';

import RecentlyPlayed from './pages/components/recentlyplayed';

import Testing from './pages/testing';

function App() {

  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorFlag, seterrorFlag] = useState(false);

  useEffect(() => {


    const fetchConfig = async () => {
        try {
            const newConfig = await Config();
            if(!newConfig.response){
              setConfig(newConfig);
            }else{
              seterrorFlag(true);
            }
            setLoading(false);
           
        } catch (error) {
          console.log(error);
        }
    };

    if (!config) {
        fetchConfig();
    }

}, [config]);

if (loading) {
  return <Loading />;
}

if (errorFlag) {
  return <ErrorPage message={"Error: Unable to connect to Jellystat Backend"} />;
}

if (!config || config.apiKey ==null) {
  return <Setup />;
}



  return (
    <div className="App">
      <Navbar />
      <div>
      <main>
        <Routes>
        <Route path="/" element={<Home />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/users" element={<Users />} />
          <Route path="/user-info/:UserId" element={<UserInfo />} />
          <Route path="/libraries" element={<Libraries />} />
          <Route path="/testing" element={<Testing />} />
          <Route path="/recent" element={<RecentlyPlayed />} />
        </Routes>
      </main>
      </div>

    </div>

  );
}

export default App;
