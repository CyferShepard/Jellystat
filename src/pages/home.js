import React from 'react'

import './css/home.css'

import Sessions from './components/sessions'
import LibraryOverView from './components/libraryOverview'

export default function Home() {
  return (
    <div>
      <LibraryOverView/>
      <h1>Sessions</h1>
      <Sessions />
    </div>
  )
}