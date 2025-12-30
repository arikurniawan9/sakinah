import { getServerSession } from "next-auth/next";
import { authOptions } from "@/lib/authOptions";
import prisma from "@/lib/prisma";

export async function GET(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Hanya user dengan role WAREHOUSE atau lebih tinggi yang bisa mengakses
    if (!['WAREHOUSE', 'ADMIN', 'MANAGER'].includes(session.user.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(request.url);
    const storeId = url.searchParams.get('storeId');
    const templateName = url.searchParams.get('templateName');

    // Ambil template distribusi berdasarkan storeId jika disediakan, atau semua template milik user
    let whereClause = {
      userId: session.user.id,
      type: 'DISTRIBUTION_TEMPLATE', // Tipe khusus untuk template distribusi
    };

    if (storeId) {
      whereClause.storeId = storeId;
    }

    if (templateName) {
      whereClause.name = { contains: templateName, mode: 'insensitive' };
    }

    const templates = await prisma.userPreference.findMany({
      where: whereClause,
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Parse data template
    const parsedTemplates = templates.map(template => ({
      id: template.id,
      name: template.name,
      storeId: template.storeId,
      data: JSON.parse(template.value),
      createdAt: template.createdAt,
      updatedAt: template.updatedAt,
    }));

    return Response.json({ templates: parsedTemplates });
  } catch (error) {
    console.error('Error fetching distribution templates:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function POST(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['WAREHOUSE', 'ADMIN', 'MANAGER'].includes(session.user.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { name, storeId, items, notes } = body;

    if (!name || !storeId || !items || !Array.isArray(items) || items.length === 0) {
      return Response.json({ error: 'Nama template, Store ID, dan items distribusi wajib disediakan' }, { status: 400 });
    }

    // Periksa apakah template dengan nama yang sama sudah ada untuk user ini
    const existingTemplate = await prisma.userPreference.findFirst({
      where: {
        userId: session.user.id,
        name: name,
        type: 'DISTRIBUTION_TEMPLATE',
      },
    });

    if (existingTemplate) {
      return Response.json({ error: 'Template dengan nama ini sudah ada' }, { status: 400 });
    }

    // Simpan template sebagai user preference
    const template = await prisma.userPreference.create({
      data: {
        userId: session.user.id,
        name: name,
        type: 'DISTRIBUTION_TEMPLATE',
        storeId: storeId,
        value: JSON.stringify({
          items,
          notes: notes || '',
          createdAt: new Date().toISOString(),
        }),
      },
    });

    return Response.json({ 
      message: 'Template distribusi berhasil disimpan', 
      template: {
        id: template.id,
        name: template.name,
        storeId: template.storeId,
        data: JSON.parse(template.value),
      }
    });
  } catch (error) {
    console.error('Error saving distribution template:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['WAREHOUSE', 'ADMIN', 'MANAGER'].includes(session.user.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const body = await request.json();
    const { templateId, name, storeId, items, notes } = body;

    if (!templateId || !name || !storeId || !items || !Array.isArray(items) || items.length === 0) {
      return Response.json({ error: 'Template ID, nama, Store ID, dan items distribusi wajib disediakan' }, { status: 400 });
    }

    // Update template
    const template = await prisma.userPreference.update({
      where: {
        id: templateId,
        userId: session.user.id,
        type: 'DISTRIBUTION_TEMPLATE',
      },
      data: {
        name,
        storeId,
        value: JSON.stringify({
          items,
          notes: notes || '',
          updatedAt: new Date().toISOString(),
        }),
      },
    });

    return Response.json({ 
      message: 'Template distribusi berhasil diperbarui', 
      template: {
        id: template.id,
        name: template.name,
        storeId: template.storeId,
        data: JSON.parse(template.value),
      }
    });
  } catch (error) {
    console.error('Error updating distribution template:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}

export async function DELETE(request) {
  try {
    const session = await getServerSession(authOptions);
    
    if (!session) {
      return Response.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!['WAREHOUSE', 'ADMIN', 'MANAGER'].includes(session.user.role)) {
      return Response.json({ error: 'Forbidden' }, { status: 403 });
    }

    const url = new URL(request.url);
    const templateId = url.searchParams.get('templateId');

    if (!templateId) {
      return Response.json({ error: 'Template ID wajib disediakan' }, { status: 400 });
    }

    // Hapus template
    await prisma.userPreference.delete({
      where: {
        id: templateId,
        userId: session.user.id,
        type: 'DISTRIBUTION_TEMPLATE',
      },
    });

    return Response.json({ message: 'Template distribusi berhasil dihapus' });
  } catch (error) {
    console.error('Error deleting distribution template:', error);
    return Response.json({ error: 'Internal server error' }, { status: 500 });
  }
}