import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

// DELETE /api/interview/message - Delete last message pair
export async function DELETE(request: Request) {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { interviewId } = await request.json();

    if (!interviewId) {
      return NextResponse.json({ error: 'Interview ID required' }, { status: 400 });
    }

    // Get the interview
    const interview = await prisma.interview.findFirst({
      where: {
        id: interviewId,
        userId: session.user.id,
      },
    });

    if (!interview) {
      return NextResponse.json({ error: 'Interview not found' }, { status: 404 });
    }

    // Parse messages
    let messages: Message[] = [];
    try {
      messages = JSON.parse(interview.conversationLog || '[]');
    } catch {
      messages = [];
    }

    // Need at least 1 message to delete
    if (messages.length < 1) {
      return NextResponse.json({ error: 'No messages to delete' }, { status: 400 });
    }

    // Remove only the last message
    const updatedMessages = messages.slice(0, -1);

    // Update the interview
    await prisma.interview.update({
      where: { id: interviewId },
      data: {
        conversationLog: JSON.stringify(updatedMessages),
      },
    });

    return NextResponse.json({
      success: true,
      messages: updatedMessages,
      removedCount: 1,
    });
  } catch (error) {
    console.error('Delete message error:', error);
    return NextResponse.json(
      { error: 'Failed to delete message' },
      { status: 500 }
    );
  }
}
