// app/register-manager/proxy.js
// File ini diperlukan untuk menghindari error pada Next.js
// Fungsionalitas register manager sudah ditangani di proxy utama (../proxy.js)
import { NextResponse } from 'next/server'

export function proxy(request) {
  // Izinkan akses ke halaman register manager
  // Fungsionalitas penuh ditangani di proxy utama
  return NextResponse.next()
}

export const config = {
  matcher: ['/register-manager/:path*']
}