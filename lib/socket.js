// lib/socket.js
import { Server } from 'socket.io';

let io;

export const initSocket = (server) => {
  if (io) {
    console.log('Socket.IO already initialized');
    return io;
  }

  io = new Server(server, {
    path: '/api/socket_io',
    addTrailingSlash: false,
    cors: {
      origin: process.env.NEXT_PUBLIC_CLIENT_URL || "*",
      methods: ["GET", "POST"]
    }
  });

  io.on('connection', (socket) => {
    console.log('A user connected:', socket.id);

    socket.on('joinRoom', (room) => {
      socket.join(room);
      console.log(`Socket ${socket.id} joined room ${room}`);
    });

    socket.on('leaveRoom', (room) => {
      socket.leave(room);
      console.log(`Socket ${socket.id} left room ${room}`);
    });

    socket.on('disconnect', () => {
      console.log('User disconnected:', socket.id);
    });
  });

  console.log('Socket.IO initialized');
  return io;
};

export const getIo = () => {
  if (!io) {
    throw new Error('Socket.IO not initialized');
  }
  return io;
};
