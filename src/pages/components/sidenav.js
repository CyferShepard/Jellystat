import  "../css/sidenav.css"
import { NavLink } from "react-router-dom";

import MenuUnfoldFillIcon from 'remixicon-react/MenuUnfoldFillIcon';
import MenuFoldFillIcon from 'remixicon-react/MenuFoldFillIcon';

import { navData } from "../../lib/navdata";
import { useState } from "react";

export default function Sidenav() {
    const [open, setopen] = useState(false)
    const toggleOpen = () => {
        setopen(!open)
    }
  return (
    <div className={open? 'sidenav':'sidenav Closed'}>
        <button className={open? 'menuBtn menuBtn-open':'menuBtn' } onClick={toggleOpen}>
            {open?  <MenuFoldFillIcon color="#fff" />:<MenuUnfoldFillIcon color="#fff" />}
        </button>
        {navData.map(item =>{
            return <NavLink key={item.id} className={'sideitem'} to={item.link}>
            {item.icon}
            <span className={open? 'text-open' :'text-closed'}>{open? item.text : ''}</span>
        </NavLink>
        })}
    </div>
  )
}