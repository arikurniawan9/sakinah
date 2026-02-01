// API Configuration for Return Products Feature
// File: api-config/return-products.js

const RETURN_PRODUCT_API_CONFIG = {
  BASE_PATH: '/api/return-products',
  
  ENDPOINTS: {
    LIST: {
      METHOD: 'GET',
      PATH: '/api/return-products',
      DESCRIPTION: 'Get list of return products with filtering options'
    },
    CREATE: {
      METHOD: 'POST',
      PATH: '/api/return-products',
      DESCRIPTION: 'Create a new return product request'
    },
    DETAIL: {
      METHOD: 'GET',
      PATH: '/api/return-products/:id',
      DESCRIPTION: 'Get detail of a specific return product'
    },
    UPDATE: {
      METHOD: 'PUT',
      PATH: '/api/return-products/:id',
      DESCRIPTION: 'Update return product status (approve/reject)'
    },
    DELETE: {
      METHOD: 'DELETE',
      PATH: '/api/return-products/:id',
      DESCRIPTION: 'Delete a return product record'
    },
    STATS: {
      METHOD: 'GET',
      PATH: '/api/return-products/stats',
      DESCRIPTION: 'Get statistics for return products'
    }
  },

  VALIDATION_RULES: {
    CREATE: {
      required: ['storeId', 'transactionId', 'productId', 'attendantId', 'reason'],
      optional: ['category'],
      defaults: {
        category: 'OTHERS'
      },
      maxLength: {
        reason: 500
      }
    },
    UPDATE: {
      required: ['status', 'processedById'],
      allowedStatus: ['APPROVED', 'REJECTED']
    }
  },

  STATUS_CODES: {
    PENDING: 'PENDING',
    APPROVED: 'APPROVED',
    REJECTED: 'REJECTED'
  },

  CATEGORIES: {
    ERROR_BY_ATTENDANT: 'ERROR_BY_ATTENDANT',
    PRODUCT_DEFECT: 'PRODUCT_DEFECT',
    WRONG_SELECTION: 'WRONG_SELECTION',
    OTHERS: 'OTHERS'
  },

  RESPONSE_MESSAGES: {
    SUCCESS: {
      CREATE: 'Retur produk berhasil dibuat',
      UPDATE: 'Retur produk berhasil diperbarui',
      DELETE: 'Retur produk berhasil dihapus',
      FETCH: 'Data retur produk berhasil diambil'
    },
    ERROR: {
      INVALID_INPUT: 'Input tidak valid',
      NOT_FOUND: 'Retur produk tidak ditemukan',
      UNAUTHORIZED: 'Tidak memiliki izin untuk melakukan operasi ini',
      SERVER_ERROR: 'Terjadi kesalahan server'
    }
  }
};

module.exports = RETURN_PRODUCT_API_CONFIG;