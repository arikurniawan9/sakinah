// utils/return-product-utils.js
// Fungsi-fungsi utilitas untuk fitur retur produk

/**
 * Format tanggal untuk ditampilkan di UI
 * @param {string|Date} dateString - Tanggal dalam bentuk string ISO atau objek Date
 * @returns {string} - Tanggal yang diformat dalam bahasa Indonesia
 */
export function formatDate(dateString) {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

/**
 * Format tanggal dalam format pendek
 * @param {string|Date} dateString - Tanggal dalam bentuk string ISO atau objek Date
 * @returns {string} - Tanggal yang diformat dalam format pendek
 */
export function formatDateShort(dateString) {
  if (!dateString) return '-';
  
  const date = new Date(dateString);
  return date.toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric'
  });
}

/**
 * Mendapatkan label status retur produk
 * @param {string} status - Status retur produk
 * @returns {string} - Label status dalam bahasa Indonesia
 */
export function getStatusLabel(status) {
  switch (status) {
    case 'APPROVED':
      return 'Disetujui';
    case 'PENDING':
      return 'Menunggu';
    case 'REJECTED':
      return 'Ditolak';
    default:
      return status;
  }
}

/**
 * Mendapatkan keterangan kategori retur produk
 * @param {string} category - Kategori retur produk
 * @returns {string} - Keterangan kategori dalam bahasa Indonesia
 */
export function getCategoryLabel(category) {
  switch (category) {
    case 'ERROR_BY_ATTENDANT':
      return 'Kesalahan Pelayan';
    case 'PRODUCT_DEFECT':
      return 'Produk Cacat';
    case 'WRONG_SELECTION':
      return 'Salah Pilih';
    default:
      return 'Lainnya';
  }
}

/**
 * Mendapatkan warna badge berdasarkan status
 * @param {string} status - Status retur produk
 * @returns {string} - Warna badge
 */
export function getStatusBadgeVariant(status) {
  switch (status) {
    case 'APPROVED':
      return 'success';
    case 'PENDING':
      return 'warning';
    case 'REJECTED':
      return 'destructive';
    default:
      return 'secondary';
  }
}

/**
 * Mendapatkan ikon berdasarkan status
 * @param {string} status - Status retur produk
 * @returns {JSX.Element|null} - Ikon status
 */
export function getStatusIcon(status) {
  // Fungsi ini akan digunakan di komponen React
  // Karena kita tidak bisa mengembalikan JSX dari fungsi utilitas,
  // maka kita kembalikan string identifier
  switch (status) {
    case 'APPROVED':
      return 'check-circle';
    case 'PENDING':
      return 'clock';
    case 'REJECTED':
      return 'x-circle';
    default:
      return 'alert-circle';
  }
}

/**
 * Mendapatkan prioritas berdasarkan kategori
 * @param {string} category - Kategori retur produk
 * @returns {string} - Prioritas (high, medium, low)
 */
export function getPriorityFromCategory(category) {
  switch (category) {
    case 'PRODUCT_DEFECT':
      return 'high';
    case 'ERROR_BY_ATTENDANT':
      return 'medium';
    case 'WRONG_SELECTION':
      return 'low';
    default:
      return 'low';
  }
}

/**
 * Validasi data retur produk
 * @param {Object} data - Data retur produk
 * @returns {Object} - Hasil validasi
 */
export function validateReturnData(data) {
  const errors = [];
  
  if (!data.storeId) {
    errors.push('Toko harus dipilih');
  }
  
  if (!data.transactionId) {
    errors.push('Nomor transaksi harus diisi');
  }
  
  if (!data.productId) {
    errors.push('Produk harus dipilih');
  }
  
  if (!data.attendantId) {
    errors.push('Pelayan harus dipilih');
  }
  
  if (!data.reason || data.reason.trim().length === 0) {
    errors.push('Alasan retur harus diisi');
  }
  
  if (data.reason && data.reason.length > 500) {
    errors.push('Alasan retur terlalu panjang (maksimal 500 karakter)');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
}

/**
 * Mendapatkan jumlah retur berdasarkan status
 * @param {Array} returns - Array data retur produk
 * @returns {Object} - Jumlah retur berdasarkan status
 */
export function getReturnCountsByStatus(returns) {
  if (!Array.isArray(returns)) {
    return { PENDING: 0, APPROVED: 0, REJECTED: 0, TOTAL: 0 };
  }
  
  const counts = returns.reduce((acc, ret) => {
    acc[ret.status] = (acc[ret.status] || 0) + 1;
    acc.TOTAL = acc.TOTAL + 1;
    return acc;
  }, { PENDING: 0, APPROVED: 0, REJECTED: 0, TOTAL: 0 });
  
  return counts;
}

/**
 * Mendapatkan jumlah retur berdasarkan kategori
 * @param {Array} returns - Array data retur produk
 * @returns {Object} - Jumlah retur berdasarkan kategori
 */
export function getReturnCountsByCategory(returns) {
  if (!Array.isArray(returns)) {
    return {};
  }
  
  return returns.reduce((acc, ret) => {
    acc[ret.category] = (acc[ret.category] || 0) + 1;
    return acc;
  }, {});
}

/**
 * Fungsi untuk mencari retur produk berdasarkan berbagai kriteria
 * @param {Array} returns - Array data retur produk
 * @param {Object} filters - Filter pencarian
 * @returns {Array} - Hasil pencarian
 */
export function searchReturns(returns, filters = {}) {
  if (!Array.isArray(returns)) {
    return [];
  }
  
  return returns.filter(ret => {
    // Filter berdasarkan status
    if (filters.status && filters.status !== 'ALL' && ret.status !== filters.status) {
      return false;
    }
    
    // Filter berdasarkan kategori
    if (filters.category && ret.category !== filters.category) {
      return false;
    }
    
    // Filter berdasarkan tanggal
    if (filters.date) {
      const retDate = new Date(ret.returnDate).toLocaleDateString();
      const filterDate = new Date(filters.date).toLocaleDateString();
      if (retDate !== filterDate) {
        return false;
      }
    }
    
    // Filter berdasarkan pencarian teks
    if (filters.searchTerm) {
      const searchTerm = filters.searchTerm.toLowerCase();
      const matches = 
        (ret.transactionId && ret.transactionId.toLowerCase().includes(searchTerm)) ||
        (ret.product?.name && ret.product.name.toLowerCase().includes(searchTerm)) ||
        (ret.attendant?.name && ret.attendant.name.toLowerCase().includes(searchTerm)) ||
        (ret.reason && ret.reason.toLowerCase().includes(searchTerm));
      
      if (!matches) {
        return false;
      }
    }
    
    return true;
  });
}