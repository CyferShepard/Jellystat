import { Nav, Navbar as BootstrapNavbar, Container, Col } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import { navData } from "../../../lib/navdata";
import LogoutBoxLineIcon from "remixicon-react/LogoutBoxLineIcon";
import "../../css/navbar.css";

export default function Navbar() {
  const handleLogout = () => {
    localStorage.clear();
    window.location.reload();
  };

  const location = useLocation(); // use the useLocation hook from react-router-dom

  return (
    <BootstrapNavbar variant="dark" expand="md" className="navbar py-0">
      <Container fluid>
      <BootstrapNavbar.Brand href="#home">Jellystat</BootstrapNavbar.Brand>
      <BootstrapNavbar.Toggle aria-controls="responsive-navbar-nav" />
      <BootstrapNavbar.Collapse id="responsive-navbar-nav">
            <Nav className="ms-auto">
              {navData.map((item) => {
                const isActive = ('/'+item.link).toLocaleLowerCase() === location.pathname.toLocaleLowerCase(); // check if the link is the current path
                return (
                  <Nav.Link
                    as={Link}
                    key={item.id}
                    className={`navitem${isActive ? " active" : ""}`} // add the "active" class if the link is active
                    to={item.link}
                  >
                    {item.icon}
                    <span className="nav-text">{item.text}</span>
                  </Nav.Link>
                );
              })}
              <Nav.Link className="navitem" href="#logout" onClick={handleLogout}>
                <LogoutBoxLineIcon />
                <span className="nav-text">Logout</span>
              </Nav.Link>
            </Nav>
          </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
}
