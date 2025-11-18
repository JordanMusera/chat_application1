import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { API_URL } from "../constants/api";

const Login = () => {
  const navigate = useNavigate();

  const directToRegister = () => {
    navigate("/register");
  };

  const [email, setEmail] = useState<string | "">("");
  const [password, setPassword] = useState<string | "">("");
  const [rememberme, setRememberme] = useState<boolean>(true);
  const [loading, setLoading] = useState<boolean>(false); // ⬅ NEW

  const validateInputs = () => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.info("Please enter a valid email address");
      return false;
    }

    if (!password.trim() || password.length < 6) {
      toast.info("Password must be atleast 6 characters long!");
      return false;
    }
    return true;
  };

  const singInUser = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (loading) return;

    const validInputs = validateInputs();
    if (!validInputs) return;

    setLoading(true);

    try {
      const req = await fetch(`${API_URL}/auth/signin`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email,
          password,
          rememberme,
        }),
      });

      const data: any = await req.json();
      if (req.ok) {
        toast.success(data.message);
        if (rememberme) localStorage.setItem("token", data.token);
        else sessionStorage.setItem("token", data.token);

        navigate("/chat");
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Some server error occurred!");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen min-w-screen bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
      <form className="h-max w-full md:w-1/2 xl:w-1/3 flex flex-col gap-4 items-center justify-center border border-gray-400 rounded-md p-5 m-10">
      <h1 className="text-3xl font-bold text-white text-center mb-3">Login Account</h1>
        <input
          type="email"
          placeholder="Enter email"
          className="w-full p-3 rounded-2xl bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
          onChange={(e) => setEmail(e.target.value)}
        />
        <input
          type="password"
          placeholder="Enter password"
          className="w-full p-3 rounded-2xl bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
          onChange={(e) => setPassword(e.target.value)}
        />
        <div className="flex text-md text-white w-full items-center justify-between">
          <div className="flex gap-2 w-full">
            <input
              type="checkbox"
              placeholder="Remember me"
              checked={rememberme}
              onChange={(e) => setRememberme(e.target.checked)}
            />
            <p>Remember me</p>
          </div>
          <p className="w-full flex justify-end">Forgot password?</p>
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-1 rounded-2xl font-semibold text-lg transition text-white
                ${loading ? "bg-blue-300 cursor-not-allowed" : "bg-blue-400 hover:bg-blue-500"}
              `}
          onClick={(e) => singInUser(e)}
        >
          {loading ? "Logging in..." : "Login"} {/* ⬅ Text changes */}
        </button>

        <p className="text-white text-md">
          Dont have an account?{" "}
          <b onClick={directToRegister} className="hover:cursor-pointer">
            Register
          </b>
        </p>
      </form>
    </div>
  );
};

export default Login;
