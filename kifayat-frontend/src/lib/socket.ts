import { io, Socket } from "socket.io-client";

// Connect through the Vite proxy (/socket.io → http://localhost:5000)
// so it works in both dev and Replit preview without hardcoding the port.
let socket: Socket | null = null;

export function getSocket(): Socket {
  if (!socket) {
    socket = io("/", {
      path: "/socket.io",
      // Replit's proxied iframe returns 400 on the WebSocket upgrade handshake.
      // Locking to polling keeps the connection stable; events are still
      // delivered in real-time with negligible latency for a store's needs.
      transports: ["polling"],
      upgrade: false,
      withCredentials: true,
      autoConnect: true,
    });
  }
  return socket;
}
