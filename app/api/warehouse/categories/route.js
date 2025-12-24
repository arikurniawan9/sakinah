export const dynamic = 'force-dynamic';
import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth/next';
import { authOptions } from '@/lib/authOptions';
import globalPrisma from '@/lib/prisma';
import { WAREHOUSE_STORE_ID, ROLES } from '@/lib/constants';

// Helper to get or create the master store
async function getMasterStore() {
    // First, try to find the store using the official constant
    let masterStore = await globalPrisma.store.findUnique({
        where: { code: WAREHOUSE_STORE_ID },
    });

    // If not found, try to find the old 'WHS-MASTER' store
    if (!masterStore) {
        masterStore = await globalPrisma.store.findUnique({
            where: { code: 'WHS-MASTER' },
        });

        // If found, update its code to the official one for consistency
        if (masterStore) {
            masterStore = await globalPrisma.store.update({
                where: { id: masterStore.id },
                data: { code: WAREHOUSE_STORE_ID }
            });
        }
    }
    
    // If still not found, create a new one
    if (!masterStore) {
        masterStore = await globalPrisma.store.create({
            data: {
                code: WAREHOUSE_STORE_ID,
                name: 'Gudang Master',
                description: 'Store virtual untuk menampung master produk gudang',
                status: 'SYSTEM'
            }
        });
    }
    return masterStore;
}

export async function GET(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || ![ROLES.WAREHOUSE, ROLES.MANAGER].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const masterStore = await getMasterStore();
        if (!masterStore) {
            return NextResponse.json({ error: 'Master store could not be configured.' }, { status: 500 });
        }

        const { searchParams } = new URL(request.url);
        const limit = parseInt(searchParams.get('limit')) || 50;
        const page = parseInt(searchParams.get('page') || '1');
        const search = searchParams.get('search') || '';
        const offset = (page - 1) * limit;

        let whereClause = { storeId: masterStore.id };
        if (search) {
            whereClause.OR = [
                { name: { contains: search, mode: 'insensitive' } },
                { description: { contains: search, mode: 'insensitive' } },
            ];
        }

        const categories = await globalPrisma.category.findMany({
            where: whereClause,
            orderBy: { name: 'asc' },
            skip: offset,
            take: limit,
            include: {
                _count: {
                    select: { products: true }
                }
            }
        });

        const totalCount = await globalPrisma.category.count({ where: whereClause });

        return NextResponse.json({
            categories,
            pagination: {
                currentPage: page,
                totalPages: Math.ceil(totalCount / limit),
                total: totalCount,
                limit: limit
            }
        });
    } catch (error) {
        console.error('Error fetching categories for warehouse:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function POST(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || ![ROLES.WAREHOUSE, ROLES.MANAGER].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }
        
        const masterStore = await getMasterStore();
        if (!masterStore) {
            return NextResponse.json({ error: 'Master store could not be configured.' }, { status: 500 });
        }

        const body = await request.json();
        const { name, description } = body;

        if (!name) {
            return NextResponse.json({ error: 'Nama kategori wajib diisi' }, { status: 400 });
        }

        const existingCategory = await globalPrisma.category.findFirst({
            where: { name: name, storeId: masterStore.id },
        });

        if (existingCategory) {
            return NextResponse.json({ error: 'Kategori dengan nama yang sama sudah ada' }, { status: 400 });
        }

        const newCategory = await globalPrisma.category.create({
            data: {
                name,
                description: description || null,
                storeId: masterStore.id,
            },
        });

        return NextResponse.json({ category: newCategory }, { status: 201 });
    } catch (error) {
        console.error('Error creating category for warehouse:', error);
        if (error.code === 'P2003' || error.code === 'P2025') {
            return NextResponse.json({ error: 'Store tidak ditemukan' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function PUT(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || ![ROLES.WAREHOUSE, ROLES.MANAGER].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const masterStore = await getMasterStore();
        if (!masterStore) {
            return NextResponse.json({ error: 'Master store could not be configured.' }, { status: 500 });
        }

        const body = await request.json();
        const { id, name, description } = body;

        if (!id || !name) {
            return NextResponse.json({ error: 'ID dan Nama kategori wajib diisi' }, { status: 400 });
        }

        const existingCategory = await globalPrisma.category.findFirst({
            where: { id, storeId: masterStore.id },
        });

        if (!existingCategory) {
            return NextResponse.json({ error: 'Kategori tidak ditemukan' }, { status: 404 });
        }

        const duplicateCategory = await globalPrisma.category.findFirst({
            where: {
                name,
                storeId: masterStore.id,
                id: { not: id },
            },
        });

        if (duplicateCategory) {
            return NextResponse.json({ error: 'Kategori dengan nama yang sama sudah ada' }, { status: 400 });
        }

        const updatedCategory = await globalPrisma.category.update({
            where: { id },
            data: {
                name,
                description: description || null,
            },
        });

        return NextResponse.json({ category: updatedCategory });
    } catch (error) {
        console.error('Error updating category:', error);
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

export async function DELETE(request) {
    try {
        const session = await getServerSession(authOptions);
        if (!session || ![ROLES.WAREHOUSE, ROLES.MANAGER].includes(session.user.role)) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
        }

        const masterStore = await getMasterStore();
        if (!masterStore) {
            return NextResponse.json({ error: 'Master store could not be configured.' }, { status: 500 });
        }

        const body = await request.json();
        const { ids } = body;

        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return NextResponse.json({ error: 'ID kategori tidak valid' }, { status: 400 });
        }

        const result = await globalPrisma.category.deleteMany({
            where: {
                id: { in: ids },
                storeId: masterStore.id,
            },
        });

        return NextResponse.json({ deletedCount: result.count });
    } catch (error) {
        console.error('Error deleting categories:', error);
        if (error.code === 'P2014') {
            return NextResponse.json({ error: 'Tidak dapat menghapus kategori karena masih memiliki produk terkait.' }, { status: 400 });
        }
        return NextResponse.json({ error: 'Internal server error' }, { status: 500 });
    }
}

    