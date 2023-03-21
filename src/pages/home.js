import React from 'react'

import './css/home.css'

import Sessions from './components/sessions'
import WatchStatistics from './components/WatchStatistics'
import LibraryOverView from './components/libraryOverview'


export default function Home() {
  return (
    <div>

      <Sessions />
      <WatchStatistics/>
      <LibraryOverView/>

    </div>
  )
}