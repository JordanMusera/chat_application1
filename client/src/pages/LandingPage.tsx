import React from 'react'
import { useNavigate } from 'react-router-dom'

const LandingPage = () => {
    const navigate = useNavigate();

    const handleGetStarted=()=>{
        console.log('clicked get started')
        navigate('/login');
    }
  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-900 text-white gap-10">
      <h1 className="text-2xl xl:text-4xl font-bold">Welcome to Simi online chat application</h1>
      <button className="text-white rounded-xl bg-blue-400 p-3 text-xl" onClick={handleGetStarted}>Get started</button>
    </div>
  )
}

export default LandingPage
