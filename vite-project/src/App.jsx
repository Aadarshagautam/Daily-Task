import React from 'react'
import{Routes, Route} from "react-router-dom"
import CreatePages from './Pages/CreatePages.jsx'
import NoteDetailPage from './Pages/NoteDetailPage.jsx'
import HomePages from './Pages/HomePages.jsx'
import Login from './Pages/Auth/Login.jsx'
import EmailVerifty from './Pages/Auth/EmailVerifty.jsx'
import ResetPassword from './Pages/Auth/ResetPassword.jsx'
import { ToastContainer } from 'react-toastify';
import 'react-toastfy/dist/ReactToastify.css';


const App = () => {
  return (
    <div className="relative h-full w-full">
      <div className="absolute inset-0 -z-10 h-full w-full items-center px-5 py-24 [background:radious-gradient(125%_125%_at_50%_10%,#000_60% , #00FF9D40_100%)] " />
      <ToastContainer/>
      <Routes>
        <Route path="/" element={<HomePages />} />
        <Route path="/create" element={<CreatePages />} />
        <Route path="/notes/:id" element={<NoteDetailPage/>} />
        <Route path="/login" element={<Login/>} />
        <Route path="/email-verifty" element={<EmailVerifty/>} />
        <Route path="/reset-password" element={<ResetPassword/>} />
      </Routes>
    </div>
  )
}

export default App