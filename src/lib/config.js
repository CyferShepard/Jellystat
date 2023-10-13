import axios from "axios";

async function Config() {
  const token = localStorage.getItem("token");
  try {
    const response = await axios.get("/api/getconfig", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if (response.data.length > 0) {
      const { JF_HOST, APP_USER, REQUIRE_LOGIN, settings } = response.data[0];
      return {
        hostUrl: JF_HOST,
        username: APP_USER,
        token: token,
        requireLogin: REQUIRE_LOGIN,
        settings: settings,
      };
    }
    return { hostUrl: null, username: null, token: token, requireLogin: true };
  } catch (error) {
    return error;
  }
}

export default Config;
