import React from 'react'

import './css/home.css'

import Sessions from './components/sessions/sessions'
import HomeStatisticCards from './components/HomeStatisticCards'
import LibraryOverView from './components/libraryOverview'


export default function Home() {
  return (
    <div>

      <Sessions />
      <HomeStatisticCards/>
      <LibraryOverView/>

    </div>
  )
}