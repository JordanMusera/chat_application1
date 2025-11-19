/* eslint-disable @typescript-eslint/no-unused-vars */
import React, { useEffect, useRef, useState } from "react";
import { useSocket } from "../hooks/useSocket";
import { v4 as uuidv4 } from "uuid";
import {
  CloseOutlined,
  MessageOutlined,
  PaperClipOutlined,
  SendOutlined,
} from "@ant-design/icons";
import {
  FileImageOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileZipOutlined,
  FileOutlined,
} from "@ant-design/icons";
import { toast } from "react-toastify";
import { API_URL } from "../constants/api";
import MyDropdown from "../components/MyDropdown";
import { Navigate, useNavigate } from "react-router-dom";
import { Spin } from "antd";

interface IFile {
  name: string;
  url: string;
  type: string;
  public_id: string;
}
interface Message {
  message_id: number;
  chat_id: number;
  sender_id: number;
  sender_name: string;
  content: string;
  file: IFile;
  timestamp: string;
}

interface ChatI {
  chat_id: number;
  name: string;
  avatar: string;
  sender_id: number;
  messages: Message[];
}

interface User {
  chat_id: number;
  id: number;
  name: string;
  lastMessage: string;
  avatar: string;
  unread: number;
}

const Chat = () => {
  const socket = useSocket();
  const [user, setUser] = useState<any>({});
  const [users, setUsers] = useState<User[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatI | null>(null);
  const [input, setInput] = useState("");
  const [chatId, setChatId] = useState(0);
  const [receiverId, setReceiverId] = useState(0);
  const [searchWord, setSearchWord] = useState("");
  const [searchContent, setSearchContent] = useState<User[]>([]);
  const [newConvId, setNewConvId] = useState("");
  const [menuOpen, setMenuOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("chats");
  const [sendingMessage, setSendingMessage] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewFile, setPreviewFile] = useState<{
    file: File;
    name: string;
    type: string;
    url: string;
  } | null>(null);

  const navigate = useNavigate();

  const [viewportHeight, setViewportHeight] = useState(window.innerHeight);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const updateHeight = () => {
      if (window.visualViewport) {
        setViewportHeight(window.visualViewport.height);
      } else {
        setViewportHeight(window.innerHeight);
      }
      scrollToBottom();
    };

    updateHeight();

    window.visualViewport?.addEventListener("resize", updateHeight);
    window.addEventListener("resize", updateHeight);

    return () => {
      window.visualViewport?.removeEventListener("resize", updateHeight);
      window.removeEventListener("resize", updateHeight);
    };
  }, [selectedChat, input]);

  useEffect(() => {
    getUser();
  }, []);

  useEffect(() => {
    search();
  }, [searchWord]);

  useEffect(() => {
    if (user.id) getUsersConv();
  }, [user]);

  useEffect(() => {
    if (!socket || !user.id) return;

    socket.emit("register", user.id);

    if (chatId !== 0) {
      socket.emit("join_chat", chatId);
    } else {
      const newId = uuidv4();
      setNewConvId(newId);
      socket.emit("join_chat", newId);
    }

    const handleReceiveMessage = (data: Message) => {
      setSelectedChat((prev: any) => {
        if (prev && prev.chat_id === data.chat_id) {
          return {
            ...prev,
            messages: [...prev.messages, data].sort(
              (a, b) =>
                new Date(a.timestamp).getTime() -
                new Date(b.timestamp).getTime()
            ),
          };
        }

        if (chatId === 0) {
          socket.emit("join_chat", data.chat_id);
          const newChat = {
            chat_id: data.chat_id,
            name: prev?.name || "Unknown",
            sender_id: data.sender_id,
            avatar: prev?.avatar,
            messages: [data],
          };
          setChatId(data.chat_id);
          setSearchWord("");
          return newChat;
        }

        return prev;
      });
    };

    const handleNewMessage = (data: Message) => {
      show_notification(data);

      getUsersConv();
    };

    socket.on("receive_message", handleReceiveMessage);
    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("newMessage", handleNewMessage);
    };
  }, [socket, chatId, selectedChat, user.id]);

  const search = async () => {
    try {
      const res = await fetch(`${API_URL}/users/getSearchUsers`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ searchWord }),
      });
      if (res.ok) {
        const data = await res.json();
        setSearchContent(data.content);
      }
    } catch (error) {}
  };

  const getUser = async () => {
    const res = await fetch(`${API_URL}/users/getUser`, {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
    });
    const data = await res.json();
    if (res.ok) setUser(data);
  };

  const getUsersConv = async () => {
    const res = await fetch(`${API_URL}/users/fetchUsers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ user_id: user.id }),
    });
    const data = await res.json();
    if (res.ok) setUsers(data.users);
  };

  const selectChat = async (chatId: number, userId: number) => {
    setChatId(chatId);
    setReceiverId(userId);
    const res = await fetch(`${API_URL}/messages/getMessages`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ chat_id: chatId }),
    });
    const data = await res.json();
    if (res.ok) {
      const selectedUser = users.find((u) => u.chat_id === chatId);
      setSelectedChat({
        chat_id: chatId,
        name: selectedUser?.name || "Unknown",
        sender_id: selectedUser?.id || 0,
        avatar: selectedUser?.avatar || "",
        messages: (data.messages || []).sort(
          (a: Message, b: Message) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        ),
      });
    }
  };

  const selectUser = async (user: any) => {
    setReceiverId(user.id);
    const convExists = users.find((cuser) => cuser.id === user.id);
    if (convExists) {
      setSearchWord("");
      selectChat(convExists.chat_id, convExists.id);
    } else {
      setChatId(0);
      setNewConvId(uuidv4());
      setSelectedChat({
        chat_id: 0,
        name: user.name || "Unknown",
        sender_id: user.id || 0,
        avatar: user.avatar || "",
        messages: [],
      });
    }
  };

  const handleSendBE = async () => {
    if (!input.trim()) return;

    const isNewChat = !users.find((u) => u.chat_id === selectedChat?.chat_id);

    const formData = new FormData();
    formData.append("newConvId", isNewChat ? newConvId : "");
    formData.append("chat_id", (selectedChat?.chat_id || 0).toString());
    formData.append("sender_id", user.id.toString());
    formData.append("receiver_id", receiverId.toString());
    formData.append("content", input.trim());

    if (previewFile) {
      formData.append("file", previewFile.file, previewFile.name);
      formData.append("file_type", previewFile.type);
    }

    setSendingMessage(true);

    try {
      const res = await fetch(`${API_URL}/messages/postMessage`, {
        method: "POST",
        body: formData,
      });

      const data = await res.json();
      setSendingMessage(false);

      const newChatId = data.message.chat_id;

      const updatedChat: ChatI = {
        ...selectedChat!,
        chat_id: newChatId,
        messages: [...(selectedChat?.messages || []), data.message],
      };

      setSelectedChat(updatedChat);
      setChatId(newChatId);

      setInput("");
      setPreviewFile(null);

      getUsersConv();
    } catch (error) {
      setSendingMessage(false);
      console.error("Send message error:", error);
      toast.error("Some server error occurred");
    }
  };

  const handleAttachClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileUpload = (e: any) => {
    e.preventDefault();
    const file = e.target.files?.[0];
    const url = URL.createObjectURL(file);
    setPreviewFile({
      file: file,
      name: file.name,
      type: file.type,
      url,
    });
  };

  const getFileIcon = (type: string) => {
    if (type.startsWith("image/"))
      return <FileImageOutlined className="text-3xl text-blue-400" />;
    if (type === "application/pdf")
      return <FilePdfOutlined className="text-3xl text-red-500" />;
    if (type.includes("word"))
      return <FileWordOutlined className="text-3xl text-blue-600" />;
    if (type.includes("excel"))
      return <FileExcelOutlined className="text-3xl text-green-600" />;
    if (type.includes("zip"))
      return <FileZipOutlined className="text-3xl text-yellow-500" />;
    return <FileOutlined className="text-3xl text-gray-300" />;
  };

  const show_notification = (data: Message) => {
    toast(
      <div
        className="flex gap-2 items-center"
        onClick={() => selectChat(data.chat_id, data.sender_id)}
      >
        <MessageOutlined className="flex text-blue-500 text-2xl" />

        <div className="flex flex-col items-center">
          <span className="font-semibold text-gray-800 text-sm">
            {data.sender_name}
          </span>
          <span className="text-gray-600 text-sm break-words">
            {data.content}
          </span>
        </div>
      </div>,
      {
        position: "top-right",
        autoClose: 4000,
        hideProgressBar: false,
        closeOnClick: true,
        pauseOnHover: true,
        draggable: true,
      }
    );
  };

  const navigateToCreateGroup=()=>{
    n
  }

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-gray-800 relative">
      <div
        className={`fixed md:static top-0 left-0 h-[100dvh] w-full md:w-1/4 bg-gray-800 p-3 flex flex-col z-30 transform transition-transform duration-300 ease-in-out 
        ${menuOpen || !selectedChat ? "translate-x-0" : "-translate-x-full"} 
        md:translate-x-0`}
      >
        <h1 className="text-3xl font-bold text-white text-center mb-3 font-serif">
          Etu Chat
        </h1>
        <div className="flex gap-2">
          <input
            type="text"
            placeholder="Search here"
            className="w-full p-3 rounded-2xl bg-gray-700 focus:ring-2 focus:ring-blue-500 outline-none text-white"
            onChange={(e) => setSearchWord(e.target.value)}
          />
          <MyDropdown />
        </div>

        <hr className="my-3 border-gray-600" />

        <div className="flex mb-3 rounded-md">
          <button
            onClick={() => setActiveTab("chats")}
            className={`flex-1 py-3 text-center font-semibold transition 
      ${
        activeTab === "chats"
          ? "bg-blue-600 text-white"
          : "bg-gray-700 text-gray-300"
      }`}
          >
            Chats
          </button>

          <button
            onClick={() => setActiveTab("groups")}
            className={`flex-1 py-3 text-center font-semibold  transition 
      ${
        activeTab === "groups"
          ? "bg-blue-600 text-white"
          : "bg-gray-700 text-gray-300"
      }`}
          >
            Groups
          </button>
        </div>

        {activeTab === "chats" ? (
          <div className="flex flex-col gap-2">
            {(searchWord.length === 0 ? users : searchContent).map((user) => (
              <div
                key={user.id}
                onClick={() => {
                  setMenuOpen(false);
                  searchWord.length === 0
                    ? selectChat(user.chat_id, user.id)
                    : selectUser(user);
                }}
                className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-700 transition w-full"
              >
                <img
                  src={user.avatar || "/profile-icon.svg"}
                  alt={user.name}
                  className="w-12 h-12 rounded-full object-cover flex-shrink-0"
                />
                <div className="overflow-hidden flex flex-col justify-center text-md gap-2">
                  <span className="text-white font-semibold truncate">
                    {user.name}
                  </span>
                  <span className="text-sm text-gray-400 truncate">
                    {user.lastMessage}
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-white font-bold flex flex-col items-center justify-center h-full text-xl">
            <span>You are not a member of any group</span>
            <div className="flex flex-col items-center justify-center gap-3">
              <span>Join</span>
              <span className="text-xl font-extrabold">OR</span>
              <button className="text-blue-500 hover:cursor-pointer hover:underline" onClick={()=>navigate}>
                Create Group
              </button>
            </div>
          </div>
        )}
      </div>

      {(menuOpen || !selectedChat) && selectedChat && (
        <div
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 bg-black opacity-50 z-20 md:hidden"
        />
      )}

      <div
        className="flex flex-col flex-1 bg-gray-800 relative"
        style={{ height: viewportHeight }}
      >
        {selectedChat ? (
          <>
            <div className="flex items-center justify-between p-3 bg-gray-800 text-white shadow-md flex-shrink-0 sticky top-0 z-10">
              <div className="flex items-center gap-5">
                <button
                  onClick={() => setMenuOpen(true)}
                  className="md:hidden text-2xl font-bold focus:outline-none"
                >
                  ☰
                </button>
                <img
                  src={selectedChat.avatar || "/profile-icon.svg"}
                  alt={selectedChat.name}
                  className="h-12 w-12 rounded-full object-cover"
                />
                <div className="gap-0 flex flex-col">
                  <span className="font-bold text-lg">{selectedChat.name}</span>
                  <span className="text-sm text-gray-300">online</span>
                </div>
              </div>
            </div>

            <div
              className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-gray-700 rounded-tl-3xl rounded-br-3xl"
              style={{
                paddingBottom: "calc(5rem + env(safe-area-inset-bottom))",
              }}
            >
              {selectedChat.messages.map((msg) => {
                const isSender = msg.sender_id === user.id;

                return (
                  <div
                    key={msg.message_id}
                    className={`flex mb-4 ${
                      isSender ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`
                              px-4 py-3
                              max-w-[75%]
                              rounded-2xl
                              transition-all duration-200
                              shadow-[0_4px_12px_rgba(0,0,0,0.10)]
                              hover:shadow-[0_6px_18px_rgba(0,0,0,0.16)]
                              ${
                                isSender
                                  ? "bg-gradient-to-b from-green-600 to-green-800 text-white"
                                  : "bg-white text-gray-900 border border-gray-100"
                              }
                            `}
                    >
                      {msg.file && (
                        <div className="mb-3">
                          {msg.file.type?.startsWith("image/") && (
                            <img
                              src={msg.file.url}
                              className="
                              rounded-xl
                              w-full
                              max-w-[300px]
                              max-h-[350px]
                              object-cover
                              shadow-md
                            "
                              alt="attachment"
                            />
                          )}

                          {msg.file.type?.startsWith("video/") && (
                            <div className="w-full max-w-[500px]">
                              <video
                                src={msg.file.url}
                                controls
                                className="
                                rounded-xl
                                w-full
                                max-h-[500px]
                                object-cover
                                shadow-lg"
                              />
                            </div>
                          )}

                          {msg.file.type?.startsWith("audio/") && (
                            <audio
                              src={msg.file.url}
                              controls
                              className="w-full rounded-lg"
                            />
                          )}

                          {!msg.file.type?.startsWith("image/") &&
                            !msg.file.type?.startsWith("video/") &&
                            !msg.file.type?.startsWith("audio/") && (
                              <div className="flex items-center gap-2 bg-gray-100 p-3 rounded-xl">
                                {getFileIcon(msg.file.type)}
                                <span className="text-blue-700 text-sm font-medium break-all">
                                  {msg.file.name}
                                </span>
                              </div>
                            )}
                        </div>
                      )}

                      {msg.content && (
                        <p className="leading-relaxed text-[15px] whitespace-pre-wrap break-words">
                          {msg.content}
                        </p>
                      )}

                      <div
                        className={`text-[11px] mt-2 opacity-60 ${
                          isSender ? "text-right" : "text-left"
                        }`}
                      >
                        {new Date(msg.timestamp).toLocaleTimeString([], {
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </div>
                    </div>
                  </div>
                );
              })}
              <div ref={messagesEndRef} />
            </div>

            {previewFile && (
              <div className="h-max flex items-center bg-gray-800 p-2 w-full justify-between">
                <>
                  {previewFile.type.startsWith("image/") ? (
                    <div className="flex gap-2 text-white text-sm items-center">
                      <img
                        src={previewFile.url}
                        alt="preview"
                        className="w-10 h-10 object-cover rounded"
                      />
                      <span>{previewFile.name}</span>
                    </div>
                  ) : (
                    <div className="flex gap-2 text-white text-sm items-center">
                      {getFileIcon(previewFile.type)}
                      <span>{previewFile.name}</span>
                    </div>
                  )}
                </>

                <CloseOutlined
                  className="text-white text-lg cursor-pointer ml-4"
                  onClick={() => setPreviewFile(null)}
                />
              </div>
            )}

            <div className="flex items-center justify-center gap-3 h-max p-3 bg-gray-800 flex-shrink-0 sticky bottom-0 z-10 pb-[env(safe-area-inset-bottom)]">
              <PaperClipOutlined
                className="text-2xl text-white"
                onClick={handleAttachClick}
              />
              <input
                type="file"
                className="hidden"
                ref={fileInputRef}
                onChange={(e) => handleFileUpload(e)}
                title="file_upload"
              />
              <input
                type="text"
                placeholder="Type message..."
                className="flex-1 h-11 rounded-full px-4 text-white placeholder-gray-300 bg-gray-700 focus:outline-none"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onFocus={() =>
                  messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
                }
                onKeyDown={(e) => e.key === "Enter" && handleSendBE()}
              />

              {sendingMessage ? (
                <Spin size="large" />
              ) : (
                <SendOutlined
                  className="text-2xl text-white rounded-full cursor-pointer hover:scale-110 transition-transform"
                  onClick={handleSendBE}
                />
              )}
            </div>
          </>
        ) : (
          <div className="flex flex-1 items-center justify-center text-gray-700 text-lg font-medium text-center px-4">
            Tap the menu to select a chat
            <button
              onClick={() => setMenuOpen(true)}
              className="ml-2 px-3 py-1 bg-blue-600 text-white rounded-lg md:hidden"
            >
              ☰
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
