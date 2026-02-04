// lib/utils.js
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs) {
  return twMerge(clsx(inputs));
}

// Fungsi untuk menghasilkan kode pendek unik
export function generateShortCode(prefix = '') {
  // Generate angka acak 6 digit
  const randomNum = Math.floor(Math.random() * 900000) + 100000;
  return `${prefix}${randomNum}`;
}