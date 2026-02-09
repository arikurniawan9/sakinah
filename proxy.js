// proxy.js (main proxy file for multi-tenant system)
import { withAuth } from 'next-auth/middleware';
import { NextResponse } from 'next/server';
import { ROLES } from './lib/constants';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import prisma from '@/lib/prisma';

// Definisikan role mana yang termasuk global role (bisa mengakses semua toko)
const GLOBAL_ROLES = [ROLES.MANAGER, ROLES.WAREHOUSE];

// Definisikan permission untuk masing-masing path
const rolePermissions = {
  '/manager': [ROLES.MANAGER],
  '/warehouse': [ROLES.WAREHOUSE], // WAREHOUSE adalah role utama untuk warehouse, tapi MANAGER juga bisa akses (ditangani di bawah)
  '/admin': [ROLES.ADMIN], // Ini harus bisa diakses baik oleh global admin maupun store admin
  '/kasir': [ROLES.CASHIER],
  '/pelayan': [ROLES.ATTENDANT],
};

// Fungsi untuk mengecek apakah sudah ada manager
async function checkManagerExists() {
  try {
    const managerCount = await prisma.user.count({
      where: {
        role: 'MANAGER',
      },
    });
    return managerCount > 0;
  } catch (error) {
    // Jika terjadi error karena tabel belum ada, anggap belum ada manager
    return false;
  }
}

// Fungsi proxy untuk proteksi route
function authProxy(req) {
  const { pathname } = req.nextUrl;
  const { token } = req.nextauth;

  // Validasi token dan informasi tambahan untuk keamanan
  if (token) {
    // Validasi waktu token untuk mencegah penggunaan token lama
    const tokenAge = Date.now() - (token.tokenCreationTime || 0);
    const maxTokenAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    if (tokenAge > maxTokenAge) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }
  }

  // Jika path adalah untuk role tertentu, validasi akses
  for (const path in rolePermissions) {
    if (pathname.startsWith(path)) {
      const allowedRoles = rolePermissions[path];

      if (!token) {
        // Jika tidak ada token, arahkan ke halaman login
        const url = req.nextUrl.clone();
        url.pathname = '/login';
        return NextResponse.redirect(url);
      }

      // Untuk halaman admin, kita perlu membedakan antara admin global dan admin toko
      if (pathname.startsWith('/admin')) {
        // Jika user adalah global admin (MANAGER), perbolehkan akses
        if (token.role === ROLES.MANAGER) {
          // Manager dapat mengakses admin dashboard jika mereka memiliki storeId tertentu
        }
        // Jika user adalah admin toko, perbolehkan akses jika mereka memiliki storeId
        else if (token.role === ROLES.ADMIN && token.storeId) {
          // Admin toko dapat mengakses dashboard admin jika mereka memiliki akses ke toko
        }
        // Jika user bukan MANAGER dan bukan ADMIN dengan storeId, tolak akses
        else if (token.role !== ROLES.MANAGER && (token.role !== ROLES.ADMIN || !token.storeId)) {
          const url = req.nextUrl.clone();
          url.pathname = '/unauthorized';
          return NextResponse.redirect(url);
        }
      }
      // Untuk halaman lainnya, gunakan validasi role sederhana
      else if (!allowedRoles.includes(token.role)) {
        // Jika user memiliki global role, arahkan ke halaman yang sesuai
        if (token?.role === ROLES.MANAGER) {
          if (pathname.startsWith('/admin') || pathname.startsWith('/kasir') || pathname.startsWith('/pelayan')) {
            // Manager bisa mengakses halaman toko, tapi akan ditangani di halaman masing-masing
            // jika mereka tidak memiliki storeId
          } else if (pathname.startsWith('/warehouse')) {
            // Manager bisa mengakses halaman warehouse
          } else {
            // Untuk halaman non-toko, biarkan manager akses
          }
        } else if (token?.role === ROLES.WAREHOUSE) {
          // Warehouse role tidak boleh mengakses halaman toko biasa
          if (!pathname.startsWith('/warehouse')) {
            const url = req.nextUrl.clone();
            url.pathname = '/unauthorized';
            return NextResponse.redirect(url);
          }
        } else {
          // User biasa dengan role yang salah
          const url = req.nextUrl.clone();
          url.pathname = '/unauthorized';
          return NextResponse.redirect(url);
        }
      }

      // Untuk role per toko (bukan global), pastikan memiliki akses ke toko tertentu
      if (!GLOBAL_ROLES.includes(token.role) && !token.storeId) {
        // Kecualikan halaman admin untuk admin toko yang seharusnya bisa mengakses dashboard
        if (pathname.startsWith('/admin') && token.role === ROLES.ADMIN) {
          // Admin toko akan diarahkan ke dashboard admin toko masing-masing
        }
        // Kecualikan juga halaman pelayan untuk pelayan yang seharusnya bisa mengakses dashboard pelayan
        else if (pathname.startsWith('/pelayan') && token.role === ROLES.ATTENDANT) {
          // Pelayan akan diarahkan ke dashboard pelayan toko masing-masing
        }
        // Kecualikan juga halaman kasir untuk kasir yang seharusnya bisa mengakses dashboard kasir
        else if (pathname.startsWith('/kasir') && token.role === ROLES.CASHIER) {
          // Kasir akan diarahkan ke dashboard kasir toko masing-masing
        }
        else {
          // Jika user belum memiliki akses ke toko, arahkan ke halaman unauthorized
          // untuk mencegah loop redirect yang terjadi jika langsung mengarah ke dashboard
          if (!pathname.startsWith('/api/')) { // Hanya untuk halaman UI, bukan API
            const url = req.nextUrl.clone();
            url.pathname = '/unauthorized';
            return NextResponse.redirect(url);
          }
        }
      }

      // Validasi apakah user memiliki akses ke toko yang dipilih
      if (token.storeId && !GLOBAL_ROLES.includes(token.role)) {
        // Di sini bisa ditambahkan validasi tambahan jika diperlukan
        // Misalnya: cek apakah user masih aktif di toko tersebut
      }

      break;
    }
  }

  // Validasi akses API routes untuk sistem multi-tenant
  if (pathname.startsWith('/api/') && !pathname.startsWith('/api/auth/')) {
    // Tambahkan validasi tambahan untuk API routes
    if (!token) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Validasi waktu token untuk API juga
    const tokenAge = Date.now() - (token.tokenCreationTime || 0);
    const maxTokenAge = 24 * 60 * 60 * 1000; // 24 hours in milliseconds

    if (tokenAge > maxTokenAge) {
      return NextResponse.json({ error: 'Token expired' }, { status: 401 });
    }
  }

  return NextResponse.next();
}

// Proxy wrapper yang menangani proteksi berdasarkan path
export default async function mainProxy(req) {
  const { pathname } = req.nextUrl;

  // Izinkan akses ke halaman utama tanpa otentikasi
  if (pathname === '/' || pathname === '/index') {
    return NextResponse.next();
  }

  // Tangani register manager
  if (pathname === '/register-manager' || pathname.startsWith('/register-manager')) {
    const managerExists = await checkManagerExists();

    // Jika sudah ada manager, redirect ke login
    if (managerExists) {
      const url = req.nextUrl.clone();
      url.pathname = '/login';
      return NextResponse.redirect(url);
    }

    return NextResponse.next();
  }

  // Untuk path lainnya, gunakan proteksi otentikasi
  return withAuth(authProxy, {
    pages: {
      signIn: '/login',
    },
  })(req);
}

// Konfigurasi matcher digabungkan dari semua proxy
export const config = {
  matcher: [
    /*
     * Exclude the following:
     * - /api/ routes
     * - /login page
     * - /unauthorized page
     * - /register-manager page
     * - /register page
     * - Static assets (.png, .jpg, etc.)
     * - Other public files
     */
    '/((?!api|_next/static|_next/image|favicon.ico|login|unauthorized|register-manager|register|.*\\.png$|.*\\.jpg$|.*\\.jpeg$|.*\\.gif$|.*\\.svg$).*)',
    '/register-manager',
  ],
};