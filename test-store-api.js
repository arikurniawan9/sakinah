// Script sederhana untuk menguji endpoint /api/stores/current
const { getServerSession } = require('next-auth/next');
const { authOptions } = require('./lib/authOptions');
const prisma = require('./lib/prisma');

async function testCurrentStoreEndpoint(mockSession) {
  try {
    console.log('Testing /api/stores/current endpoint with mock session:', mockSession);

    // Ambil informasi toko berdasarkan storeId dari session
    const store = await prisma.store.findUnique({
      where: { 
        id: mockSession.user.storeId 
      },
      include: {
        setting: true // Include setting if available
      }
    });

    if (!store) {
      console.log('Toko tidak ditemukan');
      return { error: 'Toko tidak ditemukan' };
    }

    // Return store information along with any available settings
    const storeInfo = {
      name: store.setting?.shopName || store.name,
      address: store.setting?.address || store.address,
      phone: store.setting?.phone || store.phone,
      email: store.email,
      code: store.code,
      description: store.description,
    };

    console.log('Store info retrieved:', storeInfo);
    return storeInfo;
  } catch (error) {
    console.error('Error in testCurrentStoreEndpoint:', error);
    return { error: 'Failed to fetch store info', details: error.message };
  }
}

// Contoh pengujian dengan session yang valid
const mockSession = {
  user: {
    id: 'test_user_id',
    role: 'CASHIER',
    storeId: 'test_store_id' // ID toko yang valid dari database
  }
};

// Jalankan pengujian
testCurrentStoreEndpoint(mockSession)
  .then(result => {
    console.log('Test result:', result);
  })
  .catch(error => {
    console.error('Test error:', error);
  });