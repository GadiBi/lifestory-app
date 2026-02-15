import { NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Relationship patterns to detect in text
const relationshipPatterns: [RegExp, string][] = [
  [/\b(mom|mother|mama|ima)\b/i, 'Mother'],
  [/\b(dad|father|papa|abba|aba)\b/i, 'Father'],
  [/\b(grandma|grandmother|savta|nana|granny)\b/i, 'Grandmother'],
  [/\b(grandpa|grandfather|saba|grandad)\b/i, 'Grandfather'],
  [/\b(brother)\b/i, 'Brother'],
  [/\b(sister)\b/i, 'Sister'],
  [/\b(wife)\b/i, 'Wife'],
  [/\b(husband)\b/i, 'Husband'],
  [/\b(son)\b/i, 'Son'],
  [/\b(daughter)\b/i, 'Daughter'],
  [/\b(uncle)\b/i, 'Uncle'],
  [/\b(aunt|auntie)\b/i, 'Aunt'],
  [/\b(cousin)\b/i, 'Cousin'],
  [/\b(friend|best friend)\b/i, 'Friend'],
  [/\b(teacher|professor|mentor)\b/i, 'Teacher/Mentor'],
  [/\b(boss|manager|colleague|coworker)\b/i, 'Colleague'],
  [/\b(neighbor|neighbour)\b/i, 'Neighbor'],
];

// Common words to exclude from proper noun detection
const excludeWords = new Set([
  'The', 'And', 'But', 'For', 'Not', 'You', 'She', 'His', 'Her', 'Was', 'Are',
  'They', 'This', 'That', 'Would', 'Could', 'Should', 'Have', 'Been', 'When',
  'What', 'How', 'Who', 'Why', 'Where', 'Yes', 'Yeah', 'Well', 'Also', 'Then',
  'There', 'Here', 'Just', 'Like', 'Very', 'Really', 'Actually', 'About',
  'After', 'Before', 'During', 'Because', 'Since', 'Until', 'While', 'Some',
  'Many', 'Much', 'Most', 'Other', 'Each', 'Every', 'Both', 'Few', 'More',
  'Into', 'Over', 'Such', 'Still', 'Back', 'Even', 'Made', 'Never', 'Always',
  'Sometimes', 'Often', 'Once', 'Twice', 'Today', 'Yesterday', 'Tomorrow',
  'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday',
  'January', 'February', 'March', 'April', 'May', 'June', 'July', 'August',
  'September', 'October', 'November', 'December', 'Mom', 'Dad', 'Mother',
  'Father', 'Brother', 'Sister', 'Grandma', 'Grandpa', 'Wife', 'Husband',
]);

interface PersonInfo {
  name: string;
  relationship: string;
  mentions: { type: 'event' | 'conversation'; id: string; title: string }[];
}

// GET /api/people - Extract people from user's conversations and life events
export async function GET() {
  try {
    const session = await auth();

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const [events, interviews] = await Promise.all([
      prisma.lifeEvent.findMany({
        where: { userId: session.user.id },
        select: { id: true, title: true, description: true },
      }),
      prisma.interview.findMany({
        where: { userId: session.user.id },
        select: { id: true, conversationLog: true, currentPeriod: true, updatedAt: true },
      }),
    ]);

    const peopleMap = new Map<string, PersonInfo>();

    function addPerson(name: string, relationship: string, mention: PersonInfo['mentions'][0]) {
      const key = name.toLowerCase();
      if (peopleMap.has(key)) {
        const person = peopleMap.get(key)!;
        // Don't duplicate mentions
        if (!person.mentions.some(m => m.id === mention.id && m.type === mention.type)) {
          person.mentions.push(mention);
        }
      } else {
        peopleMap.set(key, { name, relationship, mentions: [mention] });
      }
    }

    // Scan life events
    for (const event of events) {
      const text = `${event.title} ${event.description}`;

      // Check relationship patterns
      for (const [pattern, rel] of relationshipPatterns) {
        if (pattern.test(text)) {
          addPerson(rel, rel, { type: 'event', id: event.id, title: event.title });
        }
      }

      // Extract proper nouns as potential names
      const properNouns = text.match(/\b[A-Z][a-z]{2,}\b/g) || [];
      for (const noun of properNouns) {
        if (!excludeWords.has(noun)) {
          addPerson(noun, 'Person', { type: 'event', id: event.id, title: event.title });
        }
      }
    }

    // Scan conversations
    for (const interview of interviews) {
      try {
        const messages = JSON.parse(interview.conversationLog || '[]') as { role: string; content: string }[];
        const userMessages = messages.filter(m => m.role === 'user').map(m => m.content);
        const fullText = userMessages.join(' ');

        // Generate a title for this conversation
        const convTitle = interview.currentPeriod || `Conversation`;

        // Check relationship patterns
        for (const [pattern, rel] of relationshipPatterns) {
          if (pattern.test(fullText)) {
            addPerson(rel, rel, { type: 'conversation', id: interview.id, title: convTitle });
          }
        }

        // Extract proper nouns
        const properNouns = fullText.match(/\b[A-Z][a-z]{2,}\b/g) || [];
        for (const noun of properNouns) {
          if (!excludeWords.has(noun)) {
            addPerson(noun, 'Person', { type: 'conversation', id: interview.id, title: convTitle });
          }
        }
      } catch {
        // Skip unparseable conversations
      }
    }

    // Convert to array and sort by mention count
    const people = Array.from(peopleMap.values())
      .sort((a, b) => b.mentions.length - a.mentions.length);

    return NextResponse.json({ people });
  } catch (error) {
    console.error('People extraction error:', error);
    return NextResponse.json({ error: 'Failed to extract people' }, { status: 500 });
  }
}
