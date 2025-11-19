import React, { useRef, useState } from "react";
import { API_URL } from "../constants/api";
import { EditOutlined } from "@ant-design/icons";
import { Spin } from "antd";
import { toast } from "react-toastify";

interface User {
  id: number;
  name: string;
  avatar: string;
}

const CreateGroupPage = () => {
  const [searchWord, setSearchWord] = useState("");
  const [users, setUsers] = useState<User[]>([]);

  const [groupMembers, setGroupMembers] = useState<User[]>([]);
  const [groupName, setGroupName] = useState("");
  const [groupDescription, setGroupDescription] = useState("");
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const [profilePicURL, setProfilePicURL] = useState(
    "./group-profile-icon.jpg"
  );
  const profilePicInputRef = useRef<HTMLInputElement | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const searchUsers = async (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchWord(e.target.value);

    try {
      const res = await fetch(`${API_URL}/users/getSearchUsers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: JSON.stringify({ searchWord }),
      });
      if (res.ok) {
        const data = await res.json();
        setUsers(data.content);
      }
    } catch (error) {}
  };

  const addGroupMember = (user: User) => {
    setGroupMembers((prev) => {
      const exists = prev.some((m) => m.id === user.id);
      if (exists) return prev;
      return [...prev, user];
    });
  };

  const removeGroupMember = (user: User) => {
    setGroupMembers((prev) => prev.filter((m) => m.id !== user.id));
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

  const createGroup = async () => {
    if(groupName.length<1 || groupDescription.length<1) return toast.info("Fill required fields");
    if(groupMembers.length===0) return toast.info("Add chat members");
    const formData = new FormData();
    formData.append("group_name", groupName);
    formData.append("group_description", groupDescription);
    formData.append("group_members", JSON.stringify(groupMembers));
    if (profilePic) {
      formData.append("avatar", profilePic);
    }

    try {
      setLoading(true);
      const res = await fetch(`${API_URL}/group/create_group`, {
        method: "POST",
        headers:{
            Authorization: `Bearer ${localStorage.getItem("token")}`
        },
        body: formData,
      });

      const data = await res.json();
      setLoading(false);
      if (res.ok) {
        toast.success(data.message);
      } else {
        toast.error(data.message);
      }
    } catch (error) {
      setLoading(false);
    }
  };

  return (
    <div className="h-screen w-screen flex flex-col md:flex-row bg-gray-900 text-white">
      <div className="w-full md:w-1/2 p-6 flex flex-col gap-6 border-b md:border-b-0 md:border-r border-gray-700">
        <h2 className="text-2xl font-bold">Create Group</h2>

        <div className="flex flex-col items-center gap-3">
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
        </div>

        <div className="flex flex-col gap-3">
          <label className="text-sm text-gray-300">Group Name</label>
          <input
            type="text"
            placeholder="Enter group name"
            value={groupName}
            onChange={(e) => setGroupName(e.target.value)}
            className="p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none"
          />

          <label className="text-sm text-gray-300">Group Description</label>
          <input
            type="text"
            placeholder="Enter group description"
            value={groupDescription}
            onChange={(e) => setGroupDescription(e.target.value)}
            className="p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none"
          />
          <label className="text-sm text-gray-300">
            Group Members
            <span className="text-red-400">  Click user name to remove user</span>
          </label>
          <p>
            {groupMembers.map((m,index) => (
              <span
                className="text-green-500 hover:cursor-pointer text-md hover:text-lg hover:text-orange-500"
                onClick={() => removeGroupMember(m)}
                key={index}
              >
                @${m.name} <span className="text-white">,</span>{" "}
              </span>
            ))}
          </p>
        </div>
      </div>

      <div className="w-full md:w-1/2 p-6 flex flex-col gap-4">
        <h3 className="text-xl font-semibold">Add Members</h3>

        <input
          type="text"
          placeholder="Search users..."
          value={searchWord}
          onChange={(e) => searchUsers(e)}
          className="p-3 rounded-lg bg-gray-800 border border-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        />

        <div className="flex flex-col gap-3 overflow-y-auto h-full">
          {users.map((user, index) => (
            <div
              key={index}
              className="flex items-center justify-between p-3 bg-gray-800 rounded-lg hover:bg-gray-700"
            >
              <div className="flex items-center gap-3">
                <img
                  src={user.avatar || "/profile-icon.svg"}
                  alt="profile"
                  className="w-10 h-10 rounded-full bg-gray-600"
                ></img>
                <span>{user.name}</span>
              </div>
              <div>
                {groupMembers.some((m,index) => m.id === user.id) ? (
                  <button
                    className="px-3 py-1 bg-orange-600 rounded-lg text-sm hover:bg-blue-700"
                    onClick={() => removeGroupMember(user)}
                    key={index}
                  >
                    Remove
                  </button>
                ) : (
                  <button
                    className="px-3 py-1 bg-blue-600 rounded-lg text-sm hover:bg-blue-700"
                    onClick={() => addGroupMember(user)}
                    key={index}
                  >
                    Add
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>

        <button
          type="submit"
          disabled={loading}
          className={`w-full py-2 rounded-2xl font-semibold text-lg transition text-white
                ${
                  loading
                    ? "bg-blue-300 cursor-not-allowed"
                    : "bg-blue-400 hover:bg-blue-500"
                }
              `}
          onClick={() => createGroup()}
        >
          {loading ? (
            <div className="gap-3">
              <span>Creating...</span>
              <Spin size="large" />
            </div>
          ) : (
            "Create Group"
          )}
        </button>
      </div>
    </div>
  );
};

export default CreateGroupPage;
