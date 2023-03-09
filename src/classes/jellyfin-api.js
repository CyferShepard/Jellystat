import  { Component } from 'react';
import axios from 'axios';
import Config from '../lib/config';

class API extends Component {
  constructor(props) {
    super(props);
    this.state = {
      data: [],
    };
  }


  async getSessions() {
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

  async getActivityData(limit) {
    if(limit===undefined || limit<1)
    {
        return[];
    }
    try {
      const config = await Config();
      const url = `${config.hostUrl}/System/ActivityLog/Entries?limit=${limit}`;
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

  async getAdminUser() {
    try {
      const config = await Config();
      const url = `${config.hostUrl}/Users`;
      const response = await axios.get(url, {
        headers: {
          'X-MediaBrowser-Token': config.apiKey,
        },
      });
      const adminUser = response.data.filter(user => user.Policy.IsAdministrator === true);
      return adminUser || null;
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  async getLibraries() {
    
    try {
      const config = await Config();
      const admins=await this.getAdminUser()
      const userid=admins[0].Id;
      const url = `${config.hostUrl}/users/${userid}/Items`;
      const response = await axios.get(url, {
        headers: {
          'X-MediaBrowser-Token': config.apiKey,
        },
      });
      const mediafolders = response.data.Items.filter(type => ['tvshows','movies'].includes(type.CollectionType));
      return mediafolders || null;
    } catch (error) {
      console.log(error);
      return [];
    }
  }
  
  async getItem(itemID) {
    
    try {
      const config = await Config();
      const admins=await this.getAdminUser()
      const userid=admins[0].Id;
      const url = `${config.hostUrl}/users/${userid}/Items?ParentID=${itemID}`;
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

  async getRecentlyPlayed(userid,limit) {
    
    try {
      const config = await Config();
      const url = `${config.hostUrl}/users/${userid}/Items/Resume?limit=${limit}`;
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

export default API;
