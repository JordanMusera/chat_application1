import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";
import { API_URL } from "../constants/api";

interface ServerToClientEvents {
  message: (data: any) => void;
  newMessage: (data: any) => void;
  receive_message: (data: any) => void;
  notification: (data: any) => void;
}

interface ClientToServerEvents {
  register: (userId: number) => void;
  join_chat: (chatId: any) => void;
  send_message: (data: any) => void;
}

export const useSocket = () => {
  const socketRef = useRef<Socket<ServerToClientEvents, ClientToServerEvents> | null>(null);
  const [userId, setUserId] = useState<number | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const user = await getUser();
      if (user?.id) {
        setUserId(user.id);
      }
    };
    fetchUser();
  }, []);

  useEffect(() => {
    if (!userId) return;

    // ⚡ Make sure to include these options
    socketRef.current = io(`${API_URL}`, {
      withCredentials: true,
      transports: ["websocket"], // forces websocket, avoids handshake parsing errors
    });

    socketRef.current.on("connect", () => {
      console.log("Socket connected with id:", socketRef.current?.id);

      // Register user
      socketRef.current?.emit("register", userId);
    });

    // Optional: log server messages
    socketRef.current.on("message", (data) => console.log("Message:", data));
    socketRef.current.on("receive_message", (data) => console.log("Received:", data));

    return () => {
      socketRef.current?.disconnect();
      console.log("Socket disconnected");
    };
  }, [userId]);

  return socketRef.current;
};

export const getUser = async () => {
  const res = await fetch(`${API_URL}/users/getUser`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${localStorage.getItem("token")}`,
    },
  });

  if (!res.ok) return null;

  const user = await res.json();
  return user;
};
