import React from 'react'
import { useNavigate } from 'react-router-dom'

const Login = () => {
    const navigate = useNavigate()

    const directToRegister=()=>{
        navigate('/register')
    }
  return (
    <div className='min-h-screen min-w-screen bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center'>
      <form className='h-max w-full md:w-1/2 xl:w-1/3 flex flex-col gap-4 items-center justify-center border border-gray-400 rounded-md p-5 m-10'>
      <input type='email' placeholder='Enter email' className='w-full rounded-2xl p-2'/>
      <input type='password' placeholder='Enter password' className='w-full rounded-2xl p-2'/>
      <div className='flex text-md text-white w-full items-center justify-between'>
        <div className='flex gap-2 w-full'>
        <input type='checkbox' placeholder='Remember me'/>
        <p>Remember me</p>
      </div>
      <p className='w-full flex justify-end'>Forgot password?</p>
      </div>
      
      
      <button type='submit' className='text-white w-full rounded-2xl p-2 bg-blue-400'>login</button>
      <p className='text-white text-md'>Dont have an account? <b onClick={directToRegister} className='hover:cursor-pointer'>Register</b></p>
      </form>
    </div>
  )
}

export default Login
