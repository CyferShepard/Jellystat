import React from 'react'

import './css/home.css'

import Sessions from './components/sessions/sessions'
import HomeStatisticCards from './components/HomeStatisticCards'
import LibraryOverView from './components/libraryOverview'
import RecentlyAdded from './components/library/recently-added'

export default function Home() {
  return (
    <div className='Home'>

      <Sessions />
      <RecentlyAdded/>
      <HomeStatisticCards/>
      <LibraryOverView/>

    </div>
  )
}