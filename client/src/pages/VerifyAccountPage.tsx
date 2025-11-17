import React, { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-toastify";
import { API_URL } from "../constants/api";

const VerifyAccountPage = () => {
  const [emailSent, setEmailSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [code, setCode] = useState("");
  const [message, setMessage] = useState("");
  const {email} = useParams<{email:string}>();
  const decodedEmail = email ? decodeURIComponent(email) : "";

  const navigate = useNavigate();

  const handleSendVerification = async () => {
    setLoading(true);
    setMessage("");

    try {
      const res = await fetch(`${API_URL}/auth/verifyAccount`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email:decodedEmail,code })
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
    <div className="min-h-screen flex items-center justify-center bg-gray-900 p-6">
      <div className="bg-gray-800 p-8 rounded-2xl shadow-xl w-full max-w-md text-white">
        <h1 className="text-2xl font-bold mb-4 text-center">Verify Your Account</h1>
        <p className="text-gray-300 text-center mb-6">
          {`Enter the code sent to your email address: ${decodedEmail}`}
        </p>

        {!emailSent && (
          <>
            <label className="block text-sm mb-1">OTP Code</label>
            <input
              type="text"
              inputMode="numeric"
              value={code}
              onChange={(e) => setCode(e.target.value)}
              placeholder="Enter OPT code"
              className="w-full p-3 rounded-lg bg-gray-700 outline-none focus:ring-2 focus:ring-blue-500 mb-4"
            />

            <button
              onClick={handleSendVerification}
              className="w-full py-2 bg-blue-600 hover:bg-blue-700 rounded-xl text-lg font-semibold transition disabled:bg-blue-400"
              disabled={loading}
            >
              {loading ? "Sending..." : "Verify Account"}
            </button>
          </>
        )}

        {emailSent && (
          <div className="text-center">
            <p className="text-green-400 mb-4">{message}</p>
            <button
              onClick={() => setEmailSent(false)}
              className="py-2 px-6 bg-gray-700 hover:bg-gray-600 rounded-lg mt-4"
            >
              Send Again
            </button>
          </div>
        )}

        {message && !emailSent && (
          <p className="text-red-400 text-center mt-4">{message}</p>
        )}
      </div>
    </div>
  );
}

export default VerifyAccountPage


  