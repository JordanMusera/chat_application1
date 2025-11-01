import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({children}:{children:React.ReactNode}) => {
    const [isAuth,setIsAuth] = useState<boolean|null>(null);

    useEffect(()=>{
        const checkAuth=async()=>{
            try {
                const res = await fetch("http://192.168.0.159:5000/auth/verify",{
                    headers:{
                        "Content-Type":"application/json",
                        "Authorization":`Bearer ${localStorage.getItem("token")}`
                    }
                });

                if(res.ok) setIsAuth(true);
                else setIsAuth(false)
            } catch (error) {
                setIsAuth(false)
            }
        };
        checkAuth()
    },[]);

  if(isAuth===null)return <p>Loading...</p>

  return isAuth ? <>{children}</>:<Navigate to='/login' replace/>;
}

export default ProtectedRoute;
