import { NavLink } from "react-router-dom";
import { navData } from "../../../lib/navdata";
import "../../css/navbar.css";
import LogoutBoxLineIcon from "remixicon-react/LogoutBoxLineIcon";

export default function Navbar() {
  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };



  return (
    <div className={"navbar"}>
      <h1 style={{marginRight:"20px"}}>Jellystat</h1>
      {navData.map((item) => {
        return (
          <NavLink key={item.id} className={"navitem"} to={item.link}>
            {item.icon}
            <span className={"nav-text"}>{item.text}</span>
          </NavLink>
        );
      })}
      <NavLink className={"navitem"} to={"/logout"} onClick={handleLogout}>
        <LogoutBoxLineIcon />
        <span className={"nav-text"}>Logout</span>
      </NavLink>
    </div>
  );
}
