import { useState, useCallback, useRef } from 'react';

export function useTransactionCart() {
  const [cart, setCart] = useState([]);
  const [calculation, setCalculation] = useState(null);

  // Gunakan useRef untuk menyimpan referensi showNotification
  const showNotificationRef = useRef(null);

  // Fungsi untuk menginisialisasi notifikasi
  const initializeNotification = useCallback((showNotification) => {
    showNotificationRef.current = showNotification;
  }, []);

  const removeFromCart = useCallback((productId) => {
    setCart((prevCart) => prevCart.filter((item) => item.productId !== productId));
  }, []);

  const updateQuantity = useCallback((productId, newQuantity, productStock, productName) => {
    setCart((prevCart) =>
      prevCart.map((item) => {
        if (item.productId === productId) {
          if (newQuantity <= 0) {
            removeFromCart(productId);
            return item; // return tidak digunakan karena removeFromCart akan menghapus item
          }
          if (newQuantity > productStock) {
            if (showNotificationRef.current) {
              showNotificationRef.current(`Jumlah maksimum ${productName} adalah ${productStock} (stok tersedia).`, 'warning');
            }
            return { ...item, quantity: Math.min(newQuantity, productStock) };
          }
          return { ...item, quantity: newQuantity };
        }
        return item;
      })
    );
  }, [removeFromCart]);

  const addToCart = useCallback((product) => {
    setCart((prevCart) => {
      const existingItem = prevCart.find((item) => item.productId === product.id);
      if (existingItem) {
        // Update quantity jika produk sudah ada
        return prevCart.map((item) =>
          item.productId === product.id
            ? { ...item, quantity: Math.min(item.quantity + 1, item.stock) }
            : item
        );
      } else {
        // Tambah produk baru ke cart
        const newItem = {
          productId: product.id,
          name: product.name,
          productCode: product.productCode,
          quantity: 1,
          stock: product.stock,
          priceTiers: product.priceTiers,
        };

        // Tampilkan notifikasi jika stok rendah
        if (product.stock < 5 && showNotificationRef.current) {
          showNotificationRef.current(`Stok produk ${product.name} kurang dari 5!`, 'warning');
        }

        return [...prevCart, newItem];
      }
    });
  }, []);

  // Fungsi untuk menghitung perhitungan transaksi
  const calculateTransaction = useCallback((cartItems, selectedMember, additionalDiscount, getTierPrice) => {
    if (cartItems.length === 0) {
      setCalculation(null);
      return;
    }

    let subtotal = 0;
    let itemDiscount = 0;
    const calculatedItems = cartItems.map((item) => {
      const basePrice = getTierPrice(item, 1);
      const actualPrice = getTierPrice(item, item.quantity);
      const discountPerItem = basePrice - actualPrice;
      const itemSubtotal = actualPrice * item.quantity;
      const totalItemDiscount = discountPerItem * item.quantity;
      subtotal += itemSubtotal;
      itemDiscount += totalItemDiscount;
      return {
        ...item,
        originalPrice: basePrice,
        priceAfterItemDiscount: actualPrice,
        itemDiscount: totalItemDiscount,
        subtotal: itemSubtotal,
      };
    });

    let memberDiscount = 0;
    if (selectedMember?.discount) {
      // Diskon member dihitung dari subtotal sebelum diskon item
      memberDiscount = (subtotal * selectedMember.discount) / 100;
    }

    // Total diskon adalah jumlah dari semua jenis diskon
    const totalDiscount = itemDiscount + memberDiscount;

    // Hitung grand total setelah diskon member diterapkan
    const grandTotalAfterMemberDiscount = subtotal - memberDiscount;

    // Terapkan diskon tambahan jika ada
    const finalGrandTotal = Math.max(0, grandTotalAfterMemberDiscount - additionalDiscount);

    // Total diskon akhir adalah jumlah semua diskon
    const finalTotalDiscount = totalDiscount + additionalDiscount;

    const newCalculation = {
      items: calculatedItems,
      subTotal: subtotal,
      itemDiscount: itemDiscount,
      memberDiscount: memberDiscount,
      additionalDiscount: additionalDiscount,
      totalDiscount: finalTotalDiscount,
      tax: 0, // Pajak bisa ditambahkan nanti jika diperlukan
      grandTotal: Math.max(0, Math.round(finalGrandTotal)), // Pastikan tidak negatif
    };

    setCalculation(newCalculation);

    // Periksa apakah ada produk dengan stok rendah dan tampilkan notifikasi
    const hasLowStockItems = calculatedItems.some(item => item.stock < 5);
    if (hasLowStockItems && showNotificationRef.current) {
      showNotificationRef.current('Beberapa produk memiliki stok rendah!', 'warning');
    }
  }, []);

  return {
    cart,
    setCart,
    calculation,
    initializeNotification,
    removeFromCart,
    updateQuantity,
    addToCart,
    calculateTransaction,
  };
}