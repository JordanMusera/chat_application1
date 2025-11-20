import React, { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { EditOutlined } from "@ant-design/icons";
import { API_URL } from "../constants/api";

const RegisterPage = () => {
  const navigate = useNavigate();

  const [username, setUsername] = useState<string>("");
  const [email, setEmail] = useState<string>("");
  const [password, setPassword] = useState<string>("");
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [profilePicURL, setProfilePicURL] = useState("./profile-icon.svg");
  const profilePicInputRef = useRef<HTMLInputElement | null>(null);

  const [loading, setLoading] = useState<boolean>(false);

  const directToVerifyAccount = () => {
    const encodedEmail = encodeURIComponent(email);
    navigate(`/verify_account/${encodedEmail}`);
  };

  const directToLogin = () => {
    navigate("/login");
  };

  const validateInputs = () => {
    if (!username.trim()) {
      toast.info("Username is required");
      return false;
    }
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      toast.error("Please enter a valid email address.");
      return false;
    }
    if (!password.trim() || password.length < 6) {
      toast.info("Password must be atleast 6 characters long!");
      return false;
    }
    return true;
  };

  const registerUser = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();

    if (loading) return;

    const validInputs = validateInputs();
    if (!validInputs) return;

    setLoading(true);

    try {
      const formData = new FormData();
      formData.append("name", username);
      formData.append("email", email);
      formData.append("password", password);
      if (profilePic) {
        formData.append("image", profilePic);
      }

      const req = await fetch(`${API_URL}/auth/register`, {
        method: "POST",
        body: formData,
      });

      const data = await req.json();
      if (req.ok) {
        toast.success(data.message);
        directToVerifyAccount();
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      toast.error("Some server error occurred.");
      console.log(error);
    } finally {
      setLoading(false);
    }
  };

  const handleEditProfileBtnClick = () => {
    profilePicInputRef.current?.click();
  };

  const handleProfilePicChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];

    if (!file) return;
    setProfilePic(file);

    setProfilePicURL(URL.createObjectURL(file));
  };

  return (
    <div className="min-h-screen min-w-screen bg-gradient-to-br from-gray-700 to-gray-900 flex items-center justify-center">
      <form className="h-max w-full md:w-1/2 xl:w-1/3 flex flex-col gap-4 items-center justify-center border text-white border-gray-400 rounded-md p-5 m-10">
      <h1 className="text-3xl font-bold text-white text-center mb-3">Sign-up Account</h1>
        <div className="flex gap-3">
          <img
            src={profilePicURL}
            alt="profile"
            className="w-[150px] h-[150px] border border-blue-800 rounded-full bg-white"
          />
          <div className="flex items-center">
            <EditOutlined
              className="text-4xl text-white hover:text-blue-600"
              onClick={handleEditProfileBtnClick}
            />
            <input
              type="file"
              accept="image/"
              ref={profilePicInputRef}
              className="hidden"
              title="edit_pic"
              onChange={(e) => handleProfilePicChange(e)}
            />
          </div>
        </div>

        <input
          type="text"
          placeholder="Enter username"
          className="w-full p-3 rounded-2xl bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none"
          onChange={(e) => setUsername(e.target.value)}
        />
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

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-1 rounded-2xl font-semibold text-lg transition text-white
                ${loading ? "bg-blue-300 cursor-not-allowed" : "bg-blue-400 hover:bg-blue-500"}
              `}
          onClick={(e) => registerUser(e)}
        >
          {loading ? "Signing up..." : "Sign up"}
        </button>

        <p className="text-white text-md">
          Have an account?{" "}
          <b onClick={directToLogin} className="hover:cursor-pointer text-blue-500">
            Login
          </b>
        </p>
      </form>
    </div>
  );
};

export default RegisterPage;
