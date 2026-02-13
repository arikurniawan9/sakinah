import '../styles/globals.css'
import { Inter } from 'next/font/google'
import { Providers } from './providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata = {
  title: 'Sakinah - Aplikasi Kasir',
  description: 'Aplikasi kasir untuk toko pakaian Sakinah',
  // Explicitly allowing features via metadata if possible
  other: {
    'permissions-policy': 'camera=*, microphone=(), geolocation=()'
  }
}

export default function RootLayout({ children }) {
  return (
    <html lang="en">
      <head>
        {/* Force allow camera for PWA/Mobile browsers */}
        <meta httpEquiv="Permissions-Policy" content="camera=*" />
      </head>
      <body className={inter.className}>
        <Providers>{children}</Providers>
      </body>
    </html>
  )
}