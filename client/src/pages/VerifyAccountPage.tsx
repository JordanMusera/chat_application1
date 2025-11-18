import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { API_URL } from "../constants/api";

const VerifyAccountPage = () => {
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const { email } = useParams<{ email: string }>();
  const decodedEmail = email ? decodeURIComponent(email) : "";

  const navigate = useNavigate();

  const handleSendVerification = async () => {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API_URL}/auth/verifyAccount`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: decodedEmail, code }),
      });

      const data = await res.json();

      if (res.ok) {
        setEmailSent(true);
        setMessage(data.message);
        localStorage.setItem("token", data.token);
        navigate("/chat");
        toast.success(data.message);
      } else {
        setMessage(data.message || "Something went wrong.");
      }
    } catch (err) {
      setMessage("Network error. Try again.");
    }

    setLoading(false);
  };

  return (
    <div className="min-h-screen min-w-screen bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
      <form className="h-max w-full md:w-1/2 xl:w-1/3 flex flex-col gap-4 items-center justify-center border border-gray-400 rounded-md p-5 m-10">
        <h1 className="text-3xl font-bold text-white text-center mb-3">Verify Account</h1>
        <p className="text-center text-white mb-6">
          Enter the OTP sent to  
          <span className="font-semibold text-blue-400"> {decodedEmail}</span>
        </p>

        {!emailSent && (
          <div className="space-y-4 w-full px-10">
            <div className="text-white">
              <label className="block text-sm mb-1 font-medium">OTP Code</label>
              <input
                type="text"
                inputMode="numeric"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                placeholder="Enter OTP code"
                className="w-full p-3 rounded-2xl bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-white"
              />
            </div>

            <button
              disabled={loading}
              onClick={handleSendVerification}
              className={`w-full py-1 rounded-2xl font-semibold text-lg transition text-white
                ${loading ? "bg-blue-300 cursor-not-allowed" : "bg-blue-400 hover:bg-blue-500"}
              `}
            >
              {loading ? "Verifying..." : "Verify Account"}
            </button>

            {message && (
              <p className="text-center text-red-400 text-sm">{message}</p>
            )}
          </div>
        )}

        {emailSent && (
          <div className="text-center space-y-4">
            <p className="text-green-400 font-medium">{message}</p>

            <button
              onClick={() => setEmailSent(false)}
              className="py-2 px-6 bg-gray-700 hover:bg-gray-600 rounded-xl text-white font-medium"
            >
              Send Again
            </button>
          </div>
        )}
      </form>
    </div>
  );
};

export default VerifyAccountPage;
