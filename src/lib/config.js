import axios from 'axios';

async function Config() {
  const token = localStorage.getItem('token');
  try {
    const response = await axios.get('/api/getconfig', {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });

    if(response.data.length>0)
    {
      const { JF_HOST, JF_API_KEY, APP_USER,REQUIRE_LOGIN } = response.data[0];
      return { hostUrl: JF_HOST, apiKey: JF_API_KEY, username: APP_USER, token:token, requireLogin:REQUIRE_LOGIN };
    }
    return { hostUrl: null, apiKey: null, username: null, token:token,requireLogin:true };

  } catch (error) {
    // console.log(error);
    return error;
  }
}

export default Config;
