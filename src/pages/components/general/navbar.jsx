import { Button, Modal, Nav, Navbar as BootstrapNavbar } from "react-bootstrap";
import { Link, useLocation } from "react-router-dom";
import { navData } from "../../../lib/navdata";
import LogoutBoxLineIcon from "remixicon-react/LogoutBoxLineIcon";
import UserFillIcon from "remixicon-react/UserFillIcon";
import logo_dark from "../../images/icon-b-512.png";
import "../../css/navbar.css";
import VersionCard from "./version-card";
import { Trans } from "react-i18next";
import { useState } from "react";
import baseUrl from "../../../lib/baseurl";
import {
  defaultThemeSettings,
  getServerIconUrl,
  getServerSplashscreenUrl,
  getThemeSettings,
  JELLYFIN_ICON_URL,
  saveThemeSettings,
  themePresets,
  THEME_STORAGE_KEY,
} from "../../../lib/theme";

function decodeTokenUser() {
  try {
    const token = localStorage.getItem("token");
    const payload = token?.split(".")?.[1];
    if (!payload) {
      return {};
    }

    const normalizedPayload = payload.replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(window.atob(normalizedPayload))?.user || {};
  } catch {
    return {};
  }
}

function ProfileAvatar({ imageUrl, size }) {
  const [imageError, setImageError] = useState(false);

  if (imageUrl && !imageError) {
    return <img alt="" className="profile-avatar-image" src={imageUrl} onError={() => setImageError(true)} />;
  }

  return <UserFillIcon size={size} />;
}

function ServerIconMark({ className }) {
  const [imageError, setImageError] = useState(false);
  const imageUrl = getServerIconUrl(baseUrl);

  if (!imageError) {
    return <img alt="" className={className} src={imageUrl} onError={() => setImageError(true)} />;
  }

  return <img alt="" className="navbar-jellyfin-logo" src={JELLYFIN_ICON_URL} />;
}

export default function Navbar() {
  const [showProfileModal, setShowProfileModal] = useState(false);
  const [themeSettings, setThemeSettings] = useState(getThemeSettings());
  const config = (() => {
    try {
      return JSON.parse(localStorage.getItem("config") || "{}");
    } catch {
      return {};
    }
  })();
  const tokenUser = decodeTokenUser();
  const username = tokenUser?.username || config?.username || "Jellystat";
  const accountProvider = tokenUser?.provider === "jellyfin" ? "Jellyfin" : "Jellystat";
  const profileImageUrl = tokenUser?.provider === "jellyfin" && tokenUser?.id
    ? `${baseUrl}/proxy/Users/Images/Primary?id=${tokenUser.id}&quality=50`
    : null;
  const selectedIcon = themeSettings.icon || themeSettings.brand || defaultThemeSettings.icon;
  const brandLabel =
    selectedIcon === "server" ? config?.serverName || "Server" : selectedIcon === "jellyfin" ? "Jellyfin" : <Trans i18nKey="JELLYSTAT" />;

  const updateTheme = (themePatch) => {
    setThemeSettings((currentTheme) => {
      const nextTheme = saveThemeSettings({
        ...currentTheme,
        ...themePatch,
        colors: {
          ...currentTheme.colors,
          ...(themePatch.colors || {}),
        },
      });
      return nextTheme;
    });
  };

  const applyPreset = (presetName) => {
    updateTheme({
      preset: presetName,
      colors: themePresets[presetName].colors,
    });
  };

  const resetTheme = () => {
    const nextTheme = saveThemeSettings(defaultThemeSettings);
    setThemeSettings(nextTheme);
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("config");
    deleteLibraryTabKeys();
    window.location.reload();
  };

  const deleteLibraryTabKeys = () => {
    for (let i = 0; i < localStorage.length; i++) {
      const key = localStorage.key(i);
      if (key.startsWith("PREF_") && key !== THEME_STORAGE_KEY) {
        localStorage.removeItem(key);
      }
    }
  };

  const location = useLocation();

  return (
    <BootstrapNavbar variant="dark" className=" d-flex flex-column py-0 text-center sticky-top">
      <div className="sticky-top py-md-3">
        <BootstrapNavbar.Brand as={Link} to={"/"} className="d-none d-md-inline">
          {selectedIcon === "server" ? (
            <ServerIconMark className="navbar-server-icon" />
          ) : selectedIcon === "jellyfin" ? (
            <img alt="" className="navbar-jellyfin-logo" src={JELLYFIN_ICON_URL} />
          ) : (
            <img src={logo_dark} className="navbar-jellystat-logo" alt="" />
          )}
          <span className="navbar-brand-text">{brandLabel}</span>
        </BootstrapNavbar.Brand>

        <Nav className="flex-row flex-md-column w-100">
          {navData.map((item) => {
            const locationString = location.pathname.toLocaleLowerCase();
            const isActive =
              locationString.includes(("/" + item.link).toLocaleLowerCase()) &&
              ((locationString.length > 0 && item.link.length > 0) || (locationString.length === 1 && item.link.length === 0)); // check if the link is the current path
            return (
              <Nav.Link
                as={Link}
                key={item.id}
                className={`navitem${isActive ? " active" : ""} p-2`} // add the "active" class if the link is active
                to={item.link}
              >
                {item.icon}
                <span className="d-none d-md-block nav-text">{item.text}</span>
              </Nav.Link>
            );
          })}
          <Nav.Link className="navitem p-2 logout d-md-none" href="#logout" onClick={handleLogout}>
            <LogoutBoxLineIcon />
            <span className="d-none d-md-block nav-text">
              <Trans i18nKey="MENU_TABS.LOGOUT" />
            </span>
          </Nav.Link>
          <button
            aria-label="Open profile"
            className="navitem profile-navitem p-2 d-md-none"
            type="button"
            onClick={() => setShowProfileModal(true)}
          >
            <UserFillIcon />
          </button>
        </Nav>
      </div>
      <div className="profile-nav d-none d-md-flex">
        <button aria-label="Open profile" className="profile-nav-button" type="button" onClick={() => setShowProfileModal(true)}>
          <span className="profile-nav-avatar">
            <ProfileAvatar imageUrl={profileImageUrl} size={22} />
          </span>
          <span className="profile-nav-meta">
            <span className="profile-nav-label">Profile</span>
            <span className="profile-nav-username">{username}</span>
          </span>
        </button>
      </div>
      <VersionCard />
      <Modal show={showProfileModal} onHide={() => setShowProfileModal(false)} dialogClassName="profile-modal-dialog">
        <Modal.Header closeButton>
          <Modal.Title>Profile</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <div className="profile-modal-header">
            <div className="profile-modal-avatar">
              <ProfileAvatar imageUrl={profileImageUrl} size={34} />
            </div>
            <div>
              <p className="profile-modal-name">{username}</p>
              <p className="profile-modal-subtitle">{accountProvider} account</p>
            </div>
          </div>
          <div className="profile-theme-panel">
            <div className="profile-theme-heading">Appearance</div>
            <div className="profile-theme-row">
              <span>Preset</span>
              <div className="profile-theme-segment">
                {Object.entries(themePresets).map(([presetName, preset]) => (
                  <button
                    className={themeSettings.preset === presetName ? "active" : ""}
                    key={presetName}
                    type="button"
                    onClick={() => applyPreset(presetName)}
                  >
                    {preset.label}
                  </button>
                ))}
              </div>
            </div>
            <div className="profile-theme-row">
              <span>Icon</span>
              <div className="profile-theme-segment">
                <button
                  className={selectedIcon === "jellystat" ? "active" : ""}
                  type="button"
                  onClick={() => updateTheme({ icon: "jellystat", brand: "jellystat" })}
                >
                  Jellystat
                </button>
                <button
                  className={selectedIcon === "jellyfin" ? "active" : ""}
                  type="button"
                  onClick={() => updateTheme({ icon: "jellyfin", brand: "jellyfin" })}
                >
                  Jellyfin
                </button>
                <button
                  className={selectedIcon === "server" ? "active" : ""}
                  type="button"
                  onClick={() => updateTheme({ icon: "server", brand: "server" })}
                >
                  Server
                </button>
              </div>
            </div>
            {selectedIcon === "server" && (
              <div className="profile-server-icon-preview">
                <img src={getServerIconUrl(baseUrl)} alt="" />
              </div>
            )}
            <div className="profile-theme-row">
              <span>Splash screen</span>
              <div className="profile-theme-segment">
                <button
                  className={(themeSettings.splash || defaultThemeSettings.splash) === "off" ? "active" : ""}
                  type="button"
                  onClick={() => updateTheme({ splash: "off" })}
                >
                  Off
                </button>
                <button
                  className={themeSettings.splash === "server" ? "active" : ""}
                  type="button"
                  onClick={() => updateTheme({ splash: "server" })}
                >
                  Server
                </button>
              </div>
            </div>
            {themeSettings.splash === "server" && (
              <div className="profile-server-splash-preview">
                <img src={getServerSplashscreenUrl(baseUrl)} alt="" />
              </div>
            )}
            <div className="profile-color-grid">
              {[
                ["primary", "Primary"],
                ["secondary", "Accent"],
                ["background", "Background"],
                ["surface", "Surface"],
              ].map(([colorKey, label]) => (
                <label className="profile-color-control" key={colorKey}>
                  <span>{label}</span>
                  <input
                    type="color"
                    value={themeSettings.colors[colorKey]}
                    onChange={(event) =>
                      updateTheme({
                        preset: "custom",
                        colors: { [colorKey]: event.target.value },
                      })
                    }
                  />
                </label>
              ))}
            </div>
            <Button className="profile-theme-reset" type="button" variant="outline-primary" onClick={resetTheme}>
              Reset appearance
            </Button>
          </div>
        </Modal.Body>
        <Modal.Footer className="profile-modal-actions">
          <Button variant="primary" onClick={handleLogout}>
            <LogoutBoxLineIcon size={18} />
            <span>
              <Trans i18nKey="MENU_TABS.LOGOUT" />
            </span>
          </Button>
        </Modal.Footer>
      </Modal>
    </BootstrapNavbar>
  );
}
