
import CredentialsProvider from "next-auth/providers/credentials";
import { PrismaAdapter } from "@next-auth/prisma-adapter";
import prisma from "./prisma"; // Use the singleton prisma instance
import bcrypt from "bcryptjs";

export const authOptions = {
  adapter: PrismaAdapter(prisma),
  providers: [
    CredentialsProvider({
      name: "Credentials",
      credentials: {
        username: { label: "Username", type: "text" },
        password: { label: "Password", type: "password" },
        selectedStoreId: { label: "Selected Store ID", type: "text", optional: true }, // Optional credential for manager to switch store context
        selectedStoreRole: { label: "Selected Store Role", type: "text", optional: true }, // Optional credential for manager to switch store context
      },
      async authorize(credentials) {
        if (!credentials?.username || !credentials?.password) {
          throw new Error("Masukkan username dan password");
        }

        const user = await prisma.user.findUnique({
          where: { username: credentials.username },
        });

        if (!user) {
          throw new Error("Username tidak ditemukan");
        }

        const isValid = await bcrypt.compare(credentials.password, user.password);

        if (!isValid) {
          throw new Error("Password salah");
        }

        // Cek apakah user memiliki role global (MANAGER atau WAREHOUSE)
        const isGlobalRole = user.role === 'MANAGER' || user.role === 'WAREHOUSE';

        // Jika bukan role global, cek apakah user memiliki akses ke toko
        let storeAccess = null;
        if (!isGlobalRole) {
          const storeUsers = await prisma.storeUser.findMany({
            where: {
              userId: user.id,
              status: 'ACTIVE',
            },
            include: {
              store: true,
            },
          });

          // Default ke toko pertama jika tersedia
          if (storeUsers.length > 0) {
            storeAccess = {
              id: storeUsers[0].store.id,
              name: storeUsers[0].store.name,
              role: storeUsers[0].role,
            };
          }
        }

        // If manager is trying to switch store context
        if (user.role === 'MANAGER' && credentials.selectedStoreId && credentials.selectedStoreRole) {
          const managerStoreAccess = await prisma.storeUser.findFirst({
            where: {
              userId: user.id,
              storeId: credentials.selectedStoreId,
              status: 'ACTIVE',
              role: credentials.selectedStoreRole, // Expecting 'ADMIN' for manager context switch
            },
            include: {
              store: true,
            },
          });

          // Ensure the manager actually has the requested role in that store
          if (managerStoreAccess) {
            storeAccess = {
              id: managerStoreAccess.store.id,
              name: managerStoreAccess.store.name,
              role: managerStoreAccess.role,
            };
          } else {
            // Manager doesn't have the requested role in that store, or store not found
            throw new Error(`Anda tidak memiliki akses ${credentials.selectedStoreRole} untuk toko ini.`);
          }
        }

        return {
          id: user.id,
          name: user.name,
          username: user.username,
          role: user.role, // Global role remains MANAGER
          employeeNumber: user.employeeNumber,
          isGlobalRole,
          storeAccess,
        };
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user }) {
      if (user) {
        token.id = user.id;
        token.role = user.role;
        token.username = user.username;
        token.employeeNumber = user.employeeNumber;
        token.isGlobalRole = user.isGlobalRole;
        token.storeAccess = user.storeAccess; // Informasi akses toko
        token.storeId = user.storeAccess?.id; // Untuk akses cepat
        token.storeRole = user.storeAccess?.role; // Role di toko ini
      }
      return token;
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.id;
        session.user.role = token.role;
        session.user.username = token.username;
        session.user.employeeNumber = token.employeeNumber;
        session.user.isGlobalRole = token.isGlobalRole;
        session.user.storeAccess = token.storeAccess;
        session.user.storeId = token.storeId;
        session.user.storeRole = token.storeRole;
      }
      return session;
    },
  },
  pages: {
    signIn: "/login",
  },
  session: {
    strategy: "jwt",
  },
  secret: process.env.NEXTAUTH_SECRET,
};
