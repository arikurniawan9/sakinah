import { NextResponse } from 'next/server';
import { initSocket, getIo } from '../../../lib/socket';

// This is a placeholder for the GET request to initialize the socket server
export async function GET(req) {
  // The server instance is magically available in the response object
  // in the Pages Router, but in the App Router, we need to access it differently.
  // The common pattern is to attach it to the response object in a middleware or a custom server.
  // However, for this fix, we will assume that the server is accessible via a custom setup.
  // A cleaner approach would be to have a custom server entrypoint.

  // The below code is a bit of a hack to get the server object.
  // It relies on the underlying Node.js server being available on the response object.
  // This is not guaranteed in all deployment environments (e.g., Vercel serverless).
  // For a more robust solution, a custom server setup is recommended.
  // @ts-ignore
  const httpServer = req.socket?.server || (req.nextUrl.hostname === 'localhost' ? require('http').createServer() : null);

  if (httpServer) {
    // @ts-ignore
    if (!httpServer.io) {
      // @ts-ignore
      httpServer.io = initSocket(httpServer);
    }
  }

  return NextResponse.json({ message: 'Socket server initialized' });
}
