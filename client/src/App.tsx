import React from 'react';
import logo from './logo.svg';
import './App.css';
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from './pages/LandingPage';
import Login from './pages/Login';
import RegisterPage from './pages/RegisterPage';

import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css'
import Chat from './pages/Chat';
import ProtectedRoute from './components/ProtectedRoute';

function App() {
  return (
     <Router>
      <Routes>
        <Route path='/' element={<LandingPage/>}/>
        <Route path='/login' element={<Login/>}/>
        <Route path='/register' element={<RegisterPage/>}/>

        <Route path='/chat'
        element={
          <ProtectedRoute>
            <Chat/>
          </ProtectedRoute>
        }/>
      </Routes>

      <ToastContainer
      position='top-right'
      autoClose={3000}/>
     </Router>
  );
}

export default App;
