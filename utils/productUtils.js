// utils/productUtils.js
// Utility functions for product-related operations

/**
 * Get selling price based on membership type
 * @param {Object} product - Product object that contains retailPrice, silverPrice, goldPrice, platinumPrice
 * @param {string} membershipType - Type of membership (RETAIL, SILVER, GOLD, PLATINUM)
 * @returns {number} Selling price
 */
export function getSellingPriceByMemberType(product, membershipType = 'RETAIL') {
  switch (membershipType) {
    case 'SILVER':
      return product.silverPrice || 0;
    case 'GOLD':
      return product.goldPrice || 0;
    case 'PLATINUM':
      return product.platinumPrice || 0;
    case 'RETAIL':
    default:
      return product.retailPrice || 0;
  }
}

/**
 * Get selling price based on membership type (alias for backwards compatibility)
 * @param {Object} product - Product object that contains retailPrice, silverPrice, goldPrice, platinumPrice
 * @param {string} membershipType - Type of membership (RETAIL, SILVER, GOLD, PLATINUM)
 * @returns {number} Selling price
 */
export function calculateSellingPrice(product, membershipType = 'RETAIL') {
  return getSellingPriceByMemberType(product, membershipType);
}

/**
 * Transform product array to include calculated sellingPrice
 * @param {Array} products - Array of product objects
 * @param {string} membershipType - Type of membership (RETAIL, SILVER, GOLD, PLATINUM)
 * @returns {Array} Transformed products with sellingPrice
 */
export function transformProductsForDisplay(products, membershipType = 'RETAIL') {
  return (products || []).map(product => ({
    ...product,
    sellingPrice: getSellingPriceByMemberType(product, membershipType)
  }));
}