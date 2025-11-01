import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";

const RegisterPage = () => {
    const navigate = useNavigate()
    const directToLogin=()=>{
        navigate('/login')
    }

    const [username,setUsername] = useState<string>("");
    const [email,setEmail] = useState<string>("");
    const [password,setPassword] = useState<string>("");

    const validateInputs=()=>{
      if(!username.trim()){
        toast.info("Username is required");
        return false;
      }
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
      if(!emailRegex.test(email)){
        toast.error("Please enter a valid email address.");
        return false;
      }
      if(!password.trim()||password.length<6){
        toast.info("Password must be atleast 6 characters long!");
        return false;
      }
      return true;
    }

    const registerUser=async(e:React.MouseEvent<HTMLButtonElement>)=>{
      e.preventDefault();
      const validInputs = validateInputs();
      if(!validInputs){
        return;
      }
      
      try {
        const req = await fetch("http://192.168.0.159:5000/auth/register",{
        method:"POST",
        headers:{"Content-Type":"application/json"},
        body:JSON.stringify({
          name:username,
          email,
          password
        })
      });

      const data = await req.json();
      if(req.ok)
        toast.success(data.message);
      else
        toast.error(data.message)

      } catch (error) {
       toast.error("Some server error occurred.");
        console.log(error);
      }
      
    }
  return (
    <div className="min-h-screen min-w-screen bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
      <form className="h-max w-full md:w-1/2 xl:w-1/3 flex flex-col gap-4 items-center justify-center border border-gray-400 rounded-md p-5 m-10">
      <input
          type="email"
          placeholder="Enter username"
          className="w-full rounded-2xl p-2"
          onChange={(e)=>setUsername(e.target.value)}
        />
        <input
          type="email"
          placeholder="Enter email"
          className="w-full rounded-2xl p-2"
          onChange={(e)=>setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Enter password"
          className="w-full rounded-2xl p-2"
          onChange={(e)=>setPassword(e.target.value)}
        />

        <button
          type="submit"
          className="text-white w-full rounded-2xl p-2 bg-blue-400"
          onClick={(e)=>registerUser(e)}
        >
          Sign up
        </button>
        <p className="text-white text-md">
          Have an account?{" "}
          <b onClick={directToLogin} className="hover:cursor-pointer">
            Login
          </b>
        </p>
      </form>
    </div>
  );
};

export default RegisterPage;
