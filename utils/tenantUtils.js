// utils/tenantUtils.js
import { PrismaClient } from '@prisma/client';

const modelsToFilter = [
  'category',
  'product',
  'supplier',
  'member',
  'sale',
  'receivable',
  'saleDetail',
  'tempCart',
  'purchase',
  'purchaseItem',
  'suspendedSale',
  'setting',
  'auditLog',
  'expenseCategory',
  'expense',
];

export function getTenantPrismaClient(storeId) {
  // Create a new instance for each request context to ensure middleware isolation
  const tenantPrisma = new PrismaClient(); 

  if (!storeId) {
    console.warn("No storeId provided for tenant Prisma client. Returning client without tenant filter.");
    return tenantPrisma;
  }

  tenantPrisma.$use(async (params, next) => {
    // Only apply middleware if the model is in our list and has a storeId field
    if (modelsToFilter.includes(params.model?.toLowerCase())) {
        // Ensure that 'where' clause always includes storeId for read/delete/update operations
        if (params.action.startsWith('find') || params.action.startsWith('count') || params.action.startsWith('delete') || params.action.startsWith('update')) {
            if (!params.args.where) {
                params.args.where = {};
            }
            params.args.where.storeId = storeId;
        } 
        // Ensure that 'data' for create/upsert always includes storeId
        else if (params.action.startsWith('create')) {
            if (!params.args.data) {
                params.args.data = {};
            }
            params.args.data.storeId = storeId;
        } 
        else if (params.action === 'upsert') {
          // Ensure storeId is in both create and update parts for upsert
          if (!params.args.where) {
            params.args.where = {};
          }
          params.args.where.storeId = storeId;

          if (!params.args.create) {
              params.args.create = {};
          }
          params.args.create.storeId = storeId;
          
          if (!params.args.update) {
            params.args.update = {};
          }
          params.args.update.storeId = storeId;
        }
    }
    return next(params);
  });

  return tenantPrisma;
}