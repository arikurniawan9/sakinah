// components/warehouse/distribution/BarcodeScannerManager.js
import { useState, useEffect } from 'react';
import BarcodeScanner from './BarcodeScanner';

const BarcodeScannerManager = ({ onScan, darkMode, products, addToCart }) => {
  const [showScanner, setShowScanner] = useState(false);

  // Tangani event untuk membuka scanner
  useEffect(() => {
    const handleOpenScanner = () => {
      setShowScanner(true);
    };

    window.addEventListener('openBarcodeScanner', handleOpenScanner);

    return () => {
      window.removeEventListener('openBarcodeScanner', handleOpenScanner);
    };
  }, []);

  // Tangani hasil scan
  const handleScanResult = (barcode) => {
    // Cari produk berdasarkan barcode (kode produk)
    const foundProduct = products.find(p =>
      p.Product && p.Product.productCode && p.Product.productCode.toLowerCase() === barcode.toLowerCase()
    );

    if (foundProduct) {
      addToCart(foundProduct);
      // Gunakan toast notification atau feedback yang lebih halus daripada alert
      console.log(`Produk ditemukan dan ditambahkan ke keranjang: ${foundProduct.Product.name}`);
    } else {
      // Gunakan toast notification atau feedback yang lebih halus daripada alert
      console.log(`Produk dengan kode ${barcode} tidak ditemukan.`);
    }

    setShowScanner(false);
  };

  return (
    <>
      {showScanner && (
        <BarcodeScanner
          onScan={handleScanResult}
          darkMode={darkMode}
          onClose={() => setShowScanner(false)}
        />
      )}
    </>
  );
};

export default BarcodeScannerManager;