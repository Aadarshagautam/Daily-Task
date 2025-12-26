import React from 'react'
import{Routes, Route} from "react-router-dom"
import CreatePages from './Pages/CreatePages.jsx'
import NoteDetailPage from './Pages/NoteDetailPage.jsx'
import HomePages from './Pages/HomePages.jsx'


const App = () => {
  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 -z-10 h-full w-full items-center px-5 py-24 [background:radious-gradient(125%_125%_at_50%_10%,#000_60% , #00FF9D40_100%)] " />
      
      <Routes>
        <Route path="/" element={<HomePages />} />
        <Route path="/create" element={<CreatePages />} />
        <Route path="/notes/:id" element={<NoteDetailPage/>} />
      </Routes>
    </div>
  )
}

export default App