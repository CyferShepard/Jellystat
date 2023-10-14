import "./App.css";
import React, { useState, useEffect } from "react";
import { Routes, Route } from "react-router-dom";
import axios from "axios";

import { ToastContainer, toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

import Config from "./lib/config";

import Loading from "./pages/components/general/loading";

import Signup from "./pages/signup";
import Setup from "./pages/setup";
import Login from "./pages/login";

import Navbar from "./pages/components/general/navbar";
import Home from "./pages/home";
import Settings from "./pages/settings";
import Users from "./pages/users";
import UserInfo from "./pages/components/user-info";
import Libraries from "./pages/libraries";
import LibraryInfo from "./pages/components/library-info";
import ItemInfo from "./pages/components/item-info";
import ErrorPage from "./pages/components/general/error";
import About from "./pages/about";

import Testing from "./pages/testing";
import Activity from "./pages/activity";
import Statistics from "./pages/statistics";
import Datadebugger from "./pages/data-debugger";

function App() {
  const [setupState, setSetupState] = useState(0);
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorFlag, seterrorFlag] = useState(false);
  const token = localStorage.getItem("token");

  useEffect(() => {
    const fetchConfig = async () => {
      try {
        const newConfig = await Config();
        if (!newConfig.response) {
          setConfig(newConfig);
        } else {
          if (newConfig.response.status !== 403) {
            seterrorFlag(true);
          }
        }
        setLoading(false);
      } catch (error) {
        console.log(error);
      }
    };

    if (setupState === 0) {
      setLoading(false);
      axios
        .get("/auth/isConfigured")
        .then(async (response) => {
          if (response.status === 200) {
            setSetupState(response.data.state);
          }
        })
        .catch((error) => {
          console.log(error);
          seterrorFlag(true);
        });
    }

    if (!config && setupState >= 1) {
      fetchConfig();
    }
  }, [config, setupState]);

  if (loading) {
    return <Loading />;
  }

  if (errorFlag) {
    return (
      <ErrorPage message={"Error: Unable to connect to Jellystat Backend"} />
    );
  }

  if (!config && setupState === 2) {
    if (token === undefined || token === null || !config) {
      return <Login />;
    }
  }

  if (setupState === 0) {
    return <Signup />;
  }
  if (setupState === 1) {
    return <Setup />;
  }

  if (config && setupState === 2 && token !== null) {
    return (
      <div className="App">
        <div className="d-flex flex-column flex-md-row">
          <Navbar />
          <main className="w-md-100">
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
              <Route path="/debugger/data" element={<Datadebugger />} />
            </Routes>
          </main>
        </div>
      </div>
    );
  }
}

export default App;
