export const THEME_STORAGE_KEY = "PREF_THEME";
export const JELLYFIN_ICON_URL = "https://cdn.jsdelivr.net/gh/selfhst/icons@main/svg/jellyfin.svg";

export const themePresets = {
  jellystat: {
    label: "Jellystat",
    colors: {
      primary: "#5a2da5",
      secondary: "#00A4DC",
      background: "#1e1c22",
      surface: "#2c2a2f",
      tertiary: "#2f2e31",
    },
  },
  jellyfin: {
    label: "Jellyfin",
    colors: {
      primary: "#00A4DC",
      secondary: "#AA5CC3",
      background: "#101216",
      surface: "#1c2028",
      tertiary: "#252a34",
    },
  },
};

export const defaultThemeSettings = {
  preset: "jellystat",
  brand: "jellystat",
  icon: "jellystat",
  splash: "off",
  colors: themePresets.jellystat.colors,
};

export function getServerSplashscreenUrl(baseUrl = "") {
  return `${baseUrl}/proxy/Branding/Splashscreen?format=jpg&foregroundLayer=20`;
}

export function getServerIconUrl(baseUrl = "") {
  return `${baseUrl}/proxy/web/icon-transparent.png`;
}

export function getThemeSettings() {
  try {
    const storedTheme = JSON.parse(localStorage.getItem(THEME_STORAGE_KEY) || "{}");
    const legacyBrand = storedTheme.brand || defaultThemeSettings.brand;
    return {
      ...defaultThemeSettings,
      ...storedTheme,
      icon: storedTheme.icon || legacyBrand,
      splash: storedTheme.splash || (legacyBrand === "server" ? "server" : defaultThemeSettings.splash),
      colors: {
        ...defaultThemeSettings.colors,
        ...(storedTheme.colors || {}),
      },
    };
  } catch {
    return defaultThemeSettings;
  }
}

export function applyThemeSettings(themeSettings = getThemeSettings()) {
  const root = document.documentElement;
  const colors = themeSettings.colors || defaultThemeSettings.colors;

  root.style.setProperty("--primary-color", colors.primary);
  root.style.setProperty("--secondary-color", colors.secondary);
  root.style.setProperty("--background-color", colors.background);
  root.style.setProperty("--secondary-background-color", colors.surface);
  root.style.setProperty("--tertiary-background-color", colors.tertiary);
  root.dataset.icon = themeSettings.icon || themeSettings.brand || defaultThemeSettings.icon;
  root.dataset.splash = themeSettings.splash || defaultThemeSettings.splash;
}

export function saveThemeSettings(themeSettings) {
  const nextTheme = {
    ...defaultThemeSettings,
    ...themeSettings,
    icon: themeSettings.icon || themeSettings.brand || defaultThemeSettings.icon,
    splash: themeSettings.splash || defaultThemeSettings.splash,
    colors: {
      ...defaultThemeSettings.colors,
      ...(themeSettings.colors || {}),
    },
  };

  localStorage.setItem(THEME_STORAGE_KEY, JSON.stringify(nextTheme));
  applyThemeSettings(nextTheme);
  return nextTheme;
}
