import React, { useEffect, useState } from "react";
import { useSocket } from "../hooks/useSocket";

const Chat = () => {
  const socket = useSocket();

  useEffect(() => {}, [socket]);

  interface Chat {
    id: number;
    name: string;
    lastMessage: string;
    avatar: string;
    messages: { from: string; text: string; time: string }[];
  }

  const [chats, setChats] = useState<Chat[]>([
    {
      id: 1,
      name: "Alice",
      lastMessage: "See you later!",
      avatar: "https://i.pravatar.cc/150?img=1",
      messages: [
        { from: "Alice", text: "Hey there!", time: "10:30 AM" },
        { from: "Me", text: "Hi Alice!", time: "10:31 AM" },
      ],
    },
    {
      id: 2,
      name: "Bob",
      lastMessage: "Let’s catch up.",
      avatar: "https://i.pravatar.cc/150?img=2",
      messages: [
        { from: "Bob", text: "Hello!", time: "09:15 AM" },
        { from: "Me", text: "Hey Bob!", time: "09:17 AM" },
      ],
    },
  ]);

  const [selectedChat, setSelectedChat] = useState<Chat | null>(null);
  const [input, setInput] = useState("");

  const selectChat = (chat: Chat) => {
    setSelectedChat(chat);
  };

  const handleSend = () => {
    if (input === null) {
      return;
    }

    const newMessage = {
      from: "Me",
      text: input,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };
    const updatedChats = chats.map((chat) =>
      chat.id === selectedChat?.id
        ? {
            ...chat,
            messages: [...chat.messages, newMessage],
            lastMessage: input,
          }
        : chat
    );

    setChats(updatedChats);
    setSelectedChat((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        messages: [...prev.messages, newMessage],
      };
    });
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
          {chats.map((chat) => (
            <div
              key={chat.id}
              className="text-white flex py-3 px-2 items-center w-full hover:bg-gray-700 hover:rounded-lg"
              onClick={() => selectChat(chat)}
            >
              <img
                src={chat.avatar}
                alt={chat.name}
                className="w-10 h-10 rounded-full mr-3"
              />
              <div>
                <p className="text-md font-bold">{chat.name}</p>
                <p>{chat.lastMessage}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
      <div className="h-screen w-3/4 bg-gray-500 flex flex-col">
        <div className="w-full shadow-xl min-h-16">
          {selectedChat && (
            <div className="flex items-center">
              <img
                src={selectedChat.avatar}
                alt={selectedChat.name}
                className="h-10 w-10 rounded-full m-3"
              />
              <div>
                <p className="text-md font-bold text-white">
                  {selectedChat.name}
                </p>
                <p className="text-md text-gray-300">online</p>
              </div>
            </div>
          )}
        </div>

        <div className="flex-1">
          {selectedChat == null ? (
            <div className="p-6 w-full h-full flex items-center justify-center">
              <h1 className="text-white text-2xl">
                Start chatting to connect with friends and family!
              </h1>
            </div>
          ) : (
            <div className="w-full h-full flex flex-col">
              <div className="flex-1 p-5">
                {selectedChat.messages.map((msg, index) => (
                  <div
                    key={index}
                    className={`flex ${
                      msg.from === "Me" ? "justify-end" : "justify-start"
                    }`}
                  >
                    <div
                      className={`px-4 py-2 my-1 rounded-3xl max-w-xs ${
                        msg.from === "Me"
                          ? "bg-blue-500 text-white"
                          : "bg-gray-300 text-black"
                      }`}
                    >
                      <p>{msg.text}</p>
                      <span className="block text-xs mt-1 opacity-75">
                        {msg.time}
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
                  onKeyDown={(e) => e.key === "Enter" && handleSend()}
                />
                <img
                  src="/sendIcon.png"
                  alt="send"
                  className="w-10 h-10 rounded-full transition-transform duration-200 hover:scale-125"
                  onClick={handleSend}
                />
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Chat;
