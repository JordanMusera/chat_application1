import React, { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({children}:{children:React.ReactNode}) => {
    const [isAuth,setIsAuth] = useState<boolean|null>(null);

    useEffect(()=>{
        const checkAuth=async()=>{
            try {
                const res = await fetch("http://localhost:5000/auth/verify",{
                    credentials:"include"
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
