// Skrip uji untuk fitur retur produk
// File: test-return-feature.js

async function testReturnFeature() {
  console.log('=== Mulai Uji Fitur Retur Produk ===\n');

  // Tes 1: Membuat retur produk baru
  console.log('1. Menguji pembuatan retur produk baru...');
  try {
    const newReturnResponse = await fetch('/api/return-products', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        storeId: 'STORE_ID_SAMPLE',
        transactionId: 'TRANSACTION_ID_SAMPLE',
        productId: 'PRODUCT_ID_SAMPLE',
        attendantId: 'ATTENDANT_ID_SAMPLE',
        reason: 'Produk cacat saat diterima',
        category: 'PRODUCT_DEFECT'
      }),
    });

    const newReturnResult = await newReturnResponse.json();
    console.log('   Status:', newReturnResponse.status);
    console.log('   Sukses:', newReturnResult.success);
    console.log('   Pesan:', newReturnResult.message || 'Tidak ada pesan');
    
    if (newReturnResult.success) {
      console.log('   ✅ Pembuatan retur produk berhasil\n');
      const returnId = newReturnResult.data.id;
      
      // Tes 2: Mengambil detail retur produk
      console.log('2. Menguji pengambilan detail retur produk...');
      const detailResponse = await fetch(`/api/return-products/${returnId}`);
      const detailResult = await detailResponse.json();
      console.log('   Status:', detailResponse.status);
      console.log('   Sukses:', detailResult.success);
      
      if (detailResult.success) {
        console.log('   ✅ Pengambilan detail retur produk berhasil\n');
        
        // Tes 3: Menyetujui retur produk
        console.log('3. Menguji persetujuan retur produk...');
        const approveResponse = await fetch(`/api/return-products/${returnId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            status: 'APPROVED',
            processedById: 'TEST_USER_ID'
          }),
        });
        
        const approveResult = await approveResponse.json();
        console.log('   Status:', approveResponse.status);
        console.log('   Sukses:', approveResult.success);
        console.log('   Pesan:', approveResult.message || 'Tidak ada pesan');
        
        if (approveResult.success) {
          console.log('   ✅ Persetujuan retur produk berhasil\n');
        } else {
          console.log('   ❌ Gagal menyetujui retur produk\n');
        }
      } else {
        console.log('   ❌ Gagal mengambil detail retur produk\n');
      }
    } else {
      console.log('   ❌ Gagal membuat retur produk\n');
    }
  } catch (error) {
    console.error('   ❌ Terjadi kesalahan:', error.message);
  }

  // Tes 4: Mengambil daftar retur produk
  console.log('4. Menguji pengambilan daftar retur produk...');
  try {
    const listResponse = await fetch('/api/return-products');
    const listResult = await listResponse.json();
    console.log('   Status:', listResponse.status);
    console.log('   Sukses:', listResult.success);
    console.log('   Jumlah data:', listResult.data ? listResult.data.length : 0);
    
    if (listResult.success) {
      console.log('   ✅ Pengambilan daftar retur produk berhasil\n');
    } else {
      console.log('   ❌ Gagal mengambil daftar retur produk\n');
    }
  } catch (error) {
    console.error('   ❌ Terjadi kesalahan:', error.message);
  }

  // Tes 5: Mengambil statistik retur produk
  console.log('5. Menguji pengambilan statistik retur produk...');
  try {
    const statsResponse = await fetch('/api/return-products/stats');
    const statsResult = await statsResponse.json();
    console.log('   Status:', statsResponse.status);
    console.log('   Sukses:', statsResult.success);
    
    if (statsResult.success) {
      console.log('   Total retur:', statsResult.data.totalReturns);
      console.log('   Retur berdasarkan status:', statsResult.data.returnsByStatus);
      console.log('   ✅ Pengambilan statistik retur produk berhasil\n');
    } else {
      console.log('   ❌ Gagal mengambil statistik retur produk\n');
    }
  } catch (error) {
    console.error('   ❌ Terjadi kesalahan:', error.message);
  }

  console.log('=== Selesai Uji Fitur Retur Produk ===');
}

// Jalankan tes
testReturnFeature().catch(console.error);