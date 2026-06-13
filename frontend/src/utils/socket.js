import { io } from 'socket.io-client';

const getSocketUrl = () => {
  if (import.meta.env.PROD) {
    // In production on Vercel, the origin is the same
    return window.location.origin;
  }
  return 'http://localhost:5000';
};

let socket = null;

export const initiateSocket = () => {
  if (socket) return socket;
  
  socket = io(getSocketUrl(), {
    autoConnect: true,
    reconnection: true,
    reconnectionAttempts: 5,
    reconnectionDelay: 2000,
  });

  socket.on('connect', () => {
    console.log('Socket.io connected successfully:', socket.id);
  });

  socket.on('connect_error', (err) => {
    console.warn('Socket.io connection error (falling back to polling):', err.message);
  });

  return socket;
};

export const getSocket = () => {
  if (!socket) {
    return initiateSocket();
  }
  return socket;
};

export const disconnectSocket = () => {
  if (socket) {
    socket.disconnect();
    socket = null;
  }
};
