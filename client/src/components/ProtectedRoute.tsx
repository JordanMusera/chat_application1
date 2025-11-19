import React, { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { API_URL } from "../constants/api";
import { Spin } from "antd";

const ProtectedRoute = ({ children }: { children: React.ReactNode }) => {
  const [isAuth, setIsAuth] = useState<boolean | null>(null);

  useEffect(() => {
    const checkAuth = async () => {
      try {
        const token =
          localStorage.getItem("token") || sessionStorage.getItem("token");

        if (!token) {
          setIsAuth(false);
          return;
        }

        const res = await fetch(`${API_URL}/auth/verify`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        setIsAuth(res.ok);
      } catch (error) {
        setIsAuth(false);
      }
    };

    checkAuth();
  }, []);

  if (isAuth === null)
    return (
      <div className="h-screen w-full flex justify-center items-center">
        <Spin size="large" />
      </div>
    );

  return isAuth ? <>{children}</> : <Navigate to="/login" replace />;
};

export default ProtectedRoute;
