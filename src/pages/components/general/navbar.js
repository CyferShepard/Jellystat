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
        <Col xs={8} md={4}>
          <BootstrapNavbar.Brand href="#home">Jellystat</BootstrapNavbar.Brand>
        </Col>
        <Col className="d-flex align-items-center justify-content-end">
          <BootstrapNavbar.Toggle aria-controls="basic-navbar-nav" />
        </Col>
        <Col md={8} className="w-100">
          <BootstrapNavbar.Collapse id="basic-navbar-nav">
            <Nav className="ml-auto">
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
        </Col>
      </Container>
    </BootstrapNavbar>
  );
}
