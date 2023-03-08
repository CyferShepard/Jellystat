// import logo from './logo.svg';
import './App.css';
import {
  Routes,
  Route,
} from "react-router-dom";


import SideNav from './pages/components/sidenav';
import Home from './pages/home';
import Settings from './pages/settings';
import Activity from './pages/activity';
import UserActivity from './pages/useractivity';
import Libraries from './pages/libraries';

import UserData from './pages/userdata';

function App() {
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
        </Routes>
      </main>
      </div>

    </div>

  );
}

export default App;
