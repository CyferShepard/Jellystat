
import { NavLink } from "react-router-dom";
import { navData } from "../../../lib/navdata";
import  "../../css/navbar.css"



export default function Navbar() {
  return (
    <div className={'navbar'}>
        {navData.map(item =>{
            return <NavLink key={item.id} className={'navitem'} to={item.link}>
            {item.icon}
            <span className={'nav-text'}>{item.text}</span>
        </NavLink>
        })}
    </div>
  )
}