import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';
import cloudinary from '@/lib/cloudinary';
import { validateFileUpload } from '@/lib/validation';

// GET /api/media - Get all user's media
export async function GET(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const lifeEventId = searchParams.get('lifeEventId');

    const where: { userId: string; lifeEventId?: string | null } = { userId: session.user.id };
    if (lifeEventId) {
      where.lifeEventId = lifeEventId;
    }

    const media = await prisma.media.findMany({
      where,
      orderBy: { createdAt: 'desc' },
      include: {
        lifeEvent: {
          select: { id: true, title: true },
        },
      },
    });

    return NextResponse.json({ media });
  } catch (error) {
    console.error('Get media error:', error);
    return NextResponse.json({ error: 'Failed to get media' }, { status: 500 });
  }
}

// POST /api/media - Upload new media
export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const formData = await request.formData();
    const file = formData.get('file') as File;
    const title = formData.get('title') as string | null;
    const description = formData.get('description') as string | null;
    const lifeEventId = formData.get('lifeEventId') as string | null;

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    // Validate file size and type
    const fileError = validateFileUpload(file, 20, ['image/*', 'audio/*', 'video/*']);
    if (fileError) return NextResponse.json({ error: fileError }, { status: 400 });

    // Check if Cloudinary is configured
    if (!process.env.CLOUDINARY_CLOUD_NAME || !process.env.CLOUDINARY_API_KEY || !process.env.CLOUDINARY_API_SECRET) {
      return NextResponse.json(
        { error: 'Media storage is not configured. Voice memo upload is unavailable.' },
        { status: 503 }
      );
    }

    // Convert file to base64
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);
    const base64 = `data:${file.type};base64,${buffer.toString('base64')}`;

    // Upload to Cloudinary
    const result = await cloudinary.uploader.upload(base64, {
      folder: `lifestory/${session.user.id}`,
      resource_type: 'auto',
    });

    // Save to database
    const media = await prisma.media.create({
      data: {
        userId: session.user.id,
        url: result.secure_url,
        publicId: result.public_id,
        type: result.resource_type,
        title,
        description,
        width: result.width,
        height: result.height,
        size: result.bytes,
        lifeEventId,
      },
    });

    return NextResponse.json({ media }, { status: 201 });
  } catch (error) {
    console.error('Upload media error:', error);
    return NextResponse.json({ error: 'Failed to upload media' }, { status: 500 });
  }
}

// DELETE /api/media - Delete media
export async function DELETE(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json({ error: 'Media ID required' }, { status: 400 });
    }

    // Find media and verify ownership
    const media = await prisma.media.findFirst({
      where: { id, userId: session.user.id },
    });

    if (!media) {
      return NextResponse.json({ error: 'Media not found' }, { status: 404 });
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(media.publicId);

    // Delete from database
    await prisma.media.delete({ where: { id } });

    return NextResponse.json({ message: 'Media deleted' });
  } catch (error) {
    console.error('Delete media error:', error);
    return NextResponse.json({ error: 'Failed to delete media' }, { status: 500 });
  }
}
