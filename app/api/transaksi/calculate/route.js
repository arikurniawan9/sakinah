// app/api/transaksi/calculate/route.js
import { NextResponse } from 'next/server';
import prisma from '@/lib/prisma';

/**
 * Calculate transaction totals based on quantity and fixed member prices
 *
 * Request body should contain:
 * - items: Array of objects with { productId, quantity }
 * - memberId: Optional - ID of member for price calculation
 */
export async function POST(request) {
  try {
    const { items, memberId } = await request.json();

    if (!Array.isArray(items) || items.length === 0) {
      return NextResponse.json(
        { error: 'Items array is required and cannot be empty' },
        { status: 400 }
      );
    }

    let subtotal = 0;
    let totalDiscount = 0; // This represents the difference from retail price
    let itemDiscount = 0;  // Total savings compared to retail price
    let memberDiscount = 0; // Total savings from member level pricing
    let tax = 0; // Optional tax
    let calculatedItems = [];

    // Fetch member details if memberId is provided
    let membershipType = 'RETAIL'; // Default to retail if no member specified
    if (memberId) {
      const member = await prisma.member.findUnique({
        where: { id: memberId }
      });

      if (!member) {
        return NextResponse.json(
          { error: `Member with id ${memberId} not found` },
          { status: 404 }
        );
      }

      membershipType = member.membershipType;
    }

    // Fetch product details for each item
    for (const item of items) {
      const product = await prisma.product.findUnique({
        where: { id: item.productId }
      });

      if (!product) {
        return NextResponse.json(
          { error: `Product with id ${item.productId} not found` },
          { status: 404 }
        );
      }

      if (product.stock < item.quantity) {
        return NextResponse.json(
          { error: `Insufficient stock for ${product.name}. Available: ${product.stock}, Requested: ${item.quantity}` },
          { status: 400 }
        );
      }

      // Get price based on membership type
      let applicablePrice = 0;
      switch (membershipType) {
        case 'SILVER':
          applicablePrice = product.silverPrice || product.retailPrice;
          break;
        case 'GOLD':
          applicablePrice = product.goldPrice || product.retailPrice;
          break;
        case 'PLATINUM':
          applicablePrice = product.platinumPrice || product.retailPrice;
          break;
        case 'RETAIL':
        default:
          applicablePrice = product.retailPrice;
          break;
      }

      // Calculate original price for comparison (retail price)
      const originalPrice = product.retailPrice || 0;

      // Calculate the discount per item compared to the retail price
      const discountPerItem = originalPrice - applicablePrice;
      const itemSubtotal = applicablePrice * item.quantity;
      const itemDiscountAmount = discountPerItem * item.quantity;

      calculatedItems.push({
        productId: product.id,
        productName: product.name,
        quantity: item.quantity,
        originalPrice: originalPrice,
        discountPerItem: discountPerItem,
        itemDiscount: itemDiscountAmount,
        priceAfterItemDiscount: applicablePrice,
        subtotal: itemSubtotal
      });

      subtotal += itemSubtotal;
      itemDiscount += itemDiscountAmount;
    }

    // Update memberDiscount to represent the total savings from member pricing
    memberDiscount = itemDiscount; // In the new system, this is the same as itemDiscount

    // Optional tax calculation (5% as example)
    // In a real application, tax rate might come from settings
    tax = subtotal * 0.05; // 5% tax
    const grandTotal = subtotal + tax;

    // Calculate total discount (difference from retail price)
    totalDiscount = itemDiscount;

    return NextResponse.json({
      items: calculatedItems,
      subTotal: subtotal,  // Total after applying member pricing
      itemDiscount: itemDiscount,  // Total discount from member pricing
      memberDiscount: memberDiscount,  // Total discount from member pricing
      totalDiscount: totalDiscount,  // Combined discount
      tax: tax,  // Tax amount
      totalAfterDiscounts: subtotal,  // Same as subtotal in the new system
      grandTotal: Math.round(grandTotal),  // Final total including tax
    });
  } catch (error) {
    console.error('Error calculating transaction:', error);
    return NextResponse.json(
      { error: 'Failed to calculate transaction' },
      { status: 500 }
    );
  }
}