import {useEffect,useRef} from "react"
import {io,Socket} from "socket.io-client"

export const useSocket=()=>{
    const socketRef = useRef<Socket|null>(null);

    useEffect(()=>{
        socketRef.current = io("http://192.168.0.159:5000",{
        });

        console.log("Socket connected",socketRef.current.id);

        return()=>{
            socketRef.current?.disconnect();
            console.log("Socket disconnected");
        };
    },[]);

    return socketRef.current;
}
