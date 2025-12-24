import { Server } from 'socket.io';

export const config = {
  api: {
    bodyParser: false,
  },
};

let ioInstance; // Declare outside to maintain singleton pattern

export default function socketHandler(req, res) {
  // @ts-ignore
  if (!res.socket.server.io) {
    // @ts-ignore
    ioInstance = new Server(res.socket.server, {
      path: '/api/socket_io', // Custom path for the socket.io server
      addTrailingSlash: false,
      cors: {
        origin: process.env.NEXT_PUBLIC_CLIENT_URL || "*", // Adjust CORS as needed
        methods: ["GET", "POST"]
      }
    });

    ioInstance.on('connection', (socket) => {
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

    // @ts-ignore
    res.socket.server.io = ioInstance;
  } else {
    // @ts-ignore
    ioInstance = res.socket.server.io;
  }
  res.end();
}

export const getIo = () => {
  return ioInstance;
};
