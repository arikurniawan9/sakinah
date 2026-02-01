// Sistem mock untuk data retur produk
// Digunakan ketika akses ke database bermasalah
// File: utils/mock-return-data.js

// Data mock untuk retur produk
const MOCK_RETURN_DATA = [
  {
    id: 'ret1',
    storeId: 'STORE001',
    transactionId: 'INV-001',
    productId: 'PROD-001',
    attendantId: 'ATT-001',
    reason: 'Produk rusak saat diterima',
    category: 'PRODUCT_DEFECT',
    returnDate: new Date('2025-12-15T10:30:00Z'),
    status: 'APPROVED',
    createdAt: new Date('2025-12-15T09:00:00Z'),
    updatedAt: new Date('2025-12-15T10:30:00Z'),
    store: {
      id: 'STORE001',
      name: 'Toko Sakinah Pusat'
    },
    product: {
      id: 'PROD-001',
      name: 'Sabun Mandi Lux'
    },
    attendant: {
      id: 'ATT-001',
      name: 'Ahmad Kurniawan',
      username: 'ahmadk'
    }
  },
  {
    id: 'ret2',
    storeId: 'STORE001',
    transactionId: 'INV-002',
    productId: 'PROD-005',
    attendantId: 'ATT-002',
    reason: 'Salah beli warna',
    category: 'WRONG_SELECTION',
    returnDate: new Date('2025-12-16T14:20:00Z'),
    status: 'PENDING',
    createdAt: new Date('2025-12-16T13:45:00Z'),
    updatedAt: new Date('2025-12-16T13:45:00Z'),
    store: {
      id: 'STORE001',
      name: 'Toko Sakinah Pusat'
    },
    product: {
      id: 'PROD-005',
      name: 'Shampo Pantene'
    },
    attendant: {
      id: 'ATT-002',
      name: 'Rina Lestari',
      username: 'rinalestari'
    }
  },
  {
    id: 'ret3',
    storeId: 'STORE001',
    transactionId: 'INV-003',
    productId: 'PROD-008',
    attendantId: 'ATT-003',
    reason: 'Kasir salah input harga',
    category: 'ERROR_BY_ATTENDANT',
    returnDate: new Date('2025-12-17T09:15:00Z'),
    status: 'REJECTED',
    createdAt: new Date('2025-12-17T08:30:00Z'),
    updatedAt: new Date('2025-12-17T09:15:00Z'),
    store: {
      id: 'STORE001',
      name: 'Toko Sakinah Pusat'
    },
    product: {
      id: 'PROD-008',
      name: 'Pasta Gigi Sensodyne'
    },
    attendant: {
      id: 'ATT-003',
      name: 'Bambang Hartono',
      username: 'bambangh'
    }
  }
];

// Fungsi untuk mendapatkan data mock
export const getMockReturnData = (filters = {}) => {
  let data = [...MOCK_RETURN_DATA];
  
  // Filter berdasarkan status
  if (filters.status && filters.status !== 'ALL') {
    data = data.filter(item => item.status === filters.status);
  }
  
  // Filter berdasarkan store
  if (filters.storeId) {
    data = data.filter(item => item.storeId === filters.storeId);
  }
  
  // Filter berdasarkan pencarian
  if (filters.searchTerm) {
    const term = filters.searchTerm.toLowerCase();
    data = data.filter(item => 
      item.transactionId.toLowerCase().includes(term) ||
      item.product.name.toLowerCase().includes(term) ||
      item.attendant.name.toLowerCase().includes(term) ||
      item.reason.toLowerCase().includes(term)
    );
  }
  
  return data;
};

// Fungsi untuk mendapatkan data berdasarkan ID
export const getMockReturnById = (id) => {
  return MOCK_RETURN_DATA.find(item => item.id === id);
};

// Fungsi untuk menambahkan data mock (untuk simulasi)
export const addMockReturn = (newReturn) => {
  const returnWithDefaults = {
    id: `ret${MOCK_RETURN_DATA.length + 1}`,
    ...newReturn,
    createdAt: new Date(),
    updatedAt: new Date(),
    status: 'PENDING',
    returnDate: new Date()
  };
  
  MOCK_RETURN_DATA.push(returnWithDefaults);
  return returnWithDefaults;
};

// Fungsi untuk memperbarui status mock
export const updateMockReturnStatus = (id, status, processedById) => {
  const index = MOCK_RETURN_DATA.findIndex(item => item.id === id);
  if (index !== -1) {
    MOCK_RETURN_DATA[index] = {
      ...MOCK_RETURN_DATA[index],
      status,
      updatedAt: new Date()
    };
    return MOCK_RETURN_DATA[index];
  }
  return null;
};

// Fungsi untuk mendapatkan statistik mock
export const getMockReturnStats = () => {
  const totalReturns = MOCK_RETURN_DATA.length;
  const pendingReturns = MOCK_RETURN_DATA.filter(r => r.status === 'PENDING').length;
  const approvedReturns = MOCK_RETURN_DATA.filter(r => r.status === 'APPROVED').length;
  const rejectedReturns = MOCK_RETURN_DATA.filter(r => r.status === 'REJECTED').length;
  
  const returnsByCategory = MOCK_RETURN_DATA.reduce((acc, curr) => {
    acc[curr.category] = (acc[curr.category] || 0) + 1;
    return acc;
  }, {});
  
  return {
    totalReturns,
    pendingReturns,
    approvedReturns,
    rejectedReturns,
    returnsByCategory
  };
};