import { useEffect, useRef, useState } from "react";
import { io, Socket } from "socket.io-client";

let _socket: Socket | null = null;

export function getSocket(): Socket {
  if (!_socket) {
    _socket = io({
      path: "/api/socket.io",
      withCredentials: true,
      autoConnect: false,
    });
  }
  return _socket;
}

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const socketRef = useRef<Socket>(getSocket());

  useEffect(() => {
    const socket = socketRef.current;
    if (!socket.connected) socket.connect();

    const onConnect = () => setConnected(true);
    const onDisconnect = () => setConnected(false);

    socket.on("connect", onConnect);
    socket.on("disconnect", onDisconnect);

    if (socket.connected) setConnected(true);

    return () => {
      socket.off("connect", onConnect);
      socket.off("disconnect", onDisconnect);
    };
  }, []);

  return { socket: socketRef.current, connected };
}
