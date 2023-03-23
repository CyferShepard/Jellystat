import axios from 'axios';

async function Config() {
  try {
    const response = await axios.get('/api/getconfig');
    const { JF_HOST, JF_API_KEY, APP_USER, APP_PASSWORD } = response.data[0];
    return { hostUrl: JF_HOST, apiKey: JF_API_KEY, username: APP_USER, password: APP_PASSWORD };
  } catch (error) {
    // console.log(error);
    return error;
  }
}

export default Config;
