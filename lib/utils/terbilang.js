// lib/utils/terbilang.js
import terbilang from 'terbilang';

export const getTerbilangText = (amount) => {
  if (typeof amount !== 'number' || isNaN(amount)) {
    return 'Nol Rupiah';
  }

  if (amount < 0) {
    return 'Angka negatif tidak valid';
  }

  // Batasi jumlah maksimum untuk mencegah crash dari library terbilang
  if (amount > 999999999999) { // Maksimum 999 milyar
    return 'Jumlah terlalu besar untuk ditampilkan';
  }

  try {
    const result = terbilang(Math.round(amount));
    if (typeof result === 'string') {
      return result.charAt(0).toUpperCase() + result.slice(1) + ' Rupiah';
    } else {
      // Fallback for cases where terbilang might return non-string or object
      // Re-call terbilang to ensure consistent behavior if the first one was problematic
      const fallbackResult = String(terbilang(Math.round(amount)));
      return fallbackResult.charAt(0).toUpperCase() + fallbackResult.slice(1) + ' Rupiah';
    }
  } catch (error) {
    console.error('Error converting number to terbilang:', error);
    // Fallback jika terbilang gagal
    return `Jumlah: ${new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)}`;
  }
};