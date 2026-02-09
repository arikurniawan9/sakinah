// middleware.js
import { withAuth } from 'next-auth/middleware';

export default function middleware(req) {
  // Allow access to home page and other public routes without authentication
  const publicPaths = ['/', '/login', '/register', '/api/auth/*', '/api/trpc/*', '/api/throttle-status'];
  
  const isPublicPath = publicPaths.some(path => {
    if (path.endsWith('/*')) {
      return req.nextUrl.pathname.startsWith(path.replace('/*', ''));
    }
    return req.nextUrl.pathname === path;
  });

  if (isPublicPath) {
    return; // Allow access to public paths without authentication
  }

  // For protected paths, use the default NextAuth middleware
  return withAuth({
    pages: {
      signIn: '/login',
    },
  })(req);
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};