// components/pelayan/VirtualizedProductList.js
import { memo, useMemo, useCallback } from 'react';
import { FixedSizeList as List } from 'react-window';
import ProductItem from './ProductItem';

const VirtualizedProductList = ({
  products,
  addToCart,
  addQuickProduct,
  removeQuickProduct,
  quickProducts,
  darkMode,
  height = 400,
  loadMoreProducts,
  hasMoreProducts,
  searchTerm,
  isSearchingProducts
}) => {
  // Memoisasi data produk untuk mencegah perhitungan ulang yang tidak perlu
  const productList = useMemo(() =>
    products.map((product, index) => ({
      ...product,
      index,
      isOutOfStock: product.stock <= 0
    })),
    [products]
  );

  // Handler untuk infinite scroll
  const onItemsRendered = useCallback(({ visibleStartIndex, visibleStopIndex }) => {
    // Jika pengguna telah mencapai 80% dari akhir daftar dan masih ada produk lebih
    if (
      visibleStopIndex >= productList.length * 0.8 &&
      hasMoreProducts &&
      !isSearchingProducts &&
      loadMoreProducts
    ) {
      loadMoreProducts(searchTerm);
    }
  }, [productList.length, hasMoreProducts, isSearchingProducts, loadMoreProducts, searchTerm]);

  // Fungsi untuk merender item produk
  const ProductRow = memo(({ index, style }) => {
    const product = productList[index];

    return (
      <div style={style} className="py-1">
        <ProductItem
          product={product}
          isOutOfStock={product.isOutOfStock}
          addToCart={addToCart}
          addQuickProduct={addQuickProduct}
          removeQuickProduct={removeQuickProduct}
          quickProducts={quickProducts}
          darkMode={darkMode}
        />
      </div>
    );
  });
  ProductRow.displayName = 'ProductRow';

  // Memoisasi komponen row untuk mencegah rendering ulang
  const MemoizedProductRow = memo(ProductRow);

  // Render list virtual
  return (
    <List
      height={height}
      itemCount={productList.length}
      itemSize={120} // Tinggi perkiraan setiap item produk
      overscanCount={5} // Jumlah item tambahan yang dirender di luar viewport
      onItemsRendered={onItemsRendered} // Tambahkan handler untuk infinite scroll
    >
      {MemoizedProductRow}
    </List>
  );
};

export default VirtualizedProductList;