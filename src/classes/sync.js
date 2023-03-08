import  { Component } from 'react';
import axios from 'axios';
import Config from '../lib/config';

class GetSeries extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
    };
  }


  async getData() {
    try {
      const config = await Config();
      const url = `${config.hostUrl}/users/5f63950a2339462196eb8cead70cae7e/Items?ParentID=9d7ad6afe9afa2dab1a2f6e00ad28fa6`;
      const response = await axios.get(url, {
        headers: {
          'X-MediaBrowser-Token': config.apiKey,
        },
      });
      return response.data.Items;
    } catch (error) {
      console.log(error);
      return [];
    }
  }
}

export default GetSeries;
