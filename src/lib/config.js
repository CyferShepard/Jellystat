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
      const { JF_HOST, JF_API_KEY, APP_USER } = response.data[0];
      return { hostUrl: JF_HOST, apiKey: JF_API_KEY, username: APP_USER, token:token };
    }
    return { hostUrl: null, apiKey: null, username: null, token:token };

  } catch (error) {
    // console.log(error);
    return error;
  }
}

export default Config;
