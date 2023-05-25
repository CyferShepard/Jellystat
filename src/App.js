// import logo from './logo.svg';
import './App.css';
import React, { useState, useEffect } from 'react';
import { Routes, Route } from "react-router-dom";
import axios from 'axios';

import Config from './lib/config';

import Loading from './pages/components/general/loading';

import Signup from './pages/signup';
import Setup from './pages/setup';
import Login from './pages/login';


import Navbar from './pages/components/general/navbar';
import Home from './pages/home';
import Settings from './pages/settings';
import Users from './pages/users';
import UserInfo from './pages/components/user-info';
import Libraries from './pages/libraries';
import LibraryInfo from './pages/components/library-info';
import ItemInfo from './pages/components/item-info';
import ErrorPage from './pages/components/general/error';
import About from './pages/about';


import Testing from './pages/testing';
import Activity from './pages/activity';
import Statistics from './pages/statistics';

function App() {

  const [isConfigured, setisConfigured] = useState(false);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorFlag, seterrorFlag] = useState(false);
  const token = localStorage.getItem('token');

  useEffect(() => {


    const fetchConfig = async () => {
        try {
            const newConfig = await Config();
            if(!newConfig.response){
              setConfig(newConfig);
            }else{
              if(newConfig.response.status!==403)
              {
                seterrorFlag(true);
              }
             
            }
            setLoading(false);
           
        } catch (error) {
          console.log(error);
        }
    };

    if(!isConfigured)
    {
      setLoading(false);
      axios
      .get("/auth/isConfigured")
      .then(async (response) => {
        // console.log(response);
        if(response.status===200)
        {
          setisConfigured(true);
         
        }
   
        
      })
      .catch((error) => {
        console.log(error);
        seterrorFlag(true);
        
      });
       
    }

    if (!config && isConfigured) {
        fetchConfig();
    }

}, [config,isConfigured]);

if (loading) {
  return <Loading />;
}

if (errorFlag) {
  return <ErrorPage message={"Error: Unable to connect to Jellystat Backend"} />;
}

if(isConfigured)
  {
    if ((token===undefined || token===null) || !config) {
      return <Login />;
    }
  }
  else{
    return <Signup />;
  }





if (config  && config.apiKey ===null) {
  return <Setup />;
}

if (config  && isConfigured && token!==null){
  return (
    <div className="App">
 
      <div className='d-flex flex-column flex-md-row'>
      <Navbar/>
      <main className='w-md-100'>
        <Routes>
        <Route path="/" element={<Home />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/users" element={<Users />} />
          <Route path="/users/:UserId" element={<UserInfo />} />
          <Route path="/libraries" element={<Libraries />} />
          <Route path="/libraries/:LibraryId" element={<LibraryInfo />} />
          <Route path="/libraries/item/:Id" element={<ItemInfo />} />
          <Route path="/statistics" element={<Statistics />} />
          <Route path="/activity" element={<Activity />} />
          <Route path="/testing" element={<Testing />} />
          <Route path="/about" element={<About />} />
        </Routes>
      </main>
      </div>

    </div>

  );
}




}

export default App;
