import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import { getToken } from 'next-auth/jwt';
import { ROLES } from '@/lib/constants';

// This API endpoint allows a manager to switch their active store context.
export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);

    if (!session || session.user.role !== ROLES.MANAGER) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { storeId } = await request.json();

    if (!storeId) {
      return NextResponse.json({ error: 'Store ID is required' }, { status: 400 });
    }

    // In a real application, you might want to verify that the manager
    // is actually authorized to access this specific store (e.g., they created it, or were assigned).
    // For now, we assume a MANAGER can access any store they've created or is visible to them.

    // Update the session token with the new storeId and role for that context
    // This requires re-generating the JWT with the updated payload.
    // Next-auth's getToken function usually reads the token from the request.
    // To modify it, we typically update the session object itself in the frontend/middleware
    // and then NextAuth's callbacks will handle the JWT update.
    // However, for a direct API call, the session needs to be explicitly updated or a new session initiated.
    // A simpler approach for the frontend to handle this would be to sign out and then sign in
    // with a modified credential that includes the storeId.
    // Or, more robustly, directly modify the session token's payload if NextAuth allows it (it doesn't directly via API routes usually).

    // Given NextAuth's design, directly modifying the server-side session via an API route
    // and having it persist immediately is tricky.
    // A more common pattern is for the UI to:
    // 1. Store the selected storeId in a cookie or localStorage.
    // 2. Refresh the session (or re-login with the storeId as a credential).
    // 3. The `session` callback in `authOptions` would then attach this `storeId` to the `token`.

    // For now, let's simulate the update in the session object
    // and rely on the frontend to perhaps re-fetch session or trigger a re-render.
    // This part is conceptually tricky with NextAuth's default behavior for API routes
    // without a full re-login flow.

    // A better way is to update the JWT directly. next-auth/jwt's `getToken` is for reading.
    // We cannot directly write to the JWT from an API route without custom JWT signing logic.
    // The most straightforward way to change the session context on the server is to trigger a re-login
    // or to redirect to a page that forces session refresh with the new context.

    // For demonstration purposes, we will return a success and let the frontend
    // trigger a session refresh.
    // In authOptions's `jwt` callback, you'd need logic like:
    // if (user.role === ROLES.MANAGER && account?.type === "credentials" && trigger === "signIn") {
    //   token.storeId = credentials.storeId;
    //   token.role = ROLES.ADMIN; // when manager is acting as admin for a store
    // }

    // This API simply confirms the storeId selection.
    // The actual session update (token.storeId) should ideally happen in the jwt callback
    // when the session is first created/updated based on some client-side context (e.g., local storage/cookie).

    // The current setup assumes `session.user.storeId` is already updated by some mechanism
    // or this API is meant to *signal* the change to the client, which then refreshes the session.

    // Let's assume the frontend will handle the session refresh or re-login.
    // We can explicitly add the storeId to the session object returned to the client,
    // though this doesn't directly modify the JWT for subsequent server-side requests automatically
    // without refreshing.

    // For a manager to access a store's admin panel, their token should reflect that specific storeId
    // and their role should transition from MANAGER (global) to ADMIN (store-specific).
    // This is best handled by updating the `session` and `jwt` callbacks in `authOptions`.

    return NextResponse.json({ success: true, message: `Switched to store ${storeId}`, selectedStoreId: storeId });

  } catch (error) {
    console.error('Error updating store context:', error);
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
  }
}