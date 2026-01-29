// server.js
const { createServer } = require('http');
const { parse } = require('url');
const next = require('next');
const { initSocket } = require('./lib/socket');

const dev = process.env.NODE_ENV !== 'production';
const app = next({ dev });
const handle = app.getRequestHandler();

const port = process.env.PORT || 3000;

app.prepare().then(() => {
  const server = createServer((req, res) => {
    const parsedUrl = parse(req.url, true);
    handle(req, res, parsedUrl);
  });

  // Initialize Socket.IO
  const io = initSocket(server);

  // Example: You can add more application-specific socket logic here if needed
  io.on('connection', (socket) => {
    // This is the socket instance for each client.
    // The generic handlers are in lib/socket.js, but you can add more here.
    console.log(`New client connected on the main server: ${socket.id}`);
  });

  server.listen(port, (err) => {
    if (err) throw err;
    console.log(`> Ready on http://localhost:${port}`);
  });
});
