import React, { useEffect } from "react";
import { useSocket } from "../hooks/useSocket";

const Chat = () => {
  const socket = useSocket();

  useEffect(() => {
   
  }, [socket]);
  return <div></div>;
};

export default Chat;
