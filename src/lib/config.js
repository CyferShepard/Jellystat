import axios from 'axios';

async function Config() {
  try {
    const response = await axios.get('http://10.0.0.99:3003/api/getconfig');
    const { JF_HOST, JF_API_KEY, APP_USER, APP_PASSWORD } = response.data[0];
    return { hostUrl: JF_HOST, apiKey: JF_API_KEY, username: APP_USER, password: APP_PASSWORD };
  } catch (error) {
    console.log(error);
  }
}

export default Config;
