import  { Component } from 'react';
import axios from 'axios';
import Config from '../lib/config';

class Stats extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
    };
  }


  async getLibrary() {
    try {
      const config = await Config();
      const url = `${config.hostUrl}/Sessions`;
      const response = await axios.get(url, {
        headers: {
          'X-MediaBrowser-Token': config.apiKey,
        },
      });
      return response.data;
    } catch (error) {
      console.log(error);
      return [];
    }
  }
}


export default Stats;
