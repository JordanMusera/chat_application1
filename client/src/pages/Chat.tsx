import React, { useEffect, useRef, useState } from "react";
import { useSocket } from "../hooks/useSocket";
import { data } from "react-router-dom";
import { v4 as uuidv4 } from "uuid";
import { toast } from "react-toastify";
import { CloseOutlined, PaperClipOutlined } from "@ant-design/icons";
import {
  FileImageOutlined,
  FilePdfOutlined,
  FileWordOutlined,
  FileExcelOutlined,
  FileZipOutlined,
  FileOutlined,
} from "@ant-design/icons";

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

  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const [previewFile, setPreviewFile] = useState<{
    file: File;
    name: string;
    type: string;
    url: string;
  } | null>(null);

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
      toast.info(`${data.sender_name}: ${data.content}`);

      setUsers((prevUsers: User[]) => {
        const existing = prevUsers.find((u) => u.chat_id === data.chat_id);
        if (existing) {
          const updated = {
            ...existing,
            lastMessage: data.content,
            unread: chatId === data.chat_id ? 0 : (existing.unread || 0) + 1,
          };
          return [
            updated,
            ...prevUsers.filter((u) => u.chat_id !== data.chat_id),
          ];
        } else {
          const newUser: User = {
            chat_id: data.chat_id,
            id: data.sender_id,
            name: data.sender_name,
            lastMessage: data.content,
            avatar: "",
            unread: chatId === data.chat_id ? 0 : 1,
          };
          return [newUser, ...prevUsers];
        }
      });
    };

    getUsersConv();
    socket.on("receive_message", handleReceiveMessage);
    socket.on("newMessage", handleNewMessage);

    return () => {
      socket.off("receive_message", handleReceiveMessage);
      socket.off("newMessage", handleNewMessage);
    };
  }, [socket, chatId, selectedChat, user.id]);

  const search = async () => {
    try {
      const res = await fetch(
        "http://192.168.0.131:5000/users/getSearchUsers",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ searchWord }),
        }
      );
      if (res.ok) {
        const data = await res.json();
        setSearchContent(data.content);
      }
    } catch (error) {}
  };

  const getUser = async () => {
    const res = await fetch("http://192.168.0.131:5000/users/getUser", {
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
    const res = await fetch("http://192.168.0.131:5000/users/fetchUsers", {
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
    const res = await fetch("http://192.168.0.131:5000/messages/getMessages", {
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

    const formData = new FormData();
    formData.append("newConvId", newConvId || "");
    formData.append("chat_id", (selectedChat?.chat_id || 0).toString());
    formData.append("sender_id", user.id.toString());
    formData.append("receiver_id", receiverId.toString());
    formData.append("content", input.trim());

    if (previewFile) {
      formData.append("file", previewFile.file, previewFile.name);
      formData.append("file_type", previewFile.type);
    }

    try {
      const res = await fetch(
        "http://192.168.0.131:5000/messages/postMessage",
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await res.json();
      console.log(data);

      if (chatId === 0) {
        setSelectedChat((prev) =>
          prev ? { ...prev, messages: [...prev.messages, data.message] } : prev
        );
      }

      setInput("");
    } catch (error) {
      console.error("Send message error:", error);
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

  return (
    <div className="flex flex-col md:flex-row h-[100dvh] bg-gray-100 relative">
      <div
        className={`fixed md:static top-0 left-0 h-[100dvh] w-full md:w-1/4 bg-gray-800 p-3 flex flex-col z-30 transform transition-transform duration-300 ease-in-out 
        ${menuOpen || !selectedChat ? "translate-x-0" : "-translate-x-full"} 
        md:translate-x-0`}
      >
        <input
          type="text"
          placeholder="Search here"
          className="w-full p-2 rounded-xl bg-gray-700 text-white placeholder-gray-400 focus:outline-none"
          onChange={(e) => setSearchWord(e.target.value)}
        />
        <hr className="my-3 border-gray-600" />
        <div className="flex-1 overflow-y-auto space-y-1">
          {(searchWord.length === 0 ? users : searchContent).map((user) => (
            <div
              key={user.id}
              onClick={() => {
                setMenuOpen(false);
                searchWord.length === 0
                  ? selectChat(user.chat_id, user.id)
                  : selectUser(user);
              }}
              className="flex items-center gap-3 p-3 rounded-lg cursor-pointer hover:bg-gray-700 transition"
            >
              <img
                src={user.avatar}
                alt={user.name}
                className="w-12 h-12 rounded-full object-cover"
              />
              <div className="overflow-hidden">
                <p className="text-white font-semibold truncate">{user.name}</p>
                <p className="text-sm text-gray-400 truncate">
                  {user.lastMessage}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {(menuOpen || !selectedChat) && selectedChat && (
        <div
          onClick={() => setMenuOpen(false)}
          className="fixed inset-0 bg-black opacity-50 z-20 md:hidden"
        />
      )}

      <div className="flex flex-col flex-1 bg-gray-200 h-full relative">
        {selectedChat ? (
          <>
            <div className="flex items-center justify-between p-3 bg-gray-800 text-white shadow-md flex-shrink-0 sticky top-0 z-10">
              <div className="flex items-center gap-3">
                <button
                  onClick={() => setMenuOpen(true)}
                  className="md:hidden text-2xl font-bold focus:outline-none"
                >
                  ☰
                </button>
                <img
                  src={selectedChat.avatar}
                  alt={selectedChat.name}
                  className="h-10 w-10 rounded-full object-cover"
                />
                <div>
                  <p className="font-bold text-md">{selectedChat.name}</p>
                  <p className="text-sm text-gray-300">online</p>
                </div>
              </div>
            </div>

            <div
              className="flex-1 overflow-y-auto px-4 py-3 space-y-2 bg-gray-100"
              style={{
                paddingBottom: "calc(5rem + env(safe-area-inset-bottom))",
              }}
            >
              {selectedChat.messages.map((msg) => (
                <div
                  key={msg.message_id}
                  className={`flex ${
                    msg.sender_id === user.id ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`px-4 py-2 rounded-3xl max-w-[80%] text-sm sm:text-base break-words shadow-sm ${
                      msg.sender_id === user.id
                        ? "bg-blue-500 text-white"
                        : "bg-gray-300 text-black"
                    }`}
                  >
                    {msg.file && (
                      <div className="my-2">
                        {msg.file.type.startsWith("image/") ? (
                          <img
                            src={msg.file.url}
                            className="w-64 rounded"
                            alt="Loading..."
                          />
                        ) : msg.file.type.startsWith("video/") ? (
                          <video
                            src={msg.file.url}
                            controls
                            className="w-full max-w-lg rounded-lg shadow-md"
                          />
                        ) : (
                          <div className="flex gap-2 items-center">
                            {getFileIcon(msg.file.type)}
                            <span className="text-sm text-blue-800">
                              {msg.file.name}
                            </span>
                          </div>
                        )}
                      </div>
                    )}

                    <p>{msg.content}</p>

                    <span className="block text-xs mt-1 opacity-70 text-right">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}
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

            <div className="flex items-center gap-3 p-3 bg-gray-800 flex-shrink-0 sticky bottom-0 z-10 pb-[env(safe-area-inset-bottom)]">
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
                onFocus={() => window.scrollTo(0, document.body.scrollHeight)}
                onKeyDown={(e) => e.key === "Enter" && handleSendBE()}
              />
              <img
                src="/sendIcon.png"
                alt="send"
                className="w-10 h-10 rounded-full cursor-pointer hover:scale-110 transition-transform"
                onClick={handleSendBE}
              />
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
