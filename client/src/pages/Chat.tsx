import React, { useEffect, useState } from "react";
import { useSocket } from "../hooks/useSocket";

interface Message {
  message_id: number;
  chat_id: number;
  sender_id: number;
  sender_name: string;
  content: string;
  timestamp: string;
}

interface ChatI {
  chat_id: number;
  name: string;
  avatar: string;
  messages: Message[];
}

interface User {
  chat_id: number;
  id: number;
  name: string;
  lastMessage: string;
  avatar: string;
}

const Chat = () => {
  const socket = useSocket();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedChat, setSelectedChat] = useState<ChatI | null>(null);
  const [input, setInput] = useState("");
  const [chatId, setChatId] = useState(0);
  const senderId = 2;
  const userId = 2;

  useEffect(() => {
    getUsers();
  }, []);

  useEffect(() => {
    if (!socket || !chatId) return;

    socket.emit("join_chat", chatId);

    socket.on("receive_message", (data: Message) => {
      setSelectedChat((prev) =>
        prev && prev.chat_id === data.chat_id
          ? {
              ...prev,
              messages: [...prev.messages, data].sort(
                (a, b) =>
                  new Date(a.timestamp).getTime() -
                  new Date(b.timestamp).getTime()
              ),
            }
          : prev
      );
    });

    return () => {
      socket.off("receive_message");
    };
  }, [socket, chatId]);

  const getUsers = async () => {
    const res = await fetch("http://192.168.0.159:5000/users/fetchUsers", {
      method: "GET",
      headers: { "Content-Type": "application/json" },
    });
    const data = await res.json();
    if (res.ok) setUsers(data.users);
  };

  const selectChat = async (chatId: number) => {
    setChatId(chatId);
    const res = await fetch("http://192.168.0.159:5000/messages/getMessages", {
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
        avatar: selectedUser?.avatar || "",
        messages: (data.messages || []).sort(
          (a: Message, b: Message) =>
            new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
        ),
      });
    }
  };

  const handleSendBE = () => {
    if (!input.trim() || !selectedChat) return;

    const messageData: Message = {
      message_id: Date.now(),
      chat_id: selectedChat.chat_id,
      sender_id: senderId,
      sender_name: "Me",
      content: input,
      timestamp: new Date().toISOString(),
    };

    socket?.emit("send_message", messageData);

    setSelectedChat((prev) =>
      prev
        ? {
            ...prev,
            messages: [...prev.messages, messageData].sort(
              (a, b) =>
                new Date(a.timestamp).getTime() -
                new Date(b.timestamp).getTime()
            ),
          }
        : prev
    );

    setInput("");
  };

  return (
    <div className="min-h-screen bg-gray-100 w-full flex">
      <div className="h-screen w-1/4 bg-gray-800 p-2">
        <input
          type="text"
          placeholder="Search here"
          className="w-full p-2 rounded-xl"
        />
        <hr className="my-2 text-gray-500" />
        <div>
          {users.map((user) => (
            <div
              key={user.id}
              className="text-white flex py-3 px-2 items-center w-full hover:bg-gray-700 hover:rounded-lg cursor-pointer"
              onClick={() => selectChat(user.chat_id)}
            >
              <img
                src={user.avatar}
                alt={user.name}
                className="w-10 h-10 rounded-full mr-3"
              />
              <div>
                <p className="text-md font-bold">{user.name}</p>
                <p>{user.lastMessage}</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="h-screen w-3/4 bg-gray-500 flex flex-col">
        {selectedChat ? (
          <>
            <div className="flex items-center p-3 shadow-xl">
              <img
                src={selectedChat.avatar}
                alt={selectedChat.name}
                className="h-10 w-10 rounded-full mr-3"
              />
              <div>
                <p className="text-md font-bold text-white">
                  {selectedChat.name}
                </p>
                <p className="text-sm text-gray-300">online</p>
              </div>
            </div>

            <div className="flex-1 p-5 overflow-y-auto">
              {selectedChat.messages.map((msg) => (
                <div
                  key={msg.message_id}
                  className={`flex ${
                    msg.sender_id === userId ? "justify-end" : "justify-start"
                  }`}
                >
                  <div
                    className={`px-4 py-2 my-1 rounded-3xl max-w-xs ${
                      msg.sender_id === userId
                        ? "bg-blue-500 text-white"
                        : "bg-gray-300 text-black"
                    }`}
                  >
                    <p>{msg.content}</p>
                    <span className="block text-xs mt-1 opacity-75">
                      {new Date(msg.timestamp).toLocaleTimeString([], {
                        hour: "2-digit",
                        minute: "2-digit",
                      })}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            <div className="h-16 mx-10 flex gap-3 items-center">
              <input
                type="text"
                placeholder="Type message here"
                className="w-full rounded-3xl p-2 h-14 text-md text-white placeholder:text-gray-100 bg-gray-400"
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && handleSendBE()}
              />
              <img
                src="/sendIcon.png"
                alt="send"
                className="w-10 h-10 rounded-full transition-transform duration-200 hover:scale-125 cursor-pointer"
                onClick={handleSendBE}
              />
            </div>
          </>
        ) : (
          <div className="flex items-center justify-center flex-1 text-white text-xl">
            Select a chat to start messaging
          </div>
        )}
      </div>
    </div>
  );
};

export default Chat;
