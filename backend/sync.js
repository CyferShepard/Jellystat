// import  { Component } from 'react';
const axios = require('axios');
// import Config from '../lib/config';

class sync  {
  constructor(hostUrl, apiKey) {
    this.hostUrl = hostUrl;
    this.apiKey = apiKey;
  }


  async getAdminUser() {

    try {
      const url = `${this.hostUrl}/Users`;
      console.log('getAdminUser: ',url);
      const response = await axios.get(url, {
        headers: {
          'X-MediaBrowser-Token': this.apiKey,
        },
      });
      const adminUser = response.data.filter(user => user.Policy.IsAdministrator === true);
      return adminUser || null;
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  async getAllItems() {
    if( this.hostUrl ===undefined || this.apiKey ===undefined)
    {
      return('Error: Method Not Initialized');
    }
    const libraries=await this.getLibraries();
    const allitems=[];
    for (let i = 0; i < libraries.length; i++) {
      const item = libraries[i];
      let libraryItems=await this.getItem(item.Id);
      // allitems.push({library:item, data:libraryItems});
      const libraryItemsWithParent = libraryItems.map(items => ({ ...items, ...{ParentId: item.Id} }));
      // libraryItems["ParentId"]=item.Id;
      allitems.push(...libraryItemsWithParent);
      
    }
    return allitems;
    

  }
  

  async getLibraries() {
    
    try {
  
      const admins=await this.getAdminUser()
      const userid=admins[0].Id;
      const url = `${this.hostUrl}/users/${userid}/Items`;
      console.log('getLibraries: ',url);
      const response = await axios.get(url, {
        headers: {
          'X-MediaBrowser-Token': this.apiKey,
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
   
      const admins=await this.getAdminUser()
      const userid=admins[0].Id;
      const url = `${this.hostUrl}/users/${userid}/Items?ParentID=${itemID}`;
      const response = await axios.get(url, {
        headers: {
          'X-MediaBrowser-Token': this.apiKey,
        },
      });
      return response.data.Items;
    } catch (error) {
      console.log(error);
      return [];
    }
  }

  async getShows() {
     
      let libraries=await this.getLibraries();
      libraries=libraries.filter(type => type.CollectionType==='tvshows');
      const allShows=[];
      for (let i = 0; i < libraries.length; i++) {
        const item = libraries[i];
        const showItems=await this.getItem(item.Id);
        const showsWithParent = showItems.map(items => ({ ...items, ...{ParentId: item.Id} }));
        allShows.push(...showsWithParent);
      }
      return allShows;
  }


  async getSeasonsAndEpisodes(showId) {
     
    const allSeasons=[];
    const allEpisodes=[];


        let seasonItems=await this.getItem(showId);
        const seasonWithParent = seasonItems.map(items => ({ ...items, ...{ParentId: showId} }));
        allSeasons.push(...seasonWithParent);
          for (let e = 0; e < seasonItems.length; e++) {
            const season = seasonItems[e];
            let episodeItems=await this.getItem(season.Id);
            const episodeWithParent = episodeItems.map(items => ({ ...items, ...{ParentId: season.Id} }));
            allEpisodes.push(...episodeWithParent);

          } 
        

    return {allSeasons:allSeasons,allEpisodes:allEpisodes};
}

}



module.exports= sync;
