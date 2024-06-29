import axios from 'axios';

async function Config() {
  const token = localStorage.getItem('token');
  try {
    const response = await axios.get('/api/getconfig', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
    const { JF_HOST,  APP_USER,REQUIRE_LOGIN, settings, IS_JELLYFIN } = response.data;
      return { hostUrl: JF_HOST, username: APP_USER, token:token, requireLogin:REQUIRE_LOGIN, settings:settings, IS_JELLYFIN:IS_JELLYFIN };

  } catch (error) {
    // console.log(error);
    return error;
  }
}

export default Config;
